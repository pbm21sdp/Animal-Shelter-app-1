import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
    cream:       '#FAF7F4',
    espresso:    '#2D1F14',
    terracotta:  '#C07A4A',
    muted:       '#7A5C44',
    lightMuted:  '#B09880',
    border:      'rgba(45,31,20,0.12)',
    borderLight: 'rgba(45,31,20,0.08)',
};

// ── Shared style fragments ────────────────────────────────────────────────────
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const labelStyle = {
    fontFamily: sans,
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: C.terracotta,
    fontWeight: 500,
    display: 'block',
    marginBottom: '6px',
};

const readMoreStyle = {
    fontFamily: sans,
    fontSize: '10px',
    color: C.terracotta,
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer',
    display: 'inline-block',
    marginTop: '8px',
    background: 'none',
    border: 'none',
    padding: 0,
};

const liveDot = {
    width: '6px',
    height: '6px',
    backgroundColor: '#5B9E6B',
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
    animation: 'pulse-green 2s ease-in-out infinite',
};


// ── Masthead date (dynamic) ───────────────────────────────────────────────────
function getMastheadDate() {
    const d = new Date();
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PawsHomepage() {
    const navigate = useNavigate();
    const [slide, setSlide]       = useState(0);
    const [fading, setFading]     = useState(false);
    const [hovering, setHovering] = useState(false);
    const timerRef = useRef(null);
    const [stats, setStats] = useState({ total_uploaded: 0, found_home: 0, urgent_cases: 0, available_count: 0 });
    const [recentPets, setRecentPets] = useState([]);
    const [rightColumnPets, setRightColumnPets] = useState([]);
    const [donationStats, setDonationStats] = useState({ totalRaised: 0, donorCount: 0, donors: [] });

    const STORIES = [
        {
            label: 'How to adopt',
            title: 'Three steps to giving a street animal its forever home',
            desc:  'From spotting a stray to making it official — our streamlined process makes adoption simple for both the animal and the adopter.',
            href:  '/how-to-adopt',
        },
        {
            label: 'Community',
            title: `${stats.found_home || 0} animals found homes through Paws`,
            desc:  'Thanks to hundreds of community uploads and connections made on the platform, our city is making a real difference one animal at a time.',
            href:  '/community',
        },
        {
            label: 'Tips',
            title: 'What to do when you find a stray animal',
            desc:  'Stay calm, check for ID tags, photograph the animal, and post on Paws immediately. Speed matters when it comes to reuniting lost pets.',
            href:  '/guide',
        },
        {
            label: 'Legal',
            title: 'Why you need an adoption contract',
            desc:  'A written agreement protects both you and the animal. Learn what to include and download our free template.',
            href:  '/adoption-contract',
        },
        {
            label: 'Community Fund',
            title: `${donationStats.totalRaised > 0 ? donationStats.totalRaised.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' €' : '0 €'} raised by the community`,
            desc:  `${donationStats.donorCount} ${donationStats.donorCount === 1 ? 'donor has contributed' : 'donors have contributed'} to the welfare of animals on the platform. See the full list and make a difference.`,
            href:  '/donations',
        },
    ];

    const goToSlide = (idx) => {
        if (idx === slide) return;
        setFading(true);
        setTimeout(() => {
            setSlide(idx);
            setFading(false);
        }, 280);
    };

    useEffect(() => {
        clearInterval(timerRef.current);
        if (hovering) return;
        timerRef.current = setInterval(() => {
            setFading(true);
            setTimeout(() => {
                setSlide((prev) => (prev + 1) % SLIDES.length);
                setFading(false);
            }, 280);
        }, 4500);
        return () => clearInterval(timerRef.current);
    }, [hovering, recentPets.length]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/animals/stats')
            .then(r => { if (r.data.success) setStats(r.data.stats); })
            .catch(() => {});
        axios.get('http://localhost:5000/api/donations/public/stats')
            .then(r => { if (r.data.success) setDonationStats(r.data); })
            .catch(() => {});
        axios.get('http://localhost:5000/api/pets', { withCredentials: true })
            .then(r => {
                const pets = r.data.pets || r.data || [];
                if (Array.isArray(pets) && pets.length > 0) {
                    const shuffled = [...pets].sort(() => Math.random() - 0.5);
                    setRecentPets(shuffled.slice(0, 5));
                    setRightColumnPets(shuffled.slice(5, 7).length > 0
                        ? shuffled.slice(5, 7)
                        : shuffled.slice(0, 2));
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        setSlide(0);
    }, [recentPets.length]);

    const SLIDES = recentPets.length > 0 ? recentPets.map(pet => ({
        img: pet.primary_photo_id
            ? `http://localhost:5000/api/pets/photos/${pet.primary_photo_id}`
            : 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=800&q=80',
        badge:   pet.type ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1) : 'Animal',
        caption: pet.location_city || 'Timișoara',
        title:   pet.name || 'Animal found',
        loc:     pet.location_city || 'Timișoara',
        age:     pet.age_category || '',
        desc:    pet.description ? pet.description.substring(0, 120) + '...' : 'Looking for a loving home.',
        id:      pet.id,
    })) : [
        {
            img:     'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=800&q=80',
            badge:   'Animal',
            caption: 'Found in Timișoara',
            title:   'Be the first to upload an animal',
            loc:     'Timișoara',
            age:     '',
            desc:    'No animals uploaded yet. Be the first to help a stray find a home.',
            id:      null,
        },
    ];

    const cur = SLIDES[Math.min(slide, SLIDES.length - 1)];
    const fadeStyle = { opacity: fading ? 0 : 1, transition: 'opacity 0.28s ease' };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: C.cream,
            overflowY: 'auto',
        }}>
            <Navbar />

            {/* ── MASTHEAD ──────────────────────────────────────────────── */}
            <div style={{
                textAlign: 'center',
                padding: '18px 40px 14px',
                borderBottom: '3px double rgba(45,31,20,0.2)',
                backgroundColor: C.cream,
            }}>
                <div style={{
                    fontFamily: sans,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: C.lightMuted,
                    marginBottom: '6px',
                }}>
                    {getMastheadDate()} · Timișoara, Romania
                </div>
                <div style={{
                    fontFamily: serif,
                    fontSize: '30px',
                    fontWeight: 700,
                    color: C.espresso,
                    lineHeight: 1,
                    marginBottom: '5px',
                }}>
                    The Paws Daily
                </div>
                <div style={{
                    fontFamily: serif,
                    fontSize: '15px',
                    fontStyle: 'italic',
                    color: C.muted,
                }}>
                    Every stray deserves a front page.
                </div>
            </div>

            {/* ── STATS BAR ─────────────────────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '30% 40% 30%',
                borderBottom: `1px solid ${C.border}`,
                backgroundColor: C.cream,
            }}>
                {/* Col 1 */}
                <div style={{ padding: '14px 0', borderRight: `1px solid ${C.border}`, textAlign: 'center' }}>
                    <div style={{ fontFamily: serif, fontSize: '32px', fontWeight: 700, color: C.espresso, lineHeight: 1 }}>{stats.total_uploaded}</div>
                    <div style={{ fontFamily: sans, fontSize: '11px', color: C.muted, marginTop: '5px' }}>
                        Animals uploaded by the community
                    </div>
                </div>

                {/* Col 2 */}
                <Link to="/community" style={{ textDecoration: 'none', display: 'block', padding: '14px 0', borderRight: `1px solid ${C.border}`, textAlign: 'center', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,122,74,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <div style={{ fontFamily: serif, fontSize: '32px', fontWeight: 700, color: C.espresso, lineHeight: 1 }}>{stats.found_home}</div>
                    <div style={{ fontFamily: sans, fontSize: '11px', color: C.muted, marginTop: '5px' }}>
                        Found a loving home ↗
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '10px', color: C.lightMuted, marginTop: '2px' }}>
                        {stats.total_uploaded > 0 ? Math.round((stats.found_home / stats.total_uploaded) * 100) : 0}% success rate
                    </div>
                </Link>

                {/* Col 3 */}
                <div style={{ padding: '14px 0', textAlign: 'center' }}>
                    <div style={{ fontFamily: serif, fontSize: '32px', fontWeight: 700, color: C.espresso, lineHeight: 1 }}>{stats.available_count ?? stats.urgent_cases}</div>
                    <div style={{
                        fontFamily: sans, fontSize: '11px', color: C.muted, marginTop: '5px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}>
                        Waiting for a home
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '3px',
                    }}>
                        <span style={liveDot} />
                        <span style={{ fontFamily: sans, fontSize: '9px', color: C.lightMuted }}>Available now</span>
                    </div>
                </div>
            </div>

            {/* ── EDITORIAL GRID ────────────────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '30% 40% 30%',
                minHeight: '520px',
            }}>

                {/* ── LEFT COLUMN — text stories ── */}
                <div style={{
                    borderRight: `1px solid ${C.border}`,
                    padding: '24px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {STORIES.map((story, i) => (
                        <React.Fragment key={i}>
                            <div style={{
                                paddingTop:    i > 0 ? '18px' : 0,
                                paddingBottom: i < STORIES.length - 1 ? '18px' : 0,
                            }}>
                                <span style={labelStyle}>{story.label}</span>
                                <div style={{
                                    fontFamily: serif,
                                    fontSize: '17px',
                                    fontWeight: 700,
                                    color: C.espresso,
                                    lineHeight: 1.35,
                                    marginBottom: '7px',
                                }}>
                                    {story.title}
                                </div>
                                <div style={{
                                    fontFamily: sans,
                                    fontSize: '11px',
                                    color: C.muted,
                                    lineHeight: 1.65,
                                }}>
                                    {story.desc}
                                </div>
                                <Link to={story.href} style={readMoreStyle}>
                                    Read more →
                                </Link>
                            </div>
                            {i < STORIES.length - 1 && (
                                <div style={{ height: '1px', backgroundColor: C.border, flexShrink: 0 }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* ── CENTER COLUMN — auto-playing carousel ── */}
                <div
                    style={{ borderRight: `1px solid ${C.border}`, padding: '24px 28px' }}
                    onMouseEnter={() => setHovering(true)}
                    onMouseLeave={() => setHovering(false)}
                >
                    {/* Image with overlaid labels */}
                    <div
                        style={{ position: 'relative', marginBottom: '8px', cursor: cur.id ? 'pointer' : 'default' }}
                        onClick={() => { if (cur.id) navigate(`/pet/${cur.id}`); }}
                    >
                        <img
                            src={cur.img}
                            alt={cur.title}
                            style={{
                                width: '100%',
                                height: '280px',
                                objectFit: 'cover',
                                borderRadius: '2px',
                                display: 'block',
                                ...fadeStyle,
                            }}
                        />
                        {/* Badge */}
                        <div style={{
                            position: 'absolute', top: '10px', left: '10px',
                            backgroundColor: C.espresso,
                            color: C.cream,
                            fontFamily: sans,
                            fontSize: '9px',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            padding: '3px 10px',
                            borderRadius: '100px',
                        }}>
                            {cur.badge}
                        </div>
                        {/* Latest upload label */}
                        <div style={{
                            position: 'absolute', top: '10px', right: '10px',
                            fontFamily: sans,
                            fontSize: '9px',
                            color: 'rgba(250,247,244,0.82)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                        }}>
                            Latest upload
                        </div>
                    </div>

                    {/* Caption */}
                    <div style={{
                        fontFamily: serif,
                        fontSize: '10px',
                        fontStyle: 'italic',
                        color: C.lightMuted,
                        marginBottom: '10px',
                        ...fadeStyle,
                    }}>
                        {cur.caption}
                    </div>

                    {/* Headline */}
                    <div
                        onClick={() => { if (cur.id) navigate(`/pet/${cur.id}`); }}
                        style={{
                            fontFamily: serif,
                            fontSize: '22px',
                            fontWeight: 700,
                            color: C.espresso,
                            lineHeight: 1.25,
                            marginBottom: '9px',
                            cursor: cur.id ? 'pointer' : 'default',
                            ...fadeStyle,
                        }}
                    >
                        {cur.title}
                    </div>

                    {/* Byline */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        marginBottom: '10px',
                        fontFamily: sans,
                        fontSize: '11px',
                        color: C.muted,
                        ...fadeStyle,
                    }}>
                        <span style={liveDot} />
                        <span>{cur.loc}</span>
                        <span style={{ color: C.lightMuted }}>·</span>
                        <span>{cur.age}</span>
                    </div>

                    {/* Description */}
                    <div style={{
                        fontFamily: sans,
                        fontSize: '12px',
                        color: C.muted,
                        lineHeight: 1.7,
                        marginBottom: '16px',
                        ...fadeStyle,
                    }}>
                        {cur.desc}
                    </div>

                    {/* Dot indicators */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '20px' }}>
                        {SLIDES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goToSlide(i)}
                                style={{
                                    height: '6px',
                                    width: i === slide ? '22px' : '6px',
                                    borderRadius: '100px',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    backgroundColor: i === slide ? C.terracotta : C.border,
                                    transition: 'width 0.3s ease, background-color 0.3s ease',
                                }}
                            />
                        ))}
                    </div>

                    {/* ── CTA card ── */}
                    <div style={{
                        backgroundColor: '#2D1F14',
                        borderRadius: '4px',
                        padding: '22px 20px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Decorative circle — top right */}
                        <div style={{
                            position: 'absolute',
                            top: '-30px',
                            right: '-30px',
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(192,122,74,0.15)',
                            pointerEvents: 'none',
                        }} />
                        {/* Decorative circle — bottom left */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-24px',
                            left: '-24px',
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(192,122,74,0.08)',
                            pointerEvents: 'none',
                        }} />

                        {/* Content — above circles */}
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                fontFamily: sans,
                                fontSize: '9px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.14em',
                                color: 'rgba(250,247,244,0.5)',
                                marginBottom: '10px',
                            }}>
                                Found a stray?
                            </div>

                            <div style={{
                                fontFamily: serif,
                                fontSize: '22px',
                                fontWeight: 700,
                                color: '#FAF7F4',
                                lineHeight: 1.2,
                                marginBottom: '10px',
                            }}>
                                Give them a{' '}
                                <span style={{ fontStyle: 'italic', color: '#E8A96A' }}>front page.</span>
                            </div>

                            <div style={{
                                fontFamily: sans,
                                fontSize: '11px',
                                color: 'rgba(250,247,244,0.6)',
                                fontWeight: 300,
                                lineHeight: 1.65,
                                marginBottom: '16px',
                            }}>
                                Upload a photo, add the location, and let your community help find them a home. It takes under 2 minutes.
                            </div>

                            <button
                                onClick={() => navigate('/add-animal')}
                                style={{
                                    backgroundColor: '#C07A4A',
                                    color: '#FAF7F4',
                                    borderRadius: '100px',
                                    padding: '10px 18px',
                                    fontSize: '12px',
                                    fontFamily: sans,
                                    fontWeight: 500,
                                    border: 'none',
                                    cursor: 'pointer',
                                    marginBottom: '16px',
                                    display: 'inline-block',
                                    transition: 'background-color 0.15s, transform 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#A8673C';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#C07A4A';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                + Upload an animal
                            </button>

                            <div style={{
                                borderTop: '1px solid rgba(250,247,244,0.1)',
                                paddingTop: '14px',
                                display: 'flex',
                                gap: '16px',
                            }}>
                                {[
                                    { num: stats.total_uploaded || '0', label: 'Uploaded', href: null },
                                    { num: stats.found_home || '0', label: 'Found a home', href: '/community' },
                                    { num: `${stats.total_uploaded > 0 ? Math.round((stats.found_home / stats.total_uploaded) * 100) : 0}%`, label: 'Success rate', href: null },
                                ].map(({ num, label, href }) => (
                                    href ? (
                                        <Link key={label} to={href} style={{ textDecoration: 'none' }}>
                                            <div style={{ fontFamily: serif, fontSize: '20px', fontWeight: 700, color: '#FAF7F4', lineHeight: 1 }}>{num}</div>
                                            <div style={{ fontFamily: sans, fontSize: '9px', color: 'rgba(250,247,244,0.6)', marginTop: '3px', textDecoration: 'underline', textUnderlineOffset: '2px' }}>{label} ↗</div>
                                        </Link>
                                    ) : (
                                        <div key={label}>
                                            <div style={{ fontFamily: serif, fontSize: '20px', fontWeight: 700, color: '#FAF7F4', lineHeight: 1 }}>{num}</div>
                                            <div style={{ fontFamily: sans, fontSize: '9px', color: 'rgba(250,247,244,0.45)', marginTop: '3px' }}>{label}</div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN — recent uploads + Safety + Care ── */}
                <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: '0' }}>

                    {rightColumnPets.map((pet, i) => (
                        <React.Fragment key={pet.id}>
                            <div style={{ paddingBottom: '18px', paddingTop: i > 0 ? '18px' : 0 }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <img
                                        src={pet.primary_photo_id
                                            ? `http://localhost:5000/api/pets/photos/${pet.primary_photo_id}`
                                            : 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=400&q=80'}
                                        alt={pet.name}
                                        style={{ width: '80px', height: '72px', objectFit: 'cover', objectPosition: 'center 20%', borderRadius: '2px', flexShrink: 0, border: `1px solid ${C.borderLight}` }}
                                    />
                                    <div style={{ minWidth: 0 }}>
                                        <span style={labelStyle}>Recent upload</span>
                                        <div style={{ fontFamily: serif, fontSize: '15px', fontWeight: 700, color: C.espresso, lineHeight: 1.3, marginBottom: '4px' }}>
                                            {pet.name}
                                        </div>
                                        <div style={{ fontFamily: sans, fontSize: '10px', color: C.muted, lineHeight: 1.5, marginBottom: '5px' }}>
                                            {pet.description ? pet.description.substring(0, 80) + '...' : 'Looking for a loving home.'}
                                        </div>
                                        <div style={{ fontFamily: sans, fontSize: '9px', color: C.lightMuted, marginBottom: '4px' }}>
                                            📍 {pet.location_city || 'Timișoara'}
                                        </div>
                                        <button onClick={() => navigate(`/pet/${pet.id}`)} style={readMoreStyle}>
                                            View animal →
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {i < 1 && <div style={{ height: '1px', backgroundColor: C.border, flexShrink: 0 }} />}
                        </React.Fragment>
                    ))}

                    {[
                        { label: 'Safety', title: 'How to verify adopters and stay safe', desc: 'Red flags to watch for, how to conduct a safe meet-and-greet, and how to protect yourself and the animal.', href: '/safety-guide' },
                        { label: 'Care', title: 'The first 30 days with your new pet', desc: 'Everything you need to know about helping a rescued animal settle into their new home.', href: '/new-pet-guide' },
                    ].map((article, i) => (
                        <React.Fragment key={article.href}>
                            <div style={{ height: '1px', backgroundColor: C.border, flexShrink: 0 }} />
                            <div style={{ paddingTop: '18px', paddingBottom: i < 1 ? '18px' : 0 }}>
                                <span style={labelStyle}>{article.label}</span>
                                <div style={{ fontFamily: serif, fontSize: '15px', fontWeight: 700, color: C.espresso, lineHeight: 1.35, marginBottom: '7px', marginTop: '6px' }}>
                                    {article.title}
                                </div>
                                <div style={{ fontFamily: sans, fontSize: '11px', color: C.muted, lineHeight: 1.65, marginBottom: '10px' }}>
                                    {article.desc}
                                </div>
                                <Link to={article.href} style={readMoreStyle}>Read more →</Link>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}
