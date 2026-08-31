import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

const globalTexturePromiseCache = new Map<string, Promise<THREE.Texture>>();

function getTexture(url: string): Promise<THREE.Texture> {
  if (globalTexturePromiseCache.has(url)) {
    return globalTexturePromiseCache.get(url)!;
  }
  const promise = new Promise<THREE.Texture>((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(url, resolve, undefined, reject);
  });
  globalTexturePromiseCache.set(url, promise);
  return promise;
}

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

const bracketsTexture = (() => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  ctx.strokeStyle = '#00ffcc';
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 6;
  
  const pad = 24;
  const len = 45;
  
  // Top-left
  ctx.beginPath();
  ctx.moveTo(pad, pad + len);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad + len, pad);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(size - pad, pad + len);
  ctx.lineTo(size - pad, pad);
  ctx.lineTo(size - pad - len, pad);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(pad, size - pad - len);
  ctx.lineTo(pad, size - pad);
  ctx.lineTo(pad + len, size - pad);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(size - pad, size - pad - len);
  ctx.lineTo(size - pad, size - pad);
  ctx.lineTo(size - pad - len, size - pad);
  ctx.stroke();
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
})();

const greenDotTexture = (() => {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const r = 9;
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#00ffcc';
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 8, 16, 0.94)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
})();

const blueDotTexture = (() => {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const r = 9;
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 8, 16, 0.94)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
})();

const envelopeTexture = (() => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  
  ctx.fillStyle = '#ff3b3b';
  ctx.shadowColor = '#ff3b3b';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 8, 16, 0.94)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const w = 24;
  const h = 16;
  const x = cx - w / 2;
  const y = cy - h / 2 + 1;
  
  ctx.strokeRect(x, y, w, h);
  
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(cx, y + h * 0.55);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
})();

const swordsTextureCache = new Map<string, THREE.Texture>();

function getSwordsTexture(color: string, count: number): THREE.Texture {
  const key = `${color}_${count}`;
  if (swordsTextureCache.has(key)) {
    return swordsTextureCache.get(key)!;
  }
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  
  // Fond circulaire avec la couleur d'équipe
  ctx.fillStyle = color || '#f59e0b';
  ctx.shadowColor = color || '#f59e0b';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  // Bordure foncée contrastée
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 8, 16, 0.94)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  // Épées croisées
  ctx.font = '22px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚔️', cx, cy + 4);
  
  // Nombre de défis positionné au sommet entre le haut des épées
  if (count > 0) {
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(String(count), cx, cy - 11);
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  swordsTextureCache.set(key, tex);
  return tex;
}

const missionsWeekTextureCache = new Map<string, THREE.Texture>();

