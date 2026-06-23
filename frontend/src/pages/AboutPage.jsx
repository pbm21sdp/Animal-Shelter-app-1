import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale,
    PointElement, LineElement,
    Tooltip as ChartTooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer,
} from 'recharts';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip);

const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";
const API   = 'http://localhost:5000/api';

// ─── Light-page skeleton ──────────────────────────────────────────────────────

function Skeleton({ width = '100%', height = '16px', style = {} }) {
    return (
        <span style={{
            display: 'inline-block', width, height, borderRadius: '3px',
            background: 'linear-gradient(90deg, rgba(45,31,20,0.07) 25%, rgba(45,31,20,0.12) 50%, rgba(45,31,20,0.07) 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', ...style,
        }} />
    );
}

function DarkSkeleton({ width = '100%', height = '16px', style = {} }) {
    return (
        <span style={{
            display: 'inline-block', width, height, borderRadius: '3px',
            background: 'linear-gradient(90deg, rgba(250,247,244,0.06) 25%, rgba(250,247,244,0.12) 50%, rgba(250,247,244,0.06) 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', ...style,
        }} />
    );
}

function Spinner() {
    return (
        <span style={{
            display: 'inline-block', width: '16px', height: '16px',
            border: '2px solid rgba(192,122,74,0.25)', borderTopColor: '#C07A4A',
            borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
    );
}

// ─── Stat cell (light section) ────────────────────────────────────────────────

function StatCell({ value, label, trend, urgent, loading }) {
    return (
        <div style={{
            padding: '20px 16px',
            borderBottom: '1px solid rgba(45,31,20,0.08)',
            borderRight: '1px solid rgba(45,31,20,0.08)',
        }}>
            {loading ? (
                <>
                    <Skeleton width="60px" height="36px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="80px" height="12px" />
                </>
            ) : (
                <>
                    <div style={{ fontFamily: serif, fontSize: '36px', fontWeight: 700, color: '#2D1F14', lineHeight: 1.1 }}>
                        {value ?? '—'}
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '11px', color: '#7A5C44', marginTop: '4px', letterSpacing: '0.02em' }}>
                        {label}
                    </div>
                    {trend && (
                        <div style={{ fontFamily: sans, fontSize: '10px', color: urgent ? '#993C1D' : '#1A7A5E', marginTop: '5px' }}>
                            {trend}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Analytics card sub-components ───────────────────────────────────────────

function ForecastCard({ label, value, loading, insufficient }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '4px', padding: '20px 18px',
        }}>
            <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C9A98A', fontWeight: 500, marginBottom: '10px' }}>
                {label}
            </div>
            {loading ? (
                <DarkSkeleton width="60px" height="32px" />
            ) : insufficient || value === null ? (
                <div style={{ fontFamily: sans, fontSize: '12px', color: 'rgba(250,247,244,0.35)', fontStyle: 'italic' }}>
                    Not enough data yet
                </div>
            ) : (
                <div style={{ fontFamily: serif, fontSize: '36px', fontWeight: 700, color: '#FAF7F4', lineHeight: 1 }}>
                    {value}
                    <span style={{ fontFamily: sans, fontSize: '12px', fontWeight: 400, color: '#B09880', marginLeft: '6px' }}>predicted</span>
                </div>
            )}
        </div>
    );
}

function SmallMetricCard({ label, value, loading }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '4px', padding: '16px',
        }}>
            <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C9A98A', fontWeight: 500, marginBottom: '8px' }}>
                {label}
            </div>
            {loading ? (
                <DarkSkeleton width="50px" height="24px" />
            ) : value == null ? (
                <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: 'rgba(250,247,244,0.35)' }}>—</div>
            ) : (
                <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#FAF7F4' }}>{value}</div>
            )}
        </div>
    );
}

function NeedleRow({ label, impact, note }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '4px',
        }}>
            <span style={{ fontFamily: sans, fontSize: '12px', color: '#F0E8DE' }}>{label}</span>
            <span style={{ fontFamily: sans, fontSize: '12px', fontWeight: 600, color: '#6FD9B5', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                {impact} {note}
            </span>
        </div>
    );
}

