import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trophy, Play, Pause, SkipBack, SkipForward, RefreshCcw, Leaf, Droplets, Trash } from 'lucide-react';
import { NnauruAPI } from '../../../api/nnauruAPI';
import { useAuth } from '../../../utils/AuthContext';

// Palette de couleurs distinctes par école
const SCHOOL_COLORS = [
    '#7c3aed', '#db2777', '#2563eb', '#16a34a', '#ea580c',
    '#0891b2', '#ca8a04', '#be185d', '#1d4ed8', '#15803d',
];

// Formatage intelligent des valeurs
const formatCo2Value = (val) => {
    if (!val || val === 0) return '0';
    if (val >= 1000) return `${(val / 1000).toFixed(2)} tCO2e`;
    return `${val.toFixed(1)} kgCO2e`;
};

const formatEcoImpact = (value, type) => {
    if (!value) return '0';
    if (type === 'co2') return formatCo2Value(value);
    if (type === 'water') {
        if (value >= 1000) return `${(value / 1000).toFixed(1)} m³`;
        return `${Math.round(value)} L`;
    }
    if (type === 'waste') {
        if (value >= 1000) return `${(value / 1000).toFixed(1)} t`;
        return `${Math.round(value)} kg`;
    }
    return Math.round(value).toString();
};

const formatPeriodDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).replace('.', '');
};

