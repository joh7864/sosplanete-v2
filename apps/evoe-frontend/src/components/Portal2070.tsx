import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

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

export const Portal2070: React.FC = () => {
  const radarRef = useRef<THREE.Group>(null);
  const timeUniformRef = useRef({ value: 0 });

  useFrame((state) => {
    if (radarRef.current) {
      radarRef.current.rotation.y = state.clock.getElapsedTime() * 0.1; // Rotation lente de l'orbite
    }
    timeUniformRef.current.value = state.clock.getElapsedTime();
  });

  return (
    <group>
      <ambientLight intensity={0.2} />
      
      {/* Ciel Etoilé sombre */}
      <Sphere args={[50, 32, 32]}>
        <meshBasicMaterial color="#050510" side={THREE.BackSide} />
      </Sphere>

      {/* Radar Orbital Central */}
      <Sphere args={[2, 32, 32]} position={[0, 0, 0]}>
        <MeshWobbleMaterial factor={1} speed={2} color="#00ffcc" wireframe />
      </Sphere>

      {/* 30 Descendants en orbite */}
      <group ref={radarRef}>
        {Array.from({ length: 30 }).map((_, i) => {
          const angle = (i / 30) * Math.PI * 2;
          const radius = 8;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          // Simulation: 3 équipes actives, le reste inactif
          const isActive = i % 10 === 0;

          return (
            <mesh key={i} position={[x, 0, z]}>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <shaderMaterial 
                attach="material" 
                args={[glitchShader]} 
                uniforms-time={timeUniformRef.current}
                uniforms-active-value={isActive ? 1.0 : 0.0}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};
