import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  badge: string;
  targetId?: string;
  targetSelector?: string;
  position: 'bottom' | 'top' | 'left' | 'right' | 'center';
  explanation: string;
  pointerOffset?: { x: number; y: number };
}

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateStep?: (stepIndex: number) => void;
  teamName?: string;
  completionPercent?: number;
  userId?: string;
}

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 1,
    badge: 'Étape 1 / 12',
    title: '🚀 Bienvenue à bord, Agent !',
    targetId: 'hud-agent-profile',
    position: 'bottom',
    explanation: "Vous appartenez à l'équipage de l'Arche Temporelle. Votre bio-stabilité et votre identité d'agent s'affichent ici. Vos éco-gestes réels restaurent l'avenir planétaire !"
  },
  {
    id: 2,
    badge: 'Étape 2 / 12',
    title: '🌍 La Passerelle & Les Secteurs Écologiques',
    targetId: 'sector-orb-guide',
    position: 'bottom',
    explanation: "Voici la Terre en 2026 entourée de ses orbes cristallines de secteurs écologiques (Eau, Énergie, Biodiversité, Recyclage...). Cliquez sur un orbe 3D pour ouvrir ses éco-missions."
  },
  {
    id: 3,
    badge: 'Étape 3 / 12',
    title: '⚡ Le Codex & Impulsion d\'une Mission',
    targetId: 'hud-active-mission-card',
    position: 'left',
    explanation: "Quand vous accomplissez une action éco-responsable dans la vraie vie, cliquez sur 'Impulser'. Vous gagnez des points IT (Impulsions Temporelles) et réduisez l'empreinte carbone collective de l'équipage."
  },
  {
    id: 4,
    badge: 'Étape 4 / 12',
    title: '⚡ La Puissance des Impulsions Temporelles (IT)',
    targetId: 'mission-card-it-counter',
    position: 'left',
    explanation: "Les IT représentent la puissance de l'énergie vitale envoyée vers le futur. Chaque éco-geste réel accompli génère des IT. Plus vous accumulez d'IT, plus le futur se régénère rapidement et évolue dans le bon sens !"
  },
  {
    id: 5,
    badge: 'Étape 5 / 12',
    title: '🌕 L\'Arène des Défis Temporels',
    targetId: 'hud-moon-arena',
    position: 'bottom',
    explanation: "Cliquez sur la Lune en orbite ou le badge d'un joueur pour entrer dans l'arène des défis. Défiez les équipes adverses avec un chrono (24h/48h) et un gage d'équipe !"
  },
  {
    id: 6,
    badge: 'Étape 6 / 12',
    title: '📊 TERRE 2070 : % RÉGÉNÉRÉE',
    targetId: 'hud-completion-bar',
    position: 'bottom',
    explanation: "Suivez la jauge de régénération planétaire en direct. Plus votre équipage accomplit d'éco-gestes réels, plus le score d'accomplissement augmente et plus la Terre se refroidit à l'horizon 2070 !"
  },
  {
    id: 7,
    badge: 'Étape 7 / 12',
    title: '⏳ Projection Temporelle : Cap sur 2070',
    targetId: 'hud-epoch-switch',
    position: 'bottom',
    explanation: "Basculez à tout moment vers l'ère 2070 pour explorer la Terre régénérée dans le futur et visualiser en direct l'impact à long terme des actions de votre équipage !"
  },
  {
    id: 8,
    badge: 'Étape 8 / 12',
    title: '🔮 Extrapolation 2070 & Bilan d\'Impact',
    targetId: 'panel-extrapolation-2070',
    position: 'right',
    explanation: "Explorez le tableau d'extrapolation 2070 ! Visualisez le recul du Jour de Dépassement Mondial, la glace arctique préservée et les équivalences en piscines d'eau potable et camions évités."
  },
  {
    id: 9,
    badge: 'Étape 9 / 12',
    title: '🚀 Radar Temporel & Évolution des Vaisseaux',
    targetId: 'panel-radar-2070',
    position: 'left',
    explanation: "Chaque vaisseau possède 5 niveaux d'évolution. Vous franchissez des paliers technologiques selon votre progression globale de régénération :\n- N1 (0%) : Friction Thermique\n- N2 (25%) : Voiles Photovoltaïques\n- N3 (45%) : Fusion Magnétique\n- N4 (65%) : Résonance Quantique\n- N5 (85%) : Singularité Protonique"
  },
  {
    id: 10,
    badge: 'Étape 10 / 12',
    title: '🏆 Podium 3D & Progression',
    targetId: 'btn-podium-leaderboard',
    position: 'left',
    explanation: "Consultez le classement général sur le podium holographique 3D et cliquez sur n'importe quel avatar d'agent pour inspecter sa fiche, ses badges et son palmarès."
  },
  {
    id: 11,
    badge: 'Étape 11 / 12',
    title: '💬 Com-Link & Messagerie d\'Équipage',
    targetId: 'chat-panel-container',
    position: 'left',
    explanation: "Ouvrez le Com-Link spatial pour dialoguer en direct avec votre équipage, coordonner vos actions éco-responsables et débriefer vos stratégies de mission !"
  },
  {
    id: 12,
    badge: 'Étape 12 / 12',
    title: '📡 Canal WhatsApp Équipe & Alertes',
    targetId: 'hud-btn-whatsapp',
    position: 'left',
    explanation: "Rejoignez le groupe WhatsApp officiel de votre équipe pour recevoir instantanément les notifications de défis reçus, les alertes d'impact et rester connecté !"
  }
];

