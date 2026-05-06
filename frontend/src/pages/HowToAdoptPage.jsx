import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const STEPS = [
    {
        num:   '01',
        title: 'Find an animal',
        body:  'Browse the feed or map, find an animal near you that you\'d like to adopt.',
    },
    {
        num:   '02',
        title: 'Contact the uploader',
        body:  'Send a private message to the person who found the animal. Arrange a time and place to meet.',
    },
    {
        num:   '03',
        title: 'Give them a home',
        body:  'Meet the animal, make sure it\'s a good fit, and welcome them into your home.',
    },
];

const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function HowToAdoptPage() {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px', width: '100%', boxSizing: 'border-box' }}>

                {/* Dateline */}
                <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', textAlign: 'center', marginBottom: '12px' }}>
                    The Paws Daily · How to adopt · {today}
                </div>

                {/* Title + subtitle */}
                <div style={{ fontFamily: serif, fontSize: '36px', fontWeight: 700, color: '#2D1F14', lineHeight: 1.05, textAlign: 'center', marginBottom: '10px' }}>
                    How to adopt
                </div>
                <div style={{ fontFamily: serif, fontSize: '15px', fontStyle: 'italic', color: '#7A5C44', textAlign: 'center', marginBottom: '32px' }}>
                    Three simple steps to give a street animal its forever home.
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

                {/* ── Section A — Things to know ──────────────────────── */}
                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', marginTop: '48px', paddingTop: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '8px', lineHeight: 1.2 }}>
                        Things to know before adopting
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7, marginBottom: '24px' }}>
                        Bringing a street animal home is a joyful step — but it comes with responsibilities. Here are four things every new adopter should be prepared for.
                    </div>

                    {/* 2×2 grid with borders */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid rgba(45,31,20,0.1)' }}>
                        {[
                            { label: 'Time commitment', text: 'Street animals may need patience and time to adjust to a home environment. Plan for at least 2–4 weeks of settling in.' },
                            { label: 'Vet check',       text: 'Always take a newly adopted animal to a vet within the first week. Many street animals haven\'t been vaccinated or dewormed.' },
                            { label: 'Safe space',      text: 'Prepare a quiet corner with a bed, water, and food before the animal arrives. First impressions matter.' },
                            { label: 'Other pets',      text: 'If you have other animals, introduce them slowly in a neutral space. Don\'t rush the process.' },
                        ].map(({ label, text }, i) => (
                            <div
                                key={label}
                                style={{
                                    padding: '16px',
                                    borderRight: i % 2 === 0 ? '1px solid rgba(45,31,20,0.1)' : 'none',
                                    borderBottom: i < 2 ? '1px solid rgba(45,31,20,0.1)' : 'none',
                                }}
                            >
                                <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '6px' }}>
                                    {label}
                                </div>
                                <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>
                                    {text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Section B — CTA ──────────────────────────────────── */}
                <div style={{ borderTop: '3px double rgba(45,31,20,0.15)', marginTop: '56px', paddingTop: '40px', textAlign: 'center' }}>
                    <div style={{ fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#7A5C44', marginBottom: '20px', lineHeight: 1.5 }}>
                        "Every stray deserves a front page."
                    </div>
                    <Link
                        to="/animals"
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
                        Browse animals →
                    </Link>
                </div>

            </div>
        </div>
    );
}
