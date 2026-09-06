import { useEffect, useRef, useCallback } from 'react';
import type { EasterEggTriggerType } from '../types/easterEgg';

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
  // 1. KONAMI CODE STATE
  const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const konamiIndex = useRef(0);

  // 2. LOGO HOLD STATE
  const logoHoldTimer = useRef<NodeJS.Timeout | null>(null);

  // 3. TARGET REPEATED CLICKS (Generic: globe2026, codexConsole, etc.)
  const clickCounts = useRef<Record<string, number>>({});
  const clickTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // 4. METRIC SEQUENCE STATE (Agent Profile 5 notes)
  const metricSequenceRef = useRef<string[]>([]);
  const metricSequenceTimer = useRef<NodeJS.Timeout | null>(null);

  // 5. TIMELINE WARP STATE (Rapid era switches)
  const eraSwitchesRef = useRef<number[]>([]);

  // 6. CONSTELLATION 3D STARS STATE
  const clickedStarsRef = useRef<Set<number>>(new Set());

  // --- EFFECT: GLOBAL LISTENERS (Keyboard Konami + Device Motion) ---
  useEffect(() => {
    if (!activeTriggerType) return;

    // 1. Konami Code Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTriggerType !== 'KONAMI_CODE' && activeEggCode !== 'EE_KONAMI_80S') return;

      const key = e.key;
      const expectedKey = konamiSequence[konamiIndex.current];

      if (key === expectedKey || key.toLowerCase() === expectedKey.toLowerCase()) {
        konamiIndex.current++;
        if (konamiIndex.current === konamiSequence.length) {
          onTrigger('KONAMI_CODE', { sequence: 'konami' });
          konamiIndex.current = 0;
        }
      } else {
        konamiIndex.current = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // 2. Mobile Device Shake (for Antigravity or custom action)
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
                (triggerConfig?.command === '/antigravity' || activeEggCode === 'EE_ANTIGRAVITY')
              ) {
                onTrigger('COMM_LINK_COMMAND', { command: '/antigravity', source: 'device_shake' });
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
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [activeTriggerType, activeEggCode, triggerConfig, onTrigger]);

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

  // --- COMM-LINK SLASH COMMANDS ---
  const handleCommLinkCommand = useCallback(
    (commandStr: string) => {
      const cleanCmd = (commandStr || '').trim().toLowerCase();
      if (!cleanCmd.startsWith('/')) return;

      const expectedCommand = (triggerConfig?.command || '').toLowerCase();
      const isExpectedMatch = expectedCommand && cleanCmd === expectedCommand;

      if (activeTriggerType === 'COMM_LINK_COMMAND' && (isExpectedMatch || !expectedCommand)) {
        onTrigger('COMM_LINK_COMMAND', { command: cleanCmd });
      } else if (activeEggCode === 'EE_TEMPORAL_1985' && cleanCmd === '/1985') {
        onTrigger('COMM_LINK_COMMAND', { command: '/1985' });
      } else if (activeEggCode === 'EE_MATRIX_COMM_LINK' && cleanCmd === '/matrix') {
        onTrigger('COMM_LINK_COMMAND', { command: '/matrix' });
      } else if (activeEggCode === 'EE_ANTIGRAVITY' && cleanCmd === '/antigravity') {
        onTrigger('COMM_LINK_COMMAND', { command: '/antigravity' });
      } else if (activeEggCode === 'EE_PARTY_DISCO' && cleanCmd === '/party') {
        onTrigger('COMM_LINK_COMMAND', { command: '/party' });
      }
    },
    [activeTriggerType, triggerConfig, activeEggCode, onTrigger],
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
        (triggerConfig?.command === '/1985' || activeEggCode === 'EE_TEMPORAL_1985')
      ) {
        onTrigger('COMM_LINK_COMMAND', {
          command: '/1985',
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

  // Handlers attached to React elements
  return {
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
