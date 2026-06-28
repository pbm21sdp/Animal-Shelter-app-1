import React, { useState, useEffect, useMemo } from 'react';
import { formatDate } from '../../utils/date';
import { useAdoptionStore } from '../../store/adoptionStore';
import {
    BarChart3, TrendingUp, Calendar, RefreshCw, AlertCircle, Info,
    PawPrint, Users, ArrowUp, ArrowDown,
} from 'lucide-react';
import {
    ComposedChart,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import { makeRechartsXAxisFormatter } from '../../utils/chartLabels';
import axios from 'axios';

const API   = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const C = {
    cream:      '#FFFAF7',
    espresso:   '#2D1F14',
    terracotta: '#C97A4A',
    muted:      '#7A5C44',
    border:     'rgba(45,31,20,0.1)',
    bg:         'rgba(45,31,20,0.03)',
};

const CHART_COLORS = ['#C97A4A', '#2D1F14', '#8B4E28', '#7A5C44', '#D4956A', '#B09880'];

const card = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(45,31,20,0.06)',
    padding: '24px',
    border: '1px solid rgba(45,31,20,0.08)',
};

const statCard = {
    backgroundColor: 'rgba(45,31,20,0.03)',
    borderRadius: '8px',
    padding: '20px',
};

const miniLabel = {
    fontFamily: sans,
    fontSize: '11px',
    color: '#7A5C44',
    marginBottom: '4px',
};

const Spinner = () => (
    <div
        className="animate-spin"
        style={{
            width: '32px', height: '32px', borderRadius: '50%',
            borderTop: `2px solid ${C.terracotta}`,
            borderBottom: `2px solid ${C.terracotta}`,
            borderLeft: '2px solid transparent',
            borderRight: '2px solid transparent',
        }}
    />
);

const PET_TYPES = ['dog', 'cat', 'rabbit', 'bird', 'other'];

