import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

import { EngineN1, EngineN2, EngineN3, EngineN4, EngineN5 } from './3d/VesselEngines';


// =========================================================
export default function Vessel2070({ 
  team, 
  index, 
  total, 
  isSelected = false,
  onClick 
}: { 
  team: any; 
  index: number; 
  total: number; 
  isSelected?: boolean;
  onClick?: (teamId: number) => void;
}) {
  const outerGroupRef = useRef<THREE.Group>(null);
  const innerGroupRef = useRef<THREE.Group>(null);
  
  const matCentralRef = useRef<THREE.MeshStandardMaterial>(null);
  const matAilesRef = useRef<THREE.MeshStandardMaterial>(null);
  const matCockpitRef = useRef<THREE.MeshBasicMaterial>(null);
  
  const navLightRRef = useRef<THREE.MeshBasicMaterial>(null);
  const navLightLRef = useRef<THREE.MeshBasicMaterial>(null);

  const xOffset = total > 1 ? (index - (total - 1) / 2) * 2.5 : 0;
  const targetZ = 11 - (team.position / 100) * 17; // Modifié pour stopper plus tôt et rester grand

  // Niveau dynamique du vaisseau (fallback = 1)
  const level = team.level || 1;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // 1. Déplacement global sur la piste
    if (outerGroupRef.current) {
      outerGroupRef.current.position.z = THREE.MathUtils.lerp(outerGroupRef.current.position.z, targetZ, 0.05);
    }

    // 2. Animations locales (flottaison, vibrations, inclinaisons)
    if (innerGroupRef.current) {
      const floatAmp = level === 1 ? 0.05 : 0.02;
      let localY = -0.5 + Math.sin(t * 3.5 + index) * floatAmp;
      let localX = 0;
      let localZ = 0;

      // Vibrations d'instabilité pour N1
      if (level === 1) {
        localX += (Math.random() - 0.5) * 0.025;
        localY += (Math.random() - 0.5) * 0.025;
        localZ += (Math.random() - 0.5) * 0.025;
      }

      // Comportement quantique pour le niveau 4 (Résonance Quantique)
      if (level === 4) {
        // Effet fantôme / scintillement très léger, sans modifier la transparence globale du vaisseau
        const flicker = 0.8 + (Math.sin(t * 20) > 0 ? 0.2 : 0.0);
        if (matCentralRef.current) { matCentralRef.current.opacity = flicker; matCentralRef.current.transparent = true; }
        if (matAilesRef.current) { matAilesRef.current.opacity = flicker; matAilesRef.current.transparent = true; }
        
        // Lévitation quantique souple (plus ample et plus rapide, mais continue)
        localY += Math.sin(t * 6.0 + index) * 0.08;
      } else {
        if (matCentralRef.current) { matCentralRef.current.opacity = 1; matCentralRef.current.transparent = false; }
        if (matAilesRef.current) { matAilesRef.current.opacity = 1; matAilesRef.current.transparent = false; }
        if (matCockpitRef.current) { matCockpitRef.current.opacity = 0.92; matCockpitRef.current.transparent = true; }
      }

      innerGroupRef.current.position.set(localX, localY, localZ);

      // Oscillations angulaires de vol (lacet et roulis)
      let rotZ = Math.sin(t * 2 + index) * 0.06;
      let rotY = Math.sin(t * 1.2 + index) * 0.03;

      if (level === 1) {
        rotZ += (Math.random() - 0.5) * 0.02;
        rotY += (Math.random() - 0.5) * 0.02;
      }

      innerGroupRef.current.rotation.set(0, rotY, rotZ);
    }

    const blink = Math.sin(t * 10) > 0;
    if (navLightRRef.current) navLightRRef.current.visible = blink;
    if (navLightLRef.current) navLightLRef.current.visible = blink;
  });

  const colorHex = team.color || '#00ffcc';
  const isGreenTeam = colorHex.toLowerCase() === '#00ffcc' || colorHex.toLowerCase() === '#10b981' || colorHex.toLowerCase() === '#00ff00';
  const flameColor = isGreenTeam ? '#00ff66' : '#ff5a00';
  const flameInnerColor = isGreenTeam ? '#caffff' : '#ffea88';

  return (
    <group 
      ref={outerGroupRef} 
      position={[xOffset, 0, 11]} 
      scale={[1.4, 1.4, 1.4]}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(team.id);
        }
      }}
      onPointerOver={(e) => {
        if (onClick) {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={(e) => {
        if (onClick) {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
        }
      }}
    >
      <group ref={innerGroupRef}>
        <pointLight position={[0, -0.2, 0]} color={colorHex} intensity={1.2} distance={4.0} decay={2.0} />

        {/* --- GÉOMÉTRIE DU CHASSIS (Couleur d'équipe préservée) --- */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.2]}>
          <coneGeometry args={[0.18, 0.8, 4]} />
          <meshStandardMaterial ref={matCentralRef} color={colorHex} metalness={0.92} roughness={0.15} wireframe={level === 4} />
        </mesh>
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.58]}>
          <coneGeometry args={[0.07, 0.25, 4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.05} />
        </mesh>

        <mesh position={[0.11, -0.02, -0.42]} rotation={[0, -0.1, 0.12]}>
          <boxGeometry args={[0.14, 0.015, 0.08]} />
          <meshStandardMaterial color={colorHex} metalness={0.8} />
        </mesh>
        <mesh position={[-0.11, -0.02, -0.42]} rotation={[0, 0.1, -0.12]}>
          <boxGeometry args={[0.14, 0.015, 0.08]} />
          <meshStandardMaterial color={colorHex} metalness={0.8} />
        </mesh>

        <mesh position={[0.16, 0.03, -0.14]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.045, 0.045, 0.16, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.16, 0.03, -0.14]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.045, 0.045, 0.16, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
        
        <mesh position={[0, 0.22, 0.18]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.02, 0.24, 0.15]} />
          <meshStandardMaterial color={colorHex} metalness={0.8} />
        </mesh>

        <mesh position={[0.34, 0.04, 0.1]} rotation={[0, 0.2, 0.25]}>
          <boxGeometry args={[0.36, 0.02, 0.22]} />
          <meshStandardMaterial ref={matAilesRef} color={colorHex} metalness={0.9} wireframe={level === 4} />
        </mesh>
        <mesh position={[-0.34, 0.04, 0.1]} rotation={[0, -0.2, -0.25]}>
          <boxGeometry args={[0.36, 0.02, 0.22]} />
          <meshStandardMaterial color={colorHex} metalness={0.9} wireframe={level === 4} />
        </mesh>

        <mesh position={[0.5, 0.08, 0.12]} rotation={[0, 0.2, 0.6]}>
          <boxGeometry args={[0.01, 0.12, 0.16]} />
          <meshStandardMaterial color={colorHex} metalness={0.9} />
        </mesh>
        <mesh position={[-0.5, 0.08, 0.12]} rotation={[0, -0.2, -0.6]}>
          <boxGeometry args={[0.01, 0.12, 0.16]} />
          <meshStandardMaterial color={colorHex} metalness={0.9} />
        </mesh>

        <mesh position={[0.5, 0.14, 0.12]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial ref={navLightRRef} color="#00ff33" />
        </mesh>
        <mesh position={[-0.5, 0.14, 0.12]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial ref={navLightLRef} color="#ff0033" />
        </mesh>

        <mesh position={[0, 0.07, -0.1]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshBasicMaterial ref={matCockpitRef} color="#090d16" transparent opacity={0.92} wireframe={level === 4} />
        </mesh>

        {/* --- PROPULSEURS DYNAMIQUES SELON NIVEAU --- */}
        {level === 1 && <EngineN1 flameColor={flameColor} flameInnerColor={flameInnerColor} />}
        {level === 2 && <EngineN2 />}
        {level === 3 && <EngineN3 />}
        {level === 4 && <EngineN4 />}
        {level === 5 && <EngineN5 />}

        {/* Halo / Anneau de Sélection Holographique 3D */}
        {isSelected && (
          <group position={[0, -0.15, -0.2]}>
            {/* Anneau principal */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.55, 0.62, 36]} />
              <meshBasicMaterial 
                color={colorHex} 
                transparent 
                opacity={0.85} 
                blending={THREE.AdditiveBlending} 
                side={THREE.DoubleSide} 
                depthWrite={false} 
              />
            </mesh>
            {/* Halo externe diffus */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.7, 0.76, 36]} />
              <meshBasicMaterial 
                color={colorHex} 
                transparent 
                opacity={0.4} 
                blending={THREE.AdditiveBlending} 
                side={THREE.DoubleSide} 
                depthWrite={false} 
              />
            </mesh>
            {/* Point lumineux d'ambiance */}
            <pointLight color={colorHex} intensity={2.5} distance={3.5} />
          </group>
        )}

        {/* Panneau holographique au-dessus du vaisseau */}
        <Billboard position={[0, 0.6, 0]} follow={true}>
          <mesh>
            <ringGeometry args={[0.16, 0.2, 6]} />
            <meshBasicMaterial color={colorHex} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <Text
            position={[0, 0, 0]}
            fontSize={0.18}
            color={colorHex}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#000000"
          >
            N{level}
          </Text>
        </Billboard>


      </group>
    </group>
  );
}
