import React, { useEffect, useState, useRef } from 'react';
import type { ArcadeScoreEntry } from './types';
import { evoeClient } from '../../../lib/api';

interface ArcadeHighScoresViewProps {
  gameKey: string;
  gameTitle: string;
  highlightScoreId?: number;
  lastScore?: number;
  lastRank?: number;
  onReplay: () => void;
  onClose: () => void;
}

export const ArcadeHighScoresView: React.FC<ArcadeHighScoresViewProps> = ({
  gameKey,
  gameTitle,
  highlightScoreId,
  lastScore,
  lastRank,
  onReplay,
  onClose,
}) => {
  const [scores, setScores] = useState<ArcadeScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchScores = async () => {
      try {
        setLoading(true);
        const BASE_API_URL = (
          import.meta.env.VITE_API_URL || 'http://localhost:3011/legacy'
        ).replace('/legacy', '');
        const res = await evoeClient.get<{
          scores: ArcadeScoreEntry[];
          total: number;
        }>(`${BASE_API_URL}/arcade/scores/${gameKey}`);

        if (isMounted) {
          setScores(res.data.scores || []);
        }
      } catch (err) {
        console.error('Erreur chargement des high scores arcade:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchScores();
    return () => {
      isMounted = false;
    };
  }, [gameKey]);

  // Défilement automatique vers le score du joueur dès que les scores sont chargés
  useEffect(() => {
    if (!loading && highlightedRowRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 200);
    }
  }, [loading, scores]);

  const formatDate = (raw: string | Date) => {
    try {
      const d = new Date(raw);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '640px',
        margin: '0 auto',
        fontFamily: '"Courier New", monospace',
        color: '#ffffff',
        userSelect: 'none',
      }}
    >
      {/* En-tête Rétro Arcade */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '14px',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            color: '#00f0ff',
            letterSpacing: '2px',
            marginBottom: '4px',
          }}
        >
          ★ HALL OF FAME ARCADE ★
        </div>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#00ff66',
            letterSpacing: '2px',
            margin: 0,
            textShadow: '0 0 14px rgba(0, 255, 102, 0.7)',
          }}
        >
          {gameTitle}
        </h2>

        {/* Bannière du rang du joueur si fin de partie */}
        {lastRank !== undefined && lastScore !== undefined && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: 'rgba(0, 255, 102, 0.15)',
              border: '1.5px solid #00ff66',
              borderRadius: '8px',
              color: '#00ff66',
              fontSize: '15px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              boxShadow: '0 0 18px rgba(0, 255, 102, 0.4)',
              animation: 'pulse 1.5s infinite',
            }}
          >
            VOTRE SCORE : {lastScore.toLocaleString()} PTS — RANG #{lastRank} !
          </div>
        )}
      </div>

      {/* Tableau Scrollable des High Scores */}
      <div
        ref={scrollContainerRef}
        style={{
          width: '100%',
          maxHeight: '380px',
          overflowY: 'auto',
          background: 'rgba(5, 8, 16, 0.95)',
          border: '2px solid rgba(0, 255, 102, 0.4)',
          borderRadius: '12px',
          boxShadow: 'inset 0 0 25px rgba(0, 0, 0, 0.95)',
          padding: '6px',
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '50px 0',
              color: '#00f0ff',
              fontSize: '14px',
              letterSpacing: '2px',
            }}
          >
            CHARGEMENT DES SCORES...
          </div>
        ) : scores.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '50px 0',
              color: '#888888',
              fontSize: '14px',
            }}
          >
            AUCUN SCORE ENREGISTRÉ. SOYEZ LE PREMIER CHAMPION !
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid rgba(0, 255, 102, 0.35)',
                  color: '#00f0ff',
                  fontSize: '12px',
                  letterSpacing: '1px',
                }}
              >
                <th style={{ padding: '8px 6px' }}>RANG</th>
                <th style={{ padding: '8px 6px' }}>SCORE</th>
                <th style={{ padding: '8px 6px' }}>AGENT</th>
                <th style={{ padding: '8px 6px' }}>ÉQUIPE</th>
                <th style={{ padding: '8px 6px' }}>VAGUE</th>
                <th style={{ padding: '8px 6px' }}>DATE</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => {
                const isHighlight =
                  (highlightScoreId && s.id === highlightScoreId) ||
                  (lastRank && s.rank === lastRank && s.score === lastScore);

                const rankColor =
                  s.rank === 1
                    ? '#ffd700'
                    : s.rank === 2
                    ? '#c0c0c0'
                    : s.rank === 3
                    ? '#cd7f32'
                    : '#ffffff';

                return (
                  <tr
                    key={s.id}
                    ref={isHighlight ? highlightedRowRef : undefined}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      background: isHighlight
                        ? 'rgba(0, 255, 102, 0.22)'
                        : 'transparent',
                      color: isHighlight ? '#00ff66' : '#dddddd',
                      fontWeight: isHighlight ? 'bold' : 'normal',
                      boxShadow: isHighlight
                        ? 'inset 0 0 12px rgba(0, 255, 102, 0.4)'
                        : 'none',
                    }}
                  >
                    <td
                      style={{
                        padding: '7px 6px',
                        color: rankColor,
                        fontWeight: 'bold',
                      }}
                    >
                      {s.rank === 1 ? '🥇 1ST' : s.rank === 2 ? '🥈 2ND' : s.rank === 3 ? '🥉 3RD' : `#${s.rank}`}
                    </td>
                    <td
                      style={{
                        padding: '7px 6px',
                        color: '#00ff66',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                      }}
                    >
                      {s.score.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: '7px 6px',
                        color: isHighlight ? '#ffffff' : '#e2e8f0',
                        maxWidth: '110px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.childPseudo}
                    </td>
                    <td
                      style={{
                        padding: '7px 6px',
                        color: '#38bdf8',
                        fontSize: '11px',
                      }}
                    >
                      {s.teamName || '—'}
                    </td>
                    <td
                      style={{
                        padding: '7px 6px',
                        color: '#ffd000',
                        fontSize: '11px',
                      }}
                    >
                      WAVE {s.waveReached || 1}
                    </td>
                    <td
                      style={{
                        padding: '7px 6px',
                        color: '#94a3b8',
                        fontSize: '11px',
                      }}
                    >
                      {formatDate(s.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Barre d'Action Rétro "INSERT COIN" & Rejouer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '14px',
          width: '100%',
          marginTop: '16px',
        }}
      >
        <button
          type="button"
          onClick={onReplay}
          style={{
            flex: 1,
            height: '50px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            border: '2px solid #fbbf24',
            color: '#ffffff',
            fontSize: '15px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            cursor: 'pointer',
            boxShadow:
              '0 0 20px rgba(245, 158, 11, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.15s, filter 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.filter = 'brightness(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          <span>🪙</span> INSERT COIN / REJOUER
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            height: '50px',
            padding: '0 20px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            color: '#cbd5e1',
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '1px',
            cursor: 'pointer',
          }}
        >
          FERMER
        </button>
      </div>
    </div>
  );
};
