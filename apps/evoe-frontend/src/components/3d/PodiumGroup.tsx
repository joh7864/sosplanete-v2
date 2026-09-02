import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerAvatar } from './PlayerAvatar';

// 1. Fontaines de particules d'énergie montantes thématiques
function PodiumParticles({ count = 35, color = '#00ffcc', basePosition = [0, 0, 0] }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.35;
      pos[i * 3] = basePosition[0] + Math.cos(angle) * radius;
      pos[i * 3 + 1] = basePosition[1] + Math.random() * 1.5;
      pos[i * 3 + 2] = basePosition[2] + Math.sin(angle) * radius;
      spd[i] = 0.008 + Math.random() * 0.012;
    }
    return [pos, spd];
  }, [count, basePosition]);

  useFrame(() => {
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posArr = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        posArr[i * 3 + 1] += speeds[i];
        if (posArr[i * 3 + 1] > basePosition[1] + 1.5) {
          posArr[i * 3 + 1] = basePosition[1];
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 0.35;
          posArr[i * 3] = basePosition[0] + Math.cos(angle) * radius;
          posArr[i * 3 + 2] = basePosition[2] + Math.sin(angle) * radius;
        }
      }
      geo.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial 
        color={color} 
        size={0.065} 
        transparent={true} 
        opacity={0.7} 
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 2. Anneaux orbitaux
function OrbitalRings({ position, color, radius = 0.58 }: { position: [number, number, number]; color: string; radius?: number }) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.4;
      ring1Ref.current.rotation.y = t * 0.6;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.5;
      ring2Ref.current.rotation.z = t * 0.3;
    }
  });

  return (
    <group position={position}>
      <mesh ref={ring1Ref} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[radius, 0.012, 8, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 6, Math.PI / 4, 0]}>
        <torusGeometry args={[radius * 1.15, 0.008, 8, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}



// 4. Projecteur balayant
function SweepingSpotlight({ position, targetPos, color }: { position: [number, number, number]; targetPos: [number, number, number]; color: string }) {
  const spotRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (targetRef.current) {
      targetRef.current.position.set(
        targetPos[0] + Math.sin(t * 1.2) * 0.35,
        targetPos[1],
        targetPos[2] + Math.cos(t * 1.2) * 0.35
      );
    }
  });

  return (
    <>
      <object3D ref={targetRef} position={targetPos} />
      <spotLight 
        ref={spotRef}
        position={position} 
        target={targetRef.current || undefined}
        intensity={3.2} 
        color={color} 
        angle={0.25} 
        penumbra={0.7} 
        castShadow
      />
    </>
  );
}

// 5. Capsule Lumineuse thématique colorée
function ColoredCapsule({ 
  position, 
  height, 
  radius, 
  color,
  onClick,
}: { 
  position: [number, number, number]; 
  height: number; 
  radius: number; 
  color: string;
  onClick?: () => void;
}) {
  return (
    <group 
      position={position}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
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
      {/* Cylindre de verre externe coloré translucide */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 32]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={0.25}
          roughness={0.15}
          metalness={0.7}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Noyau d'énergie émissif interne lumineux */}
      <mesh scale={[0.7, 0.98, 0.7]}>
        <cylinderGeometry args={[radius, radius, height, 32]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Cerclage métallique supérieur */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 1.05, radius * 1.05, 0.05, 32]} />
        <meshStandardMaterial color="#4a5568" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Cerclage métallique inférieur */}
      <mesh position={[0, -height / 2, 0]}>
        <cylinderGeometry args={[radius * 1.05, radius * 1.05, 0.05, 32]} />
        <meshStandardMaterial color="#4a5568" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

interface PodiumGroupProps {
  players: any[];
  childInfos: any;
  setSelectedProfileId: (id: number | null) => void;
  setShowLeaderboardModal: (show: boolean) => void;
  visible: boolean;
}

