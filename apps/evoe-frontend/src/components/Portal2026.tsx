import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { PlayerAvatar } from './3d/PlayerAvatar';



function ThematicSector({ 
  category, 
  index, 
  total, 
  onSelect 
}: { 
  category: string; 
  index: number; 
  total: number; 
  onSelect?: (c: string) => void 
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // Couleurs distinctes
  const colors = ['#00ffcc', '#ff3b3b', '#ffd700', '#ff00ff', '#4dff4d', '#ff9900', '#00b3ff'];
  const sectorColor = colors[index % colors.length];

  // Nettoyage du nom (retirer "Secteur " pour alléger l'UI)
  const shortName = category.replace(/^Secteur\s+/i, '');

  // Position en orbite (rayon 3.5, entre la Terre(2) et les joueurs(6.5))
  const angle = (index / total) * Math.PI * 2;
  const radius = 3.5;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  // Animation de flottaison et respiration du halo
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = Math.sin(t * 2 + index) * 0.2;
    }
    if (haloRef.current) {
      // Effet de respiration : l'échelle et l'opacité oscillent
      const pulse = Math.sin(t * 3 + index) * 0.5 + 0.5; // Entre 0 et 1
      haloRef.current.scale.setScalar(1 + pulse * 0.5); // Échelle de 1 à 1.5
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + pulse * 0.3; // Opacité de 0.2 à 0.5
    }
  });

  return (
    <group ref={ref} position={[x, 0, z]}>
      {/* Sphère interactive */}
      <mesh 
        onClick={() => onSelect && onSelect(category)}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        scale={hovered ? 1.3 : 1}
      >
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color={hovered ? '#ffffff' : sectorColor} transparent opacity={0.8} />
      </mesh>

      {/* Halo avec animation de respiration */}
      <mesh ref={haloRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial color={sectorColor} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <pointLight color={sectorColor} intensity={hovered ? 2 : 0.5} distance={3} />
      
      <Billboard follow={true}>
        <Text
          position={[0, -0.6, 0]}
          fontSize={0.2}
          color={sectorColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {shortName}
        </Text>
      </Billboard>
    </group>
  );
}

// Composant pour l'onde de choc radiale au sol
function RadialShockwave({ pulseTime }: { pulseTime: number | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastPulse = useRef<number | null>(null);
  const active = useRef(false);
  const animTime = useRef(0);

  if (pulseTime && pulseTime !== lastPulse.current) {
    active.current = true;
    animTime.current = 0;
    lastPulse.current = pulseTime;
  }

  useFrame((_, delta) => {
    if (active.current && meshRef.current) {
      animTime.current += delta * 1.5; // 0.6s animation
      const ratio = Math.min(1.0, animTime.current);
      const size = ratio * 8.5; // S'étend au-delà des avatars à 6.5
      meshRef.current.scale.set(size, size, 1);
      
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1.0 - ratio) * 0.85;

      if (ratio >= 1.0) {
        active.current = false;
        mat.opacity = 0;
      }
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
      <ringGeometry args={[0.95, 1.0, 32]} />
      <meshBasicMaterial color="#00ffcc" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Portal2026({ 
  categories = [], 
  onSelectSector,
  onSelectPlayer,
  onlineUsers = new Set(),
  unreadTeam = 0,
  unreadMps = {},
  isMobile = false,
}: { 
  categories?: string[];
  onSelectSector?: (c: string) => void;
  onSelectPlayer?: (player: any) => void;
  onlineUsers?: Set<string>;
  unreadTeam?: number;
  unreadMps?: Record<string, number>;
  isMobile?: boolean;
}) {
  const portalRef = useRef<THREE.Mesh>(null);
  const { players } = useAuth();
  const { camera } = useThree();

  // Détection de l'impulsion temporelle
  const teamList = players || [];
  const me = teamList.find(p => p.isCurrent);
  const lastHealth = useRef<number | null>(null);
  const [pulseTime, setPulseTime] = useState<number | null>(null);

  useEffect(() => {
    if (me && lastHealth.current !== null && me.health > lastHealth.current) {
      setPulseTime(Date.now());
    }
    if (me) {
      lastHealth.current = me.health;
    }
  }, [me?.health]);

  // Réinitialisation de la caméra pour l'univers 2026
  useEffect(() => {
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  
  // Utilise un tableau vide si les joueurs ne sont pas encore chargés

  // Chargement de la texture de la Terre (locale)
  const [earthTexture, setEarthTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      '/earth.jpg',
      (tex) => setEarthTexture(tex)
    );
  }, []);

  useFrame((state) => {
    if (portalRef.current) {
      portalRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group>
      <RadialShockwave pulseTime={pulseTime} />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        minPolarAngle={Math.PI/2 - 0.2} 
        maxPolarAngle={Math.PI/2 + 0.2} 
        target={[0, 0, 0]}
      />

      {/* Lumière ambiante */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Portail Central 2026 - Terre texturée */}
      <mesh ref={portalRef}>
        <sphereGeometry args={[2, isMobile ? 16 : 64, isMobile ? 16 : 64]} />
        {/* La clé UUID force R3F à recréer le matériau quand la texture arrive */}
        <meshStandardMaterial
          key={earthTexture?.uuid || 'no-tex'}
          map={earthTexture || undefined}
          color={earthTexture ? '#ffffff' : '#1a3a5c'}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      {/* Atmosphère bleuée par-dessus */}
      <mesh>
        <sphereGeometry args={[2.06, 32, 32]} />
        <meshBasicMaterial color="#4fc3f7" transparent opacity={0.12} depthWrite={false} side={THREE.BackSide} />
      </mesh>

      {/* Secteurs Thématiques (Sphères lumineuses interactives) */}
      {categories.map((cat, i) => (
        <ThematicSector 
          key={cat} 
          category={cat} 
          index={i} 
          total={categories.length} 
          onSelect={onSelectSector} 
        />
      ))}

      {/* Avatars (Représentation dynamique) */}
      {teamList.length > 0 ? (() => {
        const playerCount = teamList.length;
        // Rayon adapté au nombre de joueurs pour éviter les chevauchements
        const baseRadius = 6.5;
        const radius = playerCount > 20 ? baseRadius + (playerCount - 20) * 0.08 : baseRadius;
        
        // Échelle inversement proportionnelle au nombre de joueurs
        // De 1.0 (≤10 joueurs) à 0.4 (≥50 joueurs)
        const avatarScale = Math.max(0.4, Math.min(1.0, 1.0 - (playerCount - 10) * 0.015));
        
        // Arc de 240° face à la caméra (au lieu d'un cercle complet)
        // Cela évite que des avatars soient cachés derrière la Terre
        const arcSpan = Math.min(Math.PI * 2, Math.PI * 1.33 + playerCount * 0.015);
        const arcStart = Math.PI / 2 - arcSpan / 2; // Centré face à la caméra (axe Z positif)

        // Trouver l'index du joueur courant pour le centrer
        const currentIndex = teamList.findIndex(p => p.isCurrent);
        const shift = currentIndex !== -1 ? currentIndex : 0;
        const midIndex = Math.floor(playerCount / 2);

        // Calculer le total des messages privés non lus
        const totalUnreadMp = unreadMps ? Object.values(unreadMps).reduce((a, b) => a + b, 0) : 0;

        return teamList.map((player, i) => {
          // Décaler les index pour que le joueur courant soit au centre de l'arc
          const normalizedIndex = (i - shift + midIndex + playerCount) % playerCount;
          
          const angle = arcStart + (normalizedIndex / (playerCount - 1 || 1)) * arcSpan;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          const isOnline = onlineUsers.has(player.pseudo.toLowerCase());
          const isMe = player.isCurrent;
          
          // L'enveloppe ne s'affiche que sur l'avatar du récepteur (l'utilisateur courant)
          // si celui-ci a reçu un message d'équipe ou un message privé.
          const hasUnread = isMe && (totalUnreadMp > 0 || unreadTeam > 0);
          
          return (
            <PlayerAvatar 
              key={player.id} 
              player={player} 
              position={[x, 0, z]} 
              avatarScale={avatarScale} 
              onSelectPlayer={onSelectPlayer} 
              isOnline={isOnline}
              hasUnread={hasUnread}
            />
          );
        });
      })() : (
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
