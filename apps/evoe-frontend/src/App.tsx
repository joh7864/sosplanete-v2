import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Radio, Scan, LogOut, ChevronRight, ChevronLeft, Shield, Trash2, Droplet, Zap, RefreshCw, Smartphone, Monitor, AlertTriangle, AlertOctagon, CheckCircle2, Eye, EyeOff, Camera, Upload, Save, X, Trophy, Mail } from 'lucide-react';
import axios from 'axios';
import Portal2026 from './components/Portal2026';
import Portal2070 from './components/Portal2070';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import TemporalBriefing from './components/TemporalBriefing';
import ChatPanel from './components/ChatPanel';
import './App.css';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

// Helper pour parser les **bold** en HTML
const parseBold = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

// Formateur d'unité intelligent : kg/t, L/m³
const fmtMass = (kg: number): string => {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(2)} kt`;
  if (kg >= 1000)      return `${(kg / 1000).toFixed(2)} t`;
  return `${kg.toFixed(1)} kg`;
};
const fmtVolume = (litres: number): string => {
  if (litres >= 1_000_000) return `${(litres / 1_000_000).toFixed(1)} ML`;
  if (litres >= 1000)      return `${(litres / 1000).toFixed(1)} m³`;
  return `${litres.toFixed(0)} L`;
};


function EvoeRadarMeter({ value, label, color, id, tooltip, displayValue }: { value: number; label: string; color: string; id: string; tooltip?: string; displayValue?: string }) {
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const angle = -135 + (normalizedValue / 100) * 270;
  const strokeDashOffset = 400.5 - (400.5 * normalizedValue) / 100;

  return (
    <div 
      title={tooltip}
      style={{ 
        width: '90px', 
        height: '90px', 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        cursor: tooltip ? 'help' : 'default'
      }}
    >
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Arc de fond */}
        <path
          d="M 40 160 A 85 85 0 1 1 160 160"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Arc actif animé */}
        <motion.path
          d="M 40 160 A 85 85 0 1 1 160 160"
          fill="none"
          stroke={`url(#grad-${id})`}
          strokeWidth="12"
          strokeLinecap="round"
          filter={`url(#glow-${id})`}
          strokeDasharray="400.5"
          initial={{ strokeDashoffset: 400.5 }}
          animate={{ strokeDashoffset: strokeDashOffset }}
          transition={{ duration: 2.0, ease: "easeOut" }}
        />

        {/* Aiguille rotative */}
        <g transform="translate(100, 100)">
          <motion.g
            initial={{ rotate: -135 }}
            animate={{ rotate: angle }}
            transition={{ duration: 2.0, ease: "easeOut" }}
          >
            {/* Cercle invisible forçant le transform-origin à rester au centre exact (0,0) */}
            <circle cx="0" cy="0" r="85" fill="none" stroke="none" />
            <polygon points="-2,0 2,0 0,-85" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }} />
            <circle cx="0" cy="0" r="6" fill="#111827" stroke="#ffffff" strokeWidth="2" />
          </motion.g>
        </g>

        {/* Pourcentage au centre */}
        <text
          x="100"
          y="68"
          fill="#ffffff"
          fontSize="36"
          fontWeight="bold"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          textAnchor="middle"
          style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}
        >
          {displayValue !== undefined ? displayValue : `${Math.round(value)}%`}
        </text>

        {/* Label sous l'aiguille */}
        <text
          x="100"
          y="152"
          fill={color}
          fontSize="14"
          fontWeight="900"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="1.5"
          style={{ textShadow: `0 0 8px ${color}55` }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy';

function AgentProfileModal({
  profileId,
  onClose,
  isOwner,
  refreshData
}: {
  profileId: number;
  onClose: () => void;
  isOwner: boolean;
  refreshData: () => void;
}) {
  const { refreshContext } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'missions' | 'top5' | 'challenges'>('missions');
  const [impulsingId, setImpulsingId] = useState<number | null>(null);

  const handleImpulseMission = async (localActionId: number) => {
    setImpulsingId(localActionId);
    try {
      const BASE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy').replace('/legacy', '');
      await axios.post(`${BASE_API_URL}/actiondone/${profileId}`, { id: localActionId });
      refreshData();
      const res = await axios.get(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/profile/${profileId}`);
      setProfileData(res.data);
    } catch (err) {
      console.error("Erreur lors de l'impulsion depuis le défi:", err);
    } finally {
      setImpulsingId(null);
    }
  };
  
  // Form states (owner mode)
  const [pseudo, setPseudo] = useState('');
  const [gender, setGender] = useState<string>('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/profile/${profileId}`);
        if (active) {
          setProfileData(res.data);
          if (isOwner) {
            setPseudo(res.data.profile.pseudo || '');
            setGender(res.data.profile.gender || '');
            const bDate = res.data.profile.birthDate;
            setBirthDate(bDate ? bDate.substring(0, 10) : '');
            setAvatar(res.data.profile.avatar || null);
            setPassword('');
          }
        }
      } catch (err) {
        console.error("Erreur de chargement du profil:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      active = false;
    };
  }, [profileId, isOwner]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const BASE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy').replace('/legacy', '');
      const resp = await axios.post(`${BASE_API_URL}/evoe/profile/upload-avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (resp.status === 200 || resp.status === 201) {
        setAvatar(resp.data.filename);
      }
    } catch (err) {
      console.error("Erreur d'upload d'avatar:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const BASE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy').replace('/legacy', '');
      const payload: any = {
        pseudo,
        gender: gender || null,
        birthDate: birthDate || null,
        avatar: avatar || null,
      };
      if (password && password.trim() !== '') {
        payload.password = password;
      }
      await axios.patch(`${BASE_API_URL}/evoe/profile`, payload);
      await refreshContext();
      refreshData();
      onClose();
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil:", err);
    } finally {
      setSaving(false);
    }
  };

  const getAvatars3DList = () => {
    const list: string[] = [];
    for (let i = 1; i <= 3; i++) list.push(`avatars_3D/EF_avatar_0${i}.png`);
    for (let i = 1; i <= 3; i++) list.push(`avatars_3D/EH_avatar_0${i}.png`);
    for (let i = 1; i <= 12; i++) list.push(`avatars_3D/F_avatar_${String(i).padStart(2, '0')}.png`);
    for (let i = 1; i <= 21; i++) list.push(`avatars_3D/H_avatar_0${i}.png`);
    return list;
  };

  const renderAvatar = (avatarValue: string | null, genderValue: string | null, pseudoValue: string) => {
    if (avatarValue && avatarValue !== 'avatars/default.png') {
      return `${EVOE_IMG_URL}${avatarValue}`;
    }
    let hash = 0;
    const name = pseudoValue || '';
    for (let i = 0; i < name.length; i++) {
      hash += name.charCodeAt(i);
    }
    let genre = genderValue;
    if (!genre) {
      genre = ['EF', 'EH', 'F', 'H'][hash % 4];
    }
    let file = '';
    if (genre === 'EF') {
      file = `EF_avatar_0${(hash % 3) + 1}.png`;
    } else if (genre === 'EH') {
      file = `EH_avatar_0${(hash % 3) + 1}.png`;
    } else if (genre === 'F') {
      file = `F_avatar_${((hash % 12) + 1).toString().padStart(2, '0')}.png`;
    } else {
      file = `H_avatar_0${(hash % 21) + 1}.png`;
    }
    return `${EVOE_IMG_URL}avatars_3D/${file}`;
  };

  if (loading) {
    return (
      <div className="agent-profile-backdrop">
        <div className="agent-profile-modal-loading">
          <RefreshCw className="icon spin-loading" size={48} />
          <p>Déchiffrement des données de l'Agent...</p>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const currentAvatar = isOwner ? avatar : profileData.profile.avatar;
  const currentGender = isOwner ? gender : profileData.profile.gender;
  const currentPseudo = isOwner ? pseudo : profileData.profile.pseudo;
  const teamColor = profileData.profile.teamColor || '#00ffcc';

  return (
    <div className="agent-profile-backdrop" onClick={onClose}>
      <div 
        className="agent-profile-modal" 
        style={{ border: `1.5px solid ${teamColor}`, boxShadow: `0 0 35px ${teamColor}33, 0 20px 50px rgba(0,0,0,0.8)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="agent-profile-close" onClick={onClose}><X size={20} /></button>

        <div className="agent-profile-container">
          {/* Section Identité & Vitalité */}
          <div className="agent-profile-sidebar">
            <div className="agent-profile-avatar-wrapper" style={{ borderColor: teamColor }}>
              <img 
                src={renderAvatar(currentAvatar, currentGender, currentPseudo)} 
                alt="" 
                className="agent-profile-avatar" 
              />
              {isOwner && (
                <button 
                  className="agent-profile-avatar-edit-btn" 
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  title="Changer d'avatar"
                >
                  <Camera size={14} />
                </button>
              )}
            </div>

            {showAvatarPicker && isOwner && (
              <div className="agent-avatar-picker-popover">
                <div className="agent-avatar-picker-header">
                  <h4>Choisir un Avatar 3D</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="picker-upload-btn"
                    >
                      <Upload size={12} /> Importer
                    </button>
                    <button onClick={() => setShowAvatarPicker(false)} className="picker-close-btn">×</button>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={(e) => {
                    handleAvatarUpload(e);
                    setShowAvatarPicker(false);
                  }}
                />
                <div className="agent-avatar-grid">
                  {getAvatars3DList().map((av) => (
                    <img 
                      key={av} 
                      src={`${EVOE_IMG_URL}${av}`} 
                      alt="" 
                      className={`agent-avatar-grid-item ${avatar === av ? 'selected' : ''}`}
                      onClick={() => {
                        setAvatar(av);
                        setShowAvatarPicker(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <h2 className="agent-profile-pseudo">{profileData.profile.pseudo}</h2>
            <div className="agent-profile-team" style={{ color: teamColor }}>{profileData.profile.teamName}</div>

            {/* Barre de Vitalité */}
            <div className="agent-vitality-container">
              <div className="agent-vitality-label">
                <span>Vitalité Temporelle</span>
                <span style={{ color: teamColor }}>{profileData.health} HP</span>
              </div>
              <div className="agent-vitality-track">
                <div 
                  className="agent-vitality-bar" 
                  style={{ 
                    width: `${Math.min(100, profileData.health)}%`,
                    background: profileData.health < 35 ? '#ff3b3b' : (profileData.health < 80 ? '#ff9f43' : '#10b981')
                  }} 
                />
              </div>
            </div>

            {/* Formulaire Propriétaire (Privé) */}
            {isOwner && (
              <form onSubmit={handleSave} className="agent-profile-form">
                <div className="form-group">
                  <label>Pseudo de l'Agent</label>
                  <input 
                    type="text" 
                    value={pseudo} 
                    onChange={(e) => setPseudo(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Genre</label>
                    <select value={gender || ''} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Non défini</option>
                      <option value="EH">Kid Garçon (EH)</option>
                      <option value="EF">Kid Fille (EF)</option>
                      <option value="M">Adulte Homme (M)</option>
                      <option value="F">Adulte Femme (F)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Date de Naissance</label>
                    <input 
                      type="date" 
                      value={birthDate} 
                      onChange={(e) => setBirthDate(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nouveau Mot de Passe</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Laisser vide pour ne pas modifier"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={saving} className="agent-profile-save-btn">
                  {saving ? <RefreshCw className="icon-sm spin-loading" /> : <Save size={14} />} 
                  {saving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </form>
            )}
          </div>

          {/* Section Statistiques, Missions et Défis */}
          <div className="agent-profile-content">
            {/* Grille des 3 indicateurs personnels */}
            <div className="profile-metrics-grid">
              <div className="profile-metric-card">
                <Shield size={20} className="metric-icon co2" />
                <div className="metric-info">
                  <span className="label">Carbone Évité</span>
                  <span className="value">{fmtMass(profileData.personalMetrics.co2)}</span>
                </div>
              </div>
              <div className="profile-metric-card">
                <Droplet size={20} className="metric-icon water" />
                <div className="metric-info">
                  <span className="label">Eau Épargnée</span>
                  <span className="value">{fmtVolume(profileData.personalMetrics.water)}</span>
                </div>
              </div>
              <div className="profile-metric-card">
                <Trash2 size={20} className="metric-icon waste" />
                <div className="metric-info">
                  <span className="label">Déchets Évités</span>
                  <span className="value">{fmtMass(profileData.personalMetrics.waste)}</span>
                </div>
              </div>
            </div>

            {/* Navigation des Onglets */}
            <div className="profile-tabs-nav">
              <button 
                className={`profile-tab-btn ${activeTab === 'missions' ? 'active' : ''}`}
                onClick={() => setActiveTab('missions')}
              >
                Missions Période ({profileData.periodMissions.length})
              </button>
              <button 
                className={`profile-tab-btn ${activeTab === 'top5' ? 'active' : ''}`}
                onClick={() => setActiveTab('top5')}
              >
                Top 5 Historique
              </button>
              <button 
                className={`profile-tab-btn ${activeTab === 'challenges' ? 'active' : ''}`}
                onClick={() => setActiveTab('challenges')}
              >
                Défis PvP ({profileData.challenges.length})
              </button>
            </div>

            {/* Contenu des Onglets */}
            <div className="profile-tab-content">
              {activeTab === 'missions' && (
                <div className="missions-tab-list">
                  {profileData.periodMissions.length === 0 ? (
                    <p className="empty-state">Aucune éco-mission impulsée sur cette période.</p>
                  ) : (
                    profileData.periodMissions.map((m: any) => (
                      <div key={m.id} className="profile-mission-item">
                        <div className="mission-details">
                          <span className="mission-label">{m.label}</span>
                          <span className="mission-date">
                            {new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="mission-points">+{m.amplitude} AT</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'top5' && (
                <div className="top5-tab-list">
                  {profileData.top5Missions.length === 0 ? (
                    <p className="empty-state">Historique vierge. Impulsez des missions pour activer la biométrie.</p>
                  ) : (
                    profileData.top5Missions.map((m: any, idx: number) => (
                      <div key={m.localActionId} className="profile-top-item">
                        <div className="top-rank">
                          <Trophy size={16} className={`rank-icon rank-${idx + 1}`} />
                          <span className="label">{m.label}</span>
                        </div>
                        <span className="count-badge">{m.count} fois</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'challenges' && (
                <div className="challenges-tab-list">
                  {profileData.challenges.length === 0 ? (
                    <p className="empty-state">Aucun défi temporel enregistré sur cette période.</p>
                  ) : (
                    profileData.challenges.map((c: any) => (
                      <div key={c.id} className="profile-challenge-item">
                        <div className="challenge-header">
                          <span className="challenge-opponent">
                            {c.isChallenger ? 'DÉFI ENVOYÉ À ' : 'DÉFI REÇU DE '}
                            <strong style={{ color: c.opponentColor }}>{c.opponentName}</strong>
                          </span>
                          <span className={`challenge-status ${c.status.toLowerCase()}`}>
                            {c.status}
                            {c.isRetroactive && <span title="Mission accomplie d'avance !" style={{marginLeft: '4px'}}>✨</span>}
                          </span>
                        </div>
                        <div className="challenge-body">
                          <p className="challenge-action"><strong>Mission :</strong> {c.actionLabel}</p>
                          <p className="challenge-pledge"><strong>Gage :</strong> <em>{c.pledge}</em></p>
                          {c.isChallenger && c.isRetroactive && c.status === 'SUCCESS' && (
                            <p style={{color: '#10b981', fontSize: '0.85rem', marginTop: '8px'}}>
                              💡 <em>Mission déjà accomplie d'avance !</em>
                            </p>
                          )}
                          {!c.isChallenger && c.status === 'ACCEPTED' && isOwner && (
                            <button 
                              onClick={() => handleImpulseMission(c.localActionId)}
                              disabled={impulsingId === c.localActionId}
                              style={{
                                marginTop: '12px',
                                width: '100%',
                                background: 'rgba(0, 255, 204, 0.15)',
                                border: '1px solid #00ffcc',
                                color: '#00ffcc',
                                padding: '8px',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: impulsingId === c.localActionId ? 'wait' : 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {impulsingId === c.localActionId ? 'IMPULSION EN COURS...' : '⚡ IMPULSER LA MISSION'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const [era, setEra] = useState<'2026' | '2070'>('2026');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [isCodexCollapsed, setIsCodexCollapsed] = useState(false);
  const [expandedMission, setExpandedMission] = useState<any | null>(null);
  const [popoverPos, setPopoverPos] = useState(0);

  const [showBriefing, setShowBriefing] = useState<boolean>(false);

  // States pour les métriques de Sprint 2
  const [extrapolation, setExtrapolation] = useState<any>(null);
  const [dashboardStatus, setDashboardStatus] = useState<any>(null);
  const [showExtrapolation, setShowExtrapolation] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [isResettingPropulsion, setIsResettingPropulsion] = useState(false);

  // State Oracle Terrestre (message machine à écrire au clic sur la planète)
  const [earthOracleLevel, setEarthOracleLevel] = useState<number | null>(null);
  const [earthOracleText, setEarthOracleText] = useState('');
  const [earthOracleTyping, setEarthOracleTyping] = useState(false);

  // States pour les défis et l'impulsion (Sprint 3)
  const [codexTab, setCodexTab] = useState<'missions' | 'challenges'>('missions');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [loadingMissionId, setLoadingMissionId] = useState<number | null>(null);

  // States pour le modal de création de défi
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTargetTeamId, setChallengeTargetTeamId] = useState<number | ''>('');
  const [challengeLocalActionId, setChallengeLocalActionId] = useState<number | ''>('');
  const [challengePledge, setChallengePledge] = useState('');
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);

  // States pour le modal de confirmation d'annulation
  const [cancelMissionConfirm, setCancelMissionConfirm] = useState<{ actionDoneId: number; label: string } | null>(null);

  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  const [allowPortrait, setAllowPortrait] = useState<boolean>(() => {
    return localStorage.getItem('evoe_allow_portrait') === 'true';
  });

  // Verrouillage natif de l'orientation (PWA standalone / Chrome Android fullscreen)
  useEffect(() => {
    const applyLock = async () => {
      try {
        if (!allowPortrait) {
          await screen.orientation.lock('landscape');
        } else {
          screen.orientation.unlock();
        }
      } catch {
        // Non supporté hors PWA/fullscreen : on ignore
      }
    };
    applyLock();
  }, [allowPortrait]);


  const { user, childInfos, missions, logoutUser, instanceChoices, players, instanceId, refreshContext } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadChat, setUnreadChat] = useState<{
    global: number;
    team: number;
    system: number;
    unreadMps: Record<string, number>;
    unreadTeams: Record<string, number>;
    total: number;
  }>({
    global: 0,
    team: 0,
    system: 0,
    unreadMps: {},
    unreadTeams: {},
    total: 0
  });

  const [chatOpen, setChatOpen] = useState<boolean | undefined>(undefined);
  const [chatActiveTab, setChatActiveTab] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (childInfos?.id) {
      const skipped = localStorage.getItem(`evoe_skip_briefing_${childInfos.id}`) === 'true';
      setShowBriefing(!skipped);
    }
  }, [childInfos?.id]);

  const fetchEvoeData = () => {
    if (!instanceId) return;
    
    // Rafraîchir le contexte pour maintenir les avatars et leurs HP à jour en temps réel dans la scène 3D
    refreshContext();

    axios.get(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/extrapolation/metrics`)
      .then(res => setExtrapolation(res.data))
      .catch(err => console.error("Erreur extrapolation:", err));

    axios.get(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/dashboard/status/${instanceId}`)
      .then(res => setDashboardStatus(res.data))
      .catch(err => console.error("Erreur dashboard status:", err));
  };

  const fetchChallenges = async () => {
    if (!instanceId) return;
    try {
      setLoadingChallenges(true);
      const res = await axios.get(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/challenges`);
      setChallenges(res.data);
    } catch (err) {
      console.error("Erreur chargement défis:", err);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const handleImpulseMission = async (missionId: number) => {
    if (!childInfos?.id) return;
    try {
      setLoadingMissionId(missionId);
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 800);

      await axios.post(`${API_URL}/actiondone/${childInfos.id}`, { id: missionId });
      await refreshContext();
      fetchEvoeData();
    } catch (err) {
      console.error("Erreur d'impulsion de la mission:", err);
    } finally {
      setLoadingMissionId(null);
    }
  };

  const handleCancelMission = async (actionDoneId: number) => {
    if (!actionDoneId) return;
    try {
      setLoadingMissionId(actionDoneId);
      await axios.delete(`${API_URL}/actiondone/${actionDoneId}`);
      await refreshContext();
      fetchEvoeData();
    } catch (err) {
      console.error("Erreur d'annulation de la mission:", err);
    } finally {
      setLoadingMissionId(null);
    }
  };

  const handleSendChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeTargetTeamId || !challengeLocalActionId || !challengePledge.trim()) {
      setChallengeError("Veuillez remplir tous les champs.");
      return;
    }
    setIsSubmittingChallenge(true);
    setChallengeError(null);
    try {
      await axios.post(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/challenges`, {
        targetTeamId: Number(challengeTargetTeamId),
        localActionId: Number(challengeLocalActionId),
        pledge: challengePledge
      });
      setShowChallengeModal(false);
      setChallengeTargetTeamId('');
      setChallengeLocalActionId('');
      setChallengePledge('');
      fetchChallenges();
    } catch (err: any) {
      console.error("Erreur création défi:", err);
      const errMsg = err.response?.data?.message || "Erreur lors de la création du défi.";
      setChallengeError(errMsg);
    } finally {
      setIsSubmittingChallenge(false);
    }
  };

  const handleRespondChallenge = async (challengeId: number, accept: boolean) => {
    try {
      await axios.post(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/challenges/${challengeId}/respond`, {
        accept
      });
      fetchChallenges();
    } catch (err) {
      console.error("Erreur réponse défi:", err);
    }
  };

  const handleResetPropulsion = async () => {
    if (!instanceId || isResettingPropulsion) return;
    setIsResettingPropulsion(true);
    try {
      await axios.post(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/propulsion/reset/${instanceId}`);
      fetchEvoeData();
    } catch (err) {
      console.error("Erreur réinitialisation propulsion:", err);
    } finally {
      setIsResettingPropulsion(false);
    }
  };

  // L'early return doit être après tous les hooks
  const shouldRedirect = !user || instanceChoices;

  // Fermer le pop-over holographique si on clique n'importe où en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mission-popover') && !target.closest('.mission-card')) {
        setExpandedMission(null);
      }
    };
    if (expandedMission) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedMission]);

  // Récupérer les données de projection / course / défis
  useEffect(() => {
    fetchEvoeData();
    let interval: any = null;

    if (era === '2070') {
      interval = setInterval(fetchEvoeData, 10000);
    } else if (era === '2026') {
      fetchChallenges();
      interval = setInterval(() => {
        fetchEvoeData();
        fetchChallenges();
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [era, instanceId]);

  const handleSwitchEra = () => {
    setIsTransitioning(true);
    setShowExtrapolation(false);
    setShowRadar(false);
    setTimeout(() => {
      setEra(prev => prev === '2026' ? '2070' : '2026');
      setIsTransitioning(false);
    }, 1000); // 1s de transition "zoom visière"
  };

  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  // ---- Messages Oracle Terrestre ----
  const EARTH_ORACLE_MESSAGES: Record<number, string> = {
    1: "La Terre de 2070 est silencieuse... Les archives des Agents Temporels ont été retrouvées dans les ruines. Leur courage a laissé une trace. Mais le temps manque encore. Revenez à 2026 — chaque action compte.",
    2: "Les premiers signes de vie réapparaissent sur la Terre de 2070. Des forêts timides, de l’eau plus pure. La mission avance. Mais les Agents ont encore le pouvoir d’écrire la suite. Chaque geste en 2026 résonne ici.",
    3: "La Terre de 2070 reprend son souffle. Les rivières coulent à nouveau, les villes verdissent. Les Agents de 2026 ont changé le cours du temps. Continuez — le futur vous entend.",
    4: "En 2070, la Terre respire. Vos actions à 2026 ont réécrit notre avenir. Les écosystèmes se reconstituent, la biodiversité revient. Vous avez accompli ce que beaucoup croyaient impossible.",
    5: "La vie a triomphé sur la Terre de 2070. Les Archives des Agents Temporels sont gravées dans l’histoire de l’humanité. Vous avez sauvé notre futur. Le voyage se termine ici — en victoire.",
  };

  const handleEarthClick = (level: number) => {
    setEarthOracleLevel(level);
    setEarthOracleText('');
    setEarthOracleTyping(true);
    const fullText = EARTH_ORACLE_MESSAGES[level] || '';
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setEarthOracleText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setEarthOracleTyping(false);
      }
    }, 28);
  };

  // Trouver les informations de profil du Gardien connecté
  const currentPlayer = players?.find(p => p.id === childInfos?.id);
  const myTeamId = currentPlayer?.teamId;

  const activeChallengeActionIds = challenges
    .filter(c => c.status === 'ACCEPTED' && c.targetTeamId === myTeamId)
    .map(c => c.localActionId);

  // Grouper les missions par categorySF. On exclut les défis actifs car ils auront leur propre section en haut.
  const missionsByCategory = missions?.reduce((acc: Record<string, any[]>, mission: any) => {
    const isChallengeActif = activeChallengeActionIds.includes(mission.id);
    if (isChallengeActif) return acc; // Exclus des catégories classiques
    
    const cat = mission.categorySF || 'Secteur Inconnu';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mission);
    return acc;
  }, {});

  const receivedChallenges = challenges.filter(c => c.targetTeamId === myTeamId);
  const sentChallenges = challenges.filter(c => c.challengerTeamId === myTeamId);
  const otherTeams = dashboardStatus?.teams?.filter((t: any) => t.id !== myTeamId) || [];
  const availableMissionsForChallenge = missions || [];

  const getAvatarUrl = () => {
    if (currentPlayer?.avatar && currentPlayer.avatar !== 'avatars/default.png') {
      return `${EVOE_IMG_URL}${currentPlayer.avatar}`;
    }
    let hash = 0;
    const name = childInfos?.pseudo || '';
    for (let i = 0; i < name.length; i++) {
      hash += name.charCodeAt(i);
    }
    
    // Approximation de l'âge à partir de birthDate si disponible
    let age = 18;
    if (currentPlayer?.birthDate) {
      age = new Date().getFullYear() - new Date(currentPlayer.birthDate).getFullYear();
    }

    // Détermination du genre
    let genre = '';
    if (currentPlayer?.gender === 'EF') {
      genre = 'EF';
    } else if (currentPlayer?.gender === 'EH') {
      genre = 'EH';
    } else if (currentPlayer?.gender === 'E' || age < 15) {
      genre = (hash % 2 === 0) ? 'EF' : 'EH';
    } else if (currentPlayer?.gender === 'F') {
      genre = 'F';
    } else if (currentPlayer?.gender === 'M') {
      genre = 'H';
    } else {
      const genres = ['EF', 'EH', 'F', 'H'];
      genre = genres[hash % 4];
    }

    let file = '';
    if (genre === 'EF') {
      const idx = (hash % 3) + 1;
      file = `EF_avatar_0${idx}.png`;
    } else if (genre === 'EH') {
      const idx = (hash % 3) + 1;
      file = `EH_avatar_0${idx}.png`;
    } else if (genre === 'F') {
      const idx = (hash % 12) + 1;
      file = `F_avatar_${idx.toString().padStart(2, '0')}.png`;
    } else { // 'H'
      const idx = (hash % 21) + 1;
      file = `H_avatar_0${idx}.png`;
    }

    return `${EVOE_IMG_URL}avatars_3D/${file}`;
  };

  // Calcul du pourcentage de l'année pour la jauge EOD
  const getEodPercent = (dateStr: string) => {
    if (!dateStr) return 50;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const date = new Date(Date.UTC(year, month, day));
      const start = new Date(Date.UTC(year, 0, 1));
      const diff = date.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      return Math.min(100, Math.max(0, (dayOfYear / 365) * 100));
    }
    return 50;
  };

  const eodN1Percent = extrapolation ? getEodPercent(extrapolation.dateDepassementSans) : 58.6;
  const eodNPercent = extrapolation ? getEodPercent(extrapolation.dateDepassement) : 70.7;

  const handleSelectPlayer = (player: any) => {
    const isMe = player.childId === childInfos?.id || player.id === childInfos?.id || player.isCurrent;
    
    if (isMe) {
      // Priorité 1 : message d'équipe (inter-équipes ou interne)
      const unreadTeamNames = Object.keys(unreadChat.unreadTeams || {}).filter(k => (unreadChat.unreadTeams?.[k] || 0) > 0);
      if (unreadChat.team > 0 || unreadTeamNames.length > 0) {
        setChatActiveTab(unreadTeamNames.length > 0 ? `team:${unreadTeamNames[0]}` : 'team');
        setChatOpen(true);
        return;
      }
      
      // Priorité 2 : message privé (le premier trouvé dans les MP)
      const unreadMpUsers = Object.keys(unreadChat.unreadMps || {}).filter(k => (unreadChat.unreadMps?.[k] || 0) > 0);
      if (unreadMpUsers.length > 0) {
        setChatActiveTab(`mp:${unreadMpUsers[0]}`);
        setChatOpen(true);
        return;
      }
      
      // Priorité 3 : message global
      if (unreadChat.global > 0) {
        setChatActiveTab('global');
        setChatOpen(true);
        return;
      }
    } else {
      // Si on clique sur un autre joueur
      const pseudo = player.pseudo.toLowerCase();
      // S'il a envoyé un message non lu, on ouvre directement son salon de chat
      if ((unreadChat.unreadMps?.[pseudo] || 0) > 0) {
        setChatActiveTab(`mp:${pseudo}`);
        setChatOpen(true);
        return;
      }
    }
    
    // Comportement par défaut si pas de message : ouvrir la fiche profil
    setSelectedProfileId(player.childId || player.id);
  };

  return (
    <div className="app-container">
      {/* Briefing Temporel (Onboarding Vidéo) */}
      {showBriefing && childInfos?.youtubeBriefingUrl && (
        <TemporalBriefing 
          onComplete={() => setShowBriefing(false)} 
          youtubeUrl={childInfos.youtubeBriefingUrl} 
          childId={childInfos.id}
        />
      )}

      {/* Glitch Écran Temporel */}
      {isGlitching && <div className="screen-glitch" />}

      {/* Three.js Canvas Container */}
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 5, 10], fov: 60 }} dpr={[1, 2]}>
          {era === '2026' ? (
            <Portal2026 
              categories={missionsByCategory ? Object.keys(missionsByCategory) : []} 
              onSelectSector={setSelectedSector} 
              onSelectPlayer={handleSelectPlayer}
              onlineUsers={onlineUsers}
              unreadTeam={unreadChat.team}
              unreadMps={unreadChat.unreadMps}
            />
          ) : (
            <Portal2070 dashboardStatus={dashboardStatus} onEarthClick={handleEarthClick} />
          )}
        </Canvas>
      </div>

      {/* Oracle Terrestre — Overlay machine à écrire au clic sur la Terre */}
      {era === '2070' && earthOracleLevel !== null && (
        <div
          onClick={() => setEarthOracleLevel(null)}
          style={{
            position: 'fixed',
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            maxWidth: '560px',
            width: '90vw',
            background: 'rgba(5, 10, 22, 0.88)',
            border: '1px solid rgba(0, 255, 204, 0.4)',
            borderRadius: '16px',
            padding: '20px 24px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(0, 255, 204, 0.12), 0 20px 50px rgba(0,0,0,0.7)',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.18em', color: '#00ffcc', textTransform: 'uppercase', textShadow: '0 0 8px rgba(0,255,204,0.5)' }}>
              🌍 Oracle Terrestre — 2070
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(160,174,192,0.6)', fontStyle: 'italic' }}>Cliquer pour fermer</span>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            lineHeight: '1.7',
            color: '#e2e8f0',
            fontFamily: '"Courier New", Courier, monospace',
            minHeight: '60px',
          }}>
            {earthOracleText}
            {earthOracleTyping && <span style={{ display: 'inline-block', width: '2px', height: '1em', background: '#00ffcc', marginLeft: '2px', animation: 'blink 0.7s step-end infinite', verticalAlign: 'text-bottom' }} />}
          </p>
        </div>
      )}

      {/* Transition Effect (Zoom Visière) */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="transition-overlay"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 50, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* UI Overlay HTML */}
      <div className="ui-overlay">
        <header className="header">
          <div className="logo">
            <Hexagon className="icon" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h1>EVOE {era}</h1>
              {childInfos && (
                <div 
                  onClick={() => setSelectedProfileId(childInfos.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#00ffcc', fontWeight: 'bold', textShadow: '0 0 5px rgba(0,255,204,0.3)', pointerEvents: 'auto', cursor: 'pointer', position: 'relative' }}
                >
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={getAvatarUrl()} 
                      alt="" 
                      className="avatar-pulse-ring"
                      style={{ width: '24px', height: '24px', borderRadius: '50%', border: `1.5px solid ${currentPlayer?.color || '#00ffcc'}`, objectFit: 'cover' }} 
                    />
                    {unreadChat.total > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#ff3b3b',
                        borderRadius: '50%',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid rgba(5, 8, 16, 0.94)',
                        boxShadow: '0 0 6px #ff3b3b',
                        zIndex: 10
                      }}>
                        <Mail size={8} color="#fff" />
                      </div>
                    )}
                  </div>
                  <span>Agent Temporel {childInfos.pseudo}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>

            <button 
              className="switch-btn" 
              onClick={() => {
                const newVal = !allowPortrait;
                setAllowPortrait(newVal);
                localStorage.setItem('evoe_allow_portrait', String(newVal));
              }}
              title={allowPortrait ? "Mode : Portrait Autorisé (Bloquer le mode Paysage / Activer l'alerte)" : "Mode : Paysage Requis (Autoriser le mode Portrait / Désactiver l'alerte)"}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: allowPortrait ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 255, 204, 0.15)',
                border: allowPortrait ? '1.5px solid rgba(255, 255, 255, 0.2)' : '1.5px solid #00ffcc',
                color: allowPortrait ? '#a0aec0' : '#00ffcc',
                boxShadow: allowPortrait ? 'none' : '0 0 10px rgba(0, 255, 204, 0.2)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              {allowPortrait ? <Smartphone size={18} /> : <Monitor size={18} />}
            </button>
            <button 
              className="switch-btn" 
              onClick={handleSwitchEra} 
              disabled={isTransitioning}
              title={era === '2026' ? 'Ouvrir le Radar 2070' : 'Retour au QG 2026'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 179, 255, 0.15)',
                border: '1.5px solid #00b3ff',
                color: '#00b3ff',
                boxShadow: '0 0 10px rgba(0, 179, 255, 0.2)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              {era === '2026' ? <Scan size={18} /> : <Radio size={18} />}
            </button>
            <button 
              className="switch-btn" 
              onClick={() => setShowLeaderboardModal(true)}
              title="Classement - Top 10"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 215, 0, 0.15)',
                border: '1.5px solid #ffd700',
                color: '#ffd700',
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <Trophy size={18} />
            </button>
            <button 
              className="switch-btn" 
              onClick={logoutUser} 
              title="Quitter la simulation"
              style={{ 
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 59, 59, 0.15)',
                border: '1.5px solid #ff3b3b',
                color: '#ff3b3b',
                boxShadow: '0 0 10px rgba(255, 59, 59, 0.2)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* CONTENU 2026 : Le Codex Temporel (Panel UI) */}
        {era === '2026' && selectedSector && (
          <aside 
            className={`codex-panel ${isCodexCollapsed ? 'collapsed' : ''}`}
            onScroll={() => setExpandedMission(null)} // Ferme le pop-over au scroll
          >
            <div className="codex-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isCodexCollapsed ? 'column' : 'row', gap: '8px', padding: '10px 15px' }}>
              {!isCodexCollapsed && <h2 style={{ margin: 0 }}>Codex Temporel {childInfos?.pseudo ? `- ${childInfos.pseudo}` : ''}</h2>}
              <div style={{ display: 'flex', flexDirection: isCodexCollapsed ? 'column' : 'row', alignItems: 'center', gap: '8px', marginLeft: isCodexCollapsed ? 'auto' : '0', marginRight: isCodexCollapsed ? 'auto' : '0' }}>
                <button 
                  className="collapse-btn" 
                  onClick={() => {
                    setIsCodexCollapsed(!isCodexCollapsed);
                    setExpandedMission(null);
                  }}
                  title={isCodexCollapsed ? "Agrandir le Codex" : "Réduire le Codex"}
                  style={{ background: 'transparent', border: 'none', color: '#00ffcc', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isCodexCollapsed ? <ChevronRight /> : <ChevronLeft />}
                </button>
                <button 
                  className="collapse-btn" 
                  onClick={() => setSelectedSector(null)}
                  title="Fermer le Codex"
                  style={{ background: 'transparent', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Sélecteur d'Onglets */}
            {!isCodexCollapsed && (
              <div className="codex-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid rgba(0, 255, 204, 0.15)', paddingBottom: '10px' }}>
                <button 
                  onClick={() => setCodexTab('missions')} 
                  style={{
                    flex: 1,
                    background: codexTab === 'missions' ? 'rgba(0, 255, 204, 0.15)' : 'transparent',
                    border: '1px solid rgba(0, 255, 204, 0.3)',
                    borderRadius: '6px',
                    color: '#00ffcc',
                    padding: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}
                >
                  Missions
                </button>
                <button 
                  onClick={() => setCodexTab('challenges')} 
                  style={{
                    flex: 1,
                    background: codexTab === 'challenges' ? 'rgba(0, 255, 204, 0.15)' : 'transparent',
                    border: '1px solid rgba(0, 255, 204, 0.3)',
                    borderRadius: '6px',
                    color: '#00ffcc',
                    padding: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}
                >
                  Défis ({challenges.length})
                </button>
              </div>
            )}
            
            <div className="mission-list">
              {isCodexCollapsed || codexTab === 'missions' ? (
                <>
                  {activeChallengeActionIds.length > 0 && (
                    <div className="category-section" style={{ marginBottom: '20px' }}>
                      {!isCodexCollapsed && <div className="category-title" style={{ color: '#ff3b3b', borderColor: '#ff3b3b', textShadow: '0 0 10px rgba(255,59,59,0.3)' }}>⚔️ DÉFIS PRIORITAIRES</div>}
                      {missions?.filter((m: any) => activeChallengeActionIds.includes(m.id)).map((missionWithChallenge: any) => (
                        <div 
                          key={`challenge-${missionWithChallenge.id}`} 
                          className="mission-card"
                          onClick={(e) => {
                            if (isCodexCollapsed) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPopoverPos(rect.top + rect.height / 2);
                              setExpandedMission(missionWithChallenge);
                            }
                          }}
                          style={{ cursor: isCodexCollapsed ? 'pointer' : 'default', border: '1px solid #ff3b3b', background: 'rgba(255, 59, 59, 0.05)' }}
                        >
                          <div className="mission-header" title={isCodexCollapsed ? '' : (missionWithChallenge.evoeMission?.titreSF || missionWithChallenge.label)}>
                            {missionWithChallenge.icon && (
                              <img src={`${EVOE_IMG_URL}${missionWithChallenge.icon}`} alt="" className="mission-icon" />
                            )}
                            {!isCodexCollapsed && <h3>{missionWithChallenge.evoeMission?.titreSF || missionWithChallenge.label}</h3>}
                          </div>
                          {!isCodexCollapsed && (
                            <>
                              <p>{parseBold(missionWithChallenge.evoeMission?.descriptionSF || missionWithChallenge.description || "Mission secrète en attente de déchiffrage.")}</p>
                              <button 
                                className={`hack-btn ${missionWithChallenge.evoeMission?.isImpulsed ? 'impulsed-btn' : ''}`}
                                disabled={loadingMissionId === missionWithChallenge.id}
                                onClick={() => {
                                  if (missionWithChallenge.evoeMission?.isImpulsed) {
                                    setCancelMissionConfirm({
                                      actionDoneId: missionWithChallenge.evoeMission.actionDoneId,
                                      label: missionWithChallenge.evoeMission?.titreSF || missionWithChallenge.label
                                    });
                                  } else {
                                    handleImpulseMission(missionWithChallenge.id);
                                  }
                                }}
                                style={missionWithChallenge.evoeMission?.isImpulsed ? {
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  borderColor: '#10b981',
                                  color: '#10b981'
                                } : {}}
                              >
                                {loadingMissionId === missionWithChallenge.id ? (
                                  <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
                                ) : missionWithChallenge.evoeMission?.isImpulsed ? (
                                  "Déjà Impulsé"
                                ) : (
                                  `Impulser (+${missionWithChallenge.evoeMission?.amplitude || 10} AT)`
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {missionsByCategory && missionsByCategory[selectedSector] ? (
                    <div key={selectedSector} className="category-section">
                      <div className="category-title">{selectedSector}</div>
                    
                    {missionsByCategory[selectedSector].map((mission: any) => (
                      <div 
                        key={mission.id} 
                        className="mission-card"
                        onClick={(e) => {
                          if (isCodexCollapsed) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopoverPos(rect.top + rect.height / 2);
                            setExpandedMission(mission);
                          }
                        }}
                        style={{ cursor: isCodexCollapsed ? 'pointer' : 'default' }}
                      >
                        <div className="mission-header" title={isCodexCollapsed ? '' : (mission.evoeMission?.titreSF || mission.label)}>
                          {mission.icon && (
                            <img src={`${EVOE_IMG_URL}${mission.icon}`} alt="" className="mission-icon" />
                          )}
                          {!isCodexCollapsed && <h3>{mission.evoeMission?.titreSF || mission.label}</h3>}
                          {mission.isChallengeActif && !isCodexCollapsed && (
                            <span style={{
                              marginLeft: 'auto',
                              background: '#ff3b3b',
                              color: '#fff',
                              fontSize: '0.65rem',
                              padding: '3px 6px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap'
                            }}>⚔️ DÉFI EN COURS</span>
                          )}
                        </div>
                        {!isCodexCollapsed && (
                          <>
                            <p>{parseBold(mission.evoeMission?.descriptionSF || mission.description || "Mission secrète en attente de déchiffrage.")}</p>
                            <button 
                              className={`hack-btn ${mission.evoeMission?.isImpulsed ? 'impulsed-btn' : ''}`}
                              disabled={loadingMissionId === mission.id}
                              onClick={() => {
                                if (mission.evoeMission?.isImpulsed) {
                                  setCancelMissionConfirm({
                                    actionDoneId: mission.evoeMission.actionDoneId,
                                    label: mission.evoeMission?.titreSF || mission.label
                                  });
                                } else {
                                  handleImpulseMission(mission.id);
                                }
                              }}
                              style={mission.evoeMission?.isImpulsed ? {
                                background: 'rgba(16, 185, 129, 0.15)',
                                borderColor: '#10b981',
                                color: '#10b981'
                              } : {}}
                            >
                              {loadingMissionId === mission.id ? (
                                <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
                              ) : mission.evoeMission?.isImpulsed ? (
                                "Déjà Impulsé"
                              ) : (
                                `Impulser (+${mission.evoeMission?.amplitude || 10} AT)`
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{color: '#a0aec0', fontStyle: 'italic', padding: '10px', textAlign: 'center'}}>
                    Aucune mission détectée dans ce secteur.
                  </p>
                )}
                </>
              ) : (
                /* Contenu de l'onglet Défis */
                <div className="challenges-section" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {loadingChallenges && challenges.length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>Mise à jour des défis...</p>
                  )}
                  {/* Section Défis Reçus */}
                  <div>
                    <h3 style={{ fontSize: '0.85rem', color: '#00ffcc', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid rgba(0,255,204,0.1)', paddingBottom: '4px' }}>
                      📥 Reçus
                    </h3>
                    {receivedChallenges.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>Aucun défi reçu.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {receivedChallenges.map((ch) => (
                          <div key={ch.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `3px solid ${ch.challengerTeamColor || '#fff'}`, borderRadius: '8px', padding: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0aec0', marginBottom: '4px' }}>
                              <span>De : <strong style={{ color: ch.challengerTeamColor }}>{ch.challengerTeamName}</strong></span>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: ch.status === 'PENDING' ? '#ffd700' : ch.status === 'ACCEPTED' ? '#00b3ff' : ch.status === 'SUCCESS' ? '#10b981' : '#ff3b3b' }}>
                                {ch.status}
                                {ch.isRetroactive && <span title="Mission accomplie d'avance !" style={{marginLeft: '4px'}}>✨</span>}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#fff', margin: '4px 0', fontWeight: 'bold' }}>
                              Mission : {ch.actionLabel}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#ff9f43', margin: '4px 0', fontStyle: 'italic' }}>
                              Gage : {ch.pledge}
                            </p>
                            {ch.status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button 
                                  onClick={() => handleRespondChallenge(ch.id, true)} 
                                  style={{ flex: 1, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Accepter
                                </button>
                                <button 
                                  onClick={() => handleRespondChallenge(ch.id, false)} 
                                  style={{ flex: 1, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Décliner
                                </button>
                              </div>
                            )}
                            {ch.status === 'ACCEPTED' && (
                              <button 
                                onClick={() => handleImpulseMission(ch.localActionId)}
                                disabled={loadingMissionId === ch.localActionId}
                                style={{
                                  marginTop: '10px',
                                  width: '100%',
                                  background: 'rgba(0, 255, 204, 0.15)',
                                  border: '1px solid #00ffcc',
                                  color: '#00ffcc',
                                  padding: '6px',
                                  borderRadius: '6px',
                                  fontWeight: 'bold',
                                  cursor: loadingMissionId === ch.localActionId ? 'wait' : 'pointer',
                                  transition: 'all 0.2s',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {loadingMissionId === ch.localActionId ? 'IMPULSION EN COURS...' : '⚡ IMPULSER LA MISSION'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section Défis Envoyés */}
                  <div>
                    <h3 style={{ fontSize: '0.85rem', color: '#00ffcc', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid rgba(0,255,204,0.1)', paddingBottom: '4px' }}>
                      📤 Envoyés
                    </h3>
                    {sentChallenges.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>Aucun défi envoyé.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {sentChallenges.map((ch) => (
                          <div key={ch.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `3px solid ${ch.targetTeamColor || '#fff'}`, borderRadius: '8px', padding: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0aec0', marginBottom: '4px' }}>
                              <span>Cible : <strong style={{ color: ch.targetTeamColor }}>{ch.targetTeamName}</strong></span>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: ch.status === 'PENDING' ? '#ffd700' : ch.status === 'ACCEPTED' ? '#00b3ff' : ch.status === 'SUCCESS' ? '#10b981' : '#ff3b3b' }}>
                                {ch.status}
                                {ch.isRetroactive && <span title="Mission accomplie d'avance !" style={{marginLeft: '4px'}}>✨</span>}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#fff', margin: '4px 0', fontWeight: 'bold' }}>
                              Mission : {ch.actionLabel}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#ff9f43', margin: '4px 0', fontStyle: 'italic' }}>
                              Gage : {ch.pledge}
                            </p>
                            {ch.isRetroactive && ch.status === 'SUCCESS' && (
                              <p style={{color: '#10b981', fontSize: '0.75rem', marginTop: '8px', marginBottom: 0}}>
                                💡 <em>Mission déjà accomplie d'avance !</em>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bouton de création */}
                  {(() => {
                    const myTeamStability = dashboardStatus?.teams?.find((t: any) => t.id === myTeamId)?.crewBioStability ?? 100;
                    const isLocked = myTeamStability < 10;
                    return (
                      <div style={{ marginTop: '10px' }}>
                        <button 
                          onClick={() => {
                            if (!isLocked) {
                              setShowChallengeModal(true);
                              setChallengeError(null);
                            }
                          }} 
                          disabled={isLocked}
                          style={{ 
                            width: '100%', 
                            background: isLocked ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #00ffcc, #00b3ff)', 
                            border: 'none', 
                            borderRadius: '6px', 
                            color: isLocked ? 'rgba(255,255,255,0.3)' : '#000', 
                            padding: '10px', 
                            fontSize: '0.85rem', 
                            fontWeight: 'bold', 
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            textTransform: 'uppercase',
                            boxShadow: isLocked ? 'none' : '0 0 10px rgba(0,255,204,0.3)'
                          }}
                        >
                          {isLocked ? "🔒 Stabilité trop basse (<10%)" : "+ Lancer un défi"}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* CONTENU 2070 : Double Tableau de Bord Flottant (Extrapolation & Course) */}
        {era === '2070' && (
          <>
            <div className="evoe-dashboards-container">
              {/* Panel de Gauche : Extrapolation Temporelle */}
              <aside className={`evoe-glass-panel panel-left ${showExtrapolation ? 'mobile-active' : ''}`}>
                <div className="evoe-panel-title-row">
                  <h2>Extrapolation 2070</h2>
                  <button className="panel-close-btn" onClick={() => setShowExtrapolation(false)}>×</button>
                </div>
                {extrapolation ? (
                  <>
                    {/* Jauge EOD N-1 vs N */}
                    <div className="jauge-eod-container">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <h3>Jour de Dépassement Mondial</h3>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          <span style={{ color: '#ef4444' }}>{extrapolation.dateDepassementSans?.slice(0,5)}</span>
                          <span style={{ color: '#a0aec0' }}>➔</span>
                          <span style={{ color: '#00ffcc', textShadow: '0 0 5px rgba(0,255,204,0.4)' }}>{extrapolation.dateDepassement?.slice(0,5)}</span>
                        </div>
                      </div>
                      <div className="jauge-eod-track">
                        {/* Zone de gain écologique */}
                        <div 
                          className="jauge-eod-gain" 
                          style={{ 
                            left: `${eodN1Percent}%`, 
                            width: `${Math.max(2, eodNPercent - eodN1Percent)}%` 
                          }}
                        />
                        {/* Marqueur EOD N-1 */}
                        <div 
                          className="jauge-eod-marker n1" 
                          style={{ left: `${eodN1Percent}%` }}
                          title={`Précédent : ${extrapolation.dateDepassementSans}`}
                        />
                        {/* Marqueur EOD N */}
                        <div 
                          className="jauge-eod-marker n" 
                          style={{ left: `${eodNPercent}%` }}
                          title={`Actuel : ${extrapolation.dateDepassement}`}
                        />
                      </div>
                      <div className="jauge-eod-labels">
                        <span>1er Janvier</span>
                        <span style={{ color: '#00ffcc', fontWeight: 'bold', textShadow: '0 0 5px rgba(0,255,204,0.2)' }}>Timeline Reculée !</span>
                        <span>31 Décembre</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,255,204,0.1)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#a0aec0', textTransform: 'uppercase' }}>Terres Nécessaires</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#00ffcc' }}>{extrapolation.nbPlanetes} 🌍</div>
                    </div>

                    {/* Grille d'impacts avec équivalences */}
                    <div className="metric-grid">
                      <div className="metric-card">
                        <div className="metric-icon-wrapper"><Shield size={18} /></div>
                        <div className="metric-info">
                          <span className="metric-label">Bouclier Cryo-Arctique</span>
                          <span className="metric-value">{fmtMass(extrapolation.iceSavedKg || 0)} ❄️</span>
                          <span className="metric-sub" style={{ color: '#10b981' }}>({fmtMass((extrapolation.co2RealTonnes || 0) * 1000)} de CO₂ évités en 2026)</span>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon-wrapper"><Zap size={18} /></div>
                        <div className="metric-info">
                          <span className="metric-label">Biomasse Génétique</span>
                          {(extrapolation.forestFootballFields || 0) >= 1 ? (
                            <>
                              <span className="metric-value">{(extrapolation.forestFootballFields || 0).toFixed(1)} zones 🍀</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(soit {(extrapolation.forestFootballFields || 0).toFixed(1)} terrains de foot préservés en 2026)</span>
                            </>
                          ) : (
                            <>
                              <span className="metric-value">{fmtMass((extrapolation.co2RealTonnes || 0) * 1000)} CO₂</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(absorbés par la biomasse végétale en 2026)</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon-wrapper"><Droplet size={18} /></div>
                        <div className="metric-info">
                          <span className="metric-label">Réserves Hydriques</span>
                          {(extrapolation.waterOlympicPools || 0) >= 1 ? (
                            <>
                              <span className="metric-value">{(extrapolation.waterOlympicPools || 0).toFixed(1)} cuves 🧪</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(soit {(extrapolation.waterOlympicPools || 0).toFixed(1)} piscines olympiques préservées en 2026)</span>
                            </>
                          ) : (
                            <>
                              <span className="metric-value">{fmtVolume(extrapolation.waterRealLitres || 0)}</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(d'eau potable épargnée en 2026)</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon-wrapper"><Trash2 size={18} /></div>
                        <div className="metric-info">
                          <span className="metric-label">Déchets Moléculaires</span>
                          {(extrapolation.wasteGarbageTrucks || 0) >= 1 ? (
                            <>
                              <span className="metric-value">{(extrapolation.wasteGarbageTrucks || 0).toFixed(1)} conteneurs 🔋</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(soit {(extrapolation.wasteGarbageTrucks || 0).toFixed(1)} camions-poubelles évités en 2026)</span>
                            </>
                          ) : (
                            <>
                              <span className="metric-value">{fmtMass(extrapolation.wasteRealKg || 0)}</span>
                              <span className="metric-sub" style={{ color: '#10b981' }}>(de résidus non produits en 2026)</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#a0aec0', fontStyle: 'italic', fontSize: '0.85rem' }}>Calcul de la projection temporelle...</p>
                )}
              </aside>

              {/* Panel de Droite : Course des Vaisseaux & Stase */}
              <aside className={`evoe-glass-panel panel-right ${showRadar ? 'mobile-active' : ''}`}>
                <div className="evoe-panel-title-row">
                  <h2>Radar Temporel</h2>
                  <button 
                    className="evoe-reset-btn" 
                    onClick={handleResetPropulsion} 
                    disabled={isResettingPropulsion}
                    title="Recalculer les niveaux technologiques"
                  >
                    <RefreshCw className={`icon-sm ${isResettingPropulsion ? 'spin-loading' : ''}`} />
                  </button>
                  <button className="panel-close-btn" onClick={() => setShowRadar(false)}>×</button>
                </div>
                {dashboardStatus ? (
                  <div className="vessels-list">
                    {[...dashboardStatus.teams].sort((a, b) => b.position - a.position).map((t: any) => (
                      <div key={t.id} className="vessel-row" style={{ borderLeftColor: t.color || '#00ffcc' }}>
                        <div className="vessel-row-header">
                          <span className="vessel-team-name" style={{ color: t.color || '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {t.icon ? (
                              <img 
                                src={`${EVOE_IMG_URL}teams/${t.icon.split('/').pop()}`} 
                                alt="" 
                                style={{ width: '24px', height: '24px', objectFit: 'contain', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', padding: '2px' }} 
                              />
                            ) : (
                              <span style={{ fontSize: '1.2rem', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🛸</span>
                            )}
                            {t.name}
                          </span>
                          <span className="vessel-tech" title={t.propulsionDesc}>
                            {t.propulsionType}
                          </span>
                        </div>
                        
                        <div className="vessel-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#a0aec0' }} title="CO₂ évité (kg/semaine)">
                            <Shield size={14} style={{ color: '#00ffcc' }} />
                            <strong style={{ color: '#fff' }}>{fmtMass(t.co2 || 0)}</strong>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#a0aec0' }} title="Eau épargnée (L)">
                            <Droplet size={14} style={{ color: '#00b3ff' }} />
                            <strong style={{ color: '#fff' }}>{fmtVolume(t.water || 0)}</strong>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#a0aec0' }} title="Déchets évités (kg)">
                            <Trash2 size={14} style={{ color: '#ff9f43' }} />
                            <strong style={{ color: '#fff' }}>{fmtMass(t.waste || 0)}</strong>
                          </span>
                        </div>

                        {/* Deux mini-compteurs circulaires de contrôle (Timeline & Stase) */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 20px', marginTop: '0px', marginBottom: '0px' }}>
                          {(() => {
                            const startYearMatch = dashboardStatus?.schoolYear?.match(/^(\d{4})-\d{4}$/);
                            const startYear = startYearMatch ? parseInt(startYearMatch[1], 10) : 2026;
                            const calculatedYear = Math.min(startYear + 44, startYear + Math.round(((t.position || 0) * 44) / 100 / 5) * 5);
                            return (
                              <EvoeRadarMeter 
                                value={t.position} 
                                label="TIMELINE" 
                                color="#ffd700" 
                                id={`timeline-${t.id}`} 
                                displayValue={String(calculatedYear)}
                                tooltip="État de la Terre et progression de la ligne temporelle vers 2070. Les défis et missions réussis permettent de stabiliser le futur et de repousser la dystopie."
                              />
                            );
                          })()}
                          <EvoeRadarMeter 
                            value={t.crewBioStability} 
                            label="STABILITÉ" 
                            color={t.crewBioStability < 40 ? '#ff3b3b' : (t.crewBioStability < 80 ? '#ff9f43' : '#10b981')} 
                            id={`stability-${t.id}`} 
                            tooltip="Score de santé de l'équipage. S'il est trop bas, la stase se fige et vous ne pouvez plus modifier la dystopie future (seuil minimal d'action : 10%)."
                          />
                        </div>

                        {/* Alerte Paradoxe Temporel graduée */}
                        {(() => {
                          const stability = t.crewBioStability;
                          if (stability === 100) {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#10b981', animation: 'none', opacity: 0.85, marginTop: '2px' }}>
                                <CheckCircle2 size={13} style={{ filter: 'drop-shadow(0 0 2px rgba(16,185,129,0.4))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Ligne temporelle stable et entièrement synchronisée.</span>
                              </div>
                            );
                          } else if (stability >= 80) {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#ffd700', animation: 'none', marginTop: '2px' }}>
                                <AlertTriangle size={13} style={{ filter: 'drop-shadow(0 0 2px rgba(255,215,0,0.4))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Légère désynchronisation temporelle détectée.</span>
                              </div>
                            );
                          } else if (stability >= 40) {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#ff9f43', marginTop: '2px' }}>
                                <AlertTriangle size={13} style={{ filter: 'drop-shadow(0 0 2px rgba(255,159,67,0.4))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Instabilité de la stase. Impulsions de missions requises !</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="vessel-paradox-warning" style={{ color: '#ff3b3b', marginTop: '2px' }}>
                                <AlertOctagon size={13} style={{ filter: 'drop-shadow(0 0 3px rgba(255,59,59,0.5))' }} />
                                <span style={{ letterSpacing: '-0.1px' }}>Paradoxe temporel imminent ! Agents en stase prolongée.</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#a0aec0', fontStyle: 'italic', fontSize: '0.85rem' }}>Verrouillage des signatures thermiques des vaisseaux...</p>
                )}
              </aside>
            </div>

            {/* Dock de contrôle mobile au bas de l'écran */}
            <div className="evoe-mobile-dock">
              <button 
                className={`dock-btn ${showExtrapolation ? 'active' : ''}`}
                onClick={() => setShowExtrapolation(v => !v)}
              >
                📊 Extrapolation 2070
              </button>
              <button 
                className={`dock-btn ${showRadar ? 'active' : ''}`}
                onClick={() => setShowRadar(v => !v)}
              >
                📡 Radar Temporel
              </button>
            </div>

            {/* Overlay d'arrière-plan pour fermer au clic en dehors */}
            {(showExtrapolation || showRadar) && (
              <div className="evoe-mobile-overlay" onClick={() => { setShowExtrapolation(false); setShowRadar(false); }} />
            )}
          </>
        )}

        {/* Pop-over Holographique pour le mode Collapsed */}
        <AnimatePresence>
          {isCodexCollapsed && expandedMission && (
            <motion.div
              className="mission-popover"
              initial={{ opacity: 0, x: -20, y: "-50%", scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: "-50%", scale: 1 }}
              exit={{ opacity: 0, x: -10, y: "-50%", scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ top: popoverPos }}
            >
              <div className="mission-header">
                {expandedMission.icon && (
                  <img src={`${EVOE_IMG_URL}${expandedMission.icon}`} alt="" className="mission-icon" />
                )}
                <h3>{expandedMission.evoeMission?.titreSF || expandedMission.label}</h3>
              </div>
              <p>{parseBold(expandedMission.evoeMission?.descriptionSF || expandedMission.description || "Mission secrète en attente de déchiffrage.")}</p>
              <button 
                className={`hack-btn ${expandedMission.evoeMission?.isImpulsed ? 'impulsed-btn' : ''}`}
                disabled={loadingMissionId === expandedMission.id}
                onClick={() => {
                  if (expandedMission.evoeMission?.isImpulsed) {
                    setCancelMissionConfirm({
                      actionDoneId: expandedMission.evoeMission.actionDoneId,
                      label: expandedMission.evoeMission?.titreSF || expandedMission.label
                    });
                  } else {
                    handleImpulseMission(expandedMission.id);
                  }
                }}
                style={expandedMission.evoeMission?.isImpulsed ? {
                  background: 'rgba(16, 185, 129, 0.15)',
                  borderColor: '#10b981',
                  color: '#10b981'
                } : {}}
              >
                {loadingMissionId === expandedMission.id ? (
                  <RefreshCw className="icon-sm spin-loading" style={{ margin: '0 auto' }} />
                ) : expandedMission.evoeMission?.isImpulsed ? (
                  "Déjà Impulsé"
                ) : (
                  `Impulser (+${expandedMission.evoeMission?.amplitude || 10} AT)`
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Création de Défi */}
      <AnimatePresence>
        {showChallengeModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              pointerEvents: 'auto'
            }}
            onClick={() => setShowChallengeModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'rgba(10, 15, 30, 0.9)',
                border: '1px solid rgba(0, 255, 204, 0.4)',
                borderRadius: '16px',
                padding: '25px',
                width: '450px',
                maxWidth: '90vw',
                backdropFilter: 'blur(25px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0,255,204,0.1)',
                color: '#fff',
                pointerEvents: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0,255,204,0.2)', paddingBottom: '10px' }}>
                <h2 style={{ fontSize: '1.2rem', color: '#00ffcc', textTransform: 'uppercase', margin: 0, textShadow: '0 0 10px rgba(0, 255, 204, 0.3)' }}>
                  🚀 Lancer un Défi Temporel
                </h2>
                <button 
                  onClick={() => setShowChallengeModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#00ffcc', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSendChallenge} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* Choix de l'équipe cible */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Équipe Cible
                  </label>
                  <select 
                    value={challengeTargetTeamId} 
                    onChange={(e) => setChallengeTargetTeamId(Number(e.target.value))}
                    required
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(0,255,204,0.3)',
                      borderRadius: '8px',
                      padding: '10px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="">-- Sélectionner une équipe --</option>
                    {otherTeams.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Choix de l'éco-mission */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Éco-Mission Imposée
                  </label>
                  <select 
                    value={challengeLocalActionId} 
                    onChange={(e) => setChallengeLocalActionId(Number(e.target.value))}
                    required
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(0,255,204,0.3)',
                      borderRadius: '8px',
                      padding: '10px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="">-- Sélectionner une mission --</option>
                    {availableMissionsForChallenge.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.evoeMission?.titreSF || m.label} (+{m.evoeMission?.amplitude || 10} AT)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Saisie libre du gage */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#00b3ff', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Le Gage (Pledge)
                  </label>
                  <input 
                    type="text" 
                    value={challengePledge}
                    onChange={(e) => setChallengePledge(e.target.value)}
                    placeholder="Saisissez un gage ou choisissez ci-dessous..."
                    required
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(0,255,204,0.3)',
                      borderRadius: '8px',
                      padding: '10px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                  
                  {/* Suggestions de gages */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {[
                      "Payer les croissants 🥐",
                      "Faire 10 pompes 💪",
                      "Chanter le refrain d'une chanson SF 🎤",
                      "Faire le café pour toute l'équipe ☕",
                      "Raconter une blague spatiale 🌌"
                    ].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setChallengePledge(sug)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '15px',
                          padding: '4px 10px',
                          color: '#a0aec0',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0,255,204,0.4)';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.color = '#a0aec0';
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {challengeError && (
                  <div style={{ color: '#ff3b3b', fontSize: '0.8rem', marginTop: '5px', padding: '8px', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)', borderRadius: '6px' }}>
                    ⚠️ {challengeError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmittingChallenge}
                  style={{
                    marginTop: '10px',
                    background: isSubmittingChallenge ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #00ffcc, #00b3ff)',
                    border: 'none',
                    borderRadius: '8px',
                    color: isSubmittingChallenge ? 'rgba(255,255,255,0.3)' : '#000',
                    padding: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: isSubmittingChallenge ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase',
                    boxShadow: isSubmittingChallenge ? 'none' : '0 0 15px rgba(0,255,204,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isSubmittingChallenge ? (
                    <RefreshCw className="icon-sm spin-loading" />
                  ) : "Envoyer le défi"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmation d'Annulation de Mission */}
      <AnimatePresence>
        {cancelMissionConfirm && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              pointerEvents: 'auto'
            }}
            onClick={() => setCancelMissionConfirm(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'rgba(15, 10, 20, 0.95)',
                border: '1px solid rgba(255, 59, 59, 0.4)',
                borderRadius: '16px',
                padding: '25px',
                width: '400px',
                maxWidth: '90vw',
                backdropFilter: 'blur(25px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,59,59,0.1)',
                color: '#fff',
                pointerEvents: 'auto',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ color: '#ff3b3b', fontSize: '2.5rem', marginBottom: '15px' }}>
                ⚠️
              </div>
              <h2 style={{ fontSize: '1.2rem', color: '#ff3b3b', textTransform: 'uppercase', margin: '0 0 10px 0', textShadow: '0 0 10px rgba(255, 59, 59, 0.3)' }}>
                Annuler l'Impulsion ?
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#a0aec0', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                Voulez-vous vraiment annuler l'impulsion de la mission <strong style={{ color: '#fff' }}>"{cancelMissionConfirm.label}"</strong> ?
                Cela réduira les gains écologiques accumulés de l'Arche EVOE.
              </p>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  onClick={() => {
                    handleCancelMission(cancelMissionConfirm.actionDoneId);
                    setCancelMissionConfirm(null);
                  }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #ff3b3b, #ff7675)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    boxShadow: '0 0 15px rgba(255,59,59,0.4)'
                  }}
                >
                  Confirmer
                </button>
                <button 
                  onClick={() => setCancelMissionConfirm(null)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal du Top 10 (Classement) */}
      <AnimatePresence>
        {showLeaderboardModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              pointerEvents: 'auto'
            }}
            onClick={() => setShowLeaderboardModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'rgba(10, 15, 30, 0.92)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                borderRadius: '16px',
                padding: '25px',
                width: '520px',
                maxWidth: '90vw',
                backdropFilter: 'blur(25px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,215,0,0.15)',
                color: '#fff',
                pointerEvents: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 215, 0, 0.2)', paddingBottom: '10px' }}>
                <h2 style={{ fontSize: '1.2rem', color: '#ffd700', textTransform: 'uppercase', margin: 0, textShadow: '0 0 10px rgba(255, 215, 0, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🏆 Classement des Agents (Top 10)
                </h2>
                <button 
                  onClick={() => setShowLeaderboardModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#ffd700', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                {dashboardStatus?.topPlayers && dashboardStatus.topPlayers.length > 0 ? (
                  dashboardStatus.topPlayers.map((p: any, idx: number) => {
                    const isCurrent = p.childId === childInfos?.id;
                    const rank = idx + 1;
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                    
                    // Helper local pour l'URL d'avatar identique à PlayerAvatar
                    let avatarUrl = '';
                    if (p.avatar && p.avatar !== 'avatars/default.png') {
                      avatarUrl = `${EVOE_IMG_URL}${p.avatar}`;
                    } else {
                      let hash = 0;
                      const name = p.pseudo || '';
                      for (let i = 0; i < name.length; i++) {
                        hash += name.charCodeAt(i);
                      }
                      let age = 18;
                      if (p.birthDate) {
                        age = new Date().getFullYear() - new Date(p.birthDate).getFullYear();
                      }
                      let genre = '';
                      if (p.gender === 'EF') genre = 'EF';
                      else if (p.gender === 'EH') genre = 'EH';
                      else if (p.gender === 'E' || age < 15) genre = (hash % 2 === 0) ? 'EF' : 'EH';
                      else if (p.gender === 'F') genre = 'F';
                      else if (p.gender === 'M') genre = 'H';
                      else genre = ['EF', 'EH', 'F', 'H'][hash % 4];

                      let file = '';
                      if (genre === 'EF') file = `EF_avatar_0${(hash % 3) + 1}.png`;
                      else if (genre === 'EH') file = `EH_avatar_0${(hash % 3) + 1}.png`;
                      else if (genre === 'F') file = `F_avatar_${((hash % 12) + 1).toString().padStart(2, '0')}.png`;
                      else file = `H_avatar_0${(hash % 21) + 1}.png`;

                      avatarUrl = `${EVOE_IMG_URL}avatars_3D/${file}`;
                    }

                    return (
                      <div 
                        key={p.childId} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 15px',
                          background: isCurrent ? 'rgba(0, 255, 204, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: isCurrent ? '1.5px solid rgba(0, 255, 204, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '10px',
                          boxShadow: isCurrent ? '0 0 10px rgba(0, 255, 204, 0.15)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {/* Médaille ou Rang */}
                          <span style={{ 
                            fontSize: rank <= 3 ? '1.2rem' : '0.85rem', 
                            width: '24px', 
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: rank > 3 ? '#a0aec0' : 'inherit'
                          }}>
                            {medal}
                          </span>

                          {/* Photo de profil */}
                          <img 
                            src={avatarUrl} 
                            alt="" 
                            onClick={() => {
                              setSelectedProfileId(p.childId);
                              setShowLeaderboardModal(false);
                            }}
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              border: `1.5px solid ${p.color || '#00ffcc'}`, 
                              objectFit: 'cover',
                              background: 'rgba(0,0,0,0.3)',
                              cursor: 'pointer'
                            }} 
                          />

                          {/* Pseudo et Équipe */}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ 
                              fontSize: '0.9rem', 
                              fontWeight: 'bold', 
                              color: isCurrent ? '#00ffcc' : '#fff' 
                            }}>
                              {p.pseudo} {isCurrent && <span style={{ fontSize: '0.7rem', color: '#00ffcc', background: 'rgba(0, 255, 204, 0.15)', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' }}>MOI</span>}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: p.color || '#a0aec0' }}>
                              {p.teamName}
                            </span>
                          </div>
                        </div>

                        {/* Score HP en badge */}
                        <div style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          background: 'rgba(0,0,0,0.3)',
                          border: `1px solid ${
                            p.health < 35 ? '#ff0055' 
                            : p.health < 70 ? '#ff7700' 
                            : '#00ff66'
                          }`,
                          color: p.health < 35 ? '#ff0055' 
                            : p.health < 70 ? '#ff7700' 
                            : '#00ff66',
                          textShadow: `0 0 5px ${
                            p.health < 35 ? 'rgba(255, 0, 85, 0.3)' 
                            : p.health < 70 ? 'rgba(255, 119, 0, 0.3)' 
                            : 'rgba(0, 255, 102, 0.3)'
                          }`
                        }}>
                          {p.health} HP
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: '#a0aec0', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', margin: '20px 0' }}>
                    Aucune donnée de classement disponible pour cette période.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal du Profil Agent */}
      <AnimatePresence>
        {selectedProfileId !== null && (
          <AgentProfileModal
            profileId={selectedProfileId}
            onClose={() => setSelectedProfileId(null)}
            isOwner={selectedProfileId === childInfos?.id}
            refreshData={fetchEvoeData}
          />
        )}
      </AnimatePresence>

      {/* Terminal de discussion instantanée (Chat) */}
      <ChatPanel 
        players={players} 
        teams={dashboardStatus?.teams || []} 
        onlineUsers={onlineUsers}
        onOnlineUsersChange={setOnlineUsers}
        onUnreadChange={setUnreadChat}
        isOpenProp={chatOpen}
        activeTabProp={chatActiveTab}
        onClose={() => setChatOpen(false)}
        onTabChange={(tab) => setChatActiveTab(tab)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<MainApp />} />
    </Routes>
  );
}