// ─── Org card ─────────────────────────────────────────────────────────────────

function OrgCard({ org, onDonate }) {
    return (
        <div style={{
            border: '1px solid rgba(45,31,20,0.12)', borderRadius: '4px',
            padding: '20px', background: '#FAF7F4',
            display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
            <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 700, color: '#2D1F14' }}>{org.name}</div>
            <p style={{ fontFamily: sans, fontSize: '11px', color: '#7A5C44', margin: 0, lineHeight: 1.6 }}>{org.description}</p>
            {org.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {org.tags.map(tag => (
                        <span key={tag} style={{
                            fontFamily: sans, fontSize: '9px', textTransform: 'uppercase',
                            letterSpacing: '0.06em', padding: '2px 8px',
                            border: '1px solid rgba(192,122,74,0.3)', color: '#C07A4A',
                            borderRadius: '2px', fontWeight: 600,
                        }}>{tag}</span>
                    ))}
                </div>
            )}
            {org.contact && <div style={{ fontFamily: sans, fontSize: '11px', color: '#7A5C44' }}>{org.contact}</div>}
            <button
                onClick={() => onDonate(org.name)}
                style={{
                    marginTop: '4px', backgroundColor: '#C07A4A', color: '#FAF7F4',
                    border: 'none', borderRadius: '3px', padding: '8px 14px',
                    fontFamily: sans, fontSize: '11px', fontWeight: 500,
                    cursor: 'pointer', alignSelf: 'flex-start', transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
                Donate via Stripe →
            </button>
        </div>
    );
}

// ─── Amount pill ──────────────────────────────────────────────────────────────

function AmountPill({ value, active, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '8px 16px', borderRadius: '3px',
                border: active ? 'none' : '1px solid rgba(250,247,244,0.2)',
                backgroundColor: active ? '#C07A4A' : 'rgba(250,247,244,0.08)',
                color: '#FAF7F4', fontFamily: sans, fontSize: '13px',
                fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
            }}
        >
            {value} €
        </button>
    );
}

