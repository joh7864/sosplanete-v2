import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Calendar, Trophy, Users } from 'lucide-react';
import { NnauruAPI } from '../../../api/nnauruAPI';
import { useAuth } from '../../../utils/AuthContext';

const CELL_WIDTH = 32;

const getHeatmapStyle = (count) => {
    if (count === 0) return { background: 'rgba(248,250,252,0.3)', color: '#cbd5e1' };
    if (count <= 2) return { background: '#d1fae5', color: '#065f46', fontWeight: 700 };
    if (count <= 5) return { background: '#6ee7b7', color: '#064e3b', fontWeight: 700 };
    if (count <= 10) return { background: '#10b981', color: '#fff', fontWeight: 900 };
    return { background: '#059669', color: '#fff', fontWeight: 900 };
};

import RankingModal from './RankingModal';

const getPlayerAvatar = (pseudo, avatarPath) => {
    if (avatarPath) return avatarPath;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${pseudo}&backgroundColor=f1f5f9`;
};

const TrackingKpiBar = ({ stats, setModalType }) => {
    if (!stats || !stats.children || !stats.periods || stats.children.length === 0) return null;

    // 1. Actions Totales
    const totalActions = stats.children.reduce((s, c) => s + c.total, 0);

    // 2. Dernière semaine
    const lastPeriodIndex = stats.periods.length - 1;
    const lastPeriodActions = stats.children.reduce((s, c) => s + (c.weeks[lastPeriodIndex] || 0), 0);
    const lastPeriodLabel = stats.periods[lastPeriodIndex]?.label || '';

    // 3. Top Equipe
    const teamTotals = {};
    const teamNames = {};
    stats.children.forEach(c => {
        teamTotals[c.teamId] = (teamTotals[c.teamId] || 0) + c.total;
        teamNames[c.teamId] = c.teamName;
    });
    let topTeamId = null;
    let maxTeamTotal = -1;
    Object.keys(teamTotals).forEach(id => {
        if (teamTotals[id] > maxTeamTotal) {
            maxTeamTotal = teamTotals[id];
            topTeamId = id;
        }
    });
    const topTeamName = topTeamId ? teamNames[topTeamId] : '-';

    // 4. Top Enfant
    let topChild = null;
    let maxChildTotal = -1;
    stats.children.forEach(c => {
        if (c.total > maxChildTotal) {
            maxChildTotal = c.total;
            topChild = c;
        }
    });

    // 5. Participation
    const totalChildren = stats.children.length;
    const activeChildren = stats.children.filter(c => c.total > 0).length;
    const participationRate = totalChildren > 0 ? Math.round((activeChildren / totalChildren) * 100) : 0;

    const Card = ({ title, value, subtext, icon, iconBg, iconColor, badge, onClick }) => (
        <div 
            onClick={onClick}
            style={{ 
                flex: 1, minWidth: 180, background: 'white', borderRadius: 20, padding: '20px 24px', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9',
                cursor: onClick ? 'pointer' : 'default',
                transform: 'scale(1)', transition: 'transform 0.2s',
                ...(onClick ? { ':hover': { transform: 'scale(1.02)' } } : {}) // Simple hover effect
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h3>
                    {badge && <div style={{ display: 'inline-block', marginTop: 8, padding: '4px 10px', background: '#ecfdf5', color: '#10b981', borderRadius: 12, fontSize: 9, fontWeight: 900 }}>{badge}</div>}
                </div>
                <div style={{ padding: 10, borderRadius: 14, background: iconBg, color: iconColor }}>
                    {icon}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>{subtext}</span>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <Card 
                title="ACTIONS TOTALES" 
                badge="Global"
                value={totalActions} 
                subtext="Cumulées" 
                icon={<TrendingUp size={24} strokeWidth={2.5} />} 
                iconBg="#ecfdf5" 
                iconColor="#10b981" 
            />
            <Card 
                title="DERNIÈRE SEMAINE" 
                value={lastPeriodActions} 
                subtext={`Actions en ${lastPeriodLabel}`} 
                icon={<Calendar size={24} strokeWidth={2.5} />} 
                iconBg="#eff6ff" 
                iconColor="#3b82f6" 
            />
            <Card 
                title="TOP ÉQUIPE" 
                value={topTeamName} 
                subtext={`${maxTeamTotal} pts`} 
                icon={<Trophy size={24} strokeWidth={2.5} />} 
                iconBg="#fef3c7" 
                iconColor="#f59e0b" 
                onClick={() => setModalType('team')}
            />
            <Card 
                title="TOP ENFANT" 
                value={topChild ? topChild.pseudo : '-'} 
                subtext={`${maxChildTotal} act.`} 
                icon={<Trophy size={24} strokeWidth={2.5} />} 
                iconBg="#ecfdf5" 
                iconColor="#10b981" 
                onClick={() => setModalType('player')}
            />
            <Card 
                title="PARTICIPATION" 
                value={`${participationRate}%`} 
                subtext={`${activeChildren} enfants actifs`} 
                icon={<Users size={24} strokeWidth={2.5} />} 
                iconBg="#faf5ff" 
                iconColor="#a855f7" 
            />
        </div>
    );
};

const TrackingMatrixView = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('all');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [hideInactive, setHideInactive] = useState(false);
    const [hideEmptyPeriods, setHideEmptyPeriods] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [modalType, setModalType] = useState(null); // 'player', 'team', or null

    useEffect(() => {
        const fetchTracking = async () => {
            try {
                const response = await NnauruAPI.get(user, '/delegate/tracking');
                setStats(response);
            } catch (err) {
                console.error("Erreur lors de la récupération du suivi", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchTracking();
    }, [user]);

    const teams = useMemo(() => {
        if (!stats?.children) return [];
        const seen = new Map();
        stats.children.forEach(c => { if (!seen.has(c.teamId)) seen.set(c.teamId, { id: c.teamId, name: c.teamName }); });
        return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [stats]);

    const groups = useMemo(() => {
        if (!stats?.children) return [];
        const seen = new Map();
        stats.children
            .filter(c => selectedTeam === 'all' || c.teamId.toString() === selectedTeam)
            .forEach(c => { if (!seen.has(c.groupId)) seen.set(c.groupId, { id: c.groupId, name: c.groupName }); });
        return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [stats, selectedTeam]);

    const filteredChildren = useMemo(() => {
        if (!stats?.children) return [];
        return stats.children.filter(c => {
            const matchSearch = c.pseudo.toLowerCase().includes(search.toLowerCase()) || c.teamName.toLowerCase().includes(search.toLowerCase());
            const matchTeam = selectedTeam === 'all' || c.teamId.toString() === selectedTeam;
            const matchGroup = selectedGroup === 'all' || c.groupId.toString() === selectedGroup;
            const matchActive = !hideInactive || c.total > 0;
            return matchSearch && matchTeam && matchGroup && matchActive;
        });
    }, [stats, search, selectedTeam, selectedGroup, hideInactive]);

    const computedWeeklyTotals = useMemo(() => {
        if (!stats?.periods) return [];
        return stats.periods.map((_, i) => filteredChildren.reduce((sum, c) => sum + (c.weeks[i] || 0), 0));
    }, [stats, filteredChildren]);

    const computedGrandTotal = useMemo(() => filteredChildren.reduce((s, c) => s + c.total, 0), [filteredChildren]);

    const visiblePeriodIndices = useMemo(() => {
        if (!stats?.periods) return [];
        return stats.periods.map((_, i) => i).filter(i => !hideEmptyPeriods || computedWeeklyTotals[i] > 0);
    }, [stats, hideEmptyPeriods, computedWeeklyTotals]);

    // Preparer les données pour les modales
    const modalData = useMemo(() => {
        if (!stats?.children || !modalType) return null;

        if (modalType === 'player') {
            return stats.children.map(c => ({
                id: c.childId,
                name: c.pseudo,
                score: c.total,
                avatar: getPlayerAvatar(c.pseudo, c.avatarPath)
            }));
        }

        if (modalType === 'team') {
            const teamTotals = {};
            const teamNames = {};
            const groupTotals = {};
            const groupNames = {};

            stats.children.forEach(c => {
                teamTotals[c.teamId] = (teamTotals[c.teamId] || 0) + c.total;
                teamNames[c.teamId] = c.teamName;
                groupTotals[c.groupId] = (groupTotals[c.groupId] || 0) + c.total;
                groupNames[c.groupId] = c.groupName;
            });

            return {
                team: Object.keys(teamTotals).map(id => ({ id, name: teamNames[id], score: teamTotals[id] })),
                group: Object.keys(groupTotals).map(id => ({ id, name: groupNames[id], score: groupTotals[id] }))
            };
        }
        return null;
    }, [stats, modalType]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 12 }}>
            <div style={{ width: 40, height: 40, border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#64748b', fontWeight: 600 }}>Chargement du suivi...</p>
        </div>
    );

    if (!stats?.children) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
            <div style={{ padding: '16px 24px', background: '#fff1f2', color: '#e11d48', borderRadius: 16, fontWeight: 700 }}>Données non disponibles</div>
        </div>
    );

    const matrixContent = (
        <div style={{ 
            background: isFullscreen ? 'white' : 'rgba(255, 255, 255, 0.45)', 
            backdropFilter: isFullscreen ? 'none' : 'blur(8px)', 
            WebkitBackdropFilter: isFullscreen ? 'none' : 'blur(8px)', 
            borderRadius: isFullscreen ? 0 : 20, 
            border: isFullscreen ? 'none' : '2px solid rgba(255, 255, 255, 0.45)', 
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column', 
            height: isFullscreen ? '100%' : 'auto' 
        }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>Suivi des Actions</h2>
                            <span style={{ padding: '2px 8px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: 20, fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Live</span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Saisie hebdomadaire par élève</p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        {/* Toggle Masquer inactifs */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', background: 'rgba(255, 255, 255, 0.45)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: 12, cursor: 'pointer', fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, boxSizing: 'border-box' }}>
                            <input type="checkbox" checked={hideInactive} onChange={e => setHideInactive(e.target.checked)} style={{ accentColor: '#10b981', margin: 0 }} />
                            Masquer inactifs
                        </label>

                        {/* Toggle Masquer périodes vides */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', background: 'rgba(255, 255, 255, 0.45)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: 12, cursor: 'pointer', fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, boxSizing: 'border-box' }}>
                            <input type="checkbox" checked={hideEmptyPeriods} onChange={e => setHideEmptyPeriods(e.target.checked)} style={{ accentColor: '#0ea5e9', margin: 0 }} />
                            Masquer vides
                        </label>

                        {/* Filtre équipe */}
                        <select value={selectedTeam} onChange={e => { setSelectedTeam(e.target.value); setSelectedGroup('all'); }} style={{ height: 36, padding: '0 12px', background: 'rgba(255, 255, 255, 0.45)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: 12, fontSize: 10, fontWeight: 900, color: '#475569', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }}>
                            <option value="all">Toutes les équipes</option>
                            {teams.map(t => <option key={t.id} value={t.id.toString()}>{t.name}</option>)}
                        </select>

                        {/* Filtre groupe */}
                        <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} style={{ height: 36, padding: '0 12px', background: 'rgba(255, 255, 255, 0.45)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: 12, fontSize: 10, fontWeight: 900, color: '#475569', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }}>
                            <option value="all">Tous les groupes</option>
                            {groups.map(g => <option key={g.id} value={g.id.toString()}>{g.name}</option>)}
                        </select>

                        {/* Recherche */}
                        <div style={{ position: 'relative', height: 36 }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}>🔍</span>
                            <input type="text" placeholder="Chercher élève..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 36, paddingLeft: 30, paddingRight: 12, background: 'rgba(255, 255, 255, 0.45)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: 12, fontSize: 10, fontWeight: 700, color: '#1e293b', outline: 'none', width: 140, boxSizing: 'border-box' }} />
                        </div>

                        {/* Plein écran */}
                        <button onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'} style={{ height: 36, width: 36, padding: 0, borderRadius: 12, border: `1px solid ${isFullscreen ? '#1e293b' : 'rgba(255, 255, 255, 0.3)'}`, background: isFullscreen ? '#1e293b' : 'rgba(255, 255, 255, 0.45)', color: isFullscreen ? 'white' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                            {isFullscreen ? '⊙' : '⛶'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tableau */}
            <div style={{ overflowX: 'auto', flex: 1 }}>
                <div style={{ minWidth: 'fit-content', display: 'flex', flexDirection: 'column', height: isFullscreen ? '100%' : 'auto' }}>
                    {/* Thead sticky */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                                <th style={{ width: 120, padding: '8px 12px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.3)', position: 'sticky', left: 0, background: 'rgba(255, 255, 255, 0.92)', zIndex: 20, textAlign: 'left' }}>Enfant</th>
                                <th style={{ width: 80, padding: '8px 12px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.3)', position: 'sticky', left: 120, background: 'rgba(255, 255, 255, 0.92)', zIndex: 20, textAlign: 'left' }}>Équipe</th>
                                <th style={{ width: 80, padding: '8px 12px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.3)', position: 'sticky', left: 200, background: 'rgba(255, 255, 255, 0.92)', zIndex: 20, textAlign: 'left' }}>Groupe</th>
                                <th style={{ width: 60, padding: '8px 12px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.3)', textAlign: 'center', background: 'rgba(240,253,244,0.3)' }}>Total</th>
                                <th style={{ padding: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.3)' }}>
                                    <div style={{ display: 'flex' }}>
                                        {visiblePeriodIndices.map(idx => {
                                            const p = stats.periods[idx];
                                            return (
                                                <div key={idx} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH, padding: 2, fontSize: 7, fontWeight: 900, textTransform: 'uppercase', color: '#64748b', borderLeft: '1px solid rgba(255, 255, 255, 0.3)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 48, background: 'rgba(255,255,255,0.3)' }}>
                                                    <span style={{ color: '#94a3b8', fontSize: 7, lineHeight: 1 }}>{p.label}</span>
                                                    <span style={{ color: '#1e293b', fontWeight: 700, marginTop: 2, lineHeight: 1, fontSize: 8 }}>
                                                        {new Date(p.start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                    </table>

                    {/* Body scrollable */}
                    <div style={{ overflowY: 'auto', maxHeight: isFullscreen ? 'calc(100vh - 200px)' : 520 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                            <tbody>
                                {filteredChildren.map(child => (
                                    <tr key={child.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                                        <td style={{ width: 120, padding: '6px 12px', position: 'sticky', left: 0, background: 'rgba(255, 255, 255, 0.92)', zIndex: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                                                    <img src={getPlayerAvatar(child.pseudo, child.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 900, color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.pseudo}</span>
                                            </div>
                                        </td>
                                        <td style={{ width: 80, padding: '6px 12px', fontSize: 9, fontWeight: 900, color: '#1e293b', position: 'sticky', left: 120, background: 'rgba(255, 255, 255, 0.92)', zIndex: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.teamName}</td>
                                        <td style={{ width: 80, padding: '6px 12px', fontSize: 8, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, position: 'sticky', left: 200, background: 'rgba(255, 255, 255, 0.92)', zIndex: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.groupName}</td>
                                        <td style={{ width: 60, padding: '6px 12px', textAlign: 'center', fontWeight: 900, fontSize: 10, color: '#1e293b', background: 'rgba(240,253,244,0.1)' }}>{child.total}</td>
                                        <td style={{ padding: 0 }}>
                                            <div style={{ display: 'flex', height: '100%' }}>
                                                {visiblePeriodIndices.map(idx => {
                                                    const count = child.weeks[idx] || 0;
                                                    return (
                                                        <div key={idx} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH, padding: 2, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(248,250,252,0.5)' }}>
                                                            <div style={{ width: '100%', height: '100%', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, transition: 'transform 0.15s', cursor: 'default', ...getHeatmapStyle(count) }}>
                                                                {count > 0 ? count : <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#e2e8f0' }} />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer totaux */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <tfoot>
                            <tr style={{ background: '#0f172a', color: 'white' }}>
                                <td colSpan={3} style={{ width: 280, padding: '8px 12px', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: '#34d399' }}>Total Hebdomadaire Filtré</td>
                                <td style={{ width: 60, padding: '8px 12px', textAlign: 'center', fontWeight: 900, fontSize: 10, color: 'white' }}>{computedGrandTotal}</td>
                                <td style={{ padding: 0 }}>
                                    <div style={{ display: 'flex' }}>
                                        {visiblePeriodIndices.map(idx => (
                                            <div key={idx} style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH, padding: 6, textAlign: 'center', fontSize: 9, fontWeight: 900, color: 'white', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                                                {computedWeeklyTotals[idx]}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );

    if (isFullscreen) {
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.2)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                <div style={{ width: '100%', height: '100%' }}>{matrixContent}</div>
            </div>
        );
    }

    return (
        <div className="tracking-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <TrackingKpiBar stats={stats} setModalType={setModalType} />
            {matrixContent}
            
            <RankingModal 
                isOpen={!!modalType} 
                onClose={() => setModalType(null)} 
                title={modalType === 'player' ? 'Classement des Joueurs' : 'Classement des Équipes'} 
                type={modalType} 
                data={modalData} 
            />
        </div>
    );
};

export default TrackingMatrixView;
