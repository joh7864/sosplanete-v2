import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { PlayerAvatar } from './3d/PlayerAvatar';
import PodiumGroup from './3d/PodiumGroup';

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

  const colors = ['#00ffcc', '#ff3b3b', '#ffd700', '#ff00ff', '#4dff4d', '#ff9900', '#00b3ff'];
  const sectorColor = colors[index % colors.length];
  const shortName = category.replace(/^Secteur\s+/i, '');

  const angle = (index / total) * Math.PI * 2;
  const radius = 3.5;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = Math.sin(t * 2 + index) * 0.2;
    }
    if (haloRef.current) {
      const pulse = Math.sin(t * 3 + index) * 0.5 + 0.5;
      haloRef.current.scale.setScalar(1 + pulse * 0.5);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + pulse * 0.3;
    }
  });

  return (
    <group ref={ref} position={[x, 0, z]}>
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
  isOnline, 
  hasUnread,
  showHealth,
  showChatIcon,
  rankTag
}: {
  player: any;
  targetPosition: [number, number, number];
  avatarScale: number;
  onSelectPlayer?: (p: any) => void;
  isOnline?: boolean;
  hasUnread?: boolean;
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
        isOnline={isOnline}
        hasUnread={hasUnread}
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
  onlineUsers = new Set(),
  unreadTeam = 0,
  unreadMps = {},
  isMobile = false,
  view = 'codex',
  dashboardStatus,
  onCloseLeaderboard: _onCloseLeaderboard,
}: { 
  categories?: string[];
  onSelectSector?: (c: string) => void;
  onSelectPlayer?: (player: any) => void;
  onlineUsers?: Set<string>;
  unreadTeam?: number;
  unreadMps?: Record<string, number>;
  isMobile?: boolean;
  view?: 'codex' | 'leaderboard';
  dashboardStatus?: any;
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
      </group>

      {/* Secteurs Thématiques (Codex) */}
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

          return (
            <AnimatedAvatar 
              key={player.id || player.childId || player.pseudo || i} 
              player={player} 
              targetPosition={targetPos} 
              avatarScale={avatarScale} 
              onSelectPlayer={onSelectPlayer} 
              isOnline={isOnline}
              hasUnread={hasUnread}
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
