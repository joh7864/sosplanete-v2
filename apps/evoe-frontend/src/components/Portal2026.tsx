import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

// Texture de halo blanc partagée par tous les avatars pour dessiner le cercle d'équipe
const haloTexture = (() => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
})();

function PlayerAvatar({ player, position, avatarScale = 1 }: { player: any, position: [number, number, number], avatarScale?: number }) {
  const color = player.color || '#40916C';
  const isMe = player.isCurrent;
  const initial = (player.pseudo || '?')[0].toUpperCase();

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const loadStatic3DAvatar = () => {
      const pseudo = player.pseudo || 'default';
      
      // On utilise le pseudo pour générer un ID déterministe
      let hash = 0;
      for (let i = 0; i < pseudo.length; i++) {
        hash += pseudo.charCodeAt(i);
      }
      
      // Calcul de l'âge
      let age: number | null = null;
      if (player.birthDate) {
        const birthYear = new Date(player.birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        age = currentYear - birthYear;
      }

      // Détermination du genre
      let genre = '';
      if (player.gender === 'EF') {
        genre = 'EF';
      } else if (player.gender === 'EH') {
        genre = 'EH';
      } else if (player.gender === 'E' || (age !== null && age < 15)) {
        genre = (hash % 2 === 0) ? 'EF' : 'EH';
      } else if (player.gender === 'F') {
        genre = 'F';
      } else if (player.gender === 'M') {
        genre = 'H';
      } else {
        const genres = ['EF', 'EH', 'F', 'H'];
        genre = genres[hash % 4];
      }

      let file = '';
      if (genre === 'EF') {
        const idx = (hash % 3) + 1;
        file = `EF_avatar_0${idx}.png`;
      } else if (genre === 'EH') {
        const idx = (hash % 3) + 1;
        file = `EH_avatar_0${idx}.png`;
      } else if (genre === 'F') {
        const idx = (hash % 12) + 1;
        file = `F_avatar_${idx.toString().padStart(2, '0')}.png`;
      } else { // 'H'
        const idx = (hash % 21) + 1;
        file = `H_avatar_0${idx}.png`;
      }
      
      // URL pointant vers le dossier uploads/avatars_3D/ (servi par /static/ sur le backend)
      const avatarUrl = `${EVOE_IMG_URL}avatars_3D/${file}`;
      
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        avatarUrl,
        (tex) => setTexture(tex),
        undefined,
        () => setTexture(null) // Fallback à l'initiale si l'image n'est pas trouvée
      );
    };

    if (player.avatar && player.avatar !== 'avatars/default.png') {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        `${EVOE_IMG_URL}${player.avatar}`,
        (tex) => setTexture(tex),
        undefined,
        () => loadStatic3DAvatar() // En cas d'erreur de chargement
      );
    } else {
      loadStatic3DAvatar();
    }
  }, [player.avatar, player.pseudo]);

  // Tailles adaptées au nombre de joueurs
  const haloScale = 0.7 * avatarScale;
  const avatarSpriteScale = 0.9 * avatarScale;
  const avatarYOffset = 0.12 * avatarScale;
  const fontSize = 0.18 * avatarScale;

  useFrame((state) => {
    if (groupRef.current) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      
      const center = new THREE.Vector3(0, 0, 0);
      const camDir = state.camera.position.clone().sub(center).normalize();
      const avatarDir = worldPos.clone().sub(center).normalize();
      
      const dot = avatarDir.dot(camDir);
      
      // Facteur d'échelle basé sur l'alignement avec la caméra (devant = plus gros)
      // dot varie de -1 à 1
      const scaleFactor = 1.0 + (dot * 0.4); // Varie de 0.6 à 1.4
      
      groupRef.current.scale.lerp(new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor), 0.1);
    }
  });

  return (
    <group ref={groupRef} position={position} frustumCulled={false}>
      {/* Halo lumineux */}
      <pointLight position={[0, 0.5, 0]} color={color} intensity={isMe ? 1.2 : 0.3} distance={2} />
      
      {/* Cercle de couleur d'équipe en arrière plan */}
      <sprite scale={[haloScale, haloScale, 1]} position={[0, 0, -0.01]} frustumCulled={false}>
        <spriteMaterial 
          map={haloTexture}
          color={color} 
          transparent={true} 
          opacity={isMe ? 0.9 : 0.6} 
          depthWrite={false} 
        />
      </sprite>

      {/* Avatar (si existant) ou Initiale */}
      {texture ? (
        <sprite scale={[avatarSpriteScale, avatarSpriteScale, 1]} position={[0, avatarYOffset, 0]} frustumCulled={false}>
          <spriteMaterial 
            key={texture.uuid}
            map={texture} 
            transparent={true}
            depthWrite={false}
          />
        </sprite>
      ) : (
        <Text
          position={[0, 0, 0]}
          fontSize={haloScale * 0.6}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          material-depthWrite={false}
          frustumCulled={false}
        >
          {initial}
        </Text>
      )}

      {/* Barre de santé des descendants */}
      <Billboard follow={true}>
        <group position={[0, -(haloScale * 0.5 + 0.08), 0.01]}>
          {/* Fond de la jauge */}
          <mesh>
            <planeGeometry args={[0.5 * avatarScale, 0.03]} />
            <meshBasicMaterial color="#333333" transparent opacity={0.8} depthWrite={false} />
          </mesh>
          {/* Remplissage coloré de la jauge (dégradé Rouge -> Vert) */}
          {player.health !== undefined && player.health > 0 && (
            <mesh position={[-0.5 * avatarScale / 2 + (0.5 * avatarScale * (player.health / 100)) / 2, 0, 0.001]}>
              <planeGeometry args={[0.5 * avatarScale * (player.health / 100), 0.02]} />
              <meshBasicMaterial color={`hsl(${player.health * 1.2}, 85%, 45%)`} depthWrite={false} />
            </mesh>
          )}
        </group>
      </Billboard>

      {/* Pseudo flottant */}
      <Billboard follow={true}>
        <Text
          position={[0, -(haloScale * 0.5 + 0.2), 0]}
          fontSize={fontSize}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          material-depthWrite={false}
          frustumCulled={false}
        >
          {player.pseudo}
        </Text>
      </Billboard>
      
      {/* Indicateur de "Moi" */}
      {isMe && (
        <Billboard follow={true}>
          <Text
            position={[0, -(haloScale * 0.5 + 0.5), 0]}
            fontSize={fontSize}
            color="#00ffcc"
            anchorX="center"
            anchorY="middle"
            material-depthWrite={false}
            frustumCulled={false}
          >
            ▼ MOI
          </Text>
        </Billboard>
      )}
    </group>
  );
}

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

export default function Portal2026({ 
  categories = [], 
  onSelectSector 
}: { 
  categories?: string[];
  onSelectSector?: (c: string) => void;
}) {
  const portalRef = useRef<THREE.Mesh>(null);
  const { players } = useAuth();
  const { camera } = useThree();

  // Réinitialisation de la caméra pour l'univers 2026
  useEffect(() => {
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  
  // Utilise un tableau vide si les joueurs ne sont pas encore chargés
  const teamList = players || [];

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
        <sphereGeometry args={[2, 64, 64]} />
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

        return teamList.map((player, i) => {
          // Décaler les index pour que le joueur courant soit au centre de l'arc
          const normalizedIndex = (i - shift + playerCount) % playerCount;
          
          const angle = arcStart + (normalizedIndex / (playerCount - 1 || 1)) * arcSpan;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          return <PlayerAvatar key={player.id} player={player} position={[x, 0, z]} avatarScale={avatarScale} />;
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
