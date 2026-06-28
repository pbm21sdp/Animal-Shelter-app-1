import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { formatDate } from '../utils/date';

const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";
const C = {
    cream:      '#FAF7F4',
    espresso:   '#2D1F14',
    terracotta: '#C07A4A',
    muted:      '#7A5C44',
    lightMuted: '#B09880',
    border:     'rgba(45,31,20,0.12)',
};
const API = 'http://localhost:5000/api';

function goToDonate(navigate) {
    navigate('/about#donation-cta');
}

export default function DonationsPage() {
    const navigate = useNavigate();
    const [data, setData]       = useState({ totalRaised: 0, donorCount: 0, donors: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API}/donations/public/stats`)
            .then(r => { if (r.data.success) setData(r.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const namedCount = data.donors.filter(d => d.displayName !== 'Anonymous').length;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: C.cream, overflowY: 'auto', fontFamily: sans }}>
            <Navbar />

            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px 80px' }}>

                {/* Masthead */}
                <div style={{ borderBottom: `3px double ${C.border}`, paddingBottom: '20px', marginBottom: '36px', textAlign: 'center' }}>
                    <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: C.terracotta, fontWeight: 500, marginBottom: '8px' }}>
                        Community Fund
                    </div>
                    <h1 style={{ fontFamily: serif, fontSize: '40px', fontWeight: 700, color: C.espresso, margin: '0 0 8px', lineHeight: 1.1 }}>
                        Our Donors
                    </h1>
                    <p style={{ fontFamily: sans, fontSize: '14px', color: C.muted, margin: 0 }}>
                        The people behind every chance given to an animal in need.
                    </p>
                </div>

                {/* Disclaimer */}
                <div style={{
                    border: `1px solid rgba(192,122,74,0.3)`,
                    borderLeft: `3px solid ${C.terracotta}`,
                    background: 'rgba(192,122,74,0.05)',
                    borderRadius: '4px',
                    padding: '18px 22px',
                    marginBottom: '36px',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                        <circle cx="12" cy="12" r="10" stroke="#C07A4A" strokeWidth="1.5"/>
                        <path d="M12 8v4M12 16h.01" stroke="#C07A4A" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <div>
                        <div style={{ fontFamily: sans, fontSize: '13px', fontWeight: 600, color: C.espresso, marginBottom: '4px' }}>
                            How donations are used
                        </div>
                        <div style={{ fontFamily: sans, fontSize: '13px', color: C.muted, lineHeight: 1.6 }}>
                            All donations collected through Paws go directly toward supporting animal rescuers,
                            foster families, and animals in critical need and are used for covering veterinary costs, food,
                            temporary shelter, and transport. No donations fund platform operations.
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    border: `1px solid ${C.border}`,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '48px',
                    background: '#fff',
                }}>
                    {[
                        { value: loading ? '…' : `${data.totalRaised.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`, label: 'Total raised' },
                        { value: loading ? '…' : data.donorCount, label: 'Donations' },
                        { value: loading ? '…' : namedCount, label: 'Named donors' },
                    ].map((stat, i) => (
                        <div key={i} style={{
                            padding: '24px 20px',
                            textAlign: 'center',
                            borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
                        }}>
                            <div style={{ fontFamily: serif, fontSize: '32px', fontWeight: 700, color: C.espresso, lineHeight: 1 }}>
                                {stat.value}
                            </div>
                            <div style={{ fontFamily: sans, fontSize: '10px', color: C.muted, marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Donor list */}
                <div style={{ marginBottom: '48px' }}>
                    <div style={{
                        fontFamily: sans, fontSize: '10px', textTransform: 'uppercase',
                        letterSpacing: '0.14em', color: C.muted, fontWeight: 500,
                        marginBottom: '4px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span>Donors</span>
                        {!loading && data.donors.length > 0 && (
                            <span style={{ color: C.lightMuted }}>
                                {data.donors.length} {data.donors.length === 1 ? 'entry' : 'entries'}
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ color: C.muted, fontSize: '14px', padding: '24px 0' }}>Loading…</div>
                    ) : data.donors.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div style={{ fontFamily: serif, fontSize: '22px', color: C.espresso, marginBottom: '10px' }}>
                                Be the first donor
                            </div>
                            <p style={{ fontSize: '14px', color: C.muted, marginBottom: '20px' }}>
                                Your contribution will appear here and help animals find a home.
                            </p>
                            <button onClick={() => goToDonate(navigate)} style={{
                                background: C.espresso, color: C.cream,
                                padding: '10px 24px', borderRadius: '4px',
                                border: 'none', cursor: 'pointer',
                                fontSize: '13px', fontFamily: sans, fontWeight: 500,
                            }}>
                                Donate →
                            </button>
                        </div>
                    ) : (
                        <div>
                            {data.donors.map((donor, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 0',
                                    borderBottom: `1px solid ${C.border}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            backgroundColor: donor.displayName === 'Anonymous' ? C.lightMuted : C.espresso,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <span style={{ fontFamily: serif, fontSize: '15px', color: C.cream, fontWeight: 700 }}>
                                                {donor.displayName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: sans, fontSize: '14px', fontWeight: 500, color: C.espresso }}>
                                                {donor.displayName}
                                            </div>
                                            {donor.note && (
                                                <div style={{ fontFamily: sans, fontSize: '12px', color: C.muted, fontStyle: 'italic', marginTop: '2px', lineHeight: 1.4 }}>
                                                    "{donor.note}"
                                                </div>
                                            )}
                                            <div style={{ fontFamily: sans, fontSize: '11px', color: C.lightMuted, marginTop: '2px' }}>
                                                {formatDate(donor.createdAt, 'short')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 700, color: C.terracotta }}>
                                        {donor.amount} €
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div style={{
                    background: C.espresso, borderRadius: '4px',
                    padding: '32px 36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '24px',
                }}>
                    <div>
                        <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: C.cream, marginBottom: '6px' }}>
                            Make a difference today
                        </div>
                        <div style={{ fontFamily: sans, fontSize: '13px', color: 'rgba(250,247,244,0.65)', lineHeight: 1.5 }}>
                            Every euro goes directly to rescuers, fosters, and animals in critical need.
                        </div>
                    </div>
                    <button onClick={() => goToDonate(navigate)} style={{
                        flexShrink: 0,
                        background: C.terracotta, color: C.cream,
                        padding: '12px 28px', borderRadius: '4px',
                        border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontFamily: sans, fontWeight: 500,
                        whiteSpace: 'nowrap',
                    }}>
                        Donate →
                    </button>
                </div>
            </div>
        </div>
    );
}
