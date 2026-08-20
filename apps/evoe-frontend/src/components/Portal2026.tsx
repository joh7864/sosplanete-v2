import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls, Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { PlayerAvatar } from './3d/PlayerAvatar';
import PodiumGroup from './3d/PodiumGroup';

export function getCategoryEmoji(category: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('recycl') || cat.includes('déchet') || cat.includes('matière')) return '♻️';
  if (cat.includes('plasma')) return '🌀';
  if (cat.includes('électricit') || cat.includes('énerg') || cat.includes('courant')) return '⚡';
  if (cat.includes('génétiq') || cat.includes('dna') || cat.includes('adn')) return '🧬';
  if (cat.includes('biodiver') || cat.includes('flore') || cat.includes('nature') || cat.includes('forêt')) return '🌿';
  if (cat.includes('propulsion')) return '🚀';
  if (cat.includes('transport') || cat.includes('mobilit') || cat.includes('vélo')) return '🚲';
  if (cat.includes('ressources') || cat.includes('vital') || cat.includes('eau') || cat.includes('hydrique') || cat.includes('océan')) return '💧';
  if (cat.includes('aliment') || cat.includes('agricul') || cat.includes('nourrit') || cat.includes('repas')) return '🌾';
  if (cat.includes('numériq') || cat.includes('tech') || cat.includes('digital') || cat.includes('écran')) return '💻';
  if (cat.includes('habitat') || cat.includes('bâtiment') || cat.includes('logement') || cat.includes('maison')) return '🏠';
  return '🌱';
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
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const colors = ['#00ffcc', '#ff3b3b', '#ffd700', '#ff00ff', '#4dff4d', '#ff9900', '#00b3ff'];
  const sectorColor = colors[index % colors.length];
  const shortName = category.replace(/^Secteur\s+/i, '');
  const emoji = getCategoryEmoji(category);

  const angle = (index / total) * Math.PI * 2;
  const radius = 3.5;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = Math.sin(t * 1.8 + index) * 0.22;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.8 + index;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 1.2 + index;
      ringRef.current.rotation.y = t * 0.5;
    }
    if (haloRef.current) {
      const pulse = Math.sin(t * 3 + index) * 0.5 + 0.5;
      haloRef.current.scale.setScalar(1 + pulse * 0.35);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + pulse * 0.25;
    }
  });

  return (
    <group 
      ref={ref} 
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect(category);
      }}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Structure de l'Orbe de Cristal Premium */}
      <group scale={hovered ? 1.35 : 1}>
        {/* 1. Coque extérieure en verre translucide haute réflexion */}
        <mesh>
          <sphereGeometry args={[0.34, 32, 32]} />
          <meshPhysicalMaterial 
            color={hovered ? '#ffffff' : sectorColor}
            transparent={true} 
            opacity={0.55} 
            roughness={0.08}
            metalness={0.3}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            transmission={0.8}
            ior={1.45}
            reflectivity={0.9}
          />
        </mesh>

        {/* 2. Cœur d'énergie néon incandescent intérieur */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial 
            color={sectorColor} 
            emissive={sectorColor} 
            emissiveIntensity={hovered ? 3.0 : 1.8} 
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* 3. Icône holographique thématique suspendue au cœur de l'orbe */}
        <Billboard follow={true} raycast={() => null}>
          <Text
            position={[0, 0, 0.36]}
            fontSize={0.24}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {emoji}
          </Text>
        </Billboard>

        {/* 4. Anneau de stase holographique en orbite autour de l'orbe */}
        <mesh ref={ringRef} rotation={[Math.PI / 3.2, 0, 0]}>
          <torusGeometry args={[0.44, 0.012, 16, 64]} />
          <meshBasicMaterial 
            color={hovered ? '#ffffff' : sectorColor} 
            transparent 
            opacity={0.85} 
            blending={THREE.AdditiveBlending} 
          />
        </mesh>
      </group>

      {/* 4. Halo lumineux atmosphérique pulsant (raycast désactivé) */}
      <mesh ref={haloRef} position={[0, 0, 0]} raycast={() => null}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial 
          color={sectorColor} 
          transparent 
          opacity={0.25} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>

      {/* 5. Lumière ponctuelle du secteur */}
      <pointLight color={sectorColor} intensity={hovered ? 3.0 : 1.2} distance={3.5} />
      
      {/* 6. Étiquette sous l'orbe (Nom épuré du secteur sans icône) */}
      <Billboard follow={true} raycast={() => null}>
        <Text
          position={[0, -0.65, 0]}
          fontSize={0.2}
          fontWeight="bold"
          color={hovered ? '#ffffff' : sectorColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {shortName}
        </Text>
      </Billboard>

      {/* Ancre HTML interactive pour le guide d'onboarding */}
      {index === 0 && (
        <Html center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
          <div id="sector-orb-guide" style={{ width: '80px', height: '80px', pointerEvents: 'none' }} />
        </Html>
      )}
    </group>
  );
}

