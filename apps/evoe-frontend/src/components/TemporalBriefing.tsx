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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#050a0f',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#00ffcc',
      fontFamily: '"Orbitron", "Courier New", monospace',
      overflow: 'hidden'
    }}>
      {/* Glitch Overlay : Scanlines animées */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(rgba(0, 255, 204, 0.03) 50%, rgba(0, 0, 0, 0.1) 50%)',
        backgroundSize: '100% 4px',
        pointerEvents: 'none',
        zIndex: 10
      }}></div>

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
        <div style={{
          width: '90%',
          maxWidth: '1000px',
          background: 'rgba(0, 20, 20, 0.8)',
          border: '1px solid rgba(0, 255, 204, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 0 30px rgba(0, 255, 204, 0.1)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 20,
          backdropFilter: 'blur(10px)',
          animation: 'briefing-fadein 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 255, 204, 0.2)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={24} />
              <span style={{ fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Connexion Sécurisée Établie
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#ff3b3b', animation: 'briefing-blink 1.5s infinite' }}>
              ● DIRECT
            </span>
          </div>

          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Barre de progression */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#00ffcc', boxShadow: '0 0 10px #00ffcc', transition: 'width 0.1s linear' }}></div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => skipTime(-10)} style={controlBtnStyle} title="Reculer 10s">
                  <Rewind size={20} />
                </button>
                <button onClick={togglePlay} style={{ ...controlBtnStyle, background: 'rgba(0, 255, 204, 0.15)' }} title={isPlaying ? "Pause" : "Lecture"}>
                  {isPlaying ? <Pause size={20} fill="#00ffcc" /> : <Play size={20} fill="#00ffcc" />}
                </button>
                <button onClick={() => skipTime(10)} style={controlBtnStyle} title="Avancer 10s">
                  <FastForward size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#a0aec0' }}>
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
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#00ffcc', color: '#000', border: 'none',
                    padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold',
                    cursor: 'pointer', textTransform: 'uppercase',
                    boxShadow: '0 0 15px rgba(0,255,204,0.4)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Passer <SkipForward size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes briefing-blink { 0% { opacity: 1; } 50% { opacity: 0.2; } 100% { opacity: 1; } }
        @keyframes briefing-pulse { 0% { transform: scale(0.98); opacity: 0.8; } 100% { transform: scale(1.02); opacity: 1; } }
        @keyframes briefing-fadein { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const controlBtnStyle = {
  background: 'transparent',
  border: '1px solid rgba(0, 255, 204, 0.4)',
  color: '#00ffcc',
  borderRadius: '50%',
  width: '44px', height: '44px',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s'
};
