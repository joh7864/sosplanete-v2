import { useState, useEffect, useRef, useCallback } from 'react';
import type { EasterEggTriggerType, CycleEggItem } from '../types/easterEgg';
import {
  playKonamiStepSound,
  playKonamiErrorSound,
  playKonamiSuccessSound,
} from '../utils/easterEggAudio';

interface UseEasterEggTriggersProps {
  activeTriggerType?: EasterEggTriggerType;
  triggerConfig?: any;
  activeEggCode?: string;
  cycleEggs?: CycleEggItem[];
  onTrigger: (triggerType: EasterEggTriggerType, metadata?: any, targetEggId?: number) => void;
}

export function useEasterEggTriggers({
  activeTriggerType,
  triggerConfig,
  activeEggCode,
  cycleEggs,
  onTrigger,
}: UseEasterEggTriggersProps) {
  // 1. KONAMI CODE STATE & HUD
  const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const konamiIndex = useRef(0);
  const konamiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [konamiHUD, setKonamiHUD] = useState({
    isVisible: false,
    stepIndex: 0,
    isError: false,
    showMobileButtons: false,
  });

  // 2. LOGO HOLD STATE
  const logoHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 3. TARGET REPEATED CLICKS (Generic: globe2026, codexConsole, etc.)
  const clickCounts = useRef<Record<string, number>>({});
  const clickTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // 4. METRIC SEQUENCE STATE (Agent Profile 5 notes)
  const metricSequenceRef = useRef<string[]>([]);
  const metricSequenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 5. TIMELINE WARP STATE (Rapid era switches)
  const eraSwitchesRef = useRef<number[]>([]);

  // 6. CONSTELLATION 3D STARS STATE
  const clickedStarsRef = useRef<Set<number>>(new Set());

  // Helper pour trouver un œuf actif dans le cycle répondant au type et aux prérequis
  const findCandidateEgg = useCallback(
    (
      type: EasterEggTriggerType,
      matcher?: (egg: CycleEggItem) => boolean,
    ): CycleEggItem | null => {
      if (cycleEggs && cycleEggs.length > 0) {
        const found = cycleEggs.find(
          (e) =>
            e.triggerType === type &&
            !e.isDiscovered &&
            e.isInteractable !== false &&
            (!matcher || matcher(e)),
        );
        if (found) return found;
      }
      if (
        activeTriggerType === type &&
        (!matcher ||
          matcher({
            id: 0,
            code: activeEggCode || '',
            triggerType: activeTriggerType,
            triggerConfig,
          } as any))
      ) {
        return {
          id: 0,
          code: activeEggCode || '',
          triggerType: activeTriggerType,
          triggerConfig,
        } as any;
      }
      return null;
    },
    [cycleEggs, activeTriggerType, activeEggCode, triggerConfig],
  );

  // Avance dans la séquence Konami (touches clavier, swipes mobiles ou boutons virtuels)
  const advanceKonamiSequence = useCallback(
    (key: string) => {
      const expectedKey = konamiSequence[konamiIndex.current];
      if (!expectedKey) return;

      const matches = key === expectedKey || key.toLowerCase() === expectedKey.toLowerCase();

      if (matches) {
        const nextIndex = konamiIndex.current + 1;
        konamiIndex.current = nextIndex;
        playKonamiStepSound(nextIndex);

        setKonamiHUD({
          isVisible: true,
          stepIndex: nextIndex,
          isError: false,
          showMobileButtons: nextIndex >= 8, // Affiche les touches virtuelles B & A sur mobile
        });

        if (konamiTimer.current) clearTimeout(konamiTimer.current);

        if (nextIndex === konamiSequence.length) {
          playKonamiSuccessSound();
          const matched = findCandidateEgg('KONAMI_CODE') || (activeEggCode === 'EE_KONAMI_80S' ? { id: undefined } : null);
          onTrigger('KONAMI_CODE', { sequence: 'konami' }, matched?.id || undefined);
          konamiTimer.current = setTimeout(() => {
            setKonamiHUD({
              isVisible: false,
              stepIndex: 0,
              isError: false,
              showMobileButtons: false,
            });
            konamiIndex.current = 0;
          }, 2200);
        } else {
          // Réinitialisation après 7s d'inactivité
          konamiTimer.current = setTimeout(() => {
            setKonamiHUD({
              isVisible: false,
              stepIndex: 0,
              isError: false,
              showMobileButtons: false,
            });
            konamiIndex.current = 0;
          }, 7000);
        }
      } else {
        // En cas de fausse touche si la séquence était déjà engagée
        if (konamiIndex.current > 0) {
          playKonamiErrorSound();
          setKonamiHUD((prev) => ({
            ...prev,
            isError: true,
          }));
          konamiIndex.current = 0;
          if (konamiTimer.current) clearTimeout(konamiTimer.current);
          konamiTimer.current = setTimeout(() => {
            setKonamiHUD({
              isVisible: false,
              stepIndex: 0,
              isError: false,
              showMobileButtons: false,
            });
          }, 900);
        }
      }
    },
    [findCandidateEgg, onTrigger, activeEggCode],
  );

  // --- EFFECT: GLOBAL LISTENERS (Keyboard Konami + Touch Swipes + Device Motion) ---
  useEffect(() => {
    const isKonamiActive =
      Boolean(findCandidateEgg('KONAMI_CODE')) ||
      activeTriggerType === 'KONAMI_CODE' ||
      activeEggCode === 'EE_KONAMI_80S';

    if (!isKonamiActive && !activeTriggerType && (!cycleEggs || cycleEggs.length === 0)) return;

    // 1. Konami Code Listener (Touches Clavier)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si l'utilisateur est en train de taper dans un champ de formulaire
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (!isKonamiActive) return;

      advanceKonamiSequence(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);

    // 2. Mobile Touch Swipes Listener (Swipes tactiles directionnels pour mobile)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isKonamiActive) return;
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isKonamiActive) return;
      if (e.changedTouches.length !== 1) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const elapsed = Date.now() - touchStartTime;

      if (elapsed > 1200) return; // Glissement trop lent ignoré

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      const minDistance = 35;
      if (absX < minDistance && absY < minDistance) return;

      if (absX > absY) {
        if (deltaX > 0) {
          advanceKonamiSequence('ArrowRight');
        } else {
          advanceKonamiSequence('ArrowLeft');
        }
      } else {
        if (deltaY > 0) {
          advanceKonamiSequence('ArrowDown');
        } else {
          advanceKonamiSequence('ArrowUp');
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    // 3. Accelerometer / Device Motion (Shakes rapides pour easter eggs mobiles)
    let lastShakeTime = 0;
    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const totalAcc = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      if (totalAcc > 28) {
        const now = Date.now();
        if (now - lastShakeTime > 2000) {
          lastShakeTime = now;
          const shakeEgg = findCandidateEgg('SCREEN_EDGE', (egg) => egg.triggerConfig?.shake);
          if (shakeEgg) {
            onTrigger('SCREEN_EDGE', { shake: true, magnitude: totalAcc }, shakeEgg.id || undefined);
          }
        }
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [findCandidateEgg, activeTriggerType, activeEggCode, cycleEggs, advanceKonamiSequence, onTrigger]);

  // --- GENERIC REPEATED CLICK HANDLER ---
  const handleTargetClick = useCallback(
    (targetName: string, defaultRequiredClicks = 5) => {
      const matched = findCandidateEgg('CLICK_REPEATED', (egg) => {
        const expected = egg.triggerConfig?.target;
        return !expected || expected === targetName;
      });

      if (!matched) return;

      const requiredClicks = matched.triggerConfig?.clicks || defaultRequiredClicks;
      const current = (clickCounts.current[targetName] || 0) + 1;
      clickCounts.current[targetName] = current;

      if (current >= requiredClicks) {
        onTrigger('CLICK_REPEATED', { target: targetName, clicks: current }, matched.id || undefined);
        clickCounts.current[targetName] = 0;
      }

      if (clickTimers.current[targetName]) {
        clearTimeout(clickTimers.current[targetName]);
      }
      clickTimers.current[targetName] = setTimeout(() => {
        clickCounts.current[targetName] = 0;
      }, 2500);
    },
    [findCandidateEgg, onTrigger],
  );

  // --- COMM-LINK SLASH & EXCLAMATION COMMANDS & DIRECT INPUT ---
  const handleCommLinkCommand = useCallback(
    (commandStr: string) => {
      const raw = (commandStr || '').trim().toLowerCase();
      if (!raw) return;

      // Supprimer les préfixes d'échappement (! ou /) pour une comparaison naturelle
      const cleanCmd = raw.replace(/^[!/]+/, '').trim();

      // Alternative textuelle pour le Konami Code sur mobile ou desktop
      if (cleanCmd === 'konami' || cleanCmd === 'code konami' || cleanCmd === 'arcade') {
        const konamiEgg = findCandidateEgg('KONAMI_CODE') || (activeEggCode === 'EE_KONAMI_80S' ? { id: undefined } : null);
        if (konamiEgg) {
          playKonamiSuccessSound();
          onTrigger('KONAMI_CODE', { sequence: 'konami', source: 'text_input' }, konamiEgg.id || undefined);
          return;
        }
      }

      const cmdEgg = findCandidateEgg('COMM_LINK_COMMAND', (egg) => {
        const expectedRaw = (egg.triggerConfig?.command || '').toLowerCase();
        const expectedClean = expectedRaw.replace(/^[!/]+/, '').trim();
        if (expectedClean && cleanCmd === expectedClean) return true;
        if (egg.code === 'EE_TEMPORAL_1985' && cleanCmd === '1985') return true;
        if (egg.code === 'EE_MATRIX_COMM_LINK' && cleanCmd === 'matrix') return true;
        if (egg.code === 'EE_ANTIGRAVITY' && cleanCmd === 'antigravity') return true;
        if (egg.code === 'EE_PARTY_DISCO' && cleanCmd === 'party') return true;
        return false;
      });

      if (cmdEgg) {
        onTrigger('COMM_LINK_COMMAND', { command: `!${cleanCmd}` }, cmdEgg.id || undefined);
      }
    },
    [findCandidateEgg, activeEggCode, onTrigger],
  );

  // Fermeture manuelle du HUD Konami
  const handleCloseKonamiHUD = useCallback(() => {
    if (konamiTimer.current) clearTimeout(konamiTimer.current);
    setKonamiHUD({
      isVisible: false,
      stepIndex: 0,
      isError: false,
      showMobileButtons: false,
    });
    konamiIndex.current = 0;
  }, []);

  // Pression sur boutons virtuels B ou A pour mobile
  const handleKonamiButtonPress = useCallback(
    (btn: 'b' | 'a') => {
      advanceKonamiSequence(btn);
    },
    [advanceKonamiSequence],
  );

  // --- TIMELINE WARP (Rapid Era Switch) ---
  const handleEraSwitch = useCallback(() => {
    const now = Date.now();
    const maxWindowMs = (triggerConfig?.maxSeconds || 15) * 1000;
    const requiredSwitches = triggerConfig?.eraSwitches || 5;

    eraSwitchesRef.current = [
      ...eraSwitchesRef.current.filter((t) => now - t <= maxWindowMs),
      now,
    ];

    if (eraSwitchesRef.current.length >= requiredSwitches) {
      const warpEgg =
        findCandidateEgg('TIMELINE_WARP') ||
        findCandidateEgg('COMM_LINK_COMMAND', (e) => e.code === 'EE_TEMPORAL_1985');
      if (warpEgg) {
        onTrigger('TIMELINE_WARP', { switches: eraSwitchesRef.current.length }, warpEgg.id || undefined);
      }
      eraSwitchesRef.current = [];
    }
  }, [findCandidateEgg, triggerConfig, onTrigger]);

  // --- METRIC SEQUENCE (Carbone -> Eau -> Déchets -> Carbone -> Eau) ---
  const handleMetricClick = useCallback(
    (metricName: 'carbon' | 'water' | 'waste') => {
      const metricEgg =
        findCandidateEgg('METRIC_SEQUENCE') ||
        (activeEggCode === 'EE_FIVE_NOTES_PROFILE' ? { id: undefined, triggerConfig } : null);
      if (!metricEgg) return;

      const expectedSequence = metricEgg.triggerConfig?.sequence || ['carbon', 'water', 'waste', 'carbon', 'water'];
      const currentList = [...metricSequenceRef.current, metricName];
      const currentIndex = currentList.length - 1;

      if (currentList[currentIndex] !== expectedSequence[currentIndex]) {
        // Mismatch: reset or keep first step if it matches
        metricSequenceRef.current = metricName === expectedSequence[0] ? [metricName] : [];
      } else {
        metricSequenceRef.current = currentList;
        if (metricSequenceRef.current.length === expectedSequence.length) {
          onTrigger('METRIC_SEQUENCE', { sequence: metricSequenceRef.current }, metricEgg.id || undefined);
          metricSequenceRef.current = [];
        }
      }

      if (metricSequenceTimer.current) clearTimeout(metricSequenceTimer.current);
      metricSequenceTimer.current = setTimeout(() => {
        metricSequenceRef.current = [];
      }, 7000);
    },
    [findCandidateEgg, activeEggCode, triggerConfig, onTrigger],
  );

  // --- 3D CONSTELLATION STARS CLICK HANDLER ---
  const handleStarClick = useCallback(
    (starId: number) => {
      const starEgg =
        findCandidateEgg('SCREEN_EDGE') ||
        (activeEggCode === 'EE_CONSTELLATION_3D' ? { id: undefined, triggerConfig } : null);
      if (!starEgg) return;

      const requiredStarsCount = starEgg.triggerConfig?.stars || 3;
      clickedStarsRef.current.add(starId);

      if (clickedStarsRef.current.size >= requiredStarsCount) {
        onTrigger('SCREEN_EDGE', { stars: clickedStarsRef.current.size, constellation: true }, starEgg.id || undefined);
        clickedStarsRef.current.clear();
      }
    },
    [findCandidateEgg, activeEggCode, triggerConfig, onTrigger],
  );

  // Handlers and states attached to React elements
  return {
    // Konami HUD arcade feedback and mobile buttons
    konamiHUD,
    handleKonamiButtonPress,
    handleCloseKonamiHUD,

    // Logo Hold
    handleLogoMouseDown: () => {
      const logoEgg =
        findCandidateEgg('LOGO_HOLD') ||
        (activeEggCode === 'EE_LOGO_ROCKET' ? { id: undefined, triggerConfig } : null);
      if (!logoEgg) return;
      const duration = (logoEgg.triggerConfig?.durationSeconds || 3) * 1000;
      logoHoldTimer.current = setTimeout(() => {
        onTrigger('LOGO_HOLD', { durationSeconds: duration / 1000 }, logoEgg.id || undefined);
      }, duration);
    },
    handleLogoMouseUpOrLeave: () => {
      if (logoHoldTimer.current) {
        clearTimeout(logoHoldTimer.current);
        logoHoldTimer.current = null;
      }
    },

    // Specific & Generic Click Handlers
    handleGlobeClick: () => handleTargetClick('globe2026', 7),
    handleCodexConsoleClick: () => handleTargetClick('codexConsole', 5),
    handleGenericTargetClick: handleTargetClick,

    // Interactions
    handleCommLinkCommand,
    handleEraSwitch,
    handleMetricClick,
    handleStarClick,
  };
}