const DashboardKpiBar = ({ stats }) => (
    <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '24px 40px', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.05)', marginBottom: 24, border: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
            {/* Left: Inventory Counts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{stats.teams}</span>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 8 }}>Équipes</span>
                </div>
                <div style={{ width: 2, height: 48, background: '#e2e8f0' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{stats.players}</span>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 8 }}>Joueurs</span>
                </div>
                <div style={{ width: 2, height: 48, background: '#e2e8f0' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: '#059669', lineHeight: 1 }}>{stats.actions}</span>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 8 }}>Actions</span>
                </div>
            </div>

            {/* Right: Eco Impacts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', marginLeft: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{formatEcoImpact(stats.co2, 'co2')}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>CO2e évité</span>
                    </div>
                    <div style={{ padding: 12, background: '#ecfdf5', borderRadius: 16, color: '#10b981', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><Leaf size={24} /></div>
                </div>
                <div style={{ width: 2, height: 48, background: '#e2e8f0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{formatEcoImpact(stats.water, 'water')}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Eau préservée</span>
                    </div>
                    <div style={{ padding: 12, background: '#eff6ff', borderRadius: 16, color: '#3b82f6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><Droplets size={24} /></div>
                </div>
                <div style={{ width: 2, height: 48, background: '#e2e8f0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{formatEcoImpact(stats.waste, 'waste')}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Déchets évités</span>
                    </div>
                    <div style={{ padding: 12, background: '#fffbeb', borderRadius: 16, color: '#f59e0b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><Trash size={24} /></div>
                </div>
            </div>
        </div>
    </div>
);

const EcoBarRaceView = () => {
    const { user } = useAuth();
    const [impactData, setImpactData] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [colorMap, setColorMap] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [impactRes, historyRes] = await Promise.all([
                    NnauruAPI.get(user, '/delegate/impact'),
                    NnauruAPI.get(user, '/delegate/eco-bar-race/history').catch(() => []) // Fallback in case of error
                ]);
                
                setImpactData(impactRes);
                setHistory(historyRes || []);

                if (historyRes && historyRes.length > 0) {
                    setSelectedPeriod(historyRes[historyRes.length - 1].period);
                    const allIds = [];
                    historyRes.forEach(snapshot => {
                        snapshot.rankings?.forEach(r => {
                            if (!allIds.includes(r.instanceId)) allIds.push(r.instanceId);
                        });
                    });
                    const map = {};
                    allIds.forEach((id, i) => { map[id] = SCHOOL_COLORS[i % SCHOOL_COLORS.length]; });
                    setColorMap(map);
                } else if (impactRes?.teams) {
                    // Fallback colors from impact data if no history
                    const map = {};
                    impactRes.teams.forEach(t => map[t.id] = t.color || SCHOOL_COLORS[0]);
                    setColorMap(map);
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des données", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user, refreshKey]);

    // Lecteur automatique
    useEffect(() => {
        let interval;
        if (isPlaying && history.length > 0 && selectedPeriod !== null) {
            interval = setInterval(() => {
                setSelectedPeriod(prev => {
                    if (prev === null) return history[0]?.period || null;
                    const idx = history.findIndex(h => h.period === prev);
                    if (idx < history.length - 1) return history[idx + 1].period;
                    setIsPlaying(false);
                    return prev;
                });
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [isPlaying, history, selectedPeriod]);

    const togglePlay = () => {
        if (!isPlaying && selectedPeriod === history[history.length - 1]?.period) {
            setSelectedPeriod(history[0]?.period);
        }
        setIsPlaying(false);
        setTimeout(() => setIsPlaying(!isPlaying), 10);
    };

    const handleRefresh = () => {
        setRefreshKey(k => k + 1);
    };

    const stats = useMemo(() => {
        if (!impactData?.teams) return { teams: 0, players: 0, actions: 0, co2: 0, water: 0, waste: 0 };
        return {
            teams: impactData.teams.length,
            players: impactData.teams.reduce((s, t) => s + (t.playersCount || 0), 0),
            actions: impactData.teams.reduce((s, t) => s + (t.actionsCount || 0), 0),
            co2: impactData.impactData?.realSums?.totalCo2 || 0,
            water: impactData.impactData?.realSums?.totalWater || 0,
            waste: impactData.impactData?.realSums?.totalWaste || 0,
        };
    }, [impactData]);

    const isHistoryAvailable = history.length > 0;
    
    // Déterminer les données à afficher (historique ou données statiques de l'impact)
    const currentSnapshot = history.find(h => h.period === selectedPeriod);
    const chartData = useMemo(() => {
        let items = [];
        if (isHistoryAvailable && currentSnapshot) {
            items = currentSnapshot.rankings.map(r => ({
                id: r.instanceId,
                name: r.instanceName,
                co2: r.co2Total,
                color: colorMap[r.instanceId] || '#10b981'
            }));
        } else if (impactData?.teams) {
            items = impactData.teams.map(t => ({
                id: t.id,
                name: t.name,
                co2: t.totalCo2,
                color: t.color || '#10b981'
            }));
        }
        return items.sort((a, b) => b.co2 - a.co2);
    }, [currentSnapshot, impactData, isHistoryAvailable, colorMap]);

    const maxCo2 = chartData[0]?.co2 || 1;
    const totalCo2 = chartData.reduce((sum, r) => sum + r.co2, 0);

    const representativePeriods = useMemo(() => {
        if (history.length === 0) return [];
        if (history.length <= 10) return history;
        const step = Math.ceil(history.length / 9);
        const result = [];
        for (let i = 0; i < history.length; i += step) result.push(history[i]);
        if (result[result.length - 1]?.period !== history[history.length - 1]?.period) {
            result.push(history[history.length - 1]);
        }
        return result;
    }, [history]);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: 16 }}>
            <Loader2 size={32} className="dashboard-loading" style={{ color: '#10b981' }} />
            <p style={{ color: '#64748b', fontWeight: 600 }}>Chargement de la course...</p>
        </div>
    );

    if (!impactData?.impactData) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <div style={{ padding: '16px 24px', background: '#fff1f2', color: '#e11d48', borderRadius: 16, fontWeight: 700 }}>Données non disponibles</div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {/* KPI Bar */}
            <DashboardKpiBar stats={stats} />

            {/* EcoBarRace Container */}
            <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 4px 40px rgba(0,0,0,0.08)', overflow: 'hidden', padding: '28px 32px' }}>
                {/* HEADER */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#1e293b' }}>🏆 Eco-Bar-Race</h2>
                            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>Course aux économies réelles de CO2e entre tous les établissements.</p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            style={{ padding: 8, background: '#f1f5f9', color: '#64748b', borderRadius: 12, border: 'none', cursor: 'pointer', transition: '0.2s' }}
                            title="Actualiser la course"
                            onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        >
                            <RefreshCcw size={18} />
                        </button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total cumulé</p>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#334155' }}>{formatCo2Value(totalCo2)}</p>
                    </div>
                </div>

                {/* GRAPHIQUE */}
                <div style={{ position: 'relative', paddingRight: 320, minHeight: 300 }}>
                    {/* Échelle X en tête */}
                    <div style={{ position: 'relative', marginLeft: 144, marginBottom: 24, height: 16 }}>
                        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                            <div 
                                key={ratio} 
                                style={{ position: 'absolute', top: 0, left: `${ratio * 100}%`, transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}
                            >
                                {formatCo2Value(maxCo2 * ratio)}
                            </div>
                        ))}
                    </div>

                    {/* BARRES ANIMÉES */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <AnimatePresence>
                            {chartData.map((entry) => (
                                <motion.div
                                    key={entry.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        layout: { duration: 0.9, ease: [0.4, 0, 0.2, 1] },
                                        opacity: { duration: 0.3 },
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                                >
                                    {/* NOM */}
                                    <div style={{ width: 148, paddingRight: 16, textAlign: 'right', flexShrink: 0 }}>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                            {entry.name}
                                        </span>
                                    </div>

                                    {/* ZONE DE BARRE */}
                                    <div style={{ flex: 1, position: 'relative', height: 36 }}>
                                        {/* Barre colorée */}
                                        <motion.div
                                            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: entry.color, borderRadius: '0 8px 8px 0' }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max((entry.co2 / maxCo2) * 100, 1)}%` }}
                                            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                                        />

                                        {/* Valeur mobile */}
                                        <motion.div
                                            style={{ position: 'absolute', top: 0, bottom: 0, display: 'flex', alignItems: 'center', zIndex: 10 }}
                                            animate={{ left: `${Math.max((entry.co2 / maxCo2) * 100, 1)}%` }}
                                            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                                        >
                                            <div style={{ fontSize: 12, fontWeight: 900, color: entry.color, paddingLeft: 8, whiteSpace: 'nowrap' }}>
                                                {formatCo2Value(entry.co2)}
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* AXE X + LECTEUR */}
                    <div style={{ marginTop: 12, position: 'relative', paddingRight: 0 }}>
                        <div style={{ height: 1, background: '#e2e8f0', marginLeft: 144 }} />
                        
                        {isHistoryAvailable && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 4, paddingBottom: 24 }}>
                                {/* Contrôles */}
                                <div style={{ width: 148, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, paddingTop: 4 }}>
                                    <button
                                        onClick={() => { setIsPlaying(false); setSelectedPeriod(history[0]?.period); }}
                                        disabled={selectedPeriod === history[0]?.period}
                                        style={{ padding: 6, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', opacity: selectedPeriod === history[0]?.period ? 0.4 : 1 }}
                                    >
                                        <SkipBack size={13} />
                                    </button>
                                    <button
                                        onClick={togglePlay}
                                        style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'linear-gradient(135deg, #10b981, #0d9488)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                    >
                                        {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" style={{ marginLeft: 2 }} />}
                                    </button>
                                    <button
                                        onClick={() => { setIsPlaying(false); setSelectedPeriod(history[history.length - 1]?.period); }}
                                        disabled={selectedPeriod === history[history.length - 1]?.period}
                                        style={{ padding: 6, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', opacity: selectedPeriod === history[history.length - 1]?.period ? 0.4 : 1 }}
                                    >
                                        <SkipForward size={13} />
                                    </button>
                                </div>

                                {/* Timeline */}
                                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', paddingTop: 4 }}>
                                    <div style={{ position: 'absolute', top: 5, left: 0, right: 0, height: 2, background: '#f1f5f9', borderRadius: 4 }} />
                                    
                                    <motion.div 
                                        style={{ position: 'absolute', top: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', x: '-50%' }}
                                        animate={{ left: `${(history.findIndex(h => h.period === selectedPeriod) / Math.max(history.length - 1, 1)) * 100}%` }}
                                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                        <div style={{ width: 12, height: 12, background: '#10b981', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: 4 }} />
                                        <div style={{ position: 'absolute', top: -440, width: 1, height: 440, background: 'rgba(16, 185, 129, 0.1)', pointerEvents: 'none' }} />
                                    </motion.div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        {representativePeriods.map(h => (
                                            <button
                                                key={h.period}
                                                onClick={() => { setIsPlaying(false); setSelectedPeriod(h.period); }}
                                                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap', zIndex: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: selectedPeriod === h.period ? '#059669' : '#94a3b8' }}
                                            >
                                                <div style={{ width: 1, height: 8, background: selectedPeriod === h.period ? '#10b981' : '#e2e8f0' }} />
                                                {h.periodDate ? formatPeriodDate(h.periodDate) : `P${h.period}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FILIGRANE DATE (Watermark) */}
                    {isHistoryAvailable && currentSnapshot?.periodDate && (
                        <div style={{ position: 'absolute', bottom: 60, right: 32, textAlign: 'right', pointerEvents: 'none', userSelect: 'none', zIndex: 0 }}>
                            <p style={{ margin: 0, fontSize: 56, fontWeight: 900, lineHeight: 1, color: '#e2e8f0' }}>
                                {formatPeriodDate(currentSnapshot.periodDate)}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 900, color: '#cbd5e1' }}>
                                Total : {formatCo2Value(totalCo2)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EcoBarRaceView;
