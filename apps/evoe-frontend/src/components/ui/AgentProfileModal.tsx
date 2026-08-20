import React, { useState, useEffect, useRef } from 'react';
import { evoeClient } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { X, Shield, Trash2, Droplet, Camera, Upload, Save, Eye, EyeOff, Trophy, RefreshCw } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';



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

interface AgentProfileModalProps {
  profileId: number;
  onClose: () => void;
  isOwner: boolean;
  refreshData: () => void;
}

export function AgentProfileModal({
  profileId,
  onClose,
  isOwner,
  refreshData
}: AgentProfileModalProps) {
  const { refreshContext } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'missions' | 'top5' | 'challenges'>('missions');
  const [impulsingId, setImpulsingId] = useState<number | null>(null);

  const handleImpulseMission = async (localActionId: number) => {
    setImpulsingId(localActionId);
    try {
      const BASE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy').replace('/legacy', '');
      await evoeClient.post(`${BASE_API_URL}/actiondone/${profileId}`, { id: localActionId });
      refreshData();
      const res = await evoeClient.get(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/profile/${profileId}`);
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
        const res = await evoeClient.get(`${import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe'}/profile/${profileId}`);
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
    formData.append('avatar', file);

    try {
      setSaving(true);
      const BASE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy').replace('/legacy', '');
      const resp = await evoeClient.post(`${BASE_API_URL}/evoe/profile/upload-avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatar(resp.data.avatarPath);
    } catch (err) {
      console.error("Erreur d'upload d'avatar:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const BASE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy').replace('/legacy', '');
      const payload: any = { pseudo, gender, birthDate };
      if (avatar) payload.avatar = avatar;
      if (password) {
        payload.password = password;
      }
      await evoeClient.patch(`${BASE_API_URL}/evoe/profile`, payload);
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
            <div className="agent-profile-identity-header">
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

              <div className="agent-profile-identity-info">
                <h2 className="agent-profile-pseudo">{profileData.profile.pseudo}</h2>
                <div className="agent-profile-team" style={{ color: teamColor }}>{profileData.profile.teamName}</div>

                {isOwner && profileData.profile?.whatsappInviteUrl && (
                  <a
                    href={profileData.profile.whatsappInviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Rejoindre le WhatsApp de l'Équipe"
                    className="agent-whatsapp-link"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      minWidth: '34px',
                      minHeight: '34px',
                      flexShrink: 0,
                      aspectRatio: '1 / 1',
                      borderRadius: '50%',
                      background: 'rgba(37, 211, 102, 0.2)',
                      border: '1.5px solid #25D366',
                      color: '#25D366',
                      textDecoration: 'none',
                      boxShadow: '0 0 10px rgba(37, 211, 102, 0.3)',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    <FaWhatsapp size={18} />
                  </a>
                )}
              </div>
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
                        <span className="mission-points">+{m.amplitude} IT</span>
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
