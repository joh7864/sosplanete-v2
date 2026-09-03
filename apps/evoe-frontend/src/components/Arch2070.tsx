import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Arch2070Props {
  progression: number; // 0 à 100
}

// -------------------------------------------------------------
// MICRO-CITÉS BULLES SATELLITES HABITABLES (5 ARCHÉTYPES UNIQUES)
// -------------------------------------------------------------
function OrbitalBubbleSatellite({ 
  sat, 
  progRatio, 
  coreColor 
}: { 
  sat: any; 
  progRatio: number; 
  coreColor: THREE.Color; 
}) {
  const satRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const inverseRatio = 1.0 - progRatio;

  const currentPos: [number, number, number] = [
    sat.target[0] + sat.drift[0] * inverseRatio,
    sat.target[1] + sat.drift[1] * inverseRatio,
    sat.target[2] + sat.drift[2] * inverseRatio
  ];

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (satRef.current) {
      // Rotation douce sur son axe propre
      satRef.current.rotation.y = t * 0.15 + sat.id * 1.2;
      satRef.current.position.y = currentPos[1] + Math.sin(t * 0.8 + sat.id) * 0.03;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.4;
    }
  });

  const type = sat.id % 5;

  return (
    <group 
      ref={satRef} 
      position={currentPos} 
      scale={[sat.scale, sat.scale, sat.scale]}
    >
      {/* 1. Socle métallique inférieur sous la bulle */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.26, 0.16, 0.08, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Anneau lumineux d'attache orbitale */}
      <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.27, 0.012, 8, 24]} />
        <meshBasicMaterial color={coreColor} toneMapped={false} />
      </mesh>

      {/* 2. Micro-ailes solaires articulées à la base */}
      <mesh position={[0.34, -0.06, 0]}>
        <boxGeometry args={[0.18, 0.01, 0.12]} />
        <meshStandardMaterial color="#1e3a8a" emissive="#1d4ed8" emissiveIntensity={0.3} metalness={0.95} />
      </mesh>
      <mesh position={[-0.34, -0.06, 0]}>
        <boxGeometry args={[0.18, 0.01, 0.12]} />
        <meshStandardMaterial color="#1e3a8a" emissive="#1d4ed8" emissiveIntensity={0.3} metalness={0.95} />
      </mesh>

      {/* ========================================================= */}
      {/* CONTENU INTÉRIEUR SPÉCIFIQUE SELON LE TYPE DE MICRO-CITÉ */}
      {/* ========================================================= */}

      {/* TYPE 0 : Cité-Jardin Flottante (Parcs & 3 Tours Blanches) */}
      {type === 0 && (
        <group>
          {/* Sol de pelouse verte */}
          <mesh position={[0, -0.01, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.02, 16]} />
            <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.3} />
          </mesh>
          {/* 3 Petits Gratte-ciels blancs avec fenêtres dorées */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 0.18, 8]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.037, 0.047, 0.04, 8]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>

          <mesh position={[0.08, 0.06, 0.05]}>
            <cylinderGeometry args={[0.025, 0.03, 0.14, 6]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
          </mesh>
          <mesh position={[0.08, 0.07, 0.05]}>
            <cylinderGeometry args={[0.027, 0.032, 0.03, 6]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>

          <mesh position={[-0.07, 0.05, -0.06]}>
            <cylinderGeometry args={[0.02, 0.025, 0.12, 6]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.8} />
          </mesh>

          {/* Arbres 3D volumiques */}
          <mesh position={[-0.08, 0.04, 0.08]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#22c55e" emissive="#15803d" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.09, 0.035, -0.07]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#4ade80" emissive="#16a34a" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}

      {/* TYPE 1 : Aqua-Dôme Océanique (Bassin Turquoise & Tours Spirales) */}
      {type === 1 && (
        <group>
          {/* Bassin d'eau turquoise luminescent */}
          <mesh position={[0, -0.01, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.02, 16]} />
            <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.6} metalness={0.8} roughness={0.1} />
          </mesh>
          {/* Tours en arcades bleues / blanches */}
          <mesh position={[0.05, 0.09, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.20, 8]} />
            <meshStandardMaterial color="#0284c7" emissive="#0ea5e9" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[-0.06, 0.07, 0.06]}>
            <cylinderGeometry args={[0.025, 0.03, 0.15, 8]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          {/* Passerelle vitrée au-dessus de l'eau */}
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.18, 0.008, 0.02]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      )}

      {/* TYPE 2 : Arcologie Solaire (Tours Prismatiques Dorées) */}
      {type === 2 && (
        <group>
          {/* Sol ambré */}
          <mesh position={[0, -0.01, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.02, 16]} />
            <meshStandardMaterial color="#b45309" emissive="#d97706" emissiveIntensity={0.3} />
          </mesh>
          {/* Tour géométrique dorée */}
          <mesh position={[0, 0.1, 0]}>
            <coneGeometry args={[0.06, 0.22, 6]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <coneGeometry args={[0.062, 0.05, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Pavillons d'énergie */}
          <mesh position={[0.09, 0.05, -0.05]}>
            <boxGeometry args={[0.04, 0.1, 0.04]} />
            <meshStandardMaterial color="#fef08a" metalness={0.7} />
          </mesh>
        </group>
      )}

      {/* TYPE 3 : Cyber-Observatoire Spatial (Anneaux rotatifs & Flèche) */}
      {type === 3 && (
        <group>
          {/* Sol cyber high-tech */}
          <mesh position={[0, -0.01, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.02, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          {/* Dôme d'observation central */}
          <mesh position={[0, 0.04, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#00ffcc" emissive="#00e5ff" emissiveIntensity={0.5} />
          </mesh>
          {/* Anneau rotatif orbital miniature */}
          <mesh ref={ringRef} position={[0, 0.06, 0]}>
            <torusGeometry args={[0.12, 0.008, 6, 24]} />
            <meshBasicMaterial color="#00ffcc" />
          </mesh>
          {/* Flèche d'antenne de communication avec balise rouge */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.005, 0.01, 0.14, 6]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial color="#ef4444" toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* TYPE 4 : Cité Sylvestre Étagée (Bio-Terrasses Botaniques Vertes) */}
      {type === 4 && (
        <group>
          {/* Terrasse 1 (Vert sombre) */}
          <mesh position={[0, -0.01, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.02, 16]} />
            <meshStandardMaterial color="#15803d" emissive="#166534" emissiveIntensity={0.3} />
          </mesh>
          {/* Terrasse 2 (Vert émeraude surélevé) */}
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.04, 16]} />
            <meshStandardMaterial color="#22c55e" emissive="#15803d" emissiveIntensity={0.35} />
          </mesh>
          {/* Terrasse 3 (Vert lime avec grand arbre) */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
            <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={0.4} />
          </mesh>
          {/* Arbre Majestueux 3D au sommet */}
          <mesh position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#86efac" emissive="#4ade80" emissiveIntensity={0.4} />
          </mesh>
          {/* Mini-habitats écologiques intégrés */}
          <mesh position={[0.09, 0.05, 0.04]}>
            <boxGeometry args={[0.03, 0.04, 0.03]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[-0.08, 0.04, -0.05]}>
            <boxGeometry args={[0.03, 0.03, 0.03]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      )}

      {/* ========================================================= */}
      {/* 3. DÔME / BULLE EN VERRE CRISTAL TRANSPARENTE EXTÉRIEURE */}
      {/* ========================================================= */}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.29, 24, 24]} />
        <meshPhysicalMaterial 
          color="#dbeafe"
          transparent
          opacity={0.18}
          roughness={0.03}
          metalness={0.05}
          transmission={0.96}
          thickness={0.04}
          ior={1.2}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Liseré méridien géodésique subtil sur la sphère */}
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.29, 0.003, 6, 24]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// COMPOSANT PRINCIPAL : L'ARCHE EVOE 2070
// -------------------------------------------------------------
export default function Arch2070({ progression }: Arch2070Props) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);

  const progRatio = Math.min(100, Math.max(0, progression)) / 100; // 0.0 à 1.0

  // Exactement 5 Satellites Cités-Bulles positionnés entre le 2ème et le 3ème anneau
  const satellites = useMemo(() => {
    const list = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + 0.35;
      // Rayon positionné entre le 2ème anneau (r~0.75) et le 3ème anneau (r~1.15)
      const radius = 0.86 + (i % 2) * 0.08;
      
      const targetX = Math.cos(angle) * radius;
      const targetY = ((i % 3) - 1) * 0.08; // Proche du plan équatorial des anneaux
      const targetZ = Math.sin(angle) * radius;

      const driftX = (Math.cos(angle) + (Math.random() - 0.5) * 0.2) * 0.6;
      const driftY = (Math.random() - 0.5) * 0.4;
      const driftZ = (Math.sin(angle) + (Math.random() - 0.5) * 0.2) * 0.6;

      list.push({
        id: i,
        target: [targetX, targetY, targetZ] as [number, number, number],
        drift: [driftX, driftY, driftZ] as [number, number, number],
        scale: 0.20, // Échelle compacte et raffinée pour s'insérer entre les anneaux
      });
    }
    return list;
  }, []);

  // Shader pour le bouclier énergétique (ultra-fin pour transparence maximale)
  const shieldShader = useMemo(() => {
    return {
      uniforms: {
        color: { value: new THREE.Color('#00f0ff') },
        opacity: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float intensity = pow(1.0 - max(dot(normal, viewDir), 0.0), 12.0);
          gl_FragColor = vec4(color, intensity * opacity * 0.15);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    };
  }, []);

  const coreColor = useMemo(() => {
    if (progRatio < 0.4) {
      return new THREE.Color('#ff3300');
    } else if (progRatio < 0.8) {
      return new THREE.Color('#00e5ff');
    } else {
      return new THREE.Color('#00f0ff');
    }
  }, [progRatio]);

  // Définition des bâtiments de la cité centrale (finition métallique sombre & fenêtres douces)
  const buildings = useMemo(() => {
    return [
      { pos: [0, 0.22, 0], radiusTop: 0.035, radiusBottom: 0.055, height: 0.44, isCenter: true, color: '#1e293b' },
      { pos: [0.12, 0.17, 0.09], radiusTop: 0.022, radiusBottom: 0.032, height: 0.34, color: '#0f172a' },
      { pos: [-0.11, 0.15, 0.12], radiusTop: 0.020, radiusBottom: 0.028, height: 0.30, color: '#1e293b' },
      { pos: [-0.15, 0.18, -0.07], radiusTop: 0.024, radiusBottom: 0.030, height: 0.36, color: '#334155' },
      { pos: [0.11, 0.16, -0.12], radiusTop: 0.020, radiusBottom: 0.026, height: 0.32, color: '#0f172a' },
      { pos: [-0.03, 0.13, -0.15], radiusTop: 0.022, radiusBottom: 0.025, height: 0.26, color: '#1e293b' },
      { pos: [0.15, 0.12, -0.02], radiusTop: 0.016, radiusBottom: 0.022, height: 0.24, color: '#334155' },
      { pos: [-0.08, 0.11, 0.18], radiusTop: 0.018, radiusBottom: 0.022, height: 0.22, color: '#0f172a' },
      { pos: [0.04, 0.10, 0.18], radiusTop: 0.015, radiusBottom: 0.020, height: 0.20, color: '#1e293b' },
    ];
  }, []);

  // Liste des massifs d'arbres 3D volumiques et massifs végétaux
  const trees = useMemo(() => {
    return [
      { pos: [0.06, 0.06, 0.10], size: 0.042, color: '#22c55e' },
      { pos: [-0.05, 0.07, 0.07], size: 0.038, color: '#16a34a' },
      { pos: [-0.08, 0.05, -0.02], size: 0.045, color: '#4ade80' },
      { pos: [0.07, 0.06, -0.04], size: 0.040, color: '#22c55e' },
      { pos: [-0.14, 0.04, 0.05], size: 0.035, color: '#15803d' },
      { pos: [0.14, 0.04, 0.04], size: 0.036, color: '#22c55e' },
      { pos: [0.02, 0.05, -0.12], size: 0.042, color: '#4ade80' },
      { pos: [-0.07, 0.04, -0.11], size: 0.038, color: '#16a34a' },
      { pos: [0.10, 0.04, 0.15], size: 0.034, color: '#22c55e' },
      { pos: [-0.03, 0.05, 0.16], size: 0.036, color: '#4ade80' },
      { pos: [0, 0.05, 0.08], size: 0.032, color: '#86efac' },
    ];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Rotation lente globale de la station
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.06;
    }

    // 2. Pulsation douce du noyau
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 3) * 0.02 * (1.0 - progRatio * 0.5);
      coreRef.current.scale.setScalar(pulse);
    }

    const activationFactor = THREE.MathUtils.clamp((progRatio - 0.2) / 0.8, 0, 1);
    const s = 0.7 + 0.3 * activationFactor;

    // 3. Anneaux orbitaux
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.08 * activationFactor;
      ring1Ref.current.scale.set(s * 1.35, s * 1.35, s * 0.12);
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.12 * activationFactor;
      ring2Ref.current.scale.set(s * 1.15, s * 1.15, s * 0.12);
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = t * 0.05 * activationFactor;
      ring3Ref.current.scale.set(s * 1.6, s * 1.6, s * 0.08);
    }

    // 4. Bouclier protecteur transparent
    if (shieldRef.current) {
      const shieldScale = 1.0 + Math.sin(t * 2.5) * 0.005;
      shieldRef.current.scale.setScalar(shieldScale);
      
      const shieldMat = shieldRef.current.material as THREE.ShaderMaterial;
      shieldMat.uniforms.color.value.copy(coreColor);

      if (progRatio >= 0.8) {
        shieldMat.uniforms.opacity.value = THREE.MathUtils.lerp(
          shieldMat.uniforms.opacity.value,
          1.0,
          0.05
        );
        shieldRef.current.visible = true;
      } else {
        shieldMat.uniforms.opacity.value = THREE.MathUtils.lerp(
          shieldMat.uniforms.opacity.value,
          0,
          0.1
        );
        if (shieldMat.uniforms.opacity.value < 0.01) {
          shieldRef.current.visible = false;
        }
      }
    }
  });

  return (
    <group rotation={[0.28, 0, -0.22]}>
      <group ref={groupRef}>
        {/* 1. Noyau de la Station & Cité Intérieure */}
        <group ref={coreRef}>
          {/* Base métallique inférieure sombre */}
          <mesh>
            <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial 
              color="#13161c" 
              roughness={0.35} 
              metalness={0.9} 
            />
          </mesh>

          {/* Lignes néon de coque */}
          {progRatio > 0.05 && (
            <>
              <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.477, 0.006, 8, 48]} />
                <meshBasicMaterial color={coreColor} toneMapped={false} />
              </mesh>
              <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.4, 0.006, 8, 48]} />
                <meshBasicMaterial color={coreColor} toneMapped={false} />
              </mesh>
            </>
          )}
          
          {/* Flèche inférieure */}
          <group>
            <mesh position={[0, -0.4, 0]}>
              <cylinderGeometry args={[0.07, 0.04, 0.4, 12]} />
              <meshStandardMaterial color="#1a1d24" metalness={0.9} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.75, 0]}>
              <cylinderGeometry args={[0.04, 0.015, 0.4, 12]} />
              <meshStandardMaterial color="#12141a" metalness={0.9} roughness={0.25} />
            </mesh>
            <mesh position={[0, -1.05, 0]}>
              <coneGeometry args={[0.015, 0.3, 8]} />
              <meshStandardMaterial color="#08090d" metalness={0.9} roughness={0.2} />
            </mesh>
            {progRatio > 0.1 && (
              <>
                <mesh position={[0, -0.35, 0.07]}>
                  <sphereGeometry args={[0.012, 8, 8]} />
                  <meshBasicMaterial color={coreColor} toneMapped={false} />
                </mesh>
                <mesh position={[0, -0.6, 0.045]}>
                  <sphereGeometry args={[0.01, 8, 8]} />
                  <meshBasicMaterial color={coreColor} toneMapped={false} />
                </mesh>
              </>
            )}
          </group>

          {/* ========================================================= */}
          {/* CITÉ BIOSPHÈRE INTÉRIEURE (Parcs, Arbres 3D & Arcologies) */}
          {/* ========================================================= */}
          <group>
            {/* 1. Sol Végétal Vert Prairie Lumineux */}
            <mesh position={[0, 0.01, 0]}>
              <cylinderGeometry args={[0.49, 0.49, 0.02, 32]} />
              <meshStandardMaterial 
                color="#059669" 
                emissive="#047857" 
                emissiveIntensity={0.25}
                roughness={0.8} 
                metalness={0.1} 
              />
            </mesh>

            {/* 2. Anneaux de Jardins Suspendus / Terrasses Végétalisées */}
            <mesh position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.34, 0.028, 8, 36]} />
              <meshStandardMaterial 
                color="#22c55e" 
                emissive="#16a34a" 
                emissiveIntensity={0.3}
                roughness={0.7} 
              />
            </mesh>
            <mesh position={[0, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.20, 0.024, 8, 32]} />
              <meshStandardMaterial 
                color="#4ade80" 
                emissive="#22c55e" 
                emissiveIntensity={0.35}
                roughness={0.7} 
              />
            </mesh>

            {/* 3. Bassin Aquatique Central Turquoise */}
            <mesh position={[0, 0.025, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.012, 24]} />
              <meshStandardMaterial 
                color="#06b6d4" 
                emissive="#0891b2" 
                emissiveIntensity={0.35} 
                roughness={0.2} 
                metalness={0.7} 
              />
            </mesh>

            {/* 4. Forêts et Arbres 3D Volumiques (Visibles nettement de loin) */}
            {trees.map((tr, idx) => (
              <group key={`tree-${idx}`} position={[tr.pos[0], tr.pos[1], tr.pos[2]]}>
                {/* Tronc */}
                <mesh position={[0, -tr.size * 0.5, 0]}>
                  <cylinderGeometry args={[0.005, 0.007, tr.size * 0.8, 6]} />
                  <meshStandardMaterial color="#78350f" roughness={0.9} />
                </mesh>
                {/* Canopée Végétale Émeraude */}
                <mesh>
                  <sphereGeometry args={[tr.size, 10, 10]} />
                  <meshStandardMaterial 
                    color={tr.color} 
                    emissive={tr.color} 
                    emissiveIntensity={0.3} 
                    roughness={0.7} 
                  />
                </mesh>
              </group>
            ))}

            {/* 5. Passerelles / Skybridges reliant les gratte-ciels */}
            <mesh position={[0.06, 0.16, 0.04]} rotation={[0, 0.6, 0]}>
              <boxGeometry args={[0.16, 0.008, 0.014]} />
              <meshStandardMaterial color="#475569" emissive="#38bdf8" emissiveIntensity={0.25} metalness={0.8} />
            </mesh>
            <mesh position={[-0.07, 0.18, 0.03]} rotation={[0, -0.8, 0]}>
              <boxGeometry args={[0.18, 0.008, 0.014]} />
              <meshStandardMaterial color="#475569" emissive="#38bdf8" emissiveIntensity={0.25} metalness={0.8} />
            </mesh>
            <mesh position={[0.05, 0.15, -0.06]} rotation={[0, -0.5, 0]}>
              <boxGeometry args={[0.15, 0.008, 0.014]} />
              <meshStandardMaterial color="#475569" emissive="#38bdf8" emissiveIntensity={0.25} metalness={0.8} />
            </mesh>

            {/* 6. Gratte-ciels futuristes & Arcologies (Teintes sombres et fenêtres douces) */}
            {buildings.map((b, idx) => (
              <group key={idx} position={[b.pos[0], b.pos[1], b.pos[2]]}>
                {/* Corps de la tour */}
                <mesh>
                  <cylinderGeometry args={[b.radiusTop, b.radiusBottom, b.height, 8]} />
                  <meshStandardMaterial 
                    color={b.color || '#1e293b'} 
                    metalness={0.85} 
                    roughness={0.35} 
                  />
                </mesh>

                {/* Fenêtres douces et élégantes (sans éblouissement) */}
                <mesh position={[0, b.height * 0.25, 0]}>
                  <cylinderGeometry args={[b.radiusTop + 0.001, b.radiusBottom + 0.001, 0.016, 8]} />
                  <meshStandardMaterial color="#0f172a" emissive="#fbbf24" emissiveIntensity={0.6} />
                </mesh>
                <mesh position={[0, -b.height * 0.2, 0]}>
                  <cylinderGeometry args={[b.radiusTop + 0.001, b.radiusBottom + 0.001, 0.016, 8]} />
                  <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.5} />
                </mesh>
                {b.height > 0.3 && (
                  <mesh position={[0, 0.02, 0]}>
                    <cylinderGeometry args={[b.radiusTop + 0.001, b.radiusBottom + 0.001, 0.016, 8]} />
                    <meshStandardMaterial color="#0f172a" emissive="#f8fafc" emissiveIntensity={0.4} />
                  </mesh>
                )}

                {/* Toit végétalisé */}
                {!b.isCenter && (
                  <mesh position={[0, b.height / 2 + 0.004, 0]}>
                    <cylinderGeometry args={[b.radiusTop * 0.85, b.radiusTop * 0.85, 0.01, 8]} />
                    <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.25} />
                  </mesh>
                )}

                {/* Antenne & Balise sur la grande tour centrale */}
                {b.isCenter && (
                  <group position={[0, b.height / 2, 0]}>
                    <mesh position={[0, 0.04, 0]}>
                      <cylinderGeometry args={[0.004, 0.012, 0.08, 6]} />
                      <meshStandardMaterial color="#00ffcc" metalness={0.9} />
                    </mesh>
                    <mesh position={[0, 0.085, 0]}>
                      <sphereGeometry args={[0.008, 8, 8]} />
                      <meshBasicMaterial color="#ef4444" toneMapped={false} />
                    </mesh>
                  </group>
                )}
              </group>
            ))}
          </group>

          {/* 7. Dôme Protecteur en Verre Cristal Ultra-Transparent */}
          <mesh>
            <sphereGeometry args={[0.52, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial 
              color="#e0f7fa"
              transparent
              opacity={0.14}
              roughness={0.02}
              metalness={0.05}
              transmission={0.98}
              thickness={0.04}
              ior={1.18}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Arches méridiennes géodésiques lumineuses */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.52, 0.004, 8, 48]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.52, 0.003, 6, 32, Math.PI]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.22} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.52, 0.003, 6, 32, Math.PI]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.22} />
          </mesh>

          {/* 8. Éclairage interne équilibré de la biosphère (doux et lisible) */}
          <pointLight 
            position={[0, 0.28, 0]} 
            color="#fef3c7" 
            intensity={0.6} 
            distance={2.0} 
            decay={2.0} 
          />
          <pointLight 
            position={[0, 0.08, 0]} 
            color="#00ffcc" 
            intensity={0.4} 
            distance={1.8} 
            decay={2.0} 
          />
        </group>
        
        {/* Halo externe diffus */}
        <pointLight 
          color={coreColor} 
          intensity={0.5 + progRatio * 0.8} 
          distance={4} 
          decay={2.0}
        />

        {/* 2. Anneaux Principaux de l'Arche */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.85, 0.04, 12, 64]} />
          <meshStandardMaterial 
            color="#1d2026" 
            roughness={0.3} 
            metalness={0.9} 
            emissive={coreColor}
            emissiveIntensity={0.18 * progRatio}
          />
        </mesh>

        <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.65, 0.02, 12, 64]} />
          <meshStandardMaterial 
            color="#14161b" 
            roughness={0.4} 
            metalness={0.85} 
            emissive={coreColor}
            emissiveIntensity={0.12 * progRatio}
          />
        </mesh>

        <mesh ref={ring3Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.05, 0.012, 8, 64]} />
          <meshStandardMaterial 
            color="#0f1014" 
            roughness={0.4} 
            metalness={0.8} 
            emissive={coreColor}
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* 3. Les 5 Satellites Cités-Bulles Rapprochés des Anneaux */}
        {satellites.map((sat) => (
          <OrbitalBubbleSatellite 
            key={sat.id} 
            sat={sat} 
            progRatio={progRatio} 
            coreColor={coreColor} 
          />
        ))}

        {/* 4. Bouclier Protecteur Énergétique */}
        <mesh ref={shieldRef}>
          <sphereGeometry args={[0.55, 32, 32]} />
          <shaderMaterial attach="material" args={[shieldShader]} />
        </mesh>
      </group>

      {/* 5. Lens Flare / Étoile de Brillance sur le flanc droit */}
      {progRatio >= 0.5 && (
        <group position={[1.08, 0.01, 0]}>
          <mesh>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh>
            <coneGeometry args={[0.007, 0.48, 4]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.007, 0.48, 4]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.007, 0.48, 4]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.007, 0.48, 4]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={coreColor} transparent opacity={0.35} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}