function getMissionsWeekTexture(color: string, count: number): THREE.Texture {
  const key = `${color}_${count}`;
  if (missionsWeekTextureCache.has(key)) {
    return missionsWeekTextureCache.get(key)!;
  }
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  
  // Fond circulaire avec un gradient émeraude / cyan néon
  ctx.fillStyle = '#10b981';
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  
  // Bordure foncée contrastée
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(5, 8, 16, 0.94)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  // Icône checkmark validation
  ctx.font = 'bold 22px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('✓', cx, cy + (count > 0 ? 4 : 0));
  
  // Nombre de missions positionné au sommet si > 0
  if (count > 0) {
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(String(count), cx, cy - 11);
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  missionsWeekTextureCache.set(key, tex);
  return tex;
}

interface PlayerAvatarProps {
  player: any;
  position: [number, number, number];
  avatarScale?: number;
  onSelectPlayer?: (p: any) => void;
  onSelectChallengeBadge?: (p: any) => void;
  onSelectMissionsWeek?: (p: any) => void;
  isOnline?: boolean;
  hasUnread?: boolean;
  isStealthMode?: boolean;
  onToggleStealth?: () => void;
  challengeCount?: number;
  missionsWeekCount?: number;
  showHealth?: boolean;
  showChatIcon?: boolean;
  rankTag?: string;
}

export function PlayerAvatar({ 
  player, 
  position, 
  avatarScale = 1, 
  onSelectPlayer, 
  onSelectChallengeBadge,
  onSelectMissionsWeek,
  isOnline = false,
  hasUnread = false,
  isStealthMode = false,
  onToggleStealth,
  challengeCount = 0,
  missionsWeekCount = 0,
  showHealth = true,
  showChatIcon = true,
  rankTag
}: PlayerAvatarProps) {
  const color = player.color || '#40916C';
  const isMe = player.isCurrent;
  const isSelfStealth = isMe && isStealthMode;
  const initial = (player.pseudo || '?')[0].toUpperCase();

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const bracketsRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    let isMounted = true;

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
      
      const avatarUrl = `${EVOE_IMG_URL}avatars_3D/${file}`;
      
      getTexture(avatarUrl)
        .then((tex) => { if (isMounted) setTexture(tex); })
        .catch(() => { if (isMounted) setTexture(null); });
    };

    if (player.avatar && player.avatar !== 'avatars/default.png') {
      getTexture(`${EVOE_IMG_URL}${player.avatar}`)
        .then((tex) => { if (isMounted) setTexture(tex); })
        .catch(() => { if (isMounted) loadStatic3DAvatar(); });
    } else {
      loadStatic3DAvatar();
    }

    return () => { isMounted = false; };
  }, [player.avatar, player.pseudo]);

  const haloScale = 0.7 * avatarScale;
  const avatarSpriteScale = 0.9 * avatarScale;
  const avatarYOffset = 0.12 * avatarScale;
  const fontSize = 0.18 * avatarScale;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      
      const center = new THREE.Vector3(0, 0, 0);
      const camDir = state.camera.position.clone().sub(center).normalize();
      const avatarDir = worldPos.clone().sub(center).normalize();
      
      const dot = avatarDir.dot(camDir);
      const scaleFactor = 1.0 + (dot * 0.4);
      
      groupRef.current.scale.lerp(new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor), 0.1);
    }
    if (bracketsRef.current) {
      const pulse = 1.0 + Math.sin(t * 5.0) * 0.04;
      bracketsRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={position} 
      frustumCulled={false}
      onClick={(e) => {
        e.stopPropagation();
        onSelectPlayer?.(player);
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
      <pointLight position={[0, 0.5, 0]} color={color} intensity={isMe ? 1.2 : 0.3} distance={2} />
      
      <Billboard follow={true}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[haloScale, haloScale]} />
          <meshBasicMaterial 
            map={haloTexture}
            color={isSelfStealth ? '#38bdf8' : color} 
            transparent={true} 
            opacity={isSelfStealth ? 0.4 : (isMe ? 0.9 : 0.6)} 
            depthWrite={false} 
          />
        </mesh>

        {texture ? (
          <mesh position={[0, avatarYOffset, 0]}>
            <planeGeometry args={[avatarSpriteScale, avatarSpriteScale]} />
            <meshBasicMaterial 
              key={texture.uuid}
              map={texture} 
              transparent={true}
              opacity={isSelfStealth ? 0.55 : 1}
              depthWrite={false}
            />
          </mesh>
        ) : (
          <Text
            position={[0, 0, 0.01]}
            fontSize={haloScale * 0.6}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            material-depthWrite={false}
            material-transparent={true}
            material-opacity={isSelfStealth ? 0.55 : 1}
            frustumCulled={false}
          >
            {initial}
          </Text>
        )}

        {/* Pastille de présence : Verte si connecté normal, Bleue (#38bdf8) si en mode furtif pour le joueur lui-même */}
        {((isOnline && !isSelfStealth) || isSelfStealth) && (
          <mesh 
            position={[avatarSpriteScale * 0.36, avatarYOffset + avatarSpriteScale * 0.36, 0.01]}
            onClick={(e) => {
              if (isMe && onToggleStealth) {
                e.stopPropagation();
                onToggleStealth();
              }
            }}
            onPointerOver={(e) => {
              if (isMe && onToggleStealth) {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }
            }}
            onPointerOut={(e) => {
              if (isMe && onToggleStealth) {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }
            }}
          >
            <planeGeometry args={[avatarSpriteScale * 0.24, avatarSpriteScale * 0.24]} />
            <meshBasicMaterial 
              map={isSelfStealth ? blueDotTexture : greenDotTexture}
              transparent={true}
              depthWrite={false}
            />
          </mesh>
        )}

        {showChatIcon && hasUnread && (
          <mesh position={[-avatarSpriteScale * 0.36, avatarYOffset + avatarSpriteScale * 0.36, 0.02]}>
            <planeGeometry args={[avatarSpriteScale * 0.24, avatarSpriteScale * 0.24]} />
            <meshBasicMaterial 
              map={envelopeTexture}
              transparent={true}
              depthWrite={false}
            />
          </mesh>
        )}

        {challengeCount > 0 && (
          <mesh 
            position={[-avatarSpriteScale * 0.36, avatarYOffset - avatarSpriteScale * 0.36, 0.02]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectChallengeBadge?.(player);
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
            <planeGeometry args={[avatarSpriteScale * 0.28, avatarSpriteScale * 0.28]} />
            <meshBasicMaterial 
              map={getSwordsTexture(player.color || '#f59e0b', challengeCount)}
              transparent={true}
              depthWrite={false}
            />
          </mesh>
        )}

        {missionsWeekCount > 0 && (
          <mesh 
            position={[avatarSpriteScale * 0.36, avatarYOffset - avatarSpriteScale * 0.36, 0.02]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectMissionsWeek?.(player);
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
            <planeGeometry args={[avatarSpriteScale * 0.28, avatarSpriteScale * 0.28]} />
            <meshBasicMaterial 
              map={getMissionsWeekTexture(player.color || '#10b981', missionsWeekCount)}
              transparent={true}
              depthWrite={false}
            />
          </mesh>
        )}
      </Billboard>

      {showHealth ? (
        <Billboard follow={true}>
          <group position={[0, -(haloScale * 0.5 + 0.08), 0.01]}>
            <mesh renderOrder={998}>
              <planeGeometry args={[0.5 * avatarScale, 0.065]} />
              <meshBasicMaterial 
                color="#ffffff" 
                transparent 
                opacity={0.25} 
                toneMapped={false} 
                depthWrite={false} 
                depthTest={false} 
              />
            </mesh>
            {player.health !== undefined && player.health > 0 && (
              <mesh 
                position={[-0.5 * avatarScale / 2 + (0.5 * avatarScale * (player.health / 100)) / 2, 0, 0.001]}
                renderOrder={999}
              >
                <planeGeometry args={[0.5 * avatarScale * (player.health / 100), 0.052]} />
                <meshBasicMaterial 
                  color={
                    player.health < 35 ? '#ff0055' 
                    : player.health < 70 ? '#ff7700' 
                    : '#00ff66'
                  }
                  transparent={true}
                  toneMapped={false}
                  depthWrite={false}
                  depthTest={false}
                />
              </mesh>
            )}
            {player.health !== undefined && player.health > 0 && (
              <mesh 
                position={[-0.5 * avatarScale / 2 + (0.5 * avatarScale * (player.health / 100)) / 2, 0.027, 0.002]}
                renderOrder={1000}
              >
                <planeGeometry args={[0.5 * avatarScale * (player.health / 100), 0.006]} />
                <meshBasicMaterial 
                  color="#ffffff"
                  transparent
                  opacity={0.8}
                  toneMapped={false}
                  depthWrite={false}
                  depthTest={false}
                />
              </mesh>
            )}
            {player.health !== undefined && (
              <Text
                position={[0, 0, 0.003]}
                fontSize={0.042}
                fontWeight="bold"
                color="#050a15"
                anchorX="center"
                anchorY="middle"
                material-depthTest={false}
                material-depthWrite={false}
                renderOrder={1001}
              >
                {`${player.health} IT`}
              </Text>
            )}
          </group>
        </Billboard>
      ) : (
        rankTag && (
          <Billboard follow={true}>
            <Text
              position={[0, -(haloScale * 0.5 + 0.08), 0.01]}
              fontSize={fontSize * 1.1}
              fontWeight="900"
              color={color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
              material-depthWrite={false}
              frustumCulled={false}
            >
              {rankTag}
            </Text>
          </Billboard>
        )
      )}

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
      
      {isMe && (
        <Billboard follow={true}>
          <mesh 
            ref={bracketsRef} 
            position={[0, avatarYOffset / 2, 0.005]} 
            renderOrder={1001}
          >
            <planeGeometry args={[avatarScale * 1.15, avatarScale * 1.15]} />
            <meshBasicMaterial 
              map={bracketsTexture} 
              transparent={true} 
              toneMapped={false}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}
