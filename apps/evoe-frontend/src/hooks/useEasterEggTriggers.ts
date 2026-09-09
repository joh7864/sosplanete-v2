import { useState, useEffect, useRef, useCallback } from 'react';
import type { EasterEggTriggerType } from '../types/easterEgg';
import {
  playKonamiStepSound,
  playKonamiErrorSound,
  playKonamiSuccessSound,
} from '../utils/easterEggAudio';

interface UseEasterEggTriggersProps {
  activeTriggerType?: EasterEggTriggerType;
  triggerConfig?: any;
  activeEggCode?: string;
  onTrigger: (triggerType: EasterEggTriggerType, metadata?: any) => void;
}

export function useEasterEggTriggers({
  activeTriggerType,
  triggerConfig,
  activeEggCode,
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
          onTrigger('KONAMI_CODE', { sequence: 'konami' });
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
    [onTrigger],
  );

  // --- EFFECT: GLOBAL LISTENERS (Keyboard Konami + Touch Swipes + Device Motion) ---
  useEffect(() => {
    if (!activeTriggerType) return;

    // 1. Konami Code Listener (Touches Clavier)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si l'utilisateur est en train de taper dans un champ de formulaire
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (activeTriggerType !== 'KONAMI_CODE' && activeEggCode !== 'EE_KONAMI_80S') return;

      advanceKonamiSequence(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);

    // 2. Mobile Touch Swipes Listener (Swipes tactiles directionnels pour mobile)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (activeTriggerType !== 'KONAMI_CODE' && activeEggCode !== 'EE_KONAMI_80S') return;
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (activeTriggerType !== 'KONAMI_CODE' && activeEggCode !== 'EE_KONAMI_80S') return;
      if (e.changedTouches.length !== 1) return;

      const elapsed = Date.now() - touchStartTime;
      if (elapsed > 1200) return; // Glissement trop lent ignoré

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      const minSwipeDistance = 35;
      if (Math.max(absDx, absDy) < minSwipeDistance) return;

      if (absDx > absDy) {
        // Balayage horizontal
        advanceKonamiSequence(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
      } else {
        // Balayage vertical
        advanceKonamiSequence(dy > 0 ? 'ArrowDown' : 'ArrowUp');
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    // 3. Mobile Device Shake (pour Antigravity ou custom action)
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    let shakeHits = 0;
    let lastShakeTimestamp = 0;

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const now = Date.now();
      if (lastX !== null && lastY !== null && lastZ !== null) {
        const delta = Math.abs(lastX - acc.x) + Math.abs(lastY - acc.y) + Math.abs(lastZ - acc.z);
        if (delta > 25) {
          if (now - lastShakeTimestamp > 300) {
            shakeHits++;
            lastShakeTimestamp = now;
            if (shakeHits >= 3) {
              if (
                activeTriggerType === 'COMM_LINK_COMMAND' &&
                (triggerConfig?.command === '!antigravity' || triggerConfig?.command === '/antigravity' || activeEggCode === 'EE_ANTIGRAVITY')
              ) {
                onTrigger('COMM_LINK_COMMAND', { command: '!antigravity', source: 'device_shake' });
              } else if (activeTriggerType === 'CUSTOM_ACTION') {
                onTrigger('CUSTOM_ACTION', { action: 'shake' });
              }
              shakeHits = 0;
            }
          }
        }
      }

      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [activeTriggerType, activeEggCode, triggerConfig, onTrigger, advanceKonamiSequence]);

  // --- GENERIC REPEATED CLICK HANDLER ---
  const handleTargetClick = useCallback(
    (targetName: string, defaultRequiredClicks = 5) => {
      if (activeTriggerType !== 'CLICK_REPEATED') return;

      const expectedTarget = triggerConfig?.target;
      // If a specific target is required by config, check match
      if (expectedTarget && expectedTarget !== targetName) return;

      const requiredClicks = triggerConfig?.clicks || defaultRequiredClicks;
      const current = (clickCounts.current[targetName] || 0) + 1;
      clickCounts.current[targetName] = current;

      if (current >= requiredClicks) {
        onTrigger('CLICK_REPEATED', { target: targetName, clicks: current });
        clickCounts.current[targetName] = 0;
      }

      if (clickTimers.current[targetName]) {
        clearTimeout(clickTimers.current[targetName]);
      }
      clickTimers.current[targetName] = setTimeout(() => {
        clickCounts.current[targetName] = 0;
      }, 2500);
    },
    [activeTriggerType, triggerConfig, onTrigger],
  );

  // --- COMM-LINK SLASH & EXCLAMATION COMMANDS & DIRECT INPUT ---
  const handleCommLinkCommand = useCallback(
    (commandStr: string) => {
      const raw = (commandStr || '').trim().toLowerCase();
      if (!raw) return;

      // Supprimer les préfixes d'échappement (! ou /) pour une comparaison naturelle
      const cleanCmd = raw.replace(/^[!/]+/, '').trim();

      // Alternative textuelle pour le Konami Code sur mobile ou desktop
      if (
        (cleanCmd === 'konami' || cleanCmd === 'code konami' || cleanCmd === 'arcade') &&
        (activeTriggerType === 'KONAMI_CODE' || activeEggCode === 'EE_KONAMI_80S')
      ) {
        playKonamiSuccessSound();
        onTrigger('KONAMI_CODE', { sequence: 'konami', source: 'text_input' });
        return;
      }

      const expectedRaw = (triggerConfig?.command || '').toLowerCase();
      const expectedClean = expectedRaw.replace(/^[!/]+/, '').trim();

      const isExpectedMatch = expectedClean && cleanCmd === expectedClean;

      if (activeTriggerType === 'COMM_LINK_COMMAND' && (isExpectedMatch || !expectedClean)) {
        onTrigger('COMM_LINK_COMMAND', { command: `!${cleanCmd}` });
      } else if (activeEggCode === 'EE_TEMPORAL_1985' && cleanCmd === '1985') {
        onTrigger('COMM_LINK_COMMAND', { command: '!1985' });
      } else if (activeEggCode === 'EE_MATRIX_COMM_LINK' && cleanCmd === 'matrix') {
        onTrigger('COMM_LINK_COMMAND', { command: '!matrix' });
      } else if (activeEggCode === 'EE_ANTIGRAVITY' && cleanCmd === 'antigravity') {
        onTrigger('COMM_LINK_COMMAND', { command: '!antigravity' });
      } else if (activeEggCode === 'EE_PARTY_DISCO' && cleanCmd === 'party') {
        onTrigger('COMM_LINK_COMMAND', { command: '!party' });
      }
    },
    [activeTriggerType, triggerConfig, activeEggCode, onTrigger],
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
      if (activeTriggerType === 'TIMELINE_WARP') {
        onTrigger('TIMELINE_WARP', { switches: eraSwitchesRef.current.length });
      } else if (
        activeTriggerType === 'COMM_LINK_COMMAND' &&
        (triggerConfig?.command === '!1985' || triggerConfig?.command === '/1985' || activeEggCode === 'EE_TEMPORAL_1985')
      ) {
        onTrigger('COMM_LINK_COMMAND', {
          command: '!1985',
          source: 'era_switch_warp',
          switches: eraSwitchesRef.current.length,
        });
      }
      eraSwitchesRef.current = [];
    }
  }, [activeTriggerType, triggerConfig, activeEggCode, onTrigger]);

  // --- METRIC SEQUENCE (Carbone -> Eau -> Déchets -> Carbone -> Eau) ---
  const handleMetricClick = useCallback(
    (metricName: 'carbon' | 'water' | 'waste') => {
      if (activeTriggerType !== 'METRIC_SEQUENCE' && activeEggCode !== 'EE_FIVE_NOTES_PROFILE') {
        return;
      }

      const expectedSequence = triggerConfig?.sequence || ['carbon', 'water', 'waste', 'carbon', 'water'];
      const currentList = [...metricSequenceRef.current, metricName];
      const currentIndex = currentList.length - 1;

      if (currentList[currentIndex] !== expectedSequence[currentIndex]) {
        // Mismatch: reset or keep first step if it matches
        metricSequenceRef.current = metricName === expectedSequence[0] ? [metricName] : [];
      } else {
        metricSequenceRef.current = currentList;
        if (metricSequenceRef.current.length === expectedSequence.length) {
          onTrigger('METRIC_SEQUENCE', { sequence: metricSequenceRef.current });
          metricSequenceRef.current = [];
        }
      }

      if (metricSequenceTimer.current) clearTimeout(metricSequenceTimer.current);
      metricSequenceTimer.current = setTimeout(() => {
        metricSequenceRef.current = [];
      }, 7000);
    },
    [activeTriggerType, triggerConfig, activeEggCode, onTrigger],
  );

  // --- 3D CONSTELLATION STARS CLICK HANDLER ---
  const handleStarClick = useCallback(
    (starId: number) => {
      if (activeTriggerType !== 'SCREEN_EDGE' && activeEggCode !== 'EE_CONSTELLATION_3D') return;

      const requiredStarsCount = triggerConfig?.stars || 3;
      clickedStarsRef.current.add(starId);

      if (clickedStarsRef.current.size >= requiredStarsCount) {
        onTrigger('SCREEN_EDGE', { stars: clickedStarsRef.current.size, constellation: true });
        clickedStarsRef.current.clear();
      }
    },
    [activeTriggerType, triggerConfig, activeEggCode, onTrigger],
  );

  // Handlers and states attached to React elements
  return {
    // Konami HUD arcade feedback and mobile buttons
    konamiHUD,
    handleKonamiButtonPress,
    handleCloseKonamiHUD,

    // Logo Hold
    handleLogoMouseDown: () => {
      if (activeTriggerType !== 'LOGO_HOLD' && activeEggCode !== 'EE_LOGO_ROCKET') return;
      const duration = (triggerConfig?.durationSeconds || 3) * 1000;
      logoHoldTimer.current = setTimeout(() => {
        onTrigger('LOGO_HOLD', { durationSeconds: duration / 1000 });
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
