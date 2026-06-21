import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useDonationStore } from '../store/donationStore';

const serif = "'Playfair Display', Georgia, serif";
const sans  = "'DM Sans', system-ui, sans-serif";
const API   = 'http://localhost:5000/api';

const PREF_OPTIONS = [
    { value: 'name',      label: 'Show my name',    desc: 'You appear with your name in the donors list' },
    { value: 'anonymous', label: 'Stay anonymous',  desc: 'You appear as "Anonymous"' },
    { value: 'hidden',    label: 'Don\'t show me',  desc: 'You don\'t appear in the donors list at all' },
];

export default function DonationSuccessPage() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const [donationDetails, setDonationDetails] = useState(null);
    const [sessionId, setSessionId]             = useState(null);
    const [verifying, setVerifying]             = useState(true);

    const [pref, setPref]         = useState('name');
    const [customName, setCustomName] = useState('');
    const [prefSaved, setPrefSaved]   = useState(false);
    const [prefSaving, setPrefSaving] = useState(false);

    const { verifyDonation } = useDonationStore();

    useEffect(() => {
        const run = async () => {
            const params = new URLSearchParams(location.search);
            const sid    = params.get('session_id');
            if (!sid) { navigate('/'); return; }
            setSessionId(sid);
            try {
                const result = await verifyDonation(sid);
                if (result?.success) setDonationDetails(result.donation);
            } catch { /* show generic success */ }
            finally { setVerifying(false); }
        };
        run();
    }, [location, navigate, verifyDonation]);

    const savePref = async () => {
        if (!sessionId) return;
        setPrefSaving(true);
        try {
            await axios.patch(`${API}/donations/session/${sessionId}/preference`, {
                displayPreference: pref,
                displayName: pref === 'name' ? customName : '',
            });
            setPrefSaved(true);
        } catch { /* silent */ }
        finally { setPrefSaving(false); }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#FDF8F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 16px',
            fontFamily: sans,
        }}>
            <div style={{
                maxWidth: '500px',
                width: '100%',
                background: '#fff',
                border: '1px solid rgba(45,31,20,0.1)',
                borderRadius: '6px',
                overflow: 'hidden',
            }}>
                {/* Top section */}
                <div style={{ padding: '48px 40px 36px', textAlign: 'center' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'rgba(192,122,74,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 28px',
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#C07A4A" />
                        </svg>
                    </div>

                    <h1 style={{ fontFamily: serif, fontSize: '26px', fontWeight: 700, color: '#2D1F14', margin: '0 0 10px' }}>
                        Thank you for your donation!
                    </h1>
                    <p style={{ fontSize: '15px', color: '#6B5144', lineHeight: 1.6, margin: '0 0 28px' }}>
                        Your generosity helps animals find their forever home.
                    </p>

                    {verifying ? (
                        <div style={{ padding: '20px', background: 'rgba(45,31,20,0.04)', borderRadius: '4px', fontSize: '14px', color: '#6B5144' }}>
                            Confirming your donation…
                        </div>
                    ) : donationDetails ? (
                        <div style={{ padding: '20px 24px', background: 'rgba(192,122,74,0.08)', borderRadius: '4px', borderLeft: '3px solid #C07A4A', textAlign: 'left' }}>
                            <div style={{ fontSize: '24px', fontFamily: serif, fontWeight: 700, color: '#2D1F14', marginBottom: '4px' }}>
                                {donationDetails.amount} €
                            </div>
                            <div style={{ fontSize: '13px', color: '#6B5144' }}>
                                A confirmation email has been sent to your address.
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '20px', background: 'rgba(192,122,74,0.08)', borderRadius: '4px', fontSize: '14px', color: '#6B5144' }}>
                            Your donation was processed successfully.
                        </div>
                    )}
                </div>

                {/* Preference section */}
                <div style={{ padding: '28px 40px 36px', borderTop: '1px solid rgba(45,31,20,0.08)' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C07A4A', fontWeight: 600, marginBottom: '12px' }}>
                        How would you like to appear in the donors list?
                    </div>

                    {prefSaved ? (
                        <div style={{ fontSize: '14px', color: '#5B8C5A', padding: '12px 16px', background: 'rgba(91,140,90,0.08)', borderRadius: '4px', borderLeft: '3px solid #5B8C5A' }}>
                            Your preference has been saved. Thank you!
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                {PREF_OPTIONS.map(opt => (
                                    <label key={opt.value} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                                        padding: '12px 14px',
                                        borderRadius: '4px',
                                        border: `1px solid ${pref === opt.value ? '#C07A4A' : 'rgba(45,31,20,0.1)'}`,
                                        background: pref === opt.value ? 'rgba(192,122,74,0.06)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}>
                                        <input
                                            type="radio"
                                            name="pref"
                                            value={opt.value}
                                            checked={pref === opt.value}
                                            onChange={() => setPref(opt.value)}
                                            style={{ marginTop: '2px', accentColor: '#C07A4A', flexShrink: 0 }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#2D1F14', marginBottom: '2px' }}>{opt.label}</div>
                                            <div style={{ fontSize: '12px', color: '#8B6B5A' }}>{opt.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {pref === 'name' && (
                                <div style={{ marginBottom: '16px' }}>
                                    <input
                                        type="text"
                                        placeholder="Display name (optional — leave blank to use your account name)"
                                        value={customName}
                                        onChange={e => setCustomName(e.target.value)}
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            padding: '10px 14px',
                                            border: '1px solid rgba(45,31,20,0.15)',
                                            borderRadius: '4px',
                                            fontFamily: sans, fontSize: '14px', color: '#2D1F14',
                                            background: '#FDFAF8', outline: 'none',
                                        }}
                                    />
                                </div>
                            )}

                            <button
                                onClick={savePref}
                                disabled={prefSaving}
                                style={{
                                    width: '100%', padding: '11px',
                                    background: prefSaving ? '#8B6B5A' : '#2D1F14',
                                    color: '#FAF7F4', border: 'none', borderRadius: '4px',
                                    fontFamily: sans, fontSize: '14px', fontWeight: 500,
                                    cursor: prefSaving ? 'not-allowed' : 'pointer',
                                    marginBottom: '12px',
                                    transition: 'background 0.15s',
                                }}
                            >
                                {prefSaving ? 'Saving…' : 'Save preference'}
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => navigate('/')}
                        style={{
                            width: '100%', padding: '11px',
                            background: 'transparent',
                            color: '#6B5144',
                            border: '1px solid rgba(45,31,20,0.15)',
                            borderRadius: '4px',
                            fontFamily: sans, fontSize: '14px',
                            cursor: 'pointer',
                        }}
                    >
                        ← Back to home
                    </button>
                </div>
            </div>
        </div>
    );
}
