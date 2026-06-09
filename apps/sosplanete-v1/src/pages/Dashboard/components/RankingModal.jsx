import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, X, Users, Tent } from 'lucide-react';

const PodiumStep = ({ rank, item, maxScore, type }) => {
    if (!item) return null;

    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const isThird = rank === 3;

    // Couleurs selon le rang
    const colors = {
        1: { border: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', text: '#d97706', bg: '#fef3c7' },
        2: { border: '#94a3b8', glow: 'rgba(148, 163, 184, 0.4)', text: '#475569', bg: '#f1f5f9' },
        3: { border: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', text: '#c2410c', bg: '#ffedd5' }
    };
    const color = colors[rank];

    const size = isFirst ? 100 : 80;
    const translateY = isFirst ? 0 : 30;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${translateY}px)`, zIndex: isFirst ? 10 : 5 }}>
            {/* Avatar / Icon Container */}
            <div style={{ position: 'relative', marginBottom: -15, zIndex: 2 }}>
                {isFirst && (
                    <div style={{ position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)', color: '#eab308' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            <path d="m19 14-7 7-7-7"/>
                            {/* Étoile stylisée */}
                            <path d="M12 2l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z" fill="#eab308" stroke="none" />
                        </svg>
                    </div>
                )}
                <div style={{ 
                    width: size, height: size, borderRadius: '50%', background: 'white', 
                    border: `4px solid ${color.border}`, padding: 4,
                    boxShadow: `0 0 20px ${color.glow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                }}>
                    {type === 'player' ? (
                        <img src={item.avatar} alt={item.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color.text }}>
                            {type === 'group' ? <Tent size={size * 0.4} /> : <Users size={size * 0.4} />}
                        </div>
                    )}
                </div>
                {/* Pastille de rang */}
                <div style={{ 
                    position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
                    width: 24, height: 24, borderRadius: '50%', background: color.border, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900,
                    border: '2px solid white'
                }}>
                    {rank}
                </div>
            </div>

            {/* Plaque d'information */}
            <div style={{ 
                background: 'white', padding: '24px 20px 12px', borderRadius: 16, minWidth: isFirst ? 160 : 130,
                textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                borderBottom: `4px solid ${color.border}`
            }}>
                <div style={{ fontSize: isFirst ? 16 : 14, fontWeight: 900, color: '#1e293b', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: color.text }}>
                    {item.score} {type === 'player' ? 'actions' : 'points'}
                </div>
            </div>
        </div>
    );
};

const RankingRow = ({ rank, item, maxScore, type }) => {
    const progress = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
    
    return (
        <div style={{ 
            display: 'flex', alignItems: 'center', padding: '12px 16px', 
            background: 'rgba(255, 255, 255, 0.4)', borderRadius: 16, marginBottom: 8,
            border: '1px solid rgba(255, 255, 255, 0.6)'
        }}>
            <div style={{ width: 30, fontSize: 11, fontWeight: 900, color: '#94a3b8' }}>#{rank}</div>
            
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', padding: 2, marginRight: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {type === 'player' ? (
                    <img src={item.avatar} alt={item.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {type === 'group' ? <Tent size={18} /> : <Users size={18} />}
                    </div>
                )}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#1e293b', marginBottom: 6 }}>{item.name}</div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.5)', borderRadius: 2 }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: type === 'player' ? '#10b981' : '#f59e0b', borderRadius: 2 }} />
                </div>
            </div>

            <div style={{ marginLeft: 20, textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#1e293b' }}>{item.score}</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {type === 'player' ? 'actions' : 'points'}
                </div>
            </div>
        </div>
    );
};

const RankingModal = ({ isOpen, onClose, title, data, type }) => {
    const [mounted, setMounted] = useState(false);
    const [subType, setSubType] = useState('team'); // 'team' or 'group' pour le modal équipes

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    // Si c'est le modal équipe, on permet de basculer entre équipes et groupes
    const isTeamModal = type === 'team';
    const currentData = isTeamModal ? data[subType] : data;
    const currentType = isTeamModal ? subType : 'player';

    const sortedData = [...currentData].sort((a, b) => b.score - a.score);
    const top3 = sortedData.slice(0, 3);
    const others = sortedData.slice(3);
    const maxScore = sortedData.length > 0 ? sortedData[0].score : 0;

    const modalContent = (
        <div style={{ 
            position: 'fixed', inset: 0, zIndex: 100000, 
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            pointerEvents: 'none' // Laisse passer les clics à côté si besoin, mais on veut fermer au clic dehors
        }}>
            {/* Overlay invisible pour fermer en cliquant à côté */}
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }} />
            
            <div style={{ 
                width: '100%', maxWidth: 600, maxHeight: '85vh', 
                background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', 
                borderRadius: 32, display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Header */}
                <div style={{ padding: '30px 40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trophy size={28} strokeWidth={2.5} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>{title}</h2>
                    </div>
                    <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Segmented Control pour Equipes / Groupes */}
                {isTeamModal && (
                    <div style={{ padding: '0 40px 20px' }}>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.4)', borderRadius: 20, padding: 4 }}>
                            <button 
                                onClick={() => setSubType('team')}
                                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 16, background: subType === 'team' ? 'white' : 'transparent', color: subType === 'team' ? '#1e293b' : '#64748b', fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                            >
                                <Users size={16} /> ÉQUIPES
                            </button>
                            <button 
                                onClick={() => setSubType('group')}
                                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 16, background: subType === 'group' ? 'white' : 'transparent', color: subType === 'group' ? '#1e293b' : '#64748b', fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                            >
                                <Tent size={16} /> GROUPES
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 40px 40px' }}>
                    {/* Podium */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 20, padding: '20px 0 60px' }}>
                        <PodiumStep rank={2} item={top3[1]} maxScore={maxScore} type={currentType} />
                        <PodiumStep rank={1} item={top3[0]} maxScore={maxScore} type={currentType} />
                        <PodiumStep rank={3} item={top3[2]} maxScore={maxScore} type={currentType} />
                    </div>

                    {/* Liste */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {others.map((item, index) => (
                            <RankingRow key={item.id || index} rank={index + 4} item={item} maxScore={maxScore} type={currentType} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default RankingModal;
