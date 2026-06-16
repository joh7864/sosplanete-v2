import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

// =========================================================
// PARTICULES ET EFFETS N1 (Turbines à combustion)
// =========================================================
function BlackSmokeParticles() {
  const count = 50;
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 2] = 0.4 + Math.random() * 2.0;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        posArr[i * 3 + 2] += 0.08 + Math.random() * 0.04;
        posArr[i * 3] += (Math.random() - 0.5) * 0.03;
        posArr[i * 3 + 1] += (Math.random() - 0.5) * 0.03;
        if (posArr[i * 3 + 2] > 3.0) {
          posArr[i * 3] = (Math.random() - 0.5) * 0.3;
          posArr[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
          posArr[i * 3 + 2] = 0.4;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.35} color="#050505" transparent opacity={0.8} depthWrite={false} />
    </points>
  );
}

function SparkParticles() {
  const count = 40;
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 2] = 0.4 + Math.random();
    }
    return pos;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        posArr[i * 3 + 2] += 0.15 + Math.random() * 0.1;
        posArr[i * 3] += (Math.random() - 0.5) * 0.05;
        posArr[i * 3 + 1] += (Math.random() - 0.5) * 0.05;
        if (posArr[i * 3 + 2] > 2.0) {
          posArr[i * 3] = (Math.random() - 0.5) * 0.3;
          posArr[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
          posArr[i * 3 + 2] = 0.4;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#ff3b00" transparent opacity={1.0} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function EngineN1({ flameColor, flameInnerColor }: { flameColor: string, flameInnerColor: string }) {
  const flameLRef = useRef<THREE.Mesh>(null);
  const flameLInnerRef = useRef<THREE.Mesh>(null);
  const flameRRef = useRef<THREE.Mesh>(null);
  const flameRInnerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const localPulseL = 1.0 + Math.sin(t * 38) * 0.15 + (Math.random() - 0.5) * 0.1;
    const localPulseR = 1.0 + Math.cos(t * 34) * 0.15 + (Math.random() - 0.5) * 0.1;
    
    if (flameLRef.current) flameLRef.current.scale.set(localPulseL, 1.2 + Math.sin(t * 45) * 0.2, localPulseL);
    if (flameLInnerRef.current) flameLInnerRef.current.scale.set(localPulseL * 0.8, 1.0 + Math.cos(t * 50) * 0.15, localPulseL * 0.8);
    if (flameRRef.current) flameRRef.current.scale.set(localPulseR, 1.2 + Math.cos(t * 45) * 0.2, localPulseR);
    if (flameRInnerRef.current) flameRInnerRef.current.scale.set(localPulseR * 0.8, 1.0 + Math.sin(t * 50) * 0.15, localPulseR * 0.8);
  });

  return (
    <group>
      <mesh position={[-0.12, -0.02, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.18, 12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh position={[0.12, -0.02, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.18, 12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.15} />
      </mesh>

      <group position={[-0.12, -0.02, 0.38]}>
        <mesh ref={flameLRef} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.08, 0.7, 8, 1, true]} />
          <meshBasicMaterial color={flameColor} transparent opacity={0.85} />
        </mesh>
        <mesh ref={flameLInnerRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]}>
          <coneGeometry args={[0.04, 0.4, 8, 1, true]} />
          <meshBasicMaterial color={flameInnerColor} transparent opacity={0.95} />
        </mesh>
      </group>
      
      <group position={[0.12, -0.02, 0.38]}>
        <mesh ref={flameRRef} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.08, 0.7, 8, 1, true]} />
          <meshBasicMaterial color={flameColor} transparent opacity={0.85} />
        </mesh>
        <mesh ref={flameRInnerRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]}>
          <coneGeometry args={[0.04, 0.4, 8, 1, true]} />
          <meshBasicMaterial color={flameInnerColor} transparent opacity={0.95} />
        </mesh>
      </group>

      <pointLight position={[0, -0.02, 0.55]} color={flameColor} intensity={3.2} distance={5.0} decay={1.8} />

      <BlackSmokeParticles />
      <SparkParticles />
    </group>
  );
}

