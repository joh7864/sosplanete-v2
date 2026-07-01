import { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, Rewind, SkipForward, AlertTriangle, ShieldCheck } from 'lucide-react';
import YouTube from 'react-youtube';

function getYoutubeId(url: string | null | undefined): string {
  if (!url || url.trim() === "") return "";
  const trimmed = url.trim();
  // Si c'est directement un ID YouTube de 11 caractères
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match && match[1] ? match[1] : "";
}

export default function TemporalBriefing({ onComplete, youtubeUrl, childId }: { onComplete: () => void, youtubeUrl?: string | null, childId?: number }) {
  const [phase, setPhase] = useState<'interception' | 'video'>('interception');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [skipNextTime, setSkipNextTime] = useState(false);
  const playerRef = useRef<any>(null);

  const videoId = getYoutubeId(youtubeUrl);

  useEffect(() => {
    // Phase 1 : Écran d'interception (durée 2.5 secondes)
    const timer = setTimeout(() => {
      setPhase('video');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying && playerRef.current) {
      interval = setInterval(async () => {
        try {
          const current = await playerRef.current.getCurrentTime();
          const duration = await playerRef.current.getDuration();
          if (duration > 0) {
            setProgress((current / duration) * 100);
          }
        } catch(e) {}
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleVideoEnded = () => {
    finishBriefing();
  };

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const skipTime = async (amount: number) => {
    if (playerRef.current) {
      const currentTime = await playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime + amount, true);
    }
  };

  const finishBriefing = () => {
    if (skipNextTime && childId) {
      localStorage.setItem(`evoe_skip_briefing_${childId}`, 'true');
    }
    onComplete();
  };

  return (
    <div className="briefing-overlay">
      {/* Glitch Overlay : Scanlines animées */}
      <div className="briefing-scanlines"></div>

      {phase === 'interception' && (
        <div style={{ textAlign: 'center', animation: 'briefing-pulse 1s infinite alternate' }}>
          <AlertTriangle size={64} color="#ff3b3b" style={{ marginBottom: '20px' }} />
          <h1 style={{ color: '#ff3b3b', textShadow: '0 0 15px rgba(255,59,59,0.8)', letterSpacing: '3px' }}>
            TRANSMISSION INTERCEPTÉE
          </h1>
          <p style={{ marginTop: '10px', fontSize: '1.2rem', color: '#a0aec0', lineHeight: '1.5' }}>
            ORIGINE : ARCHE EVOE [2070]<br/>
            DÉCRYPTAGE EN COURS...
          </p>
        </div>
      )}

      {phase === 'video' && (
        <div className="briefing-card">
          <div className="briefing-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} />
              <span className="briefing-header-title">
                Connexion Sécurisée Établie
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#ff3b3b', animation: 'briefing-blink 1.5s infinite' }}>
              ● DIRECT
            </span>
          </div>

          <div className="briefing-video-wrapper">
            <YouTube
              videoId={videoId}
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: 0,
                  controls: 1,
                  rel: 0,
                  modestbranding: 1
                }
              }}
              onReady={(e) => {
                playerRef.current = e.target;
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnd={handleVideoEnded}
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            />
          </div>

          {/* Contrôles du Lecteur */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Barre de progression */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#00ffcc', boxShadow: '0 0 10px #00ffcc', transition: 'width 0.1s linear' }}></div>
            </div>
            
            <div className="briefing-controls-row">
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => skipTime(-10)} className="briefing-control-btn" title="Reculer 10s">
                  <Rewind size={18} />
                </button>
                <button onClick={togglePlay} className="briefing-control-btn active-play" title={isPlaying ? "Pause" : "Lecture"}>
                  {isPlaying ? <Pause size={18} fill="#00ffcc" /> : <Play size={18} fill="#00ffcc" />}
                </button>
                <button onClick={() => skipTime(10)} className="briefing-control-btn" title="Avancer 10s">
                  <FastForward size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <label className="briefing-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={skipNextTime} 
                    onChange={(e) => setSkipNextTime(e.target.checked)}
                    style={{ accentColor: '#00ffcc', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  Ne plus afficher
                </label>
                <button 
                  onClick={finishBriefing}
                  className="briefing-skip-btn"
                >
                  Passer <SkipForward size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .briefing-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #050a0f;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #00ffcc;
          font-family: "Orbitron", "Courier New", monospace;
          overflow: hidden;
        }
        .briefing-scanlines {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(rgba(0, 255, 204, 0.03) 50%, rgba(0, 0, 0, 0.1) 50%);
          background-size: 100% 4px;
          pointer-events: none;
          z-index: 10;
        }
        .briefing-card {
          width: 90%;
          max-width: 900px;
          background: rgba(0, 20, 20, 0.85);
          border: 1px solid rgba(0, 255, 204, 0.3);
          border-radius: 12px;
          box-shadow: 0 0 30px rgba(0, 255, 204, 0.15);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          z-index: 20;
          backdrop-filter: blur(10px);
          animation: briefing-fadein 0.5s ease-out;
          box-sizing: border-box;
        }
        .briefing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0, 255, 204, 0.2);
          padding-bottom: 8px;
        }
        .briefing-header-title {
          font-weight: bold;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-size: 0.95rem;
        }
        .briefing-video-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          background-color: #000;
          border-radius: 8px;
          overflow: hidden;
        }
        .briefing-controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }
        .briefing-control-btn {
          background: transparent;
          border: 1px solid rgba(0, 255, 204, 0.4);
          color: #00ffcc;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .briefing-control-btn:hover {
          background: rgba(0, 255, 204, 0.1);
          transform: scale(1.05);
        }
        .briefing-control-btn.active-play {
          background: rgba(0, 255, 204, 0.15);
        }
        .briefing-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          color: #a0aec0;
          user-select: none;
        }
        .briefing-skip-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #00ffcc;
          color: #000;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
          font-size: 0.85rem;
          box-shadow: 0 0 15px rgba(0,255,204,0.4);
          transition: all 0.2s;
        }
        .briefing-skip-btn:hover {
          transform: scale(1.05);
          background: #00e6b8;
        }
        
        /* Responsive : Mobile landscape (small height) */
        @media (max-height: 550px) {
          .briefing-card {
            gap: 8px;
            padding: 10px 15px;
            width: 95vw;
          }
          .briefing-header {
            padding-bottom: 4px;
          }
          .briefing-header-title {
            font-size: 0.8rem;
          }
          .briefing-video-wrapper {
            height: 45vh;
            max-height: 180px;
            width: auto;
            aspect-ratio: 16/9;
            margin: 0 auto;
          }
          .briefing-control-btn {
            width: 32px;
            height: 32px;
          }
          .briefing-checkbox-label {
            font-size: 0.75rem;
          }
          .briefing-skip-btn {
            padding: 6px 12px;
            font-size: 0.75rem;
          }
        }

        @keyframes briefing-blink { 0% { opacity: 1; } 50% { opacity: 0.2; } 100% { opacity: 1; } }
        @keyframes briefing-pulse { 0% { transform: scale(0.98); opacity: 0.8; } 100% { transform: scale(1.02); opacity: 1; } }
        @keyframes briefing-fadein { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
