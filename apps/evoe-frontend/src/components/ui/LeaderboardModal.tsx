import { motion, AnimatePresence } from 'framer-motion';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

interface LeaderboardModalProps {
  showLeaderboardModal: boolean;
  setShowLeaderboardModal: (show: boolean) => void;
  dashboardStatus: any;
  childInfos: any;
  setSelectedProfileId: (id: number | null) => void;
}

export function LeaderboardModal({
  showLeaderboardModal,
  setShowLeaderboardModal,
  dashboardStatus,
  childInfos,
  setSelectedProfileId
}: LeaderboardModalProps) {
  return (
    <AnimatePresence>
      {showLeaderboardModal && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
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
                  
                  // Helper local pour l'URL d'avatar
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
  );
}
