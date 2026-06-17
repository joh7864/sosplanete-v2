import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, Text, OrbitControls, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Vessel2070 from './Vessel2070';


// Composant pour l'effet d'hyperespace/tunnel de vitesse (particules scintillantes)
function SpeedParticles() {
  const count = 100;
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
  }, []);

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
    <points ref={pointsRef}>
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

// Composant Vessel extrait vers Vessel2070.tsx

// Échelle cosmique commune (Frise de progression latérale)
function CosmicScale() {
  const scaleX = -6.5; // Positionnée sur la gauche
  const markers = [0, 20, 40, 60, 80, 100];

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
                {pct}%
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

export default function Portal2070({ dashboardStatus }: { dashboardStatus: any }) {
  const orbitRef = useRef<THREE.Group>(null);
  const planetMeshRef = useRef<THREE.Mesh>(null);
  const planetMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const spikesGroupRef = useRef<THREE.Group>(null);

  const { camera } = useThree();

  // Positionner idéalement la caméra pour la course temporelle en 2070
  // Vue cinématique : caméra reculée pour bien voir les vaisseaux, avec un angle bas
  useEffect(() => {
    camera.position.set(0, 3.5, 17);
    camera.lookAt(0, 0, 4);
    camera.updateProjectionMatrix();
  }, [camera]);



  // Récupération stable des équipes avec fallback
  const teams = useMemo(() => {
    if (dashboardStatus?.teams && dashboardStatus.teams.length > 0) {
      return dashboardStatus.teams;
    }
    return [
      { id: 't1', name: 'Équipe Alpha', color: '#10b981', position: 20, speed: 10, level: 1 },
      { id: 't2', name: 'Équipe Bêta', color: '#ffd700', position: 35, speed: 20, level: 2 },
      { id: 't3', name: 'Équipe Gamma', color: '#ff3b3b', position: 50, speed: 30, level: 3 }
    ];
  }, [dashboardStatus]);

  // Détermination du statut de la ligne temporelle (Chrono-Portail / Planète)
  const globalProgression = dashboardStatus?.globalProgression || 0;

  // Chargement de la texture réelle de la Terre satellite 2026 (locale)
  const [earthTexture, setEarthTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      '/earth.jpg',
      (tex) => setEarthTexture(tex)
    );
  }, []);

  // Injection de la texture de la Terre dans le shader une fois chargée
  useEffect(() => {
    if (planetMaterialRef.current && earthTexture) {
      planetMaterialRef.current.uniforms.earthMap.value = earthTexture;
    }
  }, [earthTexture]);

  // Shader procédural pour la planète métamorphique : volcanique (fissures magma) ➔ Terre réelle satellite 2026
  const planetShaderArgs = useMemo(() => {
    return {
      uniforms: {
        time: { value: 0 },
        progression: { value: 0 }, // 0.0 (volcanique) à 1.0 (Terre 2026 réelle)
        earthMap: { value: earthTexture || null }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float progression;
        uniform sampler2D earthMap;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        // Pseudo-bruit 3D simple
        float hash(vec3 p) {
          p = fract(p * 0.3183099 + .1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f*f*(3.0-2.0*f);
          return mix(
            mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)),f.x),
                mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)),f.x),
                mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)),f.x),f.y),f.z);
        }

        float fbm(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          vec3 shift = vec3(100.0);
          for (int i = 0; i < 4; ++i) {
            v += a * noise(p);
            p = p * 2.0 + shift;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 pos = vPosition * 2.5;
          // Bruit pour générer des détails
          float n = fbm(pos + vec3(0.0, 0.0, time * 0.04));
          
          // Lecture de la vraie texture de la Terre (même dans l'état dystopique)
          vec3 earthTexColor = texture2D(earthMap, vUv).rgb;
          
          // Détection des océans (les océans ont plus de bleu que de rouge)
          float isOcean = smoothstep(0.0, 0.1, earthTexColor.b - earthTexColor.r);
          
          // --- ÉTAT 1 : PLANÈTE VOLCANIQUE (AEON-9 DYSTOPIQUE) ---
          vec3 lavaBase = vec3(0.08, 0.06, 0.06); // Roche noire pour les continents
          
          // Les océans deviennent de la lave bouillonnante, les continents de la roche (avec quelques failles de lave liées au bruit)
          float lavaIntensity = clamp(isOcean * 0.85 + smoothstep(0.5, 0.6, n) * 0.4, 0.0, 1.0);
          
          float pulse = 0.85 + 0.15 * sin(time * 2.5 + n * 8.0);
          vec3 lavaGlow = vec3(1.0, 0.28 + 0.12 * sin(time), 0.0) * lavaIntensity * pulse * 2.5;
          vec3 lavaColor = mix(lavaBase, lavaGlow, lavaIntensity);

          // --- ÉTAT 2 : TERRE SAINE 2026 RÉELLE ---
          vec3 earthColor = earthTexColor;

          // Interpolation finale de la métamorphose
          vec3 finalColor = mix(lavaColor, earthColor, progression);

          // Éclairage directionnel
          vec3 light = normalize(vec3(1.0, 0.8, 0.7));
          float d = max(dot(vNormal, light), 0.26);
          
          // Atmosphère de Fresnel (inversion de couleur de rouge volcanique à bleu terrestre)
          float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
          vec3 atmosphere = mix(vec3(1.0, 0.2, 0.0) * 0.5, vec3(0.2, 0.75, 1.0) * 0.8, progression) * fresnel;

          gl_FragColor = vec4(finalColor * d + atmosphere, 1.0);
        }
      `,
      transparent: false
    };
  }, [earthTexture]);

  // Génération de 12 pics rocheux volcaniques répartis sur la sphère
  const volcanicSpikes = useMemo(() => {
    const spikes = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      
      const r = 2.76; // Rayon légèrement plus grand pour planter les pics à la surface de la planète de rayon 2.8
      const x = Math.sin(phi) * Math.cos(theta) * r;
      const y = Math.sin(phi) * Math.sin(theta) * r;
      const z = Math.cos(phi) * r;

      const direction = new THREE.Vector3(x, y, z).normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      
      spikes.push({
        position: [x, y, z] as [number, number, number],
        quaternion,
        scale: 0.16 + Math.random() * 0.16
      });
    }
    return spikes;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Rotation lente de l'orbite des descendants
    if (orbitRef.current) {
      orbitRef.current.rotation.z = t * 0.04;
    }

    // Rotation lente et réaliste de la Terre sur elle-même (axe Y)
    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y = t * 0.08;
    }

    // Animation du shader de la planète
    if (planetMaterialRef.current) {
      planetMaterialRef.current.uniforms.time.value = t;
      planetMaterialRef.current.uniforms.progression.value = THREE.MathUtils.lerp(
        planetMaterialRef.current.uniforms.progression.value,
        globalProgression / 100,
        0.05
      );
    }

    // Rétractation dynamique des pics rocheux volcaniques (ils s'enfoncent)
    if (spikesGroupRef.current && planetMaterialRef.current) {
      const currentProg = planetMaterialRef.current.uniforms.progression.value;
      const targetScale = 1.0 - currentProg;
      spikesGroupRef.current.scale.set(targetScale, targetScale, targetScale);
      spikesGroupRef.current.visible = targetScale > 0.02;
    }
  });

  return (
    <group>
      {/* Contrôles orbitaux sécurisés pour le confort visuel */}
      <OrbitControls 
        enableZoom={true} 
        enablePan={false} 
        minPolarAngle={Math.PI/2 - 0.5} 
        maxPolarAngle={Math.PI/2 + 0.15} 
        minDistance={10}
        maxDistance={25}
        target={[0, 0, 4]}
      />

      <ambientLight intensity={0.45} />
      {/* Lumière principale du portail à Z = -10 */}
      <pointLight position={[0, 0.4, -9.5]} intensity={2.8} color={globalProgression >= 50 ? '#00e5ff' : '#ff4500'} distance={25} decay={1.5} />
      {/* Lumière directionnelle principale (Soleil de côté) */}
      <directionalLight position={[5, 12, 6]} intensity={0.8} />
      {/* Lumière de face depuis l'arrière de la caméra pour éclairer les vaisseaux */}
      <directionalLight position={[0, 5, 20]} intensity={1.4} color="#ffffff" />
      <pointLight position={[0, 4, 15]} intensity={1.2} color="#ffffff" distance={15} />
      
      {/* Effet d'tunnel d'étoiles (hyperespace) */}
      <SpeedParticles />

      {/* Ciel Spatial sombre */}
      <Sphere args={[50, 32, 32]}>
        <meshBasicMaterial color="#010108" side={THREE.BackSide} />
      </Sphere>

      {/* Échelle Cosmique (remplace les pistes) */}
      <CosmicScale />

      {/* Vaisseaux des équipes */}
      {teams.map((t: any, i: number) => (
        <Vessel2070 key={t.id} team={t} index={i} total={teams.length} />
      ))}

      {/* Chrono-Planète Évolutive "Aeon-9" (Z = -10) */}
      <group position={[0, 0.4, -10.2]}>
        <mesh ref={planetMeshRef}>
          <sphereGeometry args={[2.8, 32, 32]} />
          <shaderMaterial key={earthTexture?.uuid || 'planet'} ref={planetMaterialRef} attach="material" args={[planetShaderArgs]} />
        </mesh>

        {/* Pics volcaniques rétractables par référence */}
        <group ref={spikesGroupRef}>
          {volcanicSpikes.map((spike, i) => (
            <mesh 
              key={i} 
              position={spike.position} 
              quaternion={spike.quaternion}
              scale={[spike.scale, spike.scale * 3.2, spike.scale]}
            >
              <coneGeometry args={[0.3, 1.0, 4]} />
              <meshStandardMaterial color="#1f1818" roughness={0.9} metalness={0.1} />
            </mesh>
          ))}
        </group>

      </group>
      {/* L'orbite des avatars a été retirée pour laisser la vedette absolue aux vaisseaux et épurer la scène spatiale. */}

      {/* Post-processing pour l'effet Bloom haute qualité (Copie écran 2) */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} mipmapBlur />
      </EffectComposer>
    </group>
  );
}
