import React from 'react';
import Navbar from '../components/Navbar';

const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const CONTRACT_CLAUSES = [
    'Full name and contact details of both parties',
    'Description of the animal (name, species, breed, age, color)',
    'Date and location of the transfer',
    'Health status and vaccination history at time of adoption',
    'Agreement that the animal will not be resold, abandoned, or given away without notifying the original owner',
    'Agreement to provide adequate food, shelter, veterinary care',
    'Right of the original owner to reclaim the animal if terms are violated',
    'Signatures of both parties and date',
];

export default function AdoptionContractPage() {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px', width: '100%', boxSizing: 'border-box' }}>

                <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', textAlign: 'center', marginBottom: '12px' }}>
                    The Paws Daily · Legal Guide · {today}
                </div>

                <div style={{ fontFamily: serif, fontSize: '36px', fontWeight: 700, color: '#2D1F14', lineHeight: 1.05, textAlign: 'center', marginBottom: '10px' }}>
                    The Adoption Contract
                </div>
                <div style={{ fontFamily: serif, fontSize: '15px', fontStyle: 'italic', color: '#7A5C44', textAlign: 'center', marginBottom: '32px' }}>
                    Protect the animal, protect yourself.
                </div>

                <div style={{ borderTop: '3px double rgba(45,31,20,0.15)', marginBottom: '40px' }} />

                <div style={{ marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '12px', lineHeight: 1.2 }}>
                        Why a written contract matters
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>
                        An adoption contract is a simple written agreement between the person rehoming an animal and the adopter. It protects both parties and — most importantly — protects the animal. Without a contract, there is no legal record of the adoption, no agreed terms of care, and no recourse if something goes wrong.
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '16px', lineHeight: 1.2 }}>
                        What every contract should include
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {CONTRACT_CLAUSES.map((clause, i) => (
                            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#C07A4A', fontFamily: sans, fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>—</span>
                                <span style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>{clause}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '12px', lineHeight: 1.2 }}>
                        Free contract template
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7, marginBottom: '20px' }}>
                        We have prepared a simple adoption contract template that you can print and fill in. It covers all the essential clauses recommended by animal welfare organizations.
                    </div>
                    <button
                        onClick={() => window.open('http://localhost:5000/api/ai/contract', '_blank')}
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#2D1F14',
                            color: '#FAF7F4',
                            borderRadius: '100px',
                            padding: '12px 28px',
                            fontSize: '13px',
                            fontFamily: sans,
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Download contract template (PDF)
                    </button>
                </div>

                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', paddingTop: '40px', marginBottom: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '12px', lineHeight: 1.2 }}>
                        Important
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>
                        This template is provided for informational purposes only and does not constitute legal advice. For complex situations, consult a licensed attorney.
                    </div>
                </div>

            </div>
        </div>
    );
}