const StatisticsManagement = () => {
    const { adoptions, getAllAdoptions } = useAdoptionStore();

    const [selectedPetType,      setSelectedPetType]      = useState('all');
    const [predictionViewMode,   setPredictionViewMode]   = useState('daily');
    const [predictionData,       setPredictionData]       = useState(null);
    const [isPredictionLoading,  setIsPredictionLoading]  = useState(false);
    const [predictionError,      setPredictionError]      = useState(null);

    const [animalStats,       setAnimalStats]       = useState(null);
    const [modStats,          setModStats]          = useState(null);
    const [modStatsLoading,   setModStatsLoading]   = useState(false);
    const [modStatsError,     setModStatsError]     = useState(null);

    useEffect(() => {
        getAllAdoptions();
        fetchAnimalStats();
        fetchModerationStats();
    }, []);

    const fetchAnimalStats = async () => {
        try {
            const res = await axios.get(`${API}/animals/stats`, { withCredentials: true });
            if (res.data.success) setAnimalStats(res.data.stats);
        } catch { /* non-fatal */ }
    };

    const fetchModerationStats = async () => {
        setModStatsLoading(true);
        setModStatsError(null);
        try {
            const res = await axios.get(`${API}/pets/admin/moderation-stats`, { withCredentials: true });
            if (res.data.success) setModStats(res.data.stats);
        } catch (err) {
            setModStatsError(err.response?.data?.message || 'Failed to load moderation statistics');
        } finally {
            setModStatsLoading(false);
        }
    };

    const fetchPredictions = async () => {
        setIsPredictionLoading(true);
        setPredictionError(null);
        try {
            const response = await axios.post(
                `${API}/predictions/adoptions`,
                { viewMode: predictionViewMode, petType: selectedPetType },
                { withCredentials: true }
            );
            if (response.data.success) {
                const data = response.data.data;
                const chartData = [];
                data.historicalDates.forEach((date, i) =>
                    chartData.push({ date, actual: data.historical[i], predicted: null })
                );
                data.predictionDates.forEach((date, i) =>
                    chartData.push({ date, actual: null, predicted: data.predictions[i] })
                );
                setPredictionData({
                    chartData,
                    statistics: data.statistics,
                    confidenceLevel: data.confidenceLevel || null,
                });
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error;
            setPredictionData(null);
            setPredictionError(msg || 'Failed to generate predictions. Make sure Python ML service is running.');
        } finally {
            setIsPredictionLoading(false);
        }
    };

    useEffect(() => {
        fetchPredictions();
    }, [selectedPetType, predictionViewMode]);

    const availablePetTypes = PET_TYPES;

    const petTypeDistribution = useMemo(() => {
        if (!adoptions || adoptions.length === 0) return [];
        const distribution = adoptions.reduce((acc, adoption) => {
            const type = adoption.petType || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(distribution).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        }));
    }, [adoptions]);

    const cityDistribution = useMemo(() => {
        if (!adoptions || adoptions.length === 0) return [];
        const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
        const counts = {};
        const display = {};
        for (const a of adoptions) {
            if (!a.city) continue;
            const key = normalize(a.city);
            counts[key] = (counts[key] || 0) + 1;
            if (!display[key]) display[key] = a.city;
        }
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([key, value]) => ({ name: display[key], value }));
    }, [adoptions]);


    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const visible = payload.filter(e => e.value != null && e.value !== 0);
        if (!visible.length) return null;
        return (
            <div style={{
                backgroundColor: '#fff', padding: '10px 14px',
                border: '1px solid rgba(45,31,20,0.12)', borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(45,31,20,0.1)', fontFamily: sans,
            }}>
                <p style={{ fontWeight: 600, color: C.espresso, marginBottom: '4px', fontSize: '12px' }}>{label}</p>
                {visible.map((entry, i) => (
                    <p key={i} style={{ color: entry.color, fontSize: '12px' }}>
                        {entry.name}: {Math.round(entry.value)} adoptions
                    </p>
                ))}
            </div>
        );
    };

    const periodLabel = predictionViewMode === 'daily' ? 'day' : predictionViewMode === 'weekly' ? 'week' : 'month';

    return (
        <div style={{ width: '100%' }}>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
                <h2 style={{ fontFamily: serif, fontSize: '26px', fontWeight: 600, color: C.espresso, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <BarChart3 style={{ width: '22px', height: '22px', color: C.terracotta }} />
                    Statistics & Predictions
                </h2>
                <button
                    onClick={() => { fetchAnimalStats(); fetchModerationStats(); }}
                    style={{
                        backgroundColor: C.espresso, color: C.cream,
                        border: 'none', borderRadius: '6px',
                        padding: '9px 18px', fontFamily: sans, fontSize: '13px', fontWeight: 500,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                    <RefreshCw style={{ width: '14px', height: '14px' }} />
                    Refresh
                </button>
            </div>

            {/* ── Overview Cards — 3 columns ────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>

                {/* Animals Found a Home — source: PostgreSQL pets.is_adopted */}
                <div style={{ ...card, borderLeft: `4px solid ${C.terracotta}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontFamily: sans, fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                                Animals Found a Home
                            </p>
                            <p style={{ fontFamily: serif, fontSize: '38px', fontWeight: 600, color: C.espresso, lineHeight: 1 }}>
                                {animalStats?.found_home ?? '—'}
                            </p>
                            <p style={{ fontFamily: sans, fontSize: '11px', color: C.muted, marginTop: '6px' }}>all time</p>
                        </div>
                        <div style={{ backgroundColor: 'rgba(201,122,74,0.12)', borderRadius: '50%', padding: '10px', flexShrink: 0 }}>
                            <PawPrint style={{ width: '20px', height: '20px', color: C.terracotta }} />
                        </div>
                    </div>
                </div>

                {/* Avg Time to Adoption — source: PostgreSQL adopted_at - created_at */}
                <div style={{ ...card, borderLeft: `4px solid ${C.muted}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontFamily: sans, fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                                Avg. Time to Adoption
                            </p>
                            <p style={{ fontFamily: serif, fontSize: '38px', fontWeight: 600, color: C.espresso, lineHeight: 1 }}>
                                {animalStats?.avg_days_adoption != null ? animalStats.avg_days_adoption : '—'}
                            </p>
                            <p style={{ fontFamily: sans, fontSize: '11px', color: C.muted, marginTop: '6px' }}>days from post to adopted</p>
                        </div>
                        <div style={{ backgroundColor: 'rgba(122,92,68,0.1)', borderRadius: '50%', padding: '10px', flexShrink: 0 }}>
                            <TrendingUp style={{ width: '20px', height: '20px', color: C.muted }} />
                        </div>
                    </div>
                </div>

                {/* Available now — source: PostgreSQL */}
                <div style={{ ...card, borderLeft: `4px solid ${C.espresso}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontFamily: sans, fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                                Available Now
                            </p>
                            <p style={{ fontFamily: serif, fontSize: '38px', fontWeight: 600, color: C.espresso, lineHeight: 1 }}>
                                {animalStats?.available_count ?? '—'}
                            </p>
                            <p style={{ fontFamily: sans, fontSize: '11px', color: C.muted, marginTop: '6px' }}>awaiting adoption</p>
                        </div>
                        <div style={{ backgroundColor: 'rgba(45,31,20,0.07)', borderRadius: '50%', padding: '10px', flexShrink: 0 }}>
                            <Calendar style={{ width: '20px', height: '20px', color: C.espresso }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Adoption Predictions ──────────────────────────────────── */}
            <div style={{ ...card, marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', gap: '16px' }}>
                    <h3 style={{ fontFamily: serif, fontSize: '20px', fontWeight: 600, color: C.espresso, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <TrendingUp style={{ width: '18px', height: '18px', color: C.terracotta }} />
                        Adoption Predictions
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px' }}>
                        {[
                            {
                                label: 'View Mode',
                                value: predictionViewMode,
                                onChange: setPredictionViewMode,
                                options: [
                                    { value: 'daily',   label: 'Daily (30 days ahead)' },
                                    { value: 'weekly',  label: 'Weekly (12 weeks ahead)' },
                                    { value: 'monthly', label: 'Monthly (3 months ahead)' },
                                ],
                            },
                            {
                                label: 'Pet Type',
                                value: selectedPetType,
                                onChange: setSelectedPetType,
                                options: [
                                    { value: 'all', label: 'All Types' },
                                    ...availablePetTypes.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
                                ],
                            },
                        ].map(({ label, value, onChange, options }) => (
                            <div key={label}>
                                <label style={{ fontFamily: sans, fontSize: '10px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                                    {label}
                                </label>
                                <select
                                    value={value}
                                    onChange={e => onChange(e.target.value)}
                                    disabled={isPredictionLoading}
                                    style={{
                                        fontFamily: sans, fontSize: '12px', color: C.espresso,
                                        border: `1px solid ${C.border}`, borderRadius: '6px',
                                        padding: '7px 12px', background: '#fff', cursor: 'pointer',
                                        outline: 'none',
                                    }}
                                >
                                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                {isPredictionLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                        <Spinner />
                    </div>
                )}

                {!isPredictionLoading && predictionError && (
                    <div style={{
                        padding: '20px', backgroundColor: 'rgba(201,122,74,0.07)',
                        border: '1px solid rgba(201,122,74,0.2)', borderRadius: '8px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <AlertCircle style={{ width: '18px', height: '18px', color: '#A85C32', marginTop: '2px', flexShrink: 0 }} />
                            <div>
                                <p style={{ fontFamily: sans, fontWeight: 600, color: C.espresso, marginBottom: '6px', fontSize: '13px' }}>
                                    Predictions Not Available
                                </p>
                                <p style={{ fontFamily: sans, fontSize: '12px', color: C.muted }}>{predictionError}</p>
                                {(predictionError.includes('Not enough time periods') || predictionError.includes('Not enough data')) && (
                                    <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '6px', border: `1px solid ${C.border}`, marginTop: '10px' }}>
                                        <p style={{ fontFamily: sans, fontSize: '12px', fontWeight: 600, color: C.espresso, marginBottom: '6px' }}>How to Fix:</p>
                                        <ul style={{ fontFamily: sans, fontSize: '12px', color: C.muted, paddingLeft: '18px', lineHeight: 1.9, margin: 0 }}>
                                            <li><strong>Daily:</strong> Need at least 2 weeks of approved adoptions</li>
                                            <li><strong>Weekly:</strong> Need at least 8 weeks (2 months)</li>
                                            <li><strong>Monthly:</strong> Need at least 3 months of approved adoptions</li>
                                            <li style={{ marginTop: '6px', paddingTop: '6px', borderTop: `1px solid ${C.border}` }}>
                                                <strong>Quick fix:</strong>&nbsp;
                                                <code style={{ backgroundColor: 'rgba(45,31,20,0.06)', padding: '1px 6px', borderRadius: '3px', fontSize: '11px' }}>
                                                    npm run seed:adoptions
                                                </code>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!isPredictionLoading && !predictionError && predictionData && (
                    <>
                        {/* Mini stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                            {[
                                { label: 'Current Average',  value: Math.round(predictionData.statistics.averageHistorical), suffix: `adoptions/${periodLabel}`, bg: 'rgba(201,122,74,0.08)' },
                                { label: 'Predicted Average', value: Math.round(predictionData.statistics.averagePredicted),  suffix: `adoptions/${periodLabel}`, bg: 'rgba(45,31,20,0.04)' },
                                { label: 'Expected Total',    value: Math.round(predictionData.statistics.totalPredicted),    suffix: `in next ${predictionViewMode === 'daily' ? '30 days' : predictionViewMode === 'weekly' ? '12 weeks' : '3 months'}`, bg: 'rgba(45,31,20,0.04)' },
                            ].map(c => (
                                <div key={c.label} style={{ backgroundColor: c.bg, borderRadius: '8px', padding: '16px' }}>
                                    <p style={{ ...miniLabel }}>{c.label}</p>
                                    <p style={{ fontFamily: serif, fontSize: '28px', fontWeight: 600, color: C.espresso }}>{c.value}</p>
                                    <p style={{ fontFamily: sans, fontSize: '10px', color: C.muted }}>{c.suffix}</p>
                                </div>
                            ))}
                            <div style={{
                                backgroundColor: predictionData.statistics.trend === 'increasing'
                                    ? 'rgba(22,163,74,0.08)' : 'rgba(201,122,74,0.1)',
                                borderRadius: '8px', padding: '16px',
                            }}>
                                <p style={{ ...miniLabel }}>Trend</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <p style={{ fontFamily: serif, fontSize: '28px', fontWeight: 600, color: C.espresso }}>
                                        {Math.abs(predictionData.statistics.trendPercentage)}%
                                    </p>
                                    {predictionData.statistics.trend === 'increasing'
                                        ? <ArrowUp style={{ width: '18px', height: '18px', color: '#16a34a' }} />
                                        : <ArrowDown style={{ width: '18px', height: '18px', color: C.terracotta }} />
                                    }
                                </div>
                                <p style={{ fontFamily: sans, fontSize: '10px', color: C.muted }}>{predictionData.statistics.trend}</p>
                            </div>
                        </div>

                        {/* Info note */}
                        <div style={{
                            backgroundColor: 'rgba(201,122,74,0.06)', border: '1px solid rgba(201,122,74,0.18)',
                            borderRadius: '8px', padding: '14px 16px',
                            display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px',
                        }}>
                            <Info style={{ width: '15px', height: '15px', color: C.terracotta, marginTop: '1px', flexShrink: 0 }} />
                            <p style={{ fontFamily: sans, fontSize: '12px', color: C.muted, lineHeight: 1.6, margin: 0 }}>
                                <span style={{ fontWeight: 600, color: C.espresso }}>About this prediction: </span>
                                Exponential Smoothing (Holt-Winters) model.{' '}
                                <span style={{ fontWeight: 600, color: C.espresso }}>Dark bars</span> = actual historical data.{' '}
                                <span style={{ fontWeight: 600, color: C.terracotta }}>Terracotta bars (lighter)</span> = predicted adoptions
                                {predictionViewMode === 'daily' && ' for the next 30 days'}
                                {predictionViewMode === 'weekly' && ' for the next 12 weeks'}
                                {predictionViewMode === 'monthly' && ' for the next 3 months'}.
                            </p>
                        </div>

                        {/* Low confidence warning */}
                        {predictionData.confidenceLevel === 'low' && (
                            <p style={{
                                fontFamily: sans, fontSize: '11px', fontStyle: 'italic',
                                color: C.terracotta, marginBottom: '12px',
                            }}>
                                Low confidence — limited historical data. Predictions will improve as more data is recorded.
                            </p>
                        )}

                        {/* Chart */}
                        <div style={{ backgroundColor: C.bg, padding: '16px', borderRadius: '8px' }}>
                            <p style={{ fontFamily: sans, fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                                Adoption Timeline & Predictions
                            </p>
                            <ResponsiveContainer width="100%" height={380}>
                                <ComposedChart data={predictionData.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,31,20,0.07)" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fontFamily: sans, fill: C.muted }}
                                        tickFormatter={makeRechartsXAxisFormatter(predictionData.chartData, predictionViewMode)}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fontFamily: sans, fill: C.muted }}
                                        allowDecimals={false}
                                        tickFormatter={v => Math.round(v)}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontFamily: sans, fontSize: '12px' }} />
                                    <Bar dataKey="actual" fill={C.espresso} stackId="bars"
                                        name="Actual Adoptions" maxBarSize={18} radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="predicted" fill="rgba(201,122,74,0.75)" stackId="bars"
                                        name="Predicted Adoptions" maxBarSize={18} radius={[3, 3, 0, 0]} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>


            {/* Adoptions breakdown — pet type + city */}
            {(petTypeDistribution.length > 0 || cityDistribution.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    {petTypeDistribution.length > 0 && (
                        <div style={{ ...card }}>
                            <h3 style={{ fontFamily: serif, fontSize: '20px', fontWeight: 600, color: C.espresso, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0' }}>
                                <PawPrint style={{ width: '18px', height: '18px', color: C.terracotta }} />
                                Adoptions by Pet Type
                            </h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={petTypeDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={90}
                                        dataKey="value"
                                    >
                                        {petTypeDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ fontFamily: sans, fontSize: '12px', borderRadius: '6px', border: `1px solid ${C.border}` }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {cityDistribution.length > 0 && (
                        <div style={{ ...card }}>
                            <h3 style={{ fontFamily: serif, fontSize: '20px', fontWeight: 600, color: C.espresso, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0' }}>
                                <Users style={{ width: '18px', height: '18px', color: C.terracotta }} />
                                Adoptions by City
                            </h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={cityDistribution} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,31,20,0.07)" />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fontFamily: sans, fill: C.muted }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: sans, fill: C.muted }} width={90} />
                                    <Tooltip
                                        contentStyle={{ fontFamily: sans, fontSize: '12px', borderRadius: '6px', border: `1px solid ${C.border}` }}
                                    />
                                    <Bar dataKey="value" name="Adoptions" fill={C.terracotta} radius={[0, 3, 3, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* ── Moderation Statistics ──────────────────────────────────── */}
            <div style={{ ...card, marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: serif, fontSize: '20px', fontWeight: 600, color: C.espresso, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <AlertCircle style={{ width: '18px', height: '18px', color: C.terracotta }} />
                        Moderation Statistics
                    </h3>
                    <button
                        onClick={fetchModerationStats}
                        style={{
                            fontFamily: sans, fontSize: '12px', color: C.terracotta,
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '5px 8px', borderRadius: '4px', transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,122,74,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    >
                        <RefreshCw style={{ width: '13px', height: '13px' }} />
                        Refresh
                    </button>
                </div>

                {modStatsLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                        <Spinner />
                    </div>
                )}
                {modStatsError && !modStatsLoading && (
                    <div style={{
                        padding: '14px 16px', backgroundColor: 'rgba(201,122,74,0.07)',
                        border: '1px solid rgba(201,122,74,0.2)', borderRadius: '6px',
                        fontFamily: sans, fontSize: '13px', color: '#7A3010',
                    }}>
                        {modStatsError}
                    </div>
                )}

                {modStats && !modStatsLoading && (() => {
                    const { approvalRate, rejectionReasons, avgReviewHours, queue, incompleteAnimals, recentActivity, userActivity, topUploaders, overview } = modStats;
                    const oldestDate = queue.oldestPending ? new Date(queue.oldestPending) : null;
                    const oldestDays = oldestDate ? Math.floor((Date.now() - oldestDate.getTime()) / 86400000) : null;

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                            {/* Overview totals */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                                {[
                                    { label: 'Total postings', value: overview.total,    color: C.espresso,  bg: 'rgba(45,31,20,0.04)' },
                                    { label: 'Approved',       value: overview.approved, color: '#16a34a',   bg: 'rgba(22,163,74,0.07)' },
                                    { label: 'Rejected',       value: overview.rejected, color: '#b91c1c',   bg: 'rgba(185,28,28,0.06)' },
                                    { label: 'Pending now',    value: overview.pending,  color: '#a16207',   bg: 'rgba(161,98,7,0.07)' },
                                ].map(c => (
                                    <div key={c.label} style={{ ...statCard, backgroundColor: c.bg, textAlign: 'center' }}>
                                        <p style={{ ...miniLabel }}>{c.label}</p>
                                        <p style={{ fontFamily: serif, fontSize: '32px', fontWeight: 600, color: c.color }}>{c.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Approval rate + Review performance */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                                <div style={statCard}>
                                    <p style={{ fontFamily: sans, fontSize: '12px', fontWeight: 600, color: C.espresso, marginBottom: '12px' }}>Approval vs Rejection Rate</p>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '12px' }}>
                                        <div>
                                            <p style={{ fontFamily: serif, fontSize: '30px', fontWeight: 600, color: '#16a34a' }}>{approvalRate.approvalPercent}%</p>
                                            <p style={miniLabel}>approved</p>
                                        </div>
                                        <div>
                                            <p style={{ fontFamily: serif, fontSize: '30px', fontWeight: 600, color: '#b91c1c' }}>
                                                {approvalRate.total > 0 ? 100 - approvalRate.approvalPercent : 0}%
                                            </p>
                                            <p style={miniLabel}>rejected</p>
                                        </div>
                                    </div>
                                    {approvalRate.total > 0 && (
                                        <div style={{ width: '100%', backgroundColor: 'rgba(185,28,28,0.15)', borderRadius: '100px', height: '6px' }}>
                                            <div style={{ width: `${approvalRate.approvalPercent}%`, backgroundColor: '#16a34a', borderRadius: '100px', height: '6px', transition: 'width 0.3s' }} />
                                        </div>
                                    )}
                                    <p style={{ fontFamily: sans, fontSize: '11px', color: C.muted, marginTop: '8px' }}>
                                        {approvalRate.approved} approved · {approvalRate.rejected} rejected
                                    </p>
                                </div>

                                <div style={statCard}>
                                    <p style={{ fontFamily: sans, fontSize: '12px', fontWeight: 600, color: C.espresso, marginBottom: '12px' }}>Review Performance</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div>
                                            <p style={miniLabel}>Avg. time to review</p>
                                            <p style={{ fontFamily: serif, fontSize: '26px', fontWeight: 600, color: C.espresso }}>
                                                {avgReviewHours != null
                                                    ? avgReviewHours < 24 ? `${avgReviewHours}h` : `${(avgReviewHours / 24).toFixed(1)}d`
                                                    : '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={miniLabel}>Current queue size</p>
                                            <p style={{ fontFamily: serif, fontSize: '26px', fontWeight: 600, color: '#a16207' }}>{queue.pendingCount}</p>
                                        </div>
                                        {oldestDate && oldestDays != null && (
                                            <div>
                                                <p style={miniLabel}>Oldest pending — waiting</p>
                                                <p style={{ fontFamily: sans, fontSize: '13px', fontWeight: 600, color: '#b91c1c' }}>
                                                    {oldestDays === 0 ? 'Today' : oldestDays === 1 ? '1 day' : `${oldestDays} days`}
                                                </p>
                                                <p style={{ fontFamily: sans, fontSize: '11px', color: C.muted }}>{formatDate(queue.oldestPending, 'short')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Rejection reasons */}
                            {rejectionReasons.length > 0 ? (
                                <div style={statCard}>
                                    <p style={{ fontFamily: sans, fontSize: '12px', fontWeight: 600, color: C.espresso, marginBottom: '12px' }}>Most Common Rejection Reasons</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {rejectionReasons.map((r, i) => (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontFamily: sans, fontSize: '12px', color: C.muted }}>{r.rejection_reason}</span>
                                                    <span style={{ fontFamily: sans, fontSize: '12px', fontWeight: 600, color: C.espresso }}>{r.count}</span>
                                                </div>
                                                <div style={{ width: '100%', backgroundColor: 'rgba(45,31,20,0.1)', borderRadius: '100px', height: '4px' }}>
                                                    <div style={{
                                                        width: `${Math.round((r.count / rejectionReasons[0].count) * 100)}%`,
                                                        backgroundColor: C.terracotta, borderRadius: '100px', height: '4px',
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ ...statCard, fontFamily: sans, fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>
                                    No rejection reasons recorded yet.
                                </div>
                            )}

                            {/* Recent posting activity */}
                            <div style={statCard}>
                                <p style={{ fontFamily: sans, fontSize: '12px', fontWeight: 600, color: C.espresso, marginBottom: '12px' }}>Recent Posting Activity</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                                    {[
                                        { label: 'Today',      value: recentActivity.today },
                                        { label: 'This week',  value: recentActivity.this_week },
                                        { label: 'This month', value: recentActivity.this_month },
                                    ].map(item => (
                                        <div key={item.label} style={{ backgroundColor: '#fff', borderRadius: '6px', padding: '14px', boxShadow: '0 1px 4px rgba(45,31,20,0.06)' }}>
                                            <p style={{ fontFamily: serif, fontSize: '30px', fontWeight: 600, color: C.terracotta }}>{item.value}</p>
                                            <p style={{ fontFamily: sans, fontSize: '11px', color: C.muted, marginTop: '4px' }}>{item.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* User activity + Top uploaders */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                                <div style={statCard}>
                                    <p style={{ fontFamily: sans, fontSize: '12px', fontWeight: 600, color: C.espresso, marginBottom: '12px' }}>User Activity</p>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', marginBottom: '12px' }}>
                                        <div>
                                            <p style={{ fontFamily: serif, fontSize: '30px', fontWeight: 600, color: C.terracotta }}>{userActivity.activePercent}%</p>
                                            <p style={miniLabel}>active uploaders</p>
                                        </div>
                                        <div>
                                            <p style={{ fontFamily: sans, fontSize: '18px', fontWeight: 600, color: C.espresso }}>{userActivity.activeUploaders}</p>
                                            <p style={miniLabel}>posted at least 1 animal</p>
                                        </div>
                                        <div>
                                            <p style={{ fontFamily: sans, fontSize: '18px', fontWeight: 600, color: C.muted }}>{userActivity.inactiveCount}</p>
                                            <p style={miniLabel}>never posted</p>
                                        </div>
                                    </div>
                                    {userActivity.totalUsers > 0 && (
                                        <div style={{ width: '100%', backgroundColor: C.border, borderRadius: '100px', height: '6px' }}>
                                            <div style={{ width: `${userActivity.activePercent}%`, backgroundColor: C.terracotta, borderRadius: '100px', height: '6px', transition: 'width 0.3s' }} />
                                        </div>
                                    )}
                                    <p style={{ fontFamily: sans, fontSize: '11px', color: C.muted, marginTop: '8px' }}>{userActivity.totalUsers} total registered users</p>
                                </div>

                                <div style={statCard}>
                                    <p style={{ fontFamily: sans, fontSize: '12px', fontWeight: 600, color: C.espresso, marginBottom: '12px' }}>Top Uploaders</p>
                                    {topUploaders.length === 0 ? (
                                        <p style={{ fontFamily: sans, fontSize: '13px', color: C.muted, fontStyle: 'italic' }}>No data yet.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {topUploaders.slice(0, 7).map((u, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                        <span style={{ fontFamily: sans, fontSize: '11px', color: C.muted, width: '16px', flexShrink: 0 }}>{i + 1}.</span>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ fontFamily: sans, fontSize: '12px', fontWeight: 500, color: C.espresso, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                                                            {u.email && <p style={{ fontFamily: sans, fontSize: '11px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>}
                                                        </div>
                                                    </div>
                                                    <span style={{ fontFamily: sans, fontSize: '12px', fontWeight: 700, color: C.terracotta, marginLeft: '8px', flexShrink: 0 }}>{u.petCount}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Incomplete listings */}
                            <div style={statCard}>
                                <p style={{ fontFamily: sans, fontSize: '12px', fontWeight: 600, color: C.espresso, marginBottom: '4px' }}>
                                    Incomplete Approved Listings
                                    <span style={{ fontFamily: sans, fontSize: '11px', fontWeight: 400, color: C.muted, marginLeft: '8px' }}>(no photos or missing description)</span>
                                </p>
                                {incompleteAnimals.length === 0 ? (
                                    <p style={{ fontFamily: sans, fontSize: '13px', color: '#16a34a', marginTop: '8px', fontWeight: 500 }}>
                                        All approved listings look complete.
                                    </p>
                                ) : (
                                    <>
                                        <p style={{ fontFamily: sans, fontSize: '11px', color: C.muted, marginBottom: '10px' }}>
                                            {incompleteAnimals.length} listing{incompleteAnimals.length !== 1 ? 's' : ''} need attention
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '192px', overflowY: 'auto' }}>
                                            {incompleteAnimals.map(a => (
                                                <div key={a.id} style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    backgroundColor: '#fff', borderRadius: '6px', padding: '8px 12px',
                                                    boxShadow: '0 1px 3px rgba(45,31,20,0.06)',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontFamily: sans, fontSize: '12px', fontWeight: 500, color: C.espresso }}>{a.name || '(unnamed)'}</span>
                                                        <span style={{ fontFamily: sans, fontSize: '11px', color: C.muted }}>{a.type}</span>
                                                        {a.photo_count === 0 && (
                                                            <span style={{ fontFamily: sans, fontSize: '10px', color: '#b91c1c', fontWeight: 500 }}>no photos</span>
                                                        )}
                                                    </div>
                                                    <a
                                                        href={`/pet/${a.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ fontFamily: sans, fontSize: '11px', color: C.terracotta, textDecoration: 'none', marginLeft: '16px', flexShrink: 0 }}
                                                        onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
                                                    >
                                                        View →
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

        </div>
    );
};

export default StatisticsManagement;
