import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Arch2070Props {
  progression: number; // 0 à 100
}

export default function Arch2070({ progression }: Arch2070Props) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);

  const progRatio = Math.min(100, Math.max(0, progression)) / 100; // 0.0 à 1.0

  // Définir la liste des débris (fragments flottants)
  const fragments = useMemo(() => {
    const list = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.6 + Math.random() * 0.4;
      
      const targetX = Math.cos(angle) * radius;
      const targetY = (Math.random() - 0.5) * 0.5;
      const targetZ = Math.sin(angle) * radius;

      const driftX = (Math.cos(angle) + (Math.random() - 0.5) * 0.6) * 1.5;
      const driftY = (Math.random() - 0.5) * 1.8;
      const driftZ = (Math.sin(angle) + (Math.random() - 0.5) * 0.6) * 1.5;

      list.push({
        id: i,
        target: [targetX, targetY, targetZ] as [number, number, number],
        drift: [driftX, driftY, driftZ] as [number, number, number],
        scale: 0.08 + Math.random() * 0.12,
        rotSpeed: [
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ] as [number, number, number]
      });
    }
    return list;
  }, []);

  // Custom Shader pour le bouclier (gradient halo périphérique ultra-serré et doux)
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
          // Effet Fresnel ultra-serré pour faire briller uniquement l'extrême bordure
          float intensity = pow(1.0 - max(dot(normal, viewDir), 0.0), 9.5);
          gl_FragColor = vec4(color, intensity * opacity * 0.20);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    };
  }, []);

  // Détermination de la couleur en fonction du niveau de réparation (AT)
  // Rouge/orange (dystopie/danger) -> Cyan (transition) -> Bleu/Cyan Électrique comme la capture
  const coreColor = useMemo(() => {
    if (progRatio < 0.4) {
      return new THREE.Color('#ff3300');
    } else if (progRatio < 0.8) {
      return new THREE.Color('#00e5ff');
    } else {
      // Bleu/Cyan électrique pour ressembler fidèlement à la copie d'écran
      return new THREE.Color('#00f0ff');
    }
  }, [progRatio]);

  // Définition des tours pour la cité intérieure (plus dense et détaillée)
  const towers = useMemo(() => {
    return [
      { pos: [0, 0, 0], radiusTop: 0.045, radiusBottom: 0.065, height: 0.42 },
      { pos: [0.1, 0, 0.08], radiusTop: 0.02, radiusBottom: 0.03, height: 0.3 },
      { pos: [-0.09, 0, 0.11], radiusTop: 0.015, radiusBottom: 0.025, height: 0.26 },
      { pos: [-0.13, 0, -0.06], radiusTop: 0.022, radiusBottom: 0.025, height: 0.35 },
      { pos: [0.09, 0, -0.1], radiusTop: 0.018, radiusBottom: 0.022, height: 0.28 },
      { pos: [-0.02, 0, -0.13], radiusTop: 0.02, radiusBottom: 0.02, height: 0.21 },
      { pos: [0.12, 0, -0.02], radiusTop: 0.012, radiusBottom: 0.018, height: 0.18 },
    ];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Rotation lente globale du groupe principal tournant
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.06;
    }

    // 2. Pulsation et rotation du noyau d'énergie
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 4) * 0.04 * (1.0 - progRatio * 0.5);
      coreRef.current.scale.setScalar(pulse);
    }

    const activationFactor = THREE.MathUtils.clamp((progRatio - 0.2) / 0.8, 0, 1);
    const s = 0.7 + 0.3 * activationFactor;

    // 3. Rotation et mise à l'échelle aplatie des anneaux (Saturn-like horizontal)
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.08 * activationFactor;
      // Torus aplati : échelle X,Y normale pour le diamètre, Z très fin pour l'aplatir
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

    // 4. Bouclier énergétique ultra-serré
    if (shieldRef.current) {
      const shieldScale = 1.0 + Math.sin(t * 2.5) * 0.005; // Oscillation minime
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
    // Inclinaison de ~25° (rotation X=0.28, Z=-0.22) pour correspondre fidèlement à la perspective de la station orbitale
    <group rotation={[0.28, 0, -0.22]}>
      {/* Groupe en rotation sur son axe propre */}
      <group ref={groupRef}>
        {/* 1. Noyau de la Station Orbitale (Tours sous dôme & Aiguille inférieure) */}
        <group ref={coreRef}>
          {/* Base inférieure de la station (Coupe métallique sombre) */}
          <mesh>
            <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial 
              color="#1a1d24" 
              roughness={0.3} 
              metalness={0.9} 
            />
          </mesh>

          {/* Lignes lumineuses néon horizontales sur la coupe inférieure métallique (style high-tech de la capture) */}
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
          
          {/* Aiguille / Flèche inférieure sophistiquée (plus longue, avec points luminescents) */}
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

            {/* Points de lumières bleues / cyan le long de l'aiguille */}
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
                <mesh position={[0, -0.85, 0.025]}>
                  <sphereGeometry args={[0.008, 8, 8]} />
                  <meshBasicMaterial color={coreColor} toneMapped={false} />
                </mesh>
              </>
            )}
          </group>

          {/* Cité / Tours intérieures (sous le dôme) */}
          <group>
            {towers.map((t, idx) => (
              <group key={idx} position={[t.pos[0], t.height / 2, t.pos[2]]}>
                {/* Structure principale métallique de la tour */}
                <mesh>
                  <cylinderGeometry args={[t.radiusTop, t.radiusBottom, t.height, 8]} />
                  <meshStandardMaterial color="#121319" metalness={0.85} roughness={0.25} />
                </mesh>
                {/* Bandes lumineuses néon sur les tours (effets fenêtres high-tech) */}
                {progRatio > 0.05 && (
                  <>
                    <mesh position={[0, t.height * 0.22, 0]}>
                      <cylinderGeometry args={[t.radiusTop + 0.002, t.radiusBottom + 0.002, 0.015, 8]} />
                      <meshBasicMaterial color={coreColor} toneMapped={false} />
                    </mesh>
                    <mesh position={[0, -t.height * 0.22, 0]}>
                      <cylinderGeometry args={[t.radiusTop + 0.002, t.radiusBottom + 0.002, 0.015, 8]} />
                      <meshBasicMaterial color={coreColor} toneMapped={false} />
                    </mesh>
                    {t.height > 0.3 && (
                      <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[t.radiusTop + 0.002, t.radiusBottom + 0.002, 0.015, 8]} />
                        <meshBasicMaterial color={coreColor} toneMapped={false} />
                      </mesh>
                    )}
                  </>
                )}
              </group>
            ))}
          </group>

          {/* Dôme transparent (Verre cristal) */}
          <mesh>
            <sphereGeometry args={[0.52, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial 
              color="#dcf6ff"
              transparent
              opacity={0.3}
              roughness={0.05}
              metalness={0.1}
              transmission={0.85}
              ior={1.25}
              thickness={0.12}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Ligne équatoriale métallique */}
          <mesh>
            <torusGeometry args={[0.52, 0.012, 8, 48]} />
            <meshStandardMaterial color="#16171c" metalness={0.95} roughness={0.25} />
          </mesh>

          {/* Laser Emetteur de pulse shootant vers le haut à progression >80% */}
          {progRatio >= 0.8 && (
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.003, 0.003, 0.3, 8]} />
              <meshBasicMaterial color={coreColor} transparent opacity={0.8} toneMapped={false} />
            </mesh>
          )}
        </group>
        
        {/* Halo lumineux interne */}
        <pointLight 
          color={coreColor} 
          intensity={0.8 + progRatio * 1.5} 
          distance={4} 
          decay={2.0}
        />

        {/* 2. Anneaux Principaux de l'Arche (Saturn-like horizontaux concourants) */}
        {/* Rotation de Math.PI/2 sur X pour s'aligner sur le plan équatorial horizontal */}
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

        {/* 3. Débris / Fragments Mobiles (S'assemblent vers l'Arche avec progression) */}
        {fragments.map((frag) => {
          const inverseRatio = 1.0 - progRatio;
          const currentPos: [number, number, number] = [
            frag.target[0] + frag.drift[0] * inverseRatio,
            frag.target[1] + frag.drift[1] * inverseRatio,
            frag.target[2] + frag.drift[2] * inverseRatio
          ];

          return (
            <mesh 
              key={frag.id} 
              position={currentPos}
              scale={[frag.scale, frag.scale, frag.scale]}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial 
                color={progRatio < 0.4 ? "#3d1e1e" : "#2d3748"} 
                roughness={0.8} 
                metalness={0.2}
                emissive={progRatio < 0.4 ? "#992200" : "#005577"}
                emissiveIntensity={progRatio < 0.4 ? 0.3 * (1 - progRatio) : 0.1}
              />
            </mesh>
          );
        })}

        {/* 4. Bouclier Protecteur Sphérique très serré (radius 0.55 au lieu de 1.0) */}
        <mesh ref={shieldRef}>
          <sphereGeometry args={[0.55, 32, 32]} />
          <shaderMaterial attach="material" args={[shieldShader]} />
        </mesh>
      </group>

      {/* 5. Étoile de Brillance / Lens Flare fixe sur le flanc droit du dôme et de l'anneau principal */}
      {/* Positionné dans le groupe incliné mais hors du spinningGroup pour ne pas tourner */}
      {progRatio >= 0.5 && (
        <group position={[1.08, 0.01, 0]}>
          {/* Lueur centrale */}
          <mesh>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          {/* Spicules en croix blanche intense */}
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
          {/* Halo cyan diffus léger */}
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={coreColor} transparent opacity={0.35} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}
