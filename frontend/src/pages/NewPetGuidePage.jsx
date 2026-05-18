import React from 'react';
import Navbar from '../components/Navbar';

const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const PREP_ITEMS = [
    'Food and water bowls in a quiet location',
    'A bed or blanket in a designated safe space',
    'Litter box (for cats) or designated outdoor area (for dogs)',
    'Collar with ID tag and microchip registration',
    'Veterinary appointment booked within the first week',
    'Emergency vet contact saved in your phone',
];

export default function NewPetGuidePage() {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px', width: '100%', boxSizing: 'border-box' }}>

                <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', textAlign: 'center', marginBottom: '12px' }}>
                    The Paws Daily · Care Guide · {today}
                </div>

                <div style={{ fontFamily: serif, fontSize: '36px', fontWeight: 700, color: '#2D1F14', lineHeight: 1.05, textAlign: 'center', marginBottom: '10px' }}>
                    The First 30 Days
                </div>
                <div style={{ fontFamily: serif, fontSize: '15px', fontStyle: 'italic', color: '#7A5C44', textAlign: 'center', marginBottom: '32px' }}>
                    How to help a rescued animal feel at home.
                </div>

                <div style={{ borderTop: '3px double rgba(45,31,20,0.15)', marginBottom: '40px' }} />

                <div style={{ marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '12px', lineHeight: 1.2 }}>
                        Days 1–3: The decompression period
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>
                        Most rescued animals need time to decompress. Keep the environment calm and quiet. Give them a designated safe space, like a corner, a crate, or a room, somewhere they can retreat. Do not force interaction. Let them come to you on their own terms.
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '12px', lineHeight: 1.2 }}>
                        The first week: Building routine
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>
                        Animals thrive on routine. Feed at the same times each day. Establish a consistent sleeping arrangement. Begin short, positive interactions and reward calm behavior. Avoid overwhelming them with new people or experiences.
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '12px', lineHeight: 1.2 }}>
                        Weeks 2–4: Building trust
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>
                        By the second week most animals begin to show their real personality. Continue building positive associations through play, treats, and gentle handling. This is a good time for a veterinary check-up if not already done.
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '16px', lineHeight: 1.2 }}>
                        What to have ready before they arrive
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {PREP_ITEMS.map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#C07A4A', fontFamily: sans, fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>—</span>
                                <span style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