// ─── Recharts tooltip ─────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#1A0F0A', border: '1px solid rgba(250,247,244,0.2)',
            borderRadius: '6px', padding: '8px 12px', fontFamily: sans,
        }}>
            <div style={{ fontSize: '11px', color: 'rgba(250,247,244,0.6)', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#FAF7F4' }}>{payload[0].value}</div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AboutPage() {
    const location = useLocation();

    useEffect(() => {
        if (location.hash === '#donation-cta') {
            setTimeout(() => {
                document.getElementById('donation-cta')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        }
    }, [location.hash]);

    const [stats, setStats]                 = useState(null);
    const [statsLoading, setStatsLoading]   = useState(true);
    const [analytics, setAnalytics]         = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    const [geoState, setGeoState]           = useState('requesting');
    const [city, setCity]                   = useState('');
    const [cityInput, setCityInput]         = useState('');
    const [organizations, setOrgs]          = useState([]);
    const [orgsLoading, setOrgsLoading]     = useState(false);
    const [fallbackCity, setFallbackCity]   = useState(null);

    const [selectedAmount, setSelectedAmount]   = useState(25);
    const [customAmount, setCustomAmount]       = useState('');
    const [donationTarget, setDonationTarget]   = useState('');
    const [donationLoading, setDonationLoading] = useState(false);
    const [donationMsg, setDonationMsg]         = useState('');

    useEffect(() => {
        axios.get(`${API}/animals/stats`, { withCredentials: true })
            .then(r => setStats(r.data.stats))
            .catch(() => {})
            .finally(() => setStatsLoading(false));
    }, []);

    useEffect(() => {
        axios.get(`${API}/animals/analytics`, { withCredentials: true })
            .then(r => setAnalytics(r.data.data))
            .catch(() => {})
            .finally(() => setAnalyticsLoading(false));
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) { setGeoState('denied'); return; }
        navigator.geolocation.getCurrentPosition(
            async pos => {
                const { latitude: lat, longitude: lng } = pos.coords;
                let resolvedCity = 'Romania';
                try {
                    const r = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const d = await r.json();
                    resolvedCity = d.address?.city || d.address?.town || d.address?.village || 'Romania';
                } catch { /* keep fallback */ }
                setCity(resolvedCity);
                setGeoState('searching');
                fetchOrgs(resolvedCity, lat, lng);
            },
            () => setGeoState('denied'),
            { timeout: 8000 }
        );
    }, []);

    const fetchOrgs = (cityName, lat, lng) => {
        setOrgsLoading(true);
        setFallbackCity(null);
        axios.post(`${API}/ai/organizations`, { city: cityName, lat, lng }, { withCredentials: true })
            .then(r => {
                setOrgs(r.data.organizations || []);
                setFallbackCity(r.data.fallbackCity || null);
            })
            .catch(() => { setOrgs([]); setFallbackCity(null); })
            .finally(() => { setOrgsLoading(false); setGeoState('results'); });
    };

    const handleCitySearch = () => {
        if (!cityInput.trim()) return;
        const trimmed = cityInput.trim();
        setCity(trimmed);
        setGeoState('searching');
        fetchOrgs(trimmed);
    };

    const resetSearch = () => { setGeoState('denied'); setCityInput(''); setOrgs([]); setFallbackCity(null); };

    const handleDonate = async (orgName) => {
        const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
        if (!amount || amount <= 0) return;
        setDonationLoading(true);
        setDonationMsg('');
        try {
            const r = await axios.post(
                `${API}/donations/create-session`,
                { amount, currency: 'eur', organizationName: orgName || donationTarget || 'Paws Community Fund' },
                { withCredentials: true }
            );
            if (r.data.url) window.location.href = r.data.url;
        } catch {
            setDonationMsg('Something went wrong. Please try again.');
        } finally {
            setDonationLoading(false);
        }
    };

    // ── Chart.js data ─────────────────────────────────────────────────────────

    const hCount      = analytics?.timeSeries?.historicalLabels?.length ?? 0;
    const hasForecast = (analytics?.timeSeries?.forecastLabels?.length ?? 0) > 0;
    const allLabels   = [
        ...(analytics?.timeSeries?.historicalLabels   ?? []),
        ...(analytics?.timeSeries?.forecastLabels     ?? []),
    ];
    const allUploads   = [
        ...(analytics?.timeSeries?.historicalUploads  ?? []),
        ...(analytics?.timeSeries?.forecastUploads    ?? []),
    ];
    const allAdoptions = [
        ...(analytics?.timeSeries?.historicalAdoptions ?? []),
        ...(analytics?.timeSeries?.forecastAdoptions   ?? []),
    ];

    const lineChartData = {
        labels: allLabels,
        datasets: [
            {
                label: 'Uploads',
                data: allUploads,
                borderColor: '#E2986A',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: '#E2986A',
                tension: 0.3,
                segment: {
                    borderDash: ctx =>
                        hasForecast && ctx.p0DataIndex >= hCount - 1 ? [6, 4] : undefined,
                },
            },
            {
                label: 'Adoptions',
                data: allAdoptions,
                borderColor: '#5DCAA5',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: '#5DCAA5',
                tension: 0.3,
                segment: {
                    borderDash: ctx =>
                        hasForecast && ctx.p0DataIndex >= hCount - 1 ? [6, 4] : undefined,
                },
            },
        ],
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#FAF7F4',
                titleColor: '#2D1F14',
                bodyColor: '#2D1F14',
                borderColor: 'rgba(45,31,20,0.1)',
                borderWidth: 1,
                titleFont: { family: sans, size: 11 },
                bodyFont: { family: sans, size: 11 },
                padding: 10,
                callbacks: {
                    label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}`,
                },
            },
        },
        scales: {
            x: {
                ticks: { color: '#B09880', font: { size: 9, family: sans } },
                grid: { display: false },
                border: { display: false },
            },
            y: {
                beginAtZero: true,
                ticks: { color: '#B09880', font: { size: 9, family: sans }, precision: 0 },
                grid: { color: 'rgba(255,255,255,0.06)' },
                border: { display: false },
            },
        },
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <style>{`
                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
            `}</style>

            <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
                <Navbar />

                <main style={{ maxWidth: '860px', margin: '0 auto', padding: '0 48px 64px', width: '100%', boxSizing: 'border-box' }}>

                    {/* ── SECTION 1: MASTHEAD ─────────────────────────────────── */}
                    <section style={{ textAlign: 'center', paddingTop: '52px', paddingBottom: '40px', borderBottom: '3px double rgba(45,31,20,0.15)', marginBottom: '40px' }}>
                        <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C07A4A', marginBottom: '14px', fontWeight: 500 }}>
                            The Paws Daily · Our mission
                        </div>
                        <h1 style={{ fontFamily: serif, fontSize: '42px', fontWeight: 700, color: '#2D1F14', margin: '0 0 14px' }}>
                            About Paws
                        </h1>
                        <p style={{ fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#7A5C44', margin: 0 }}>
                            A community-powered platform giving every stray a front page.
                        </p>
                    </section>

                    {/* ── SECTION 2: MISSION ──────────────────────────────────── */}
                    <section style={{ marginBottom: '40px' }}>
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
                            border: '1px solid rgba(45,31,20,0.10)', borderRadius: '4px', overflow: 'hidden',
                        }}>
                            <div style={{ padding: '32px 36px', borderRight: '1px solid rgba(45,31,20,0.10)' }}>
                                <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C07A4A', marginBottom: '14px', fontWeight: 600 }}>
                                    Why we exist
                                </div>
                                <h2 style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', margin: '0 0 16px', lineHeight: 1.3 }}>
                                    Every stray has a story. We just help tell it.
                                </h2>
                                <p style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.75, margin: 0 }}>
                                    Paws started with a simple idea: what if finding a street animal a home was as easy as sharing a post? We built a platform where anyone can upload a found animal, anyone can browse, and anyone can reach out — no shelters, no waiting lists, just people helping people help animals.
                                </p>
                            </div>
                            <div style={{ padding: '32px 36px' }}>
                                <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C07A4A', marginBottom: '14px', fontWeight: 600 }}>
                                    How it works
                                </div>
                                <h2 style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', margin: '0 0 16px', lineHeight: 1.3 }}>
                                    Find. Share. Connect. Adopt.
                                </h2>
                                <p style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.75, margin: 0 }}>
                                    Our community uploads animals found on the street — with photos, location, and a description. Others browse the feed, reach out directly, and arrange a meeting. Simple, fast, and human. No bureaucracy. No fees. Just a community that cares.
                                </p>
                            </div>
                        </div>
                        <div style={{ borderBottom: '1px solid rgba(45,31,20,0.10)', marginTop: '40px' }} />
                    </section>

                    {/* ── SECTION 3: STATS + ANALYTICS DASHBOARD ──────────────── */}
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontFamily: serif, fontSize: '26px', fontWeight: 700, color: '#2D1F14', margin: '0 0 4px' }}>
                            By the numbers
                        </h2>
                        <p style={{ fontFamily: sans, fontSize: '12px', fontStyle: 'italic', color: '#7A5C44', margin: '0 0 24px' }}>
                            Live statistics from our community
                        </p>

                        {/* 3×2 stats grid */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                            border: '1px solid rgba(45,31,20,0.08)', borderRadius: '4px',
                            overflow: 'hidden', marginBottom: '28px',
                        }}>
                            <StatCell loading={statsLoading} value={stats?.total_uploaded}    label="Total uploaded"       trend="↑ growing daily" />
                            <StatCell loading={statsLoading} value={stats?.found_home}         label="Found a home"         trend="↑ new matches" />
                            <StatCell loading={statsLoading} value={stats?.active_members}     label="Active members"       trend="↑ community growing" />
                            <StatCell loading={statsLoading} value={stats?.avg_days_adoption != null ? `${stats.avg_days_adoption}d` : null} label="Avg days to adoption" trend="faster each month" />
                            <StatCell loading={statsLoading} value={stats?.urgent_cases}       label="Urgent cases"         trend="↓ needs attention" urgent />
                            <StatCell loading={statsLoading} value={stats?.vaccinated}         label="Vaccinated animals"   trend="↑ health verified" />
                        </div>

                        {/* ── PLATFORM ANALYTICS DARK CARD ────────────────────── */}
                        <div style={{
                            background: '#2D1F14', borderRadius: '8px',
                            padding: '32px', marginBottom: '48px', color: '#FAF7F4',
                        }}>
                            {/* Card header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C9A98A', fontWeight: 500 }}>
                                    Platform Analytics
                                </div>
                                <div style={{ fontFamily: sans, fontSize: '9px', color: 'rgba(250,247,244,0.35)', letterSpacing: '0.06em' }}>
                                    Live · Updated on load
                                </div>
                            </div>
                            <div style={{ borderBottom: '1px solid rgba(250,247,244,0.1)', marginTop: '12px', marginBottom: '28px' }} />

                            {/* ── 1. Adoption overview ── */}
                            <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C9A98A', fontWeight: 500, marginBottom: '16px' }}>
                                Adoption overview
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>

                                {/* Donut — adoption rate */}
                                {(() => {
                                    const adoptionData = [
                                        { name: 'Found home',   value: stats?.found_home || 0,                                                                  color: '#0F6E56' },
                                        { name: 'Still listed', value: Math.max(0, (stats?.total_uploaded || 0) - (stats?.found_home || 0)), color: '#5C3D2E' },
                                    ];
                                    const successRate = stats?.total_uploaded > 0
                                        ? Math.round((stats.found_home / stats.total_uploaded) * 100)
                                        : 0;
                                    return (
                                        <div>
                                            <div style={{ position: 'relative' }}>
                                                <ResponsiveContainer width="100%" height={180}>
                                                    <PieChart>
                                                        <Pie data={adoptionData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3} startAngle={90} endAngle={-270}>
                                                            {adoptionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                        </Pie>
                                                        <Tooltip content={<DarkTooltip />} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                                    <div style={{ fontFamily: serif, fontSize: '20px', fontWeight: 700, color: '#FAF7F4', lineHeight: 1 }}>{successRate}%</div>
                                                    <div style={{ fontFamily: sans, fontSize: '9px', color: 'rgba(250,247,244,0.7)', marginTop: '4px' }}>success rate</div>
                                                </div>
                                            </div>
                                            <div style={{ fontFamily: sans, fontSize: '11px', color: 'rgba(250,247,244,0.75)', textAlign: 'center', marginTop: '8px' }}>Adoption Rate</div>
                                        </div>
                                    );
                                })()}

                                {/* Bar — health & status */}
                                {(() => {
                                    const healthData = [
                                        { label: 'Vacc.',   value: stats?.vaccinated     || 0, color: '#5DCAA5' },
                                        { label: 'Urgent',  value: stats?.urgent_cases   || 0, color: '#E2986A' },
                                        { label: 'Adopted', value: stats?.found_home     || 0, color: '#0F6E56' },
                                        { label: 'Total',   value: stats?.total_uploaded || 0, color: 'rgba(250,247,244,0.25)' },
                                    ];
                                    return (
                                        <div>
                                            <ResponsiveContainer width="100%" height={180}>
                                                <BarChart data={healthData} barSize={20} barCategoryGap="30%" margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                                                    <XAxis dataKey="label" tick={{ fontFamily: sans, fontSize: 9, fill: 'rgba(250,247,244,0.7)' }} axisLine={false} tickLine={false} />
                                                    <YAxis hide />
                                                    <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(250,247,244,0.05)' }} />
                                                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                                                        {healthData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                            <div style={{ fontFamily: sans, fontSize: '11px', color: 'rgba(250,247,244,0.75)', textAlign: 'center', marginTop: '8px' }}>Health & Status</div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '28px' }} />

                            {/* ── 2. Adoption forecast cards ── */}
                            <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C9A98A', fontWeight: 500, marginBottom: '16px' }}>
                                Adoption forecast
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                                <ForecastCard
                                    label="Predicted in next 30 days"
                                    value={analytics?.forecast?.next30}
                                    loading={analyticsLoading}
                                    insufficient={analytics?.forecast?.insufficient}
                                />
                                <ForecastCard
                                    label="Predicted in next 90 days"
                                    value={analytics?.forecast?.next90}
                                    loading={analyticsLoading}
                                    insufficient={analytics?.forecast?.insufficient}
                                />
                            </div>

                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '28px' }} />

                            {/* ── 3. Dual-line forecast chart ── */}
                            <div style={{ marginBottom: '28px' }}>
                                {/* Custom legend */}
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '14px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '20px', height: '2px', background: '#E2986A', borderRadius: '1px' }} />
                                        <span style={{ fontFamily: sans, fontSize: '10px', color: '#B09880' }}>Uploads</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '20px', height: '2px', background: '#5DCAA5', borderRadius: '1px' }} />
                                        <span style={{ fontFamily: sans, fontSize: '10px', color: '#B09880' }}>Adoptions</span>
                                    </div>
                                    {hasForecast && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="20" height="2" style={{ flexShrink: 0 }}>
                                                <line x1="0" y1="1" x2="20" y2="1" stroke="#B09880" strokeWidth="2" strokeDasharray="4 3" />
                                            </svg>
                                            <span style={{ fontFamily: sans, fontSize: '10px', color: '#B09880' }}>Predicted</span>
                                        </div>
                                    )}
                                </div>

                                {analyticsLoading ? (
                                    <DarkSkeleton width="100%" height="140px" />
                                ) : allLabels.length < 2 ? (
                                    <div style={{
                                        height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px',
                                    }}>
                                        <span style={{ fontFamily: sans, fontSize: '12px', color: 'rgba(250,247,244,0.35)', fontStyle: 'italic' }}>
                                            Not enough data to display trend yet
                                        </span>
                                    </div>
                                ) : (
                                    <div
                                        role="img"
                                        aria-label="Line chart showing monthly uploads and adoptions over time, with a 3-month linear forecast shown as dashed lines"
                                        style={{ height: '140px' }}
                                    >
                                        <Line data={lineChartData} options={lineChartOptions} />
                                    </div>
                                )}
                            </div>

                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '28px' }} />

                            {/* ── 4. More metrics ── */}
                            <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C9A98A', fontWeight: 500, marginBottom: '16px' }}>
                                More metrics
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '28px' }}>
                                <SmallMetricCard
                                    label="Avg. time to adoption"
                                    value={stats?.avg_days_adoption != null ? `${stats.avg_days_adoption}d` : null}
                                    loading={statsLoading}
                                />
                                <SmallMetricCard
                                    label="Dog adoption rate"
                                    value={analytics?.metrics?.dog_adoption_rate != null ? `${analytics.metrics.dog_adoption_rate}%` : null}
                                    loading={analyticsLoading}
                                />
                                <SmallMetricCard
                                    label="Cat adoption rate"
                                    value={analytics?.metrics?.cat_adoption_rate != null ? `${analytics.metrics.cat_adoption_rate}%` : null}
                                    loading={analyticsLoading}
                                />
                            </div>

                            {/* ── 5. What moves the needle ── */}
                            {!analyticsLoading && analytics?.needleInsights?.length > 0 && (
                                <>
                                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '28px' }} />
                                    <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C9A98A', fontWeight: 500, marginBottom: '16px' }}>
                                        What moves the needle
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {analytics.needleInsights.map((insight, i) => (
                                            <NeedleRow key={i} label={insight.label} impact={insight.impact} note={insight.note} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    {/* ── SECTION 4: LOCATION-AWARE ORGS ──────────────────────── */}
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontFamily: serif, fontSize: '26px', fontWeight: 700, color: '#2D1F14', margin: '0 0 24px' }}>
                            Rescue organizations near you
                        </h2>

                        {geoState === 'requesting' && (
                            <div style={{ textAlign: 'center', padding: '40px 24px', border: '1px solid rgba(45,31,20,0.10)', borderRadius: '4px' }}>
                                <div style={{ fontSize: '28px', marginBottom: '12px', animation: 'pulse 1.8s ease-in-out infinite' }}>📍</div>
                                <p style={{ fontFamily: sans, fontSize: '14px', color: '#7A5C44', margin: '0 0 12px' }}>
                                    Finding rescue organizations near you...
                                </p>
                                <button
                                    onClick={() => setGeoState('denied')}
                                    style={{ background: 'none', border: 'none', fontFamily: sans, fontSize: '12px', color: '#C07A4A', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Enter city manually
                                </button>
                            </div>
                        )}

                        {geoState === 'denied' && (
                            <div style={{ padding: '28px', border: '1px solid rgba(45,31,20,0.10)', borderRadius: '4px' }}>
                                <p style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', margin: '0 0 12px' }}>Which city are you in?</p>
                                <input
                                    type="text" value={cityInput}
                                    onChange={e => setCityInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
                                    placeholder="e.g. Cluj-Napoca, Brașov, Iași..."
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        border: '1px solid rgba(45,31,20,0.15)', borderRadius: '4px',
                                        padding: '10px 14px', fontSize: '14px', fontFamily: sans,
                                        color: '#2D1F14', backgroundColor: '#FAF7F4', outline: 'none', marginBottom: '12px',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#C07A4A'}
                                    onBlur={e  => e.target.style.borderColor = 'rgba(45,31,20,0.15)'}
                                />
                                <button
                                    onClick={handleCitySearch}
                                    style={{
                                        backgroundColor: '#C07A4A', color: '#FAF7F4', border: 'none',
                                        borderRadius: '3px', padding: '10px 20px', fontFamily: sans,
                                        fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginBottom: '12px', transition: 'opacity 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                >
                                    Find organizations →
                                </button>
                                <p style={{ fontFamily: sans, fontSize: '11px', color: '#7A5C44', margin: 0 }}>
                                    We only use your city name to find local rescue associations.
                                </p>
                            </div>
                        )}

                        {geoState === 'searching' && (
                            <div style={{ textAlign: 'center', padding: '40px 24px', border: '1px solid rgba(45,31,20,0.10)', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <Spinner />
                                    <span style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44' }}>
                                        Searching for rescue organizations in {city}...
                                    </span>
                                </div>
                            </div>
                        )}

                        {geoState === 'results' && (
                            <div>
                                {orgsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '40px', border: '1px solid rgba(45,31,20,0.10)', borderRadius: '4px' }}>
                                        <Spinner />
                                    </div>
                                ) : organizations.length === 0 ? (
                                    <div style={{ padding: '32px 28px', border: '1px solid rgba(45,31,20,0.10)', borderRadius: '4px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔍</div>
                                        <p style={{ fontFamily: sans, fontSize: '14px', color: '#2D1F14', margin: '0 0 6px', fontWeight: 500 }}>
                                            No organizations found in <strong>{city}</strong>
                                        </p>
                                        <p style={{ fontFamily: sans, fontSize: '12px', color: '#7A5C44', margin: '0 0 18px' }}>
                                            Try a nearby city (e.g. Timișoara, Cluj-Napoca, București, Iași) or a different spelling.
                                        </p>
                                        <button
                                            onClick={resetSearch}
                                            style={{
                                                backgroundColor: '#C07A4A', color: '#FAF7F4', border: 'none',
                                                borderRadius: '3px', padding: '9px 20px', fontFamily: sans,
                                                fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'opacity 0.15s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        >
                                            Try again
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <p style={{ fontFamily: sans, fontSize: '12px', color: '#7A5C44', margin: '0 0 16px' }}>
                                            Results for <strong>{city}</strong>
                                            &nbsp;·&nbsp;
                                            <button
                                                onClick={resetSearch}
                                                style={{ background: 'none', border: 'none', fontFamily: sans, fontSize: '12px', color: '#C07A4A', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                                            >
                                                Search again
                                            </button>
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: organizations.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                                            {organizations.slice(0, 4).map((org, i) => (
                                                <OrgCard
                                                    key={i} org={org}
                                                    onDonate={orgName => {
                                                        setDonationTarget(orgName);
                                                        document.getElementById('donation-cta')?.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        {fallbackCity && fallbackCity !== 'general' && (
                                            <p style={{ fontFamily: sans, fontSize: '11px', fontStyle: 'italic', color: '#7A5C44', textAlign: 'center', marginTop: '14px', marginBottom: 0 }}>
                                                Showing organizations from the nearest area to {city}. More cities coming soon.
                                            </p>
                                        )}
                                        {fallbackCity === 'general' && (
                                            <p style={{ fontFamily: sans, fontSize: '11px', fontStyle: 'italic', color: '#7A5C44', textAlign: 'center', marginTop: '14px', marginBottom: 0 }}>
                                                Showing featured Romanian rescue organizations. More cities coming soon.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </section>

                    {/* ── SECTION 5: DONATION CTA ──────────────────────────────── */}
                    <section
                        id="donation-cta"
                        style={{ position: 'relative', backgroundColor: '#2D1F14', borderRadius: '4px', padding: '36px 40px', overflow: 'hidden' }}
                    >
                        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(192,122,74,0.08)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(192,122,74,0.05)', pointerEvents: 'none' }} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(250,247,244,0.45)', marginBottom: '12px', fontWeight: 500 }}>
                                Support the cause
                            </div>
                            <h2 style={{ fontFamily: serif, fontSize: '32px', fontWeight: 700, color: '#FAF7F4', margin: '0 0 12px', lineHeight: 1.25 }}>
                                Every donation finds{' '}
                                <em style={{ color: '#C07A4A', fontStyle: 'italic' }}>another animal a home.</em>
                            </h2>
                            <p style={{ fontFamily: sans, fontSize: '13px', color: 'rgba(250,247,244,0.6)', margin: '0 0 24px', lineHeight: 1.7, maxWidth: '520px' }}>
                                Choose an amount and select which organization to support. 100% of your donation goes directly to the rescue association — Paws takes no cut.
                            </p>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                                {[10, 25, 50, 100].map(amt => (
                                    <AmountPill
                                        key={amt} value={amt}
                                        active={selectedAmount === amt && !customAmount}
                                        onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                                    />
                                ))}
                                <input
                                    type="number" placeholder="Custom" value={customAmount}
                                    onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                                    style={{
                                        width: '90px', padding: '8px 12px', borderRadius: '3px',
                                        border: '1px solid rgba(250,247,244,0.2)',
                                        backgroundColor: customAmount ? '#C07A4A' : 'rgba(250,247,244,0.08)',
                                        color: '#FAF7F4', fontFamily: sans, fontSize: '13px', outline: 'none',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#C07A4A'}
                                    onBlur={e  => e.target.style.borderColor = 'rgba(250,247,244,0.2)'}
                                />
                            </div>

                            {donationTarget && (
                                <p style={{ fontFamily: sans, fontSize: '12px', color: 'rgba(250,247,244,0.55)', marginBottom: '14px' }}>
                                    Donating to: <strong style={{ color: '#C07A4A' }}>{donationTarget}</strong>
                                    &nbsp;·&nbsp;
                                    <button onClick={() => setDonationTarget('')} style={{ background: 'none', border: 'none', color: 'rgba(250,247,244,0.4)', fontFamily: sans, fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>change</button>
                                </p>
                            )}

                            <button
                                onClick={() => handleDonate(donationTarget)}
                                disabled={donationLoading}
                                style={{
                                    backgroundColor: '#C07A4A', color: '#FAF7F4', border: 'none',
                                    borderRadius: '3px', padding: '12px 24px', fontFamily: sans,
                                    fontSize: '14px', fontWeight: 500,
                                    cursor: donationLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: donationLoading ? 0.7 : 1, transition: 'opacity 0.15s', marginBottom: '10px',
                                }}
                                onMouseEnter={e => { if (!donationLoading) e.currentTarget.style.opacity = '0.82'; }}
                                onMouseLeave={e => { if (!donationLoading) e.currentTarget.style.opacity = '1'; }}
                            >
                                {donationLoading && <Spinner />}
                                Donate with Stripe →
                            </button>

                            {donationMsg && (
                                <p style={{ fontFamily: sans, fontSize: '12px', color: 'rgba(250,247,244,0.7)', marginTop: '8px', marginBottom: 0 }}>
                                    {donationMsg}
                                </p>
                            )}
                            <p style={{ fontFamily: sans, fontSize: '10px', color: 'rgba(250,247,244,0.35)', marginTop: '10px', marginBottom: 0 }}>
                                Secured by Stripe. Receipt sent by email.
                            </p>
                        </div>
                    </section>

                </main>
            </div>
        </>
    );
}
