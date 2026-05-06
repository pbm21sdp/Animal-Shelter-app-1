import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const STEPS = [
    {
        num:   '01',
        title: 'Stay calm',
        body:  'Don\'t chase the animal. Approach slowly and let it come to you.',
    },
    {
        num:   '02',
        title: 'Check for ID',
        body:  'Look for a collar or tag. If possible, take it to a vet to scan for a microchip.',
    },
    {
        num:   '03',
        title: 'Photograph and post',
        body:  'Take clear photos and upload immediately to Paws with the exact location.',
    },
    {
        num:   '04',
        title: 'Provide temporary care',
        body:  'If the animal is injured or it\'s cold, provide shelter while you wait for a response.',
    },
];

const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function GuidePage() {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px', width: '100%', boxSizing: 'border-box' }}>

                {/* Dateline */}
                <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', textAlign: 'center', marginBottom: '12px' }}>
                    The Paws Daily · Field guide · {today}
                </div>

                {/* Title + subtitle */}
                <div style={{ fontFamily: serif, fontSize: '36px', fontWeight: 700, color: '#2D1F14', lineHeight: 1.05, textAlign: 'center', marginBottom: '10px' }}>
                    What to do when you find a stray
                </div>
                <div style={{ fontFamily: serif, fontSize: '15px', fontStyle: 'italic', color: '#7A5C44', textAlign: 'center', marginBottom: '32px' }}>
                    A quick guide for anyone who spots a stray animal.
                </div>

                {/* Divider */}
                <div style={{ borderTop: '3px double rgba(45,31,20,0.15)', marginBottom: '40px' }} />

                {/* Steps — flex row with vertical dividers */}
                <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>
                    {STEPS.map((step, i) => (
                        <React.Fragment key={step.num}>
                            <div style={{ flex: 1, padding: '28px 24px 28px 0', paddingLeft: i === 0 ? 0 : '24px' }}>
                                <div style={{ fontFamily: serif, fontSize: '48px', fontWeight: 700, color: 'rgba(45,31,20,0.08)', lineHeight: 1, width: '56px', flexShrink: 0, userSelect: 'none', marginBottom: '12px' }}>
                                    {step.num}
                                </div>
                                <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 700, color: '#2D1F14', marginBottom: '8px', lineHeight: 1.2 }}>
                                    {step.title}
                                </div>
                                <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>
                                    {step.body}
                                </div>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{ width: '1px', backgroundColor: 'rgba(45,31,20,0.1)', alignSelf: 'stretch', flexShrink: 0 }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* ── Section A — Aggressive / scared animals ──────────── */}
                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', marginTop: '48px', paddingTop: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '8px', lineHeight: 1.2 }}>
                        If the animal is aggressive or scared
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7, marginBottom: '20px' }}>
                        Not all stray animals are approachable. If an animal seems aggressive, cornered, or severely injured, do not attempt to handle it yourself.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            'Call the local animal protection service: ADPOST Timișoara — 0256 246 100',
                            'Do not block the animal\'s escape route — it may lash out if cornered',
                            'Take photos from a distance and post on Paws so others in the area are aware',
                        ].map((tip, i) => (
                            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#C07A4A', fontFamily: sans, fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>—</span>
                                <span style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Section B — Useful contacts ───────────────────────── */}
                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', marginTop: '48px', paddingTop: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '20px', lineHeight: 1.2 }}>
                        Useful contacts in Timișoara
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { name: 'ADPOST Timișoara', role: 'Animal protection service', contact: '0256 246 100' },
                            { name: 'Direcția de Mediu Timișoara', role: 'Environmental directorate', contact: '0256 408 600' },
                            { name: 'Paws community helpline', role: 'Platform support', contact: 'help@paws.ro' },
                        ].map(({ name, role, contact }) => (
                            <div key={name} style={{ borderLeft: '3px solid #C07A4A', paddingLeft: '16px' }}>
                                <div style={{ fontFamily: serif, fontSize: '15px', fontWeight: 700, color: '#2D1F14', marginBottom: '2px' }}>{name}</div>
                                <div style={{ fontFamily: sans, fontSize: '11px', color: '#B09880', marginBottom: '4px' }}>{role}</div>
                                <div style={{ fontFamily: sans, fontSize: '12px', color: '#C07A4A', fontWeight: 500 }}>{contact}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Section C — CTA ───────────────────────────────────── */}
                <div style={{ borderTop: '3px double rgba(45,31,20,0.15)', marginTop: '56px', paddingTop: '40px', textAlign: 'center' }}>
                    <div style={{ fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#7A5C44', marginBottom: '20px', lineHeight: 1.5 }}>
                        "Every stray deserves a front page."
                    </div>
                    <Link
                        to="/add-animal"
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#C07A4A',
                            color: '#FAF7F4',
                            borderRadius: '100px',
                            padding: '12px 28px',
                            fontSize: '14px',
                            fontFamily: serif,
                            fontStyle: 'italic',
                            textDecoration: 'none',
                            transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#A8673C'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C07A4A'; }}
                    >
                        Found a stray? Post it now →
                    </Link>
                </div>

            </div>
        </div>
    );
}
