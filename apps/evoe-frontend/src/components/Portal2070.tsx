import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshWobbleMaterial, Text, OrbitControls, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';

// Shader Material basique pour le Glitch
const glitchShader = {
  uniforms: {
    time: { value: 0 },
    active: { value: 0.0 } // 0 = inactif (glitché), 1 = actif (normal)
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform float active;
    varying vec2 vUv;
    
    // Fonction random basique
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      if (active > 0.5) {
        // Mode actif: Couleur solide ou texture normale
        gl_FragColor = vec4(0.2, 0.8, 1.0, 1.0);
      } else {
        // Mode glitché (descendant inactif)
        float noise = random(vUv * time);
        vec3 color = vec3(noise * 0.5 + 0.1); // gris statique
        float alpha = noise > 0.8 ? 0.3 : 0.1; // semi transparent
        gl_FragColor = vec4(color, alpha);
      }
    }
  `,
  transparent: true
};

export default function Portal2070() {
  const radarRef = useRef<THREE.Group>(null);
  const timeUniformRef = useRef({ value: 0 });
  const { players } = useAuth();

  const teamList = players || [];
  const count = teamList.length || 30;

  useFrame((state) => {
    if (radarRef.current) {
      radarRef.current.rotation.y = state.clock.getElapsedTime() * 0.1; // Rotation lente de l'orbite
    }
    timeUniformRef.current.value = state.clock.getElapsedTime();
  });

  return (
    <group>
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        minPolarAngle={Math.PI/2 - 0.1} 
        maxPolarAngle={Math.PI/2 + 0.1} 
      />

      <ambientLight intensity={0.2} />
      
      {/* Ciel Etoilé sombre */}
      <Sphere args={[50, 32, 32]}>
        <meshBasicMaterial color="#050510" side={THREE.BackSide} />
      </Sphere>

      {/* Radar Orbital Central */}
      <Sphere args={[2, 32, 32]} position={[0, 0, 0]}>
        <MeshWobbleMaterial factor={1} speed={2} color="#00ffcc" wireframe />
      </Sphere>

      {/* Descendants en orbite */}
      <group ref={radarRef}>
        {teamList.length > 0 ? teamList.map((player, i) => {
          // Calculer l'angle pour que isCurrent soit toujours à Math.PI / 2
          const currentIndex = teamList.findIndex(p => p.isCurrent);
          const shift = currentIndex !== -1 ? currentIndex : 0;
          const normalizedIndex = (i - shift + count) % count;
          const angle = (normalizedIndex / count) * Math.PI * 2 + (Math.PI / 2);

          const radius = 8 + (i % 2 === 0 ? 0 : 1.5);
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          // Simulation: 3 équipes actives, le reste inactif
          const isActive = player.isCurrent || i % 5 === 0;

          return (
            <group key={player.id} position={[x, 0, z]}>
              <Billboard follow={true}>
                <mesh position={[0, 0, 0]} frustumCulled={false}>
                  <boxGeometry args={[0.5, 0.5, 0.05]} />
                  <shaderMaterial 
                    attach="material" 
                    args={[glitchShader]} 
                    uniforms-time={timeUniformRef.current}
                    uniforms-active-value={isActive ? 1.0 : 0.0}
                    transparent={true}
                    depthWrite={false}
                  />
                </mesh>
                {isActive && (
                  <Text
                    position={[0, -0.6, 0]}
                    fontSize={0.2}
                    color={player.color || "#00ffcc"}
                    anchorX="center"
                    anchorY="middle"
                    depthWrite={false}
                    frustumCulled={false}
                  >
                    {player.pseudo}
                  </Text>
                )}
              </Billboard>
            </group>
          );
        }) : (
          Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const x = Math.cos(angle) * 8;
            const z = Math.sin(angle) * 8;
            return (
              <mesh key={i} position={[x, 0, z]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#333" opacity={0.5} transparent />
              </mesh>
            );
          })
        )}
      </group>
    </group>
  );
};
