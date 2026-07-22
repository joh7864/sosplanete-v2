import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import PodiumGroup from './PodiumGroup';
import CylinderCarousel from './CylinderCarousel';

interface LeaderboardScene3DProps {
  topPlayers: any[];
  childInfos: any;
  activeView: 'podium' | 'cylinder';
  setSelectedProfileId: (id: number | null) => void;
  setShowLeaderboardModal: (show: boolean) => void;
  focusedPlayerId: number | null;
  onFocusedPlayerReset: () => void;
}

export default function LeaderboardScene3D({
  topPlayers,
  childInfos,
  setSelectedProfileId,
  setShowLeaderboardModal,
  focusedPlayerId,
  onFocusedPlayerReset,
}: Omit<LeaderboardScene3DProps, 'activeView'>) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Position et cible de caméra fixes pour conserver le cadrage cinématique de la maquette
  const targetCamPos = useRef(new THREE.Vector3(0, 2.3, 5.8));
  const targetCamLookAt = useRef(new THREE.Vector3(0, 0.25, 0));

  useEffect(() => {
    camera.position.copy(targetCamPos.current);
    if (controlsRef.current) {
      controlsRef.current.target.copy(targetCamLookAt.current);
      controlsRef.current.update();
    }
  }, [camera]);

  useFrame(() => {
    // Interpolation légère de maintien pour la caméra
    camera.position.lerp(targetCamPos.current, 0.08);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetCamLookAt.current, 0.08);
      controlsRef.current.update();
    }
  });

  const top3 = topPlayers.slice(0, 3);
  const remaining = topPlayers.slice(3);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 6, 4]} intensity={0.95} color="#ffffff" castShadow />
      <pointLight position={[0, 4, 1]} intensity={1.2} color="#ffd700" distance={8} />
      
      <OrbitControls 
        ref={controlsRef}
        enableZoom={true} 
        enablePan={false}
        enableRotate={false} // Désactivé pour que le drag horizontal fasse tourner le carrousel de cartes et non la caméra, conservant le cadrage
        minDistance={3.0}
        maxDistance={8}
      />

      <group position={[0, -0.6, 0]}>
        {/* Podium Top 3 surélevé sur la base "Cyber Circuit" */}
        <PodiumGroup 
          players={top3} 
          childInfos={childInfos}
          setSelectedProfileId={setSelectedProfileId}
          setShowLeaderboardModal={setShowLeaderboardModal}
          visible={true}
        />

        {/* Carrousel en anneau de cartes Top 4-10 tout autour de la base */}
        <CylinderCarousel 
          players={remaining}
          childInfos={childInfos}
          setSelectedProfileId={setSelectedProfileId}
          setShowLeaderboardModal={setShowLeaderboardModal}
          active={true}
          focusedPlayerId={focusedPlayerId}
          onFocusedPlayerReset={onFocusedPlayerReset}
        />
      </group>
    </>
  );
}
