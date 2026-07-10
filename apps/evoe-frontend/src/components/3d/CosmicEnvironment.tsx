import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

// Composant pour l'effet d'hyperespace/tunnel de vitesse (particules scintillantes)
export function SpeedParticles({ isMobile = false }: { isMobile?: boolean }) {
  const count = isMobile ? 35 : 100;
  const pointsRef = useRef<THREE.Points>(null);
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Dispersion sous forme de tunnel le long de l'axe Z (de -15 à 15)
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10 - 0.5;
      pos[i * 3 + 2] = -15 + Math.random() * 30;
      
      cols[i * 3] = 1;
      cols[i * 3 + 1] = 1;
      cols[i * 3 + 2] = 1;
    }
    return [pos, cols];
  }, [count]);

  useFrame(() => {
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posArr = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        // Les particules voyagent rapidement vers la caméra (axe +Z)
        posArr[i * 3 + 2] += 0.38;
        if (posArr[i * 3 + 2] > 15) {
          // Réinitialisation au fond (Z = -15) avec de nouveaux X/Y aléatoires
          posArr[i * 3] = (Math.random() - 0.5) * 16;
          posArr[i * 3 + 1] = (Math.random() - 0.5) * 10 - 0.5;
          posArr[i * 3 + 2] = -15;
        }
      }
      geo.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} key={count}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          args={[positions, 3]} 
        />
        <bufferAttribute 
          attach="attributes-color"
          args={[colors, 3]} 
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.06} 
        color="#ffffff" 
        transparent 
        opacity={0.65} 
        sizeAttenuation={true} 
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Échelle cosmique commune (Frise de progression latérale)
export function CosmicScale({ schoolYear }: { schoolYear?: string }) {
  const scaleX = -6.5; // Positionnée sur la gauche
  const markers = [0, 20, 40, 60, 80, 100];
  const startYearMatch = schoolYear?.match(/^(\d{4})-\d{4}$/);
  const startYear = startYearMatch ? parseInt(startYearMatch[1], 10) : 2026;

  return (
    <group>
      {/* Ligne principale de l'échelle */}
      <mesh position={[scaleX, -0.51, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 23, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Graduations et Textes */}
      {markers.map(pct => {
        const markerZ = 11 - (pct / 100) * 17;
        const calculatedYear = Math.min(startYear + 44, startYear + Math.round((pct * 44) / 100 / 5) * 5);
        
        return (
          <group key={pct} position={[scaleX, -0.51, markerZ]}>
            {/* Tiret de graduation pointant vers les vaisseaux */}
            <mesh position={[0.25, 0, 0]}>
              <boxGeometry args={[0.5, 0.005, 0.02]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            
            {/* Texte du pourcentage */}
            <Billboard position={[-0.6, 0.2, 0]} follow={true}>
              <Text
                fontSize={0.25}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000000"
                fillOpacity={0.6}
              >
                {calculatedYear}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

// Composant d'impulsion d'onde de choc temporelle (Écho)
export function TemporalEchoPulse({ globalProgression }: { globalProgression: number }) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const lastProg = useRef(globalProgression);
  const triggerPulse = useRef(false);
  const pulseTime = useRef(0);

  // Déclencher le flash rapide de l'onde de choc lors d'une nouvelle validation
  if (globalProgression > lastProg.current) {
    triggerPulse.current = true;
    pulseTime.current = 0;
    lastProg.current = globalProgression;
  } else if (globalProgression < lastProg.current) {
    // Synchroniser en cas de reset ou de baisse
    lastProg.current = globalProgression;
  }

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (pulseRef.current) {
      if (triggerPulse.current) {
        pulseTime.current += delta * 1.5; // Vitesse de propagation
        const ratio = Math.min(1.0, pulseTime.current);
        const currentZ = THREE.MathUtils.lerp(12.2, -10.2, ratio);
        pulseRef.current.position.z = currentZ;
        
        // La jauge s'agrandit et s'estompe vers la fin
        const size = 1.5 + Math.sin(ratio * Math.PI) * 2.0;
        pulseRef.current.scale.set(size, size, 1);
        
        const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (1.0 - ratio) * 0.9;
        
        if (ratio >= 1.0) {
          triggerPulse.current = false;
        }
      } else {
        // Pulsation ambiante douce et régulière le long du tunnel
        const cycle = (t % 4.5) / 4.5;
        const currentZ = THREE.MathUtils.lerp(12.2, -10.2, cycle);
        pulseRef.current.position.z = currentZ;
        
        const size = 1.2 + Math.sin(cycle * Math.PI) * 0.8;
        pulseRef.current.scale.set(size, size, 1);
        
        const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.sin(cycle * Math.PI) * 0.22;
      }
    }
  });

  return (
    <mesh ref={pulseRef} position={[0, 0.4, 12.2]}>
      <torusGeometry args={[1.6, 0.05, 8, 32]} />
      <meshBasicMaterial color="#00ffcc" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}
