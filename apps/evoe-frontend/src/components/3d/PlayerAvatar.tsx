import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

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

interface PlayerAvatarProps {
  player: any;
  position: [number, number, number];
  avatarScale?: number;
  onSelectPlayer?: (p: any) => void;
  isOnline?: boolean;
  hasUnread?: boolean;
  showHealth?: boolean;
  showChatIcon?: boolean;
  rankTag?: string;
}

export function PlayerAvatar({ 
  player, 
  position, 
  avatarScale = 1, 
  onSelectPlayer, 
  isOnline = false,
  hasUnread = false,
  showHealth = true,
  showChatIcon = true,
  rankTag
}: PlayerAvatarProps) {
  const color = player.color || '#40916C';
  const isMe = player.isCurrent;
  const initial = (player.pseudo || '?')[0].toUpperCase();

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const bracketsRef = useRef<THREE.Mesh>(null);

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
      
      const avatarUrl = `${EVOE_IMG_URL}avatars_3D/${file}`;
      
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        avatarUrl,
        (tex) => setTexture(tex),
        undefined,
        () => setTexture(null)
      );
    };

    if (player.avatar && player.avatar !== 'avatars/default.png') {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        `${EVOE_IMG_URL}${player.avatar}`,
        (tex) => setTexture(tex),
        undefined,
        () => loadStatic3DAvatar()
      );
    } else {
      loadStatic3DAvatar();
    }
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
            color={color} 
            transparent={true} 
            opacity={isMe ? 0.9 : 0.6} 
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
            frustumCulled={false}
          >
            {initial}
          </Text>
        )}

        {isOnline && (
          <mesh position={[avatarSpriteScale * 0.36, avatarYOffset + avatarSpriteScale * 0.36, 0.01]}>
            <planeGeometry args={[avatarSpriteScale * 0.24, avatarSpriteScale * 0.24]} />
            <meshBasicMaterial 
              map={greenDotTexture}
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
                {`${player.health} HP`}
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
