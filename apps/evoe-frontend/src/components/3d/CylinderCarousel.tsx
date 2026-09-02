import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerAvatar } from './PlayerAvatar';

interface CylinderCarouselProps {
  players: any[];
  childInfos: any;
  setSelectedProfileId: (id: number | null) => void;
  setShowLeaderboardModal: (show: boolean) => void;
  active: boolean;
  focusedPlayerId: number | null;
  onFocusedPlayerReset: () => void;
}

export default function CylinderCarousel({
  players,
  childInfos,
  setSelectedProfileId,
  setShowLeaderboardModal: _setShowLeaderboardModal, // ignoré pour ne plus fermer le classement lors du clic profil
  active: _active,
  focusedPlayerId,
  onFocusedPlayerReset,
}: CylinderCarouselProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  const isDragging = useRef(false);
  const previousX = useRef(0);
  
  const targetRotationY = useRef(0);
  const currentRotationY = useRef(0);

  const radius = 3.3;
  const count = players.length;
  const angleStep = count > 0 ? (2 * Math.PI) / count : 0;

  // Interaction de glissement horizontal (drag)
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;

      isDragging.current = true;
      previousX.current = e.clientX;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - previousX.current;
      previousX.current = e.clientX;
      targetRotationY.current += deltaX * 0.0075;
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  // Recentrage automatique (Me trouver)
  useEffect(() => {
    if (focusedPlayerId !== null && count > 0) {
      const idx = players.findIndex(p => p.childId === focusedPlayerId);
      if (idx !== -1) {
        // Aligne l'avatar ciblé exactement au premier plan (angle = 0)
        // La position de face caméra correspond à angle = 0, donc rotation du groupe = -idx * angleStep
        const targetRot = -idx * angleStep;
        const currentRot = currentRotationY.current;
        const diff = targetRot - currentRot;
        const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
        
        targetRotationY.current = currentRot + normalizedDiff;
        onFocusedPlayerReset();
      }
    }
  }, [focusedPlayerId, players, count, angleStep, onFocusedPlayerReset]);

  useFrame(() => {
    if (groupRef.current) {
      currentRotationY.current += (targetRotationY.current - currentRotationY.current) * 0.08;
      groupRef.current.rotation.y = currentRotationY.current;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {players.map((p, idx) => {
        // Le 4ème (idx = 0) est à angle = 0 (devant), les suivants vers la droite (angle positif)
        const angle = idx * angleStep;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const rank = idx + 4;
        const isCurrent = p.childId === childInfos?.id;

        return (
          <group key={p.childId} position={[x, -0.55, z]}>
            {/* Avatar 3D de l'agent en orbite avec étiquette de classement enrichie (#4 - 450 IT) */}
            <PlayerAvatar 
              player={{
                ...p,
                isCurrent: isCurrent
              }}
              position={[0, 0, 0]}
              avatarScale={0.65}
              showHealth={false}
              rankTag={`#${rank} • ${p.score ?? 0} IT`}
              onSelectPlayer={(player) => setSelectedProfileId(player.childId)}
            />
          </group>
        );
      })}
    </group>
  );
}