export function OnboardingGuide({ isOpen, onClose, onNavigateStep, teamName, userId }: OnboardingGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>(DEFAULT_STEPS);

  const markSeen = async () => {
    const userKey = userId ? `evoe_has_seen_onboarding_v2_${userId}` : 'evoe_has_seen_onboarding_v2';
    localStorage.setItem(userKey, 'true');
    try {
      const savedAuth = localStorage.getItem('evoe_auth') || sessionStorage.getItem('evoe_auth');
      const savedInstanceId = localStorage.getItem('instanceId') || sessionStorage.getItem('instanceId');
      if (savedAuth) {
        const evoeApiUrl = import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe';
        const headers: Record<string, string> = { Authorization: `Basic ${savedAuth}` };
        if (savedInstanceId) headers['x-instance-id'] = savedInstanceId;
        await fetch(`${evoeApiUrl}/onboarding/seen`, { method: 'POST', headers });
      }
    } catch (e) {
      console.error('Erreur enregistrement onboarding vu:', e);
    }
    onClose();
  };

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const savedAuth = localStorage.getItem('evoe_auth') || sessionStorage.getItem('evoe_auth');
        const savedInstanceId = localStorage.getItem('instanceId') || sessionStorage.getItem('instanceId');
        if (!savedAuth) return;

        const evoeApiUrl = import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe';
        const headers: Record<string, string> = {
          Authorization: `Basic ${savedAuth}`,
        };
        if (savedInstanceId) {
          headers['x-instance-id'] = savedInstanceId;
        }

        const resp = await fetch(`${evoeApiUrl}/onboarding-steps`, { headers });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.ftuxSteps && Array.isArray(data.ftuxSteps) && data.ftuxSteps.length > 0) {
            setSteps(data.ftuxSteps);
          }
        }
      } catch (e) {
        console.error("Failed to load custom FTUX steps", e);
      }
    };
    fetchSteps();
  }, [isOpen, userId]);

  const step = steps[currentStepIndex];
  if (!step) return null;

  // Mesure réactive de l'élément cible (avec boucle d'animation temps réel sécurisée)
  useEffect(() => {
    if (!isOpen) return;

    let isEffectActive = true;
    let animId: number | null = null;

    if (onNavigateStep) {
      onNavigateStep(currentStepIndex);
    }

    const updateTarget = () => {
      // Invalidation immédiate si l'étape a changé ou si le guide s'est fermé
      if (!isEffectActive) return;

      const targetId = step.targetId;
      if (!targetId) {
        setTargetRect(null);
        return;
      }

      let el = document.getElementById(targetId);
      if (!el && targetId === 'hud-btn-chat') {
        el = document.getElementById('btn-com-link');
      }
      if (targetId === 'hud-completion-bar') {
        const desktopEl = document.getElementById('hud-completion-bar');
        const laserEl = document.getElementById('hud-laser-regen-bar');
        const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > 520;
        if (isMobilePortrait && laserEl) {
          el = laserEl;
        } else if (desktopEl && desktopEl.getBoundingClientRect().width > 0) {
          el = desktopEl;
        } else if (laserEl) {
          el = laserEl;
        }
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
        }

        // Relance de la boucle temps réel pour suivre parfaitement les animations d'ouverture (ex: dépliement du Codex)
        if (isEffectActive) {
          animId = requestAnimationFrame(updateTarget);
        }
        return;
      }

      // Fallback Étape 7: Panel Extrapolation 2070 sur la gauche de l'écran
      if (targetId === 'panel-extrapolation-2070') {
        const customRect = new DOMRect(
          20,
          75,
          Math.min(360, window.innerWidth * 0.85),
          Math.max(300, window.innerHeight - 150)
        );
        setTargetRect(customRect);
        if (isEffectActive) animId = requestAnimationFrame(updateTarget);
        return;
      }

      // Fallback Étape 8: Panel Radar Temporel 2070 sur la droite de l'écran
      if (targetId === 'panel-radar-2070') {
        const customRect = new DOMRect(
          window.innerWidth - Math.min(380, window.innerWidth * 0.85),
          75,
          Math.min(360, window.innerWidth * 0.85),
          Math.max(300, window.innerHeight - 150)
        );
        setTargetRect(customRect);
        if (isEffectActive) animId = requestAnimationFrame(updateTarget);
        return;
      }

      // Fallback Étape 6: Podium 3D au centre de l'écran
      if (targetId === 'btn-podium-leaderboard') {
        const customRect = new DOMRect(
          window.innerWidth * 0.5 - 160,
          window.innerHeight * 0.35,
          320,
          240
        );
        setTargetRect(customRect);
        if (isEffectActive) animId = requestAnimationFrame(updateTarget);
        return;
      }

      // Fallback Étape 10: Panneau Com-Link déplié sur la droite de l'écran
      if (targetId === 'chat-panel-container') {
        const customRect = new DOMRect(
          window.innerWidth - 380,
          0,
          380,
          window.innerHeight
        );
        setTargetRect(customRect);
        if (isEffectActive) animId = requestAnimationFrame(updateTarget);
        return;
      }

      // Fallback Étape 8 / 7: Bouton Com-Link en bas à droite
      if (targetId === 'hud-btn-chat') {
        const customRect = new DOMRect(
          window.innerWidth - 150,
          window.innerHeight - 60,
          130,
          45
        );
        setTargetRect(customRect);
        return;
      }

      // Si l'élément cible est en cours d'ouverture (ex: animation du Codex), réessaie à la frame suivante
      if (isEffectActive) {
        animId = requestAnimationFrame(updateTarget);
      }
    };

    updateTarget();
    const timer = setTimeout(updateTarget, 100);
    window.addEventListener('resize', updateTarget);

    return () => {
      isEffectActive = false; // Bloque instantanément tout callback rAF en cours !
      clearTimeout(timer);
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
      window.removeEventListener('resize', updateTarget);
    };
  }, [isOpen, currentStepIndex, step]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      markSeen();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Calcul du placement de la main animée et du tooltip
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;

  if (targetRect) {
    pointerX = targetRect.left + targetRect.width / 2;
    pointerY = targetRect.top + targetRect.height / 2;
  }

  const clampedPointerX = Math.max(25, Math.min(window.innerWidth - 65, pointerX));
  const clampedPointerY = Math.max(25, Math.min(window.innerHeight - 65, pointerY));

  const isLandscape = window.innerHeight <= 520;
  
  let justifyPos: 'flex-start' | 'center' | 'flex-end' = 'center';
  let alignPos: 'flex-start' | 'center' | 'flex-end' = 'center';

  if (targetRect) {
    const centerX = targetRect.left + targetRect.width / 2;
    const centerY = targetRect.top + targetRect.height / 2;

    // Positionnement opposé horizontal
    if (centerX < window.innerWidth * 0.45) {
      justifyPos = 'flex-end'; // Élément à gauche -> Carte à droite
    } else if (centerX > window.innerWidth * 0.55) {
      justifyPos = 'flex-start'; // Élément à droite -> Carte à gauche
    } else {
      justifyPos = 'flex-start'; // Élément au centre -> Carte sur la gauche
    }

    // Positionnement opposé vertical
    if (centerY < window.innerHeight * 0.45) {
      alignPos = 'flex-end'; // Élément en haut -> Carte en bas
    } else if (centerY > window.innerHeight * 0.65) {
      alignPos = 'flex-start'; // Élément en bas -> Carte en haut
    } else {
      alignPos = isLandscape ? 'center' : 'flex-end';
    }
  }

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100dvh',
          zIndex: 9999,
          pointerEvents: 'auto',
          overflow: 'hidden'
        }}
      >
        {/* Masque Sombre (Spotlight Backdrop) avec trou sur l'élément cible */}
        {targetRect ? (
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect 
                  x={targetRect.left - 8} 
                  y={targetRect.top - 8} 
                  width={targetRect.width + 16} 
                  height={targetRect.height + 16} 
                  rx="12" 
                  fill="black" 
                />
              </mask>
            </defs>
            <rect 
              x="0" 
              y="0" 
              width="100%" 
              height="100%" 
              fill="rgba(5, 10, 25, 0.78)" 
              mask="url(#spotlight-mask)" 
            />
            {/* Halo néon cyan autour de l'élément cible */}
            <rect 
              x={targetRect.left - 8} 
              y={targetRect.top - 8} 
              width={targetRect.width + 16} 
              height={targetRect.height + 16} 
              rx="12" 
              fill="none" 
              stroke="#00ffcc" 
              strokeWidth="2" 
              strokeDasharray="6 4" 
            />
          </svg>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 10, 25, 0.75)', pointerEvents: 'none' }} />
        )}

        {/* Pointeur / Main Animée (👆) avec trajectoire réactive & zIndex maximal */}
        <motion.div
          initial={{ x: clampedPointerX, y: clampedPointerY, scale: 0.8, opacity: 0 }}
          animate={{ 
            x: clampedPointerX + (isLandscape ? 8 : 12), 
            y: clampedPointerY + (isLandscape ? 8 : 12), 
            scale: [1, 1.15, 1],
            opacity: 1 
          }}
          transition={{
            x: { type: 'spring', stiffness: 200, damping: 25 },
            y: { type: 'spring', stiffness: 200, damping: 25 },
            scale: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 10005,
            pointerEvents: 'none',
            fontSize: isLandscape ? '2rem' : '2.5rem',
            filter: 'drop-shadow(0 0 12px rgba(0, 255, 204, 0.9))'
          }}
        >
          👆
        </motion.div>

        {/* Infobulle Cybernétique (Tooltip Card) avec positionnement dynamique */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: justifyPos,
          alignItems: alignPos,
          padding: isLandscape ? '12px 20px' : '30px',
          pointerEvents: 'none',
          zIndex: 10002
        }}>
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              background: 'rgba(10, 18, 36, 0.96)',
              border: '1.5px solid rgba(0, 255, 204, 0.6)',
              borderRadius: '16px',
              padding: isLandscape ? '12px 18px' : '22px 24px',
              width: isLandscape ? '360px' : '420px',
              maxWidth: isLandscape ? '46vw' : '92vw',
              maxHeight: isLandscape ? '88vh' : 'none',
              overflowY: isLandscape ? 'auto' : 'visible',
              boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(0,255,204,0.25)',
              backdropFilter: 'blur(20px)',
              color: '#fff',
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: isLandscape ? '8px' : '12px'
            }}
          >
            {/* Header Infobulle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ 
                background: 'rgba(0, 255, 204, 0.15)', 
                border: '1px solid #00ffcc', 
                color: '#00ffcc', 
                padding: '3px 10px', 
                borderRadius: '20px', 
                fontSize: '0.72rem', 
                fontWeight: 'bold', 
                letterSpacing: '0.5px' 
              }}>
                Étape {currentStepIndex + 1} / {steps.length}
              </span>
              <button
                onClick={markSeen}
                title="Passer le tutoriel"
                style={{ background: 'transparent', border: 'none', color: '#a0aec0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Titre & Explication */}
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#00ffcc', margin: '0 0 6px 0', textShadow: '0 0 8px rgba(0,255,204,0.3)' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: '1.45', margin: 0 }}>
                {step.explanation.replace('[Nom de l\'équipe]', teamName || 'votre équipe')}
              </p>
            </div>

            {/* Barre de progression interactive des étapes (cliquables directement) */}
            <div style={{ display: 'flex', gap: '5px', padding: '6px 0' }}>
              {steps.map((s, idx) => {
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStepIndex(idx)}
                    title={`Aller à l'Étape ${idx + 1} : ${s.title}`}
                    style={{
                      flex: 1,
                      height: '8px',
                      borderRadius: '4px',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      background: isActive 
                        ? '#00ffcc' 
                        : (isPassed ? 'rgba(0, 255, 204, 0.45)' : 'rgba(255, 255, 255, 0.18)'),
                      boxShadow: isActive ? '0 0 10px #00ffcc, 0 0 15px rgba(0, 255, 204, 0.6)' : 'none',
                      transition: 'all 0.25s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(0, 255, 204, 0.8)';
                        e.currentTarget.style.transform = 'scaleY(1.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = isPassed ? 'rgba(0, 255, 204, 0.45)' : 'rgba(255, 255, 255, 0.18)';
                        e.currentTarget.style.transform = 'scaleY(1)';
                      }
                    }}
                  />
                );
              })}
            </div>

            {/* Actions Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: currentStepIndex === 0 ? 'rgba(255,255,255,0.2)' : '#00b3ff',
                  cursor: currentStepIndex === 0 ? 'default' : 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={16} /> Précédent
              </button>

              <button
                onClick={handleNext}
                style={{
                  background: 'linear-gradient(135deg, #00ffcc, #00b3ff)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  color: '#050b14',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 15px rgba(0, 255, 204, 0.4)'
                }}
              >
                {currentStepIndex === steps.length - 1 ? 'Terminer 🚀' : 'Suivant'} <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