export default function PodiumGroup({
  players,
  childInfos,
  setSelectedProfileId,
  setShowLeaderboardModal,
  visible,
}: PodiumGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Oscillation verticale des avatars
  useFrame(({ clock }) => {
    if (groupRef.current && visible) {
      const t = clock.getElapsedTime();
      const avatars = groupRef.current.children.filter(c => c.name === 'avatar-container');
      avatars.forEach((avatar, idx) => {
        avatar.position.y = avatar.userData.baseY + Math.sin(t * 1.8 + idx) * 0.04;
      });
    }
  });

  const goldPlayer = players[0];
  const silverPlayer = players[1];
  const bronzePlayer = players[2];

  const handleSelectPlayer = (p: any) => {
    const profileId = p?.childId || p?.id;
    if (profileId) {
      setSelectedProfileId(profileId);
      setShowLeaderboardModal(false);
    }
  };

  return (
    <group ref={groupRef} visible={visible}>
      {/* 🚀 Plateforme Géante de Base "Cyber Circuit" en verre sombre à lueur cyan */}
      <group position={[0, -0.9, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[2.4, 2.5, 0.35, 32]} />
          <meshStandardMaterial 
            color="#0f172a" 
            metalness={0.8} 
            roughness={0.2} 
            emissive="#00334e"
            emissiveIntensity={0.4}
          />
        </mesh>
        {/* Anneau de lueur néon cyan */}
        <mesh position={[0, 0.176, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.42, 0.02, 8, 64]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.8} />
        </mesh>
      </group>

      {/* 🥇 OR (Rang 1) */}
      {goldPlayer && (
        <>
          {/* Capsule de verre lumineuse dorée */}
          <ColoredCapsule 
            position={[0, 0.15, 0]} 
            height={1.7} 
            radius={0.52} 
            color="#ffd700" 
            onClick={() => handleSelectPlayer(goldPlayer)}
          />

          {/* Numéro 1 garanti visible à l'avant */}
          <Billboard follow={true} position={[0, 0.15, 0.65]}>
            <Text
              fontSize={0.55}
              fontWeight="900"
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.035}
              outlineColor="#ffd700"
              onClick={() => handleSelectPlayer(goldPlayer)}
            >
              1
            </Text>
          </Billboard>

          {/* Anneaux orbitaux */}
          <OrbitalRings position={[0, 0.15, 0]} color="#ffd700" radius={0.72} />

          {/* Fontaine de particules dorées */}
          <PodiumParticles count={45} color="#ffd700" basePosition={[0, 1.0, 0]} />

          {/* Projecteur */}
          <SweepingSpotlight position={[0, 4.5, 0]} targetPos={[0, 1.0, 0]} color="#ffd700" />

          {/* Avatar */}
          <group 
            name="avatar-container" 
            position={[0, 1.9, 0]} 
            userData={{ baseY: 1.9 }}
          >
            {/* Hitbox sphérique invisible ultra-large pour garantir 100% de détection du clic */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPlayer(goldPlayer);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[0.9, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            <PlayerAvatar 
              player={{
                ...goldPlayer,
                isCurrent: goldPlayer.childId === childInfos?.id
              }}
              position={[0, 0, 0]}
              avatarScale={1.12}
              showHealth={false}
              rankTag={`#1 • ${goldPlayer.score ?? 0} IT`}
              onSelectPlayer={handleSelectPlayer}
            />
          </group>
        </>
      )}

      {/* 🥈 ARGENT (Rang 2) */}
      {silverPlayer && (
        <>
          {/* Capsule de verre argentée */}
          <ColoredCapsule 
            position={[-1.25, -0.1, 0]} 
            height={1.25} 
            radius={0.46} 
            color="#00ffcc" 
            onClick={() => handleSelectPlayer(silverPlayer)}
          />

          {/* Numéro 2 garanti visible à l'avant */}
          <Billboard follow={true} position={[-1.25, -0.1, 0.58]}>
            <Text
              fontSize={0.44}
              fontWeight="900"
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="#00ffcc"
              onClick={() => handleSelectPlayer(silverPlayer)}
            >
              2
            </Text>
          </Billboard>

          {/* Anneaux orbitaux */}
          <OrbitalRings position={[-1.25, -0.1, 0]} color="#00ffcc" radius={0.62} />

          {/* Fontaine de particules */}
          <PodiumParticles count={35} color="#00ffcc" basePosition={[-1.25, 0.5, 0]} />

          {/* Projecteur */}
          <SweepingSpotlight position={[-1.25, 4.2, 0]} targetPos={[-1.25, 0.5, 0]} color="#e2e8f0" />

          {/* Avatar */}
          <group 
            name="avatar-container" 
            position={[-1.25, 1.3, 0]} 
            userData={{ baseY: 1.3 }}
          >
            {/* Hitbox sphérique invisible */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPlayer(silverPlayer);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[0.8, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            <PlayerAvatar 
              player={{
                ...silverPlayer,
                isCurrent: silverPlayer.childId === childInfos?.id
              }}
              position={[0, 0, 0]}
              avatarScale={1.0}
              showHealth={false}
              rankTag={`#2 • ${silverPlayer.score ?? 0} IT`}
              onSelectPlayer={handleSelectPlayer}
            />
          </group>
        </>
      )}

      {/* 🥉 BRONZE (Rang 3) */}
      {bronzePlayer && (
        <>
          {/* Capsule de verre bronze */}
          <ColoredCapsule 
            position={[1.25, -0.25, 0]} 
            height={0.95} 
            radius={0.46} 
            color="#ff7700" 
            onClick={() => handleSelectPlayer(bronzePlayer)}
          />

          {/* Numéro 3 garanti visible à l'avant */}
          <Billboard follow={true} position={[1.25, -0.25, 0.58]}>
            <Text
              fontSize={0.40}
              fontWeight="900"
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="#ff7700"
              onClick={() => handleSelectPlayer(bronzePlayer)}
            >
              3
            </Text>
          </Billboard>

          {/* Anneaux orbitaux */}
          <OrbitalRings position={[1.25, -0.25, 0]} color="#ff7700" radius={0.62} />

          {/* Fontaine de particules */}
          <PodiumParticles count={35} color="#ff7700" basePosition={[1.25, 0.2, 0]} />

          {/* Projecteur */}
          <SweepingSpotlight position={[1.25, 4.2, 0]} targetPos={[1.25, 0.2, 0]} color="#ff7700" />

          {/* Avatar */}
          <group 
            name="avatar-container" 
            position={[1.25, 1.0, 0]} 
            userData={{ baseY: 1.0 }}
          >
            {/* Hitbox sphérique invisible */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPlayer(bronzePlayer);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[0.8, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            <PlayerAvatar 
              player={{
                ...bronzePlayer,
                isCurrent: bronzePlayer.childId === childInfos?.id
              }}
              position={[0, 0, 0]}
              avatarScale={1.0}
              showHealth={false}
              rankTag={`#3 • ${bronzePlayer.score ?? 0} IT`}
              onSelectPlayer={handleSelectPlayer}
            />
          </group>
        </>
      )}
    </group>
  );
}