// =========================================================
// MOTEUR N2 (Voiles Photovoltaïques)
// =========================================================
function StellarWindParticles() {
  const count = 60;
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.0;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 2] = 0.5 + Math.random() * 3.0;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        posArr[i * 3 + 2] += 0.2;
        if (posArr[i * 3 + 2] > 4.0) {
          posArr[i * 3] = (Math.random() - 0.5) * 3.0;
          posArr[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
          posArr[i * 3 + 2] = 0.5;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00ffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function EngineDebris() {
  const count = 12;
  const groupRef = useRef<THREE.Group>(null);
  const debrisData = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      pos: [(Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 0.4],
      vel: [(Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, 0.05 + Math.random() * 0.1],
      rotVel: [Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2]
    }));
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.x += debrisData[i].vel[0];
        child.position.y += debrisData[i].vel[1];
        child.position.z += debrisData[i].vel[2];
        child.rotation.x += debrisData[i].rotVel[0];
        child.rotation.y += debrisData[i].rotVel[1];
        child.rotation.z += debrisData[i].rotVel[2];
      });
    }
  });

  return (
    <group ref={groupRef}>
      {debrisData.map((_, i) => (
        <mesh key={i} position={debrisData[i].pos as any}>
          <boxGeometry args={[0.05, 0.05, 0.08]} />
          <meshStandardMaterial color="#333" metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function EngineN2() {
  const sailRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (sailRef.current) {
      sailRef.current.scale.x = THREE.MathUtils.lerp(sailRef.current.scale.x, 1.0, 0.05);
    }
    if (flashRef.current) {
      flashRef.current.intensity = THREE.MathUtils.lerp(flashRef.current.intensity, 0, 0.1);
    }
  });

  return (
    <group>
      <pointLight ref={flashRef} color="#ffd700" intensity={5.0} distance={10} />
      <EngineDebris />

      <group ref={sailRef} scale={[0.1, 1, 1]} position={[0, 0.1, 0.2]}>
        <mesh position={[-0.8, 0, 0]} rotation={[0.2, 0.1, 0.1]}>
          <planeGeometry args={[1.2, 0.4]} />
          <meshPhysicalMaterial color="#ffd700" transparent opacity={0.6} side={THREE.DoubleSide} clearcoat={1.0} roughness={0.1} />
        </mesh>
        <mesh position={[0.8, 0, 0]} rotation={[0.2, -0.1, -0.1]}>
          <planeGeometry args={[1.2, 0.4]} />
          <meshPhysicalMaterial color="#ffd700" transparent opacity={0.6} side={THREE.DoubleSide} clearcoat={1.0} roughness={0.1} />
        </mesh>
      </group>

      <StellarWindParticles />
    </group>
  );
}

// =========================================================
// MOTEUR N3 (Fusion Magnétique)
// =========================================================
function EngineN3() {
  const shockwaveRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (shockwaveRef.current) {
      shockwaveRef.current.scale.addScalar(0.2);
      const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 0.1);
    }
  });

  return (
    <group>
      <mesh ref={shockwaveRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh position={[0, -0.02, 0.35]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.15, 0.04, 16, 32]} />
        <meshStandardMaterial color="#a855f7" emissive="#d8b4fe" emissiveIntensity={2.0} />
      </mesh>

      <mesh position={[0, -0.02, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.02, 2.5, 16]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      
      <mesh position={[0, -0.02, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.01, 1.5, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      
      <pointLight position={[0, -0.02, 0.4]} color="#a855f7" intensity={4.0} distance={6.0} />
    </group>
  );
}

// =========================================================
// MOTEUR N4 (Résonance Quantique)
// =========================================================
function QuantumPixelParticles() {
  const count = 60;
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 2] = 0.2 + Math.random() * 2.0;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        if (Math.random() > 0.8) {
          posArr[i * 3 + 2] += 0.2; 
          posArr[i * 3] += (Math.random() - 0.5) * 0.1;
          posArr[i * 3 + 1] += (Math.random() - 0.5) * 0.1;
        }
        if (posArr[i * 3 + 2] > 2.5) {
          posArr[i * 3] = (Math.random() - 0.5) * 0.4;
          posArr[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
          posArr[i * 3 + 2] = 0.2;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#00ffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function EngineN4() {
  const explosionRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (explosionRef.current) {
      explosionRef.current.scale.addScalar(0.3);
      const mat = explosionRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 0.1);
    }
  });

  return (
    <group>
      <mesh ref={explosionRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.8} wireframe />
      </mesh>
      <QuantumPixelParticles />
    </group>
  );
}

// =========================================================
// MOTEUR N5 (Singularité Protonique)
// =========================================================
function EngineN5() {
  const flashRef = useRef<THREE.PointLight>(null);
  const diskRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (flashRef.current) {
      flashRef.current.intensity = THREE.MathUtils.lerp(flashRef.current.intensity, 0, 0.05);
    }
    if (diskRef.current) {
      diskRef.current.rotation.x = Math.sin(t * 5) * 0.2;
      diskRef.current.rotation.y = t * 10;
    }
  });

  return (
    <group position={[0, -0.02, 0.4]}>
      {/* Implosion (Lumière) */}
      <pointLight ref={flashRef} color="#ffffff" intensity={8.0} distance={15} />

      {/* Bras magnétiques */}
      <mesh position={[-0.15, 0, -0.1]} rotation={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.2]} />
        <meshStandardMaterial color="#333" metalness={0.9} />
      </mesh>
      <mesh position={[0.15, 0, -0.1]} rotation={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.2]} />
        <meshStandardMaterial color="#333" metalness={0.9} />
      </mesh>

      {/* Micro trou noir */}
      <mesh>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Disque d'accrétion */}
      <mesh ref={diskRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.02, 16, 64]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.04, 16, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Cône de lumière continue */}
      <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.5, 3.0, 32, 1, true]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.04} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 2.0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.0, 4.0, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.02} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// =========================================================
// COMPOSANT PRINCIPAL VESSEL
// =========================================================
export default function Vessel2070({ team, index, total }: { team: any; index: number; total: number }) {
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
    <group ref={outerGroupRef} position={[xOffset, 0, 11]} scale={[1.4, 1.4, 1.4]}>
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