// Texture lunaire réaliste avec cratères
let cachedMoonTexture: THREE.CanvasTexture | null = null;
function getMoonTexture(): THREE.CanvasTexture {
  if (cachedMoonTexture) return cachedMoonTexture;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Teinte de base grise lunaire avec dégradé subtil
  const bgGrad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  bgGrad.addColorStop(0, '#c2c6cd');
  bgGrad.addColorStop(0.7, '#9aa0a8');
  bgGrad.addColorStop(1, '#696e77');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Mers lunaires (taches sombres basaltiques)
  const maria = [
    { x: 160, y: 180, r: 90 },
    { x: 280, y: 150, r: 110 },
    { x: 340, y: 270, r: 80 },
    { x: 190, y: 320, r: 75 },
    { x: 250, y: 220, r: 95 }
  ];
  maria.forEach(({ x, y, r }) => {
    const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
    g.addColorStop(0, 'rgba(45, 48, 55, 0.45)');
    g.addColorStop(0.8, 'rgba(60, 65, 72, 0.25)');
    g.addColorStop(1, 'rgba(120, 125, 135, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Cratères avec ombre & lumière (relief)
  const craters = [
    { x: 120, y: 120, r: 24 },
    { x: 380, y: 130, r: 30 },
    { x: 400, y: 380, r: 28 },
    { x: 140, y: 400, r: 35 },
    { x: 256, y: 410, r: 22 },
    { x: 80, y: 260, r: 18 },
    { x: 430, y: 240, r: 20 },
    { x: 220, y: 100, r: 16 },
    { x: 300, y: 340, r: 25 },
  ];
  craters.forEach(({ x, y, r }) => {
    // Ombre intérieure
    const cg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    cg.addColorStop(0, 'rgba(25, 28, 33, 0.7)');
    cg.addColorStop(0.7, 'rgba(50, 55, 62, 0.4)');
    cg.addColorStop(1, 'rgba(210, 215, 225, 0.6)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Bord lumineux
    ctx.strokeStyle = 'rgba(235, 240, 250, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 0.8, Math.PI * 1.8);
    ctx.stroke();
  });

  // Grains de poussière / régolite
  for (let i = 0; i < 180; i++) {
    const rx = (Math.sin(i * 91.3) * 0.5 + 0.5) * size;
    const ry = (Math.cos(i * 47.7) * 0.5 + 0.5) * size;
    const rr = (Math.sin(i * 13.9) * 0.5 + 0.5) * 3 + 1;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(30, 35, 42, 0.35)' : 'rgba(240, 245, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  cachedMoonTexture = new THREE.CanvasTexture(canvas);
  return cachedMoonTexture;
}

function MoonChallengeArenaNode({ 
  totalChallenges,
  onSelect 
}: { 
  totalChallenges: number;
  onSelect?: () => void 
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const moonTexture = useMemo(() => getMoonTexture(), []);
  const beaconColor = totalChallenges > 0 ? '#f59e0b' : '#38bdf8';

  // Orbite lunaire autour de la Terre (surélevée au-dessus des catégories et plus large)
  const radius = 4.4;
  const orbitSpeed = 0.12;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const currentAngle = -Math.PI / 4 + t * orbitSpeed;

    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(currentAngle) * radius;
      groupRef.current.position.z = Math.sin(currentAngle) * radius;
      groupRef.current.position.y = 1.6 + Math.sin(t * 0.6) * 0.25; // Orbite plus haute (y ~ 1.6)
    }

    // Rotation de la Lune sur elle-même
    if (moonRef.current) {
      moonRef.current.rotation.y = t * 0.15;
    }

    // Pulsation du halo d'arène
    if (haloRef.current) {
      const pulse = Math.sin(t * 3.5) * 0.5 + 0.5;
      haloRef.current.scale.setScalar(1.1 + pulse * 0.35);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + pulse * 0.25;
    }
  });

  return (
    <group 
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect();
      }}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Sphère Lunaire réaliste texturée */}
      <mesh 
        ref={moonRef}
        scale={hovered ? 1.3 : 1}
      >
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial 
          map={moonTexture}
          color={hovered ? '#ffffff' : '#e2e8f0'} 
          roughness={0.88}
          metalness={0.08}
        />
      </mesh>

      {/* Halo holographique atmosphérique de la base lunaire (raycast désactivé pour ne pas bloquer les clics) */}
      <mesh ref={haloRef} raycast={() => null}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial 
          color={beaconColor} 
          transparent 
          opacity={0.3} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>

      <pointLight color={beaconColor} intensity={hovered ? 2.5 : 1.2} distance={4} />

      {/* Ancre HTML interactive temps réel pour le guide d'onboarding sur la Lune */}
      <Html center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
        <div id="hud-moon-arena" style={{ width: '90px', height: '90px', pointerEvents: 'none' }} />
      </Html>
      
      {/* Éléments holographiques directement SUR la Lune (Chiffre en haut, ⚔️ au centre, mot Défis en bas) */}
      <Billboard follow={true} raycast={() => null}>
        {/* Chiffre du total des défis en cours (Rapproché au-dessus des épées) */}
        <Text
          position={[0, 0.18, 0.45]}
          fontSize={0.11}
          fontWeight="bold"
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {totalChallenges}
        </Text>

        {/* Épées croisées au centre de la Lune */}
        <Text
          position={[0, 0, 0.45]}
          fontSize={0.20}
          anchorX="center"
          anchorY="middle"
        >
          ⚔️
        </Text>

        {/* Le mot "Défis" sous les épées (Rapproché au-dessous des épées) */}
        <Text
          position={[0, -0.21, 0.45]}
          fontSize={0.11}
          fontWeight="bold"
          color={totalChallenges > 0 ? '#ffb703' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Défis
        </Text>
      </Billboard>
    </group>
  );
}

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
      animTime.current += delta * 1.5;
      const ratio = Math.min(1.0, animTime.current);
      const size = ratio * 8.5;
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

function AnimatedAvatar({ 
  player, 
  targetPosition, 
  avatarScale, 
  onSelectPlayer, 
  onSelectChallengeBadge,
  isOnline, 
  hasUnread,
  challengeCount,
  showHealth,
  showChatIcon,
  rankTag
}: {
  player: any;
  targetPosition: [number, number, number];
  avatarScale: number;
  onSelectPlayer?: (p: any) => void;
  onSelectChallengeBadge?: (p: any) => void;
  isOnline?: boolean;
  hasUnread?: boolean;
  challengeCount?: number;
  showHealth?: boolean;
  showChatIcon?: boolean;
  rankTag?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.x += (targetPosition[0] - groupRef.current.position.x) * 0.08;
      groupRef.current.position.y += (targetPosition[1] - groupRef.current.position.y) * 0.08;
      groupRef.current.position.z += (targetPosition[2] - groupRef.current.position.z) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={targetPosition}>
      <PlayerAvatar 
        player={player} 
        position={[0, 0, 0]} 
        avatarScale={avatarScale} 
        onSelectPlayer={onSelectPlayer} 
        onSelectChallengeBadge={onSelectChallengeBadge}
        isOnline={isOnline}
        hasUnread={hasUnread}
        challengeCount={challengeCount}
        showHealth={showHealth}
        showChatIcon={showChatIcon}
        rankTag={rankTag}
      />
    </group>
  );
}

export default function Portal2026({ 
  categories = [], 
  onSelectSector,
  onSelectPlayer,
  onSelectChallenges,
  onSelectChallengeBadge,
  onlineUsers = new Set(),
  unreadTeam = 0,
  unreadMps = {},
  isMobile = false,
  view = 'codex',
  dashboardStatus,
  challenges = [],
  onCloseLeaderboard: _onCloseLeaderboard,
}: { 
  categories?: string[];
  onSelectSector?: (c: string) => void;
  onSelectPlayer?: (player: any) => void;
  onSelectChallenges?: () => void;
  onSelectChallengeBadge?: (player: any) => void;
  onlineUsers?: Set<string>;
  unreadTeam?: number;
  unreadMps?: Record<string, number>;
  isMobile?: boolean;
  view?: 'codex' | 'leaderboard';
  dashboardStatus?: any;
  challenges?: any[];
  onCloseLeaderboard?: () => void;
}) {
  const portalRef = useRef<THREE.Mesh>(null);
  const earthGroupRef = useRef<THREE.Group>(null);
  const podiumGroupRef = useRef<THREE.Group>(null);
  const sectorsGroupRef = useRef<THREE.Group>(null);

  const { players } = useAuth();
  const { camera } = useThree();

  const teamList = useMemo(() => players || [], [players]);
  const me = teamList.find(p => p.isCurrent);
  const lastHealth = useRef<number | null>(null);
  const [pulseTime, setPulseTime] = useState<number | null>(null);

  const teamPendingChallengesMap = useMemo(() => {
    const map: Record<number, number> = {};
    if (!challenges) return map;
    challenges.forEach((c: any) => {
      if (c.status === 'PENDING' && c.targetTeamId) {
        map[c.targetTeamId] = (map[c.targetTeamId] || 0) + 1;
      }
    });
    return map;
  }, [challenges]);

  useEffect(() => {
    if (me && lastHealth.current !== null && me.health > lastHealth.current) {
      setPulseTime(Date.now());
    }
    if (me) {
      lastHealth.current = me.health;
    }
  }, [me?.health]);

  useEffect(() => {
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  const [earthTexture, setEarthTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      '/earth.webp',
      (tex) => setEarthTexture(tex)
    );
  }, []);

  useFrame((state) => {
    if (portalRef.current) {
      portalRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }

    const isLb = view === 'leaderboard';

    if (earthGroupRef.current) {
      const targetScale = isLb ? 0 : 1;
      const s = earthGroupRef.current.scale.x + (targetScale - earthGroupRef.current.scale.x) * 0.08;
      earthGroupRef.current.scale.setScalar(s);
    }

    if (podiumGroupRef.current) {
      const targetScale = isLb ? 1 : 0;
      const s = podiumGroupRef.current.scale.x + (targetScale - podiumGroupRef.current.scale.x) * 0.08;
      podiumGroupRef.current.scale.setScalar(s);
    }

    if (sectorsGroupRef.current) {
      const targetScale = isLb ? 0 : 1;
      const s = sectorsGroupRef.current.scale.x + (targetScale - sectorsGroupRef.current.scale.x) * 0.08;
      sectorsGroupRef.current.scale.setScalar(s);
    }
  });

  // ─── CONSTRUCTION DU CLASSEMENT COMPLET DE TOUS LES JOUEURS (#1 à #N) ────────
  const rankedPlayers = useMemo(() => {
    const topFromDash = dashboardStatus?.topPlayers || [];
    const list: any[] = [];
    const addedPseudos = new Set<string>();

    // 1. Ajouter les joueurs officiels du classement topPlayers
    topFromDash.forEach((tp: any) => {
      const pName = (tp.pseudo || tp.name || '').toLowerCase();
      const match = teamList.find((p: any) => 
        (p.pseudo && p.pseudo.toLowerCase() === pName) ||
        (p.childId && tp.childId && Number(p.childId) === Number(tp.childId)) ||
        (p.id && tp.id && Number(p.id) === Number(tp.id))
      );
      const merged = {
        ...tp,
        ...(match || {}),
        pseudo: tp.pseudo || match?.pseudo || 'Agent',
        color: tp.color || match?.color || '#00e8ff',
      };
      if (merged.pseudo && !addedPseudos.has(merged.pseudo.toLowerCase())) {
        addedPseudos.add(merged.pseudo.toLowerCase());
        list.push(merged);
      }
    });

    // 2. Compléter avec tous les autres joueurs de l'équipe non encore classés
    const rest = teamList.filter((p: any) => p.pseudo && !addedPseudos.has(p.pseudo.toLowerCase()));
    // Trier les restants par score / actions d'abord, puis santé en cas d'égalité
    rest.sort((a: any, b: any) => {
      const aScore = a.score ?? a.actionsCount ?? a.actionsDone?.length ?? 0;
      const bScore = b.score ?? b.actionsCount ?? b.actionsDone?.length ?? 0;
      if (bScore !== aScore) return bScore - aScore;
      const aHealth = a.health ?? 0;
      const bHealth = b.health ?? 0;
      if (bHealth !== aHealth) return bHealth - aHealth;
      return (a.pseudo || '').localeCompare(b.pseudo || '');
    });
    rest.forEach((p: any) => {
      addedPseudos.add(p.pseudo.toLowerCase());
      list.push(p);
    });

    // 3. Assigner les numéros de rang #1 à #N garantis
    return list.map((p, idx) => ({
      ...p,
      rankNumber: idx + 1
    }));
  }, [dashboardStatus?.topPlayers, teamList]);

  const top3 = useMemo(() => rankedPlayers.slice(0, 3), [rankedPlayers]);
  const remainingPlayers = useMemo(() => rankedPlayers.slice(3), [rankedPlayers]);

  return (
    <group>
      <RadialShockwave pulseTime={pulseTime} />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        minPolarAngle={Math.PI / 2 - 0.2} 
        maxPolarAngle={Math.PI / 2 + 0.2} 
        target={[0, 0, 0]}
      />

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Terre Centrale (Codex) */}
      <group ref={earthGroupRef}>
        <mesh ref={portalRef}>
          <sphereGeometry args={[2, isMobile ? 16 : 64, isMobile ? 16 : 64]} />
          <meshStandardMaterial
            key={earthTexture?.uuid || 'no-tex'}
            map={earthTexture || undefined}
            color={earthTexture ? '#ffffff' : '#1a3a5c'}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.06, 32, 32]} />
          <meshBasicMaterial color="#4fc3f7" transparent opacity={0.12} depthWrite={false} side={THREE.BackSide} />
        </mesh>
      </group>

      {/* Podium Central (Leaderboard) */}
      <group ref={podiumGroupRef} scale={[0, 0, 0]}>
        <PodiumGroup
          players={top3}
          childInfos={me}
          setSelectedProfileId={(id) => {
            if (id && onSelectPlayer) {
              const targetP = teamList.find(p => p.childId === id || p.id === id);
              if (targetP) onSelectPlayer(targetP);
            }
          }}
          setShowLeaderboardModal={() => {}}
          visible={true}
        />
        {view === 'leaderboard' && (
          <Html center position={[0, 0.5, 0]} zIndexRange={[1, 0]}>
            <div id="btn-podium-leaderboard" style={{ width: '320px', height: '240px', pointerEvents: 'none' }} />
          </Html>
        )}
      </group>

      {/* Secteurs Thématiques (Codex) & Arène Défis */}
      <group ref={sectorsGroupRef}>
        {categories.map((cat, i) => (
          <ThematicSector 
            key={cat} 
            category={cat} 
            index={i} 
            total={categories.length} 
            onSelect={onSelectSector} 
          />
        ))}
        <MoonChallengeArenaNode 
          totalChallenges={challenges?.filter(c => c.status === 'PENDING' || c.status === 'ACCEPTED').length || 0}
          onSelect={onSelectChallenges}
        />
      </group>

      {/* Avatars en Orbite (Codex / Leaderboard) */}
      {teamList.length > 0 && (() => {
        const playerCount = teamList.length;
        const baseRadius = 6.5;
        const radius = playerCount > 20 ? baseRadius + (playerCount - 20) * 0.08 : baseRadius;
        const avatarScale = Math.max(0.4, Math.min(1.0, 1.0 - (playerCount - 10) * 0.015));
        
        // Arc Codex (240°)
        const arcSpanCodex = Math.min(Math.PI * 2, Math.PI * 1.33 + playerCount * 0.015);
        const arcStartCodex = Math.PI / 2 - arcSpanCodex / 2;

        const currentIndex = teamList.findIndex(p => p.isCurrent);
        const shift = currentIndex !== -1 ? currentIndex : 0;
        const midIndex = Math.floor(playerCount / 2);

        const totalUnreadMp = unreadMps ? Object.values(unreadMps).reduce((a, b) => a + b, 0) : 0;

        // Pas angulaire pour les rangs 4+ en mode Leaderboard (sur l'arc 240°)
        const remCount = Math.max(1, remainingPlayers.length);
        const stepAngleLb = remCount > 1 ? (Math.PI * 1.2) / (remCount - 1) : 0;

        return teamList.map((player, i) => {
          // 1. Position Codex
          const normalizedIndex = (i - shift + midIndex + playerCount) % playerCount;
          const angleCodex = arcStartCodex + (normalizedIndex / (playerCount - 1 || 1)) * arcSpanCodex;
          const codexX = Math.cos(angleCodex) * radius;
          const codexZ = Math.sin(angleCodex) * radius;

          // 2. Position Leaderboard
          let lbX = codexX;
          let lbY = 0;
          let lbZ = codexZ;
          let isTop3 = false;
          let rankNumber = 0;

          const pPseudo = (player.pseudo || '').toLowerCase();
          const rankMatch = rankedPlayers.find((rp: any) => (rp.pseudo || '').toLowerCase() === pPseudo);

          if (rankMatch) {
            rankNumber = rankMatch.rankNumber;
            if (rankNumber <= 3) {
              isTop3 = true;
            } else {
              // 4ème (remIndex = 0) au premier plan face caméra (x=0, z=radius)
              // 5ème (remIndex = 1), 6ème... vers la droite (x > 0)
              const remIndex = rankNumber - 4;
              const angleLb = remIndex * stepAngleLb;
              lbX = Math.sin(angleLb) * radius;
              lbY = -0.4;
              lbZ = Math.cos(angleLb) * radius;
            }
          }

          const targetPos: [number, number, number] = view === 'leaderboard'
            ? (isTop3 ? [0, -20, 0] : [lbX, lbY, lbZ])
            : [codexX, 0, codexZ];

          const isOnline = onlineUsers.has(pPseudo);
          const isMe = player.isCurrent;
          const hasUnread = isMe && (totalUnreadMp > 0 || unreadTeam > 0);
          const pChallengeCount = (player.teamId && teamPendingChallengesMap[player.teamId]) || 0;

          return (
            <AnimatedAvatar 
              key={player.id || player.childId || player.pseudo || i} 
              player={player} 
              targetPosition={targetPos} 
              avatarScale={avatarScale} 
              onSelectPlayer={onSelectPlayer} 
              onSelectChallengeBadge={onSelectChallengeBadge}
              isOnline={isOnline}
              hasUnread={hasUnread}
              challengeCount={pChallengeCount}
              showHealth={view === 'codex'}
              showChatIcon={view === 'codex'}
              rankTag={view === 'leaderboard' ? `#${rankNumber}` : undefined}
            />
          );
        });
      })()}
    </group>
  );
}
