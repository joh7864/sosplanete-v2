import React from 'react';
import { formatRemainingTime } from '../../../utils/format';

export interface CodexDockedChallengesTabProps {
  loadingChallenges: boolean;
  challenges: any[];
  receivedChallenges: any[];
  handleRespondChallenge: (id: number, accept: boolean) => Promise<any> | void;
  loadingMissionId: number | null;
  handleImpulseMission: (id: number) => Promise<any> | void;
  sentChallenges: any[];
  dashboardStatus: any;
  myTeamId: number | null;
  childInfos: any;
  setShowNoPeriodModal: (show: boolean) => void;
  setShowChallengeModal: (show: boolean) => void;
  setChallengeError: (err: any) => void;
}

export const CodexDockedChallengesTab: React.FC<CodexDockedChallengesTabProps> = ({
  loadingChallenges,
  challenges,
  receivedChallenges,
  handleRespondChallenge,
  loadingMissionId,
  handleImpulseMission,
  sentChallenges,
  dashboardStatus,
  myTeamId,
  childInfos,
  setShowNoPeriodModal,
  setShowChallengeModal,
  setChallengeError,
}) => {
  const myTeamStability =
    dashboardStatus?.teams?.find((t: any) => t.id === myTeamId)?.crewBioStability ?? 100;
  const isLocked = myTeamStability < 10;

  return (
    <div
      className="challenges-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
    >
      {loadingChallenges && challenges.length === 0 && (
        <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>
          Mise à jour des défis...
        </p>
      )}

      {/* Section Défis Reçus */}
      <div>
        <h3
          style={{
            fontSize: '0.85rem',
            color: '#00ffcc',
            textTransform: 'uppercase',
            marginBottom: '8px',
            borderBottom: '1px solid rgba(0,255,204,0.1)',
            paddingBottom: '4px',
          }}
        >
          📥 Reçus
        </h3>
        {receivedChallenges.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>
            Aucun défi reçu.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {receivedChallenges.map((ch) => (
              <div
                key={ch.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderLeft: `3px solid ${ch.challengerTeamColor || '#fff'}`,
                  borderRadius: '8px',
                  padding: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#a0aec0',
                    marginBottom: '4px',
                  }}
                >
                  <span>
                    De : <strong style={{ color: ch.challengerTeamColor }}>{ch.challengerTeamName}</strong>
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      color:
                        ch.status === 'PENDING'
                          ? '#ffd700'
                          : ch.status === 'ACCEPTED'
                          ? '#00b3ff'
                          : ch.status === 'SUCCESS'
                          ? '#10b981'
                          : '#ff3b3b',
                    }}
                  >
                    {ch.status}
                    {ch.isRetroactive && (
                      <span title="Mission accomplie d'avance !" style={{ marginLeft: '4px' }}>
                        ✨
                      </span>
                    )}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#fff', margin: '4px 0', fontWeight: 'bold' }}>
                  Mission : {ch.actionLabel}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#ff9f43', margin: '4px 0', fontStyle: 'italic' }}>
                  Gage proposé : {ch.pledge}
                </p>
                {ch.expiresAt && (ch.status === 'PENDING' || ch.status === 'ACCEPTED') && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      color: '#ffd700',
                      marginTop: '2px',
                    }}
                  >
                    <span>⏳</span>
                    <span>
                      Temps restant : <strong>{formatRemainingTime(ch.expiresAt)}</strong>
                    </span>
                  </div>
                )}
                {ch.isRetroactive && ch.status === 'SUCCESS' && (
                  <p style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '8px', marginBottom: 0 }}>
                    💡 <em>Vous aviez déjà accompli cette mission ! Défi validé automatiquement.</em>
                  </p>
                )}
                {ch.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleRespondChallenge(ch.id, true)}
                      style={{
                        flex: 1,
                        background: '#00ffcc',
                        border: 'none',
                        color: '#000',
                        padding: '6px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRespondChallenge(ch.id, false)}
                      style={{
                        flex: 1,
                        background: 'rgba(255,59,59,0.2)',
                        border: '1px solid #ff3b3b',
                        color: '#ff3b3b',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
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
                      fontSize: '0.75rem',
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
        <h3
          style={{
            fontSize: '0.85rem',
            color: '#00ffcc',
            textTransform: 'uppercase',
            marginBottom: '8px',
            borderBottom: '1px solid rgba(0,255,204,0.1)',
            paddingBottom: '4px',
          }}
        >
          📤 Envoyés
        </h3>
        {sentChallenges.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: '#a0aec0', fontStyle: 'italic', margin: 0 }}>
            Aucun défi envoyé.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sentChallenges.map((ch) => (
              <div
                key={ch.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderLeft: `3px solid ${ch.targetTeamColor || '#fff'}`,
                  borderRadius: '8px',
                  padding: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#a0aec0',
                    marginBottom: '4px',
                  }}
                >
                  <span>
                    Cible : <strong style={{ color: ch.targetTeamColor }}>{ch.targetTeamName}</strong>
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      color:
                        ch.status === 'PENDING'
                          ? '#ffd700'
                          : ch.status === 'ACCEPTED'
                          ? '#00b3ff'
                          : ch.status === 'SUCCESS'
                          ? '#10b981'
                          : '#ff3b3b',
                    }}
                  >
                    {ch.status}
                    {ch.isRetroactive && (
                      <span title="Mission accomplie d'avance !" style={{ marginLeft: '4px' }}>
                        ✨
                      </span>
                    )}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#fff', margin: '4px 0', fontWeight: 'bold' }}>
                  Mission : {ch.actionLabel}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#ff9f43', margin: '4px 0', fontStyle: 'italic' }}>
                  Gage : {ch.pledge}
                </p>
                {ch.expiresAt && (ch.status === 'PENDING' || ch.status === 'ACCEPTED') && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      color: '#ffd700',
                      marginTop: '2px',
                    }}
                  >
                    <span>⏳</span>
                    <span>
                      Temps restant : <strong>{formatRemainingTime(ch.expiresAt)}</strong>
                    </span>
                  </div>
                )}
                {ch.isRetroactive && ch.status === 'SUCCESS' && (
                  <p style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '8px', marginBottom: 0 }}>
                    💡 <em>Mission déjà accomplie d'avance !</em>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton de création */}
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => {
            if (childInfos && childInfos.isPeriodOpen === false) {
              setShowNoPeriodModal(true);
              return;
            }
            if (!isLocked) {
              setShowChallengeModal(true);
              setChallengeError(null);
            }
          }}
          disabled={isLocked}
          style={{
            width: '100%',
            background: isLocked
              ? 'rgba(255, 255, 255, 0.05)'
              : 'linear-gradient(135deg, #00ffcc, #00b3ff)',
            border: 'none',
            borderRadius: '6px',
            color: isLocked ? 'rgba(255,255,255,0.3)' : '#000',
            padding: '10px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            boxShadow: isLocked ? 'none' : '0 0 10px rgba(0,255,204,0.3)',
          }}
        >
          {isLocked ? '🔒 Stabilité trop basse (<10%)' : '+ Lancer un défi'}
        </button>
      </div>
    </div>
  );
};
