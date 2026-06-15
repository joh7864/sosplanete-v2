import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Text, OrbitControls, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

function PlayerAvatar({ player, position }: { player: any, position: [number, number, number] }) {
  // Charge l'avatar si disponible, sinon un avatar anonyme holographique par défaut
  const defaultAvatar = '/avatars/default.png'; // Assuming it's in public/ or handled by the backend
  const avatarUrl = player.avatar && player.avatar !== 'avatars/default.png' 
    ? `${EVOE_IMG_URL}${player.avatar}` 
    : `${EVOE_IMG_URL}avatars/default.png`; // Fallback vers le backend si dispo, sinon on laisse le try/catch gérer
    
  // useLoader throwera si on lui passe null, donc on gère conditionnellement
  let texture = null;
  try {
    if (avatarUrl) {
      texture = useLoader(THREE.TextureLoader, avatarUrl);
    }
  } catch (e) {
    // Erreur de chargement silencieuse
  }

  const color = player.color || '#40916C';
  const isMe = player.isCurrent;

  return (
    <group position={position}>
      {/* Halo lumineux */}
      <pointLight position={[0, 1, 0]} color={color} intensity={isMe ? 1.5 : 0.5} distance={3} />
      
      {/* Avatar (Hologramme Plat avec Billboard pour faire face à la caméra) */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.8, 0.8]} />
          <meshStandardMaterial 
            color={texture ? '#ffffff' : color} 
            map={texture} 
            emissive={isMe ? color : color}
            emissiveIntensity={isMe ? 0.4 : 0.1}
            transparent={true}
            opacity={texture ? 1 : 0.7}
            side={THREE.DoubleSide}
            depthWrite={false} // Crucial pour éviter les problèmes de tri (z-fighting) avec les plans transparents
          />
        </mesh>

        {/* Pseudo flottant attaché au Billboard */}
        <Text
          position={[0, 0.6, 0]}
        fontSize={0.3}
        color={isMe ? '#ffffff' : color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {player.pseudo}
      </Text>
      </Billboard>
      
      {/* Indicateur de "Moi" */}
      {isMe && (
        <Billboard follow={true}>
          <Text
            position={[0, 1.0, 0]}
            fontSize={0.2}
            color="#00ffcc"
            anchorX="center"
            anchorY="middle"
            depthWrite={false}
          >
            ▼
          </Text>
        </Billboard>
      )}
    </group>
  );
}

export default function Portal2026() {
  const portalRef = useRef<THREE.Mesh>(null);
  const { players } = useAuth();
  
  // Utilise un tableau vide si les joueurs ne sont pas encore chargés
  const teamList = players || [];
  const count = teamList.length || 30; // Fallback pour la démo si non connecté

  useFrame((state) => {
    if (portalRef.current) {
      portalRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group>
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        minPolarAngle={Math.PI/2 - 0.2} 
        maxPolarAngle={Math.PI/2 + 0.2} 
      />

      {/* Lumière ambiante */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Portail Central 2026 */}
      <Sphere ref={portalRef} args={[2, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial color="#e0f7fa" distort={0.2} speed={1.5} />
      </Sphere>

      {/* Avatars (Représentation dynamique) */}
      {teamList.length > 0 ? teamList.map((player, i) => {
        // Calculer l'angle pour que isCurrent soit toujours à Math.PI / 2 (devant la caméra Z)
        const currentIndex = teamList.findIndex(p => p.isCurrent);
        const shift = currentIndex !== -1 ? currentIndex : 0;
        
        // Formule pour décaler tous les index afin que le current soit au bon angle
        const normalizedIndex = (i - shift + count) % count;
        
        // Math.PI / 2 place l'élément à l'avant (axe Z max)
        const angle = (normalizedIndex / count) * Math.PI * 2 + (Math.PI / 2);
        
        const radius = 6.5; // Rayon constant pour un cercle parfait, élargi pour éviter le contact avec la sphère
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return <PlayerAvatar key={player.id} player={player} position={[x, 0, z]} />;
      }) : (
        // Fallback visuel le temps du chargement
        Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x = Math.cos(angle) * 5;
          const z = Math.sin(angle) * 5;
          return (
            <mesh key={`fb-${i}`} position={[x, 0, z]}>
              <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
              <meshStandardMaterial color="#333" opacity={0.5} transparent />
            </mesh>
          );
        })
      )}
    </group>
  );
}
