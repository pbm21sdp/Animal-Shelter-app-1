import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import Navbar from '../components/Navbar';
import axios from 'axios';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const API   = 'http://localhost:5000/api';
const sans  = "'DM Sans', sans-serif";
const serif = "'Cormorant Garamond', serif";

const TYPES = ['All', 'Dog', 'Cat', 'Rabbit', 'Bird', 'Fish', 'Hamster', 'Guinea pig', 'Reptile'];

const CITY_COORDS = {
    'timișoara':   [45.7489, 21.2087],
    'timisoara':   [45.7489, 21.2087],
    'cluj-napoca': [46.7712, 23.6236],
    'cluj':        [46.7712, 23.6236],
    'bucurești':   [44.4268, 26.1025],
    'bucharest':   [44.4268, 26.1025],
    'iași':        [47.1585, 27.6014],
    'iasi':        [47.1585, 27.6014],
    'brașov':      [45.6427, 25.5887],
    'brasov':      [45.6427, 25.5887],
    'sibiu':       [45.7983, 24.1256],
    'constanța':   [44.1598, 28.6348],
    'constanta':   [44.1598, 28.6348],
    'craiova':     [44.3302, 23.7949],
    'galați':      [45.4353, 28.0082],
    'oradea':      [47.0722, 21.9213],
    'ploiești':    [44.9451, 26.0433],
    'pitești':     [44.8565, 24.8692],
    'arad':        [46.1866, 21.3123],
};

// Deterministic pseudo-random from integer seed — stable across re-renders
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function cityToApproxCoords(city, petId) {
    const key  = (city || '').toLowerCase().trim();
    const base = CITY_COORDS[key] || [45.7489, 21.2087];
    const r1   = seededRandom(petId * 7.3 + 1);
    const r2   = seededRandom(petId * 13.7 + 2);
    // ±0.03 degrees ≈ ±3 km spread across the city
    return [base[0] + (r1 - 0.5) * 0.06, base[1] + (r2 - 0.5) * 0.06];
}

// Distinct pin icons
const exactIcon = L.divIcon({
    html: `<div style="width:13px;height:13px;border-radius:50%;background:#2D1F14;border:2.5px solid #fff;box-shadow:0 2px 7px rgba(45,31,20,0.45)"></div>`,
    className: '',
    iconSize: [13, 13],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10],
});

const approxIcon = L.divIcon({
    html: `<div style="width:13px;height:13px;border-radius:50%;background:#C07A4A;border:2.5px solid #fff;box-shadow:0 2px 7px rgba(192,122,74,0.45)"></div>`,
    className: '',
    iconSize: [13, 13],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10],
});

function RecenterMap({ center }) {
    const map = useMap();
    useEffect(() => { map.setView(center, map.getZoom()); }, [center]);
    return null;
}

