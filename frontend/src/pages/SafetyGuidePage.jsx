import React from 'react';
import Navbar from '../components/Navbar';

const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const RED_FLAGS = [
    'They refuse to answer basic questions about their home or lifestyle',
    'They want to take the animal immediately without any discussion',
    'They offer to pay above the requested donation amount',
    'They cannot provide a real name, phone number, or address',
    "They seem more interested in the animal's breed value than its wellbeing",
];

export default function SafetyGuidePage() {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px', width: '100%', boxSizing: 'border-box' }}>

                <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', textAlign: 'center', marginBottom: '12px' }}>
                    The Paws Daily · Safety · {today}
                </div>

                <div style={{ fontFamily: serif, fontSize: '36px', fontWeight: 700, color: '#2D1F14', lineHeight: 1.05, textAlign: 'center', marginBottom: '10px' }}>
                    Staying Safe When Rehoming
                </div>
                <div style={{ fontFamily: serif, fontSize: '15px', fontStyle: 'italic', color: '#7A5C44', textAlign: 'center', marginBottom: '32px' }}>
                    Your safety and the animal's safety come first.
                </div>

                <div style={{ borderTop: '3px double rgba(45,31,20,0.15)', marginBottom: '40px' }} />

                <div style={{ marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '12px', lineHeight: 1.2 }}>
                        How to vet potential adopters
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>
                        Before agreeing to hand over an animal, take time to learn about the potential adopter. Ask about their living situation, experience with animals, whether they have a yard or other pets, and their daily routine. A serious adopter will welcome these questions.
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '16px', lineHeight: 1.2 }}>
                        Red flags to watch for
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {RED_FLAGS.map((flag, i) => (
                            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#C07A4A', fontFamily: sans, fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>—</span>
                                <span style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>{flag}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '12px', lineHeight: 1.2 }}>
                        Arranging a safe first meeting
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>
                        Always meet in a public place for the first time. Bring a friend if possible. Do not share your home address until you have met and feel comfortable. A park or a veterinary clinic are good neutral meeting points. Observe how the person interacts with the animal before making any decisions.
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '12px', lineHeight: 1.2 }}>
                        Staying in touch after adoption
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>
                        A responsible adopter will be happy to send occasional updates. Ask for a photo after one week and one month. If you cannot reach the adopter or have concerns, trust your instincts and follow up.
                    </div>
                </div>

            </div>
        </div>
    );
}