export default function MapPage() {
    const [pets, setPets]                 = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [mapCenter, setMapCenter]       = useState([45.7489, 21.2087]);
    const [activeType, setActiveType]     = useState('All');
    const [petsWithCoords, setPetsWithCoords] = useState([]);

    useEffect(() => {
        axios.get(`${API}/pets`, { withCredentials: true })
            .then(r => setPets(r.data.data || r.data.pets || []))
            .catch(() => {});

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    const c = [pos.coords.latitude, pos.coords.longitude];
                    setUserLocation(c);
                    setMapCenter(c);
                },
                () => {}
            );
        }
    }, []);

    useEffect(() => {
        if (pets.length === 0) return;
        // Use stored lat/lng for exact pins; fall back to city-based approx for the rest
        setPetsWithCoords(pets.map(pet => {
            const hasExact = pet.latitude != null && pet.longitude != null
            && pet.location_address && pet.location_address.trim() !== '';
            return {
                ...pet,
                coords:  hasExact
                    ? [parseFloat(pet.latitude), parseFloat(pet.longitude)]
                    : cityToApproxCoords(pet.location_city, pet.id),
                isExact: hasExact,
            };
        }));
    }, [pets]);

    const filtered           = petsWithCoords.filter(p =>
        activeType === 'All' || (p.type || '').toLowerCase() === activeType.toLowerCase()
    );
    const filteredHasApprox  = filtered.some(p => !p.isExact);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Navbar />

            <div style={{ flex: 1, position: 'relative' }}>

                {/* Filter bar */}
                <div style={{
                    position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1000, display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center',
                    background: '#fff', borderRadius: '16px', padding: '6px 10px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.12)', border: '1px solid rgba(45,31,20,0.08)',
                    maxWidth: 'calc(100vw - 28px)',
                }}>
                    {TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setActiveType(type)}
                            style={{
                                fontFamily: sans, fontSize: '12px',
                                fontWeight: activeType === type ? 600 : 400,
                                color:  activeType === type ? '#FAF7F4' : '#7A5C44',
                                background: activeType === type ? '#2D1F14' : 'transparent',
                                border: 'none', borderRadius: '100px', padding: '5px 14px',
                                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Legend + disclaimer */}
                <div style={{
                    position: 'absolute', bottom: '60px', left: '14px', zIndex: 1000,
                    background: '#FFFAF7', border: '1px solid rgba(45,31,20,0.1)',
                    borderRadius: '10px', padding: '10px 14px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.09)', maxWidth: '230px',
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: 10, height: 10, borderRadius: '50%',
                                background: '#2D1F14', border: '2px solid #fff',
                                boxShadow: '0 1px 4px rgba(45,31,20,0.35)', flexShrink: 0,
                            }} />
                            <span style={{ fontFamily: sans, fontSize: '11px', color: '#2D1F14' }}>Exact location</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: 10, height: 10, borderRadius: '50%',
                                background: '#C07A4A', border: '2px solid #fff',
                                boxShadow: '0 1px 4px rgba(192,122,74,0.4)', flexShrink: 0,
                            }} />
                            <span style={{ fontFamily: sans, fontSize: '11px', color: '#2D1F14' }}>Approximate location</span>
                        </div>
                        {filteredHasApprox && (
                            <p style={{
                                fontFamily: sans, fontSize: '10px', color: '#7A5C44',
                                margin: '4px 0 0', lineHeight: 1.5,
                                borderTop: '1px solid rgba(45,31,20,0.08)', paddingTop: '6px',
                            }}>
                                Some animals are shown at an approximate location because the listing only specifies a city, not an exact address.
                            </p>
                        )}
                    </div>
                </div>

                {/* Count badge */}
                <div style={{
                    position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1000, background: '#2D1F14', color: '#FAF7F4',
                    fontFamily: sans, fontSize: '12px', padding: '6px 16px',
                    borderRadius: '100px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', pointerEvents: 'none',
                }}>
                    {filtered.length} {activeType === 'All' ? 'animals' : activeType.toLowerCase() + 's'} on the map
                </div>

                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {userLocation && (
                        <CircleMarker
                            center={userLocation}
                            radius={8}
                            pathOptions={{ color: '#C07A4A', fillColor: '#C07A4A', fillOpacity: 1 }}
                        >
                            <Popup>You are here</Popup>
                        </CircleMarker>
                    )}

                    {filtered.map(pet => (
                        <Marker
                            key={`${pet.id}-${pet.isExact}`}
                            position={pet.coords}
                            icon={pet.isExact ? exactIcon : approxIcon}
                        >
                            <Popup minWidth={180}>
                                <div style={{ fontFamily: sans }}>
                                    {pet.primary_photo_id && (
                                        <img
                                            src={`${API}/pets/photos/${pet.primary_photo_id}`}
                                            alt={pet.name}
                                            style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px', display: 'block' }}
                                        />
                                    )}
                                    <div style={{ fontFamily: serif, fontSize: '16px', fontWeight: 700, color: '#2D1F14', marginBottom: '3px' }}>
                                        {pet.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#7A5C44', marginBottom: '3px' }}>
                                        {pet.location_city}{pet.age_category ? ` · ${pet.age_category}` : ''}
                                    </div>
                                    {!pet.isExact && (
                                        <div style={{ fontSize: '10px', color: '#C07A4A', marginBottom: '8px' }}>
                                            ≈ Approximate location
                                        </div>
                                    )}
                                    {pet.isExact && (
                                        <div style={{ fontSize: '10px', color: '#5C8A5C', marginBottom: '8px' }}>
                                            ✓ Exact location
                                        </div>
                                    )}
                                    <a
                                        href={`/pet/${pet.id}`}
                                        style={{ display: 'block', textAlign: 'center', background: '#2D1F14', color: '#FAF7F4', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
                                    >
                                        View listing →
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    <RecenterMap center={mapCenter} />
                </MapContainer>
            </div>
        </div>
    );
}
