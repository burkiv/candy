import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { BackSide, Color } from 'three';
import { ModelAsset } from '../../game/ModelAsset';
import { useGameStore } from '../../stores/gameStore';
import {
  BASE_WORLD_SPEED,
  PLAYER_Z,
  PREVIEW_WORLD_SPEED,
  TUNNEL_SEGMENT_COUNT,
  TUNNEL_SEGMENT_LENGTH,
} from '../../utils/constants';

const OCEAN_ROAD_WIDTH = 8.8;
const OCEAN_ROAD_SURFACE_Y = -1.46;
const OCEAN_TUNNEL_RADIUS = OCEAN_ROAD_WIDTH / 2;
const OCEAN_TUNNEL_CENTER_Y = OCEAN_ROAD_SURFACE_Y;
const OCEAN_TUNNEL_GLASS_THICKNESS = 0.1;
const OCEAN_RING_OFFSETS = [-8, 0, 8] as const;
const OCEAN_TUNNEL_THETA_START = Math.PI / 2;
const OCEAN_TUNNEL_THETA_LENGTH = Math.PI;
const OCEAN_RING_ARC = Math.PI;

const glassVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const glassFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.2);
    float topMask = smoothstep(0.18, 0.92, normal.y * 0.5 + 0.5);
    float seam = smoothstep(0.9, 1.0, abs(sin(vUv.x * 6.2831853))) * 0.12;
    float shimmer = 0.5 + 0.5 * sin(vUv.y * 10.0 - uTime * 0.2 + vUv.x * 3.0);

    float alpha = uOpacity * (fresnel * (0.42 + topMask * 0.72) + seam);
    vec3 color = uColor * (0.42 + fresnel * 1.18 + topMask * 0.16 + shimmer * 0.08);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.92));
  }
`;

function seededRandom(seed: number) {
  const value = Math.sin(seed * 127.1) * 43758.5453123;
  return value - Math.floor(value);
}

function GlassTunnelShell({
  radius,
  color,
  opacity,
}: {
  radius: number;
  color: string;
  opacity: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new Color(color) },
      uOpacity: { value: opacity },
    }),
    [color, opacity],
  );

  useFrame((state) => {
    if (!materialRef.current) {
      return;
    }

    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh
      position={[0, OCEAN_TUNNEL_CENTER_Y, 0]}
      rotation={[Math.PI / 2, 0, 0]}
      renderOrder={3}
    >
      <cylinderGeometry
        args={[
          radius,
          radius,
          TUNNEL_SEGMENT_LENGTH,
          96,
          1,
          true,
          OCEAN_TUNNEL_THETA_START,
          OCEAN_TUNNEL_THETA_LENGTH,
        ]}
      />
      <shaderMaterial
        ref={materialRef}
        vertexShader={glassVertexShader}
        fragmentShader={glassFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={BackSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function OceanTunnelRing({ z }: { z: number }) {
  return (
    <mesh
      position={[0, OCEAN_TUNNEL_CENTER_Y, z]}
      rotation={[0, 0, 0]}
      renderOrder={4}
    >
      <torusGeometry
        args={[OCEAN_TUNNEL_RADIUS - 0.04, 0.05, 10, 72, OCEAN_RING_ARC]}
      />
      <meshStandardMaterial
        color="#74f9ff"
        emissive="#15e6d8"
        emissiveIntensity={0.16}
        roughness={0.22}
        metalness={0.28}
        transparent
        opacity={0.2}
        depthWrite={false}
      />
    </mesh>
  );
}

function OceanBubbleParticles({
  seed,
  side,
}: {
  seed: number;
  side: -1 | 1;
}) {
  const count = 24;
  const positionsRef = useRef<Float32Array | null>(null);
  const baseXRef = useRef<Float32Array | null>(null);
  const speedRef = useRef<Float32Array | null>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    const baseX = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const randomA = seededRandom(seed * 31 + index * 7 + 1);
      const randomB = seededRandom(seed * 37 + index * 11 + 2);
      const randomC = seededRandom(seed * 41 + index * 13 + 3);
      const bubbleX = side * (4.9 + randomA * 1.2);
      const bubbleY = -1.55 + randomB * 4.8;
      const bubbleZ = -10.5 + randomC * 21;

      values[index * 3] = bubbleX;
      values[index * 3 + 1] = bubbleY;
      values[index * 3 + 2] = bubbleZ;
      baseX[index] = bubbleX;
      speeds[index] = 0.45 + seededRandom(seed * 53 + index * 5 + 4) * 0.55;
    }

    positionsRef.current = values;
    baseXRef.current = baseX;
    speedRef.current = speeds;

    return values;
  }, [seed, side]);

  useFrame((state, delta) => {
    const geometry = pointsRef.current?.geometry;
    const activePositions = positionsRef.current;
    const baseX = baseXRef.current;
    const speeds = speedRef.current;

    if (!geometry || !activePositions || !baseX || !speeds) {
      return;
    }

    const time = state.clock.getElapsedTime();

    for (let index = 0; index < count; index += 1) {
      const xIndex = index * 3;
      const yIndex = xIndex + 1;
      const nextY = activePositions[yIndex] + speeds[index] * delta;

      activePositions[xIndex] = baseX[index] + Math.sin(time * 0.9 + index) * 0.08;
      activePositions[yIndex] = nextY > 4.9 ? -1.55 : nextY;
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#d8ffff"
        size={0.16}
        transparent
        opacity={0.55}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

type FishModelPath =
  | '/models/ocean-world/clownfish.glb'
  | '/models/ocean-world/surgeonfish.glb'
  | '/models/ocean-world/dolphin.glb'
  | '/models/ocean-world/jellyfish.glb';

const fishModelPaths: FishModelPath[] = [
  '/models/ocean-world/clownfish.glb',
  '/models/ocean-world/surgeonfish.glb',
  '/models/ocean-world/dolphin.glb',
  '/models/ocean-world/jellyfish.glb',
];

const fishSizes: Record<FishModelPath, { width: number; height: number; depth: number }> = {
  '/models/ocean-world/clownfish.glb': { width: 1.3, height: 0.9, depth: 1.6 },
  '/models/ocean-world/surgeonfish.glb': { width: 1.6, height: 1.05, depth: 1.9 },
  '/models/ocean-world/dolphin.glb': { width: 2.4, height: 1.4, depth: 3.3 },
  '/models/ocean-world/jellyfish.glb': { width: 1.5, height: 1.9, depth: 1.5 },
};

function OceanFish({
  modelPath,
  startX,
  startY,
  startZ,
  radius,
  speed,
  targetWidth,
}: {
  modelPath: FishModelPath;
  startX: number;
  startY: number;
  startZ: number;
  radius: number;
  speed: number;
  targetWidth: number;
}) {
  const fishRef = useRef<THREE.Group | null>(null);
  const size = fishSizes[modelPath];
  const widthRatio = targetWidth / size.width;

  useFrame((state) => {
    if (!fishRef.current) {
      return;
    }

    const time = state.clock.getElapsedTime();
    fishRef.current.position.x = startX + Math.sin(time * speed) * radius;
    fishRef.current.position.y = startY + Math.cos(time * speed * 0.7) * 1.5;
    fishRef.current.rotation.y = Math.cos(time * speed) * 0.5;
  });

  return (
    <group ref={fishRef} position={[startX, startY, startZ]}>
      <ModelAsset
        path={modelPath}
        targetWidth={targetWidth}
        targetHeight={size.height * widthRatio}
        targetDepth={size.depth * widthRatio}
        colorBoost={1.08}
        emissiveColor="#7cefe3"
        emissiveIntensity={0.08}
      />
    </group>
  );
}

function OceanTunnelDecor({ segmentIndex }: { segmentIndex: number }) {
  const swap = segmentIndex % 2 === 0 ? 1 : -1;
  const fishCount = segmentIndex % 3 === 0 ? 2 : 1;

  const fishEntries = Array.from({ length: fishCount }).map((_, fishIndex) => {
    const seed = segmentIndex * 5 + fishIndex + 1;
    const side = ((segmentIndex + fishIndex) % 2 === 0 ? 1 : -1) as -1 | 1;
    const modelPath = fishModelPaths[(segmentIndex + fishIndex) % fishModelPaths.length];

    return {
      id: `${segmentIndex}-${fishIndex}`,
      modelPath,
      startX: side * (8.9 + seededRandom(seed * 17) * 2.1),
      startY: 1.4 + seededRandom(seed * 19) * 4.2,
      startZ: -7.8 + seededRandom(seed * 23) * 15.6,
      radius: 0.85 + seededRandom(seed * 29) * 1.6,
      speed: 0.5 + seededRandom(seed * 31) * 0.8,
      targetWidth:
        modelPath === '/models/ocean-world/dolphin.glb'
          ? 2.2
          : modelPath === '/models/ocean-world/jellyfish.glb'
            ? 1.5
            : 1.3 + seededRandom(seed * 37) * 0.35,
    };
  });

  return (
    <>
      <group position={[swap * 9.2, -1.56, -7.4]} rotation={[0, -swap * 0.5, 0]}>
        <ModelAsset
          path="/models/ocean-world/deco_coral_garden.glb"
          targetWidth={3.8}
          targetHeight={3.1}
          targetDepth={3.4}
          colorBoost={1.12}
          emissiveColor="#12f0bf"
          emissiveIntensity={0.06}
        />
      </group>
      <group position={[-swap * 9.4, -1.56, 7.8]} rotation={[0, swap * 0.55, 0]}>
        <ModelAsset
          path="/models/ocean-world/deco_coral_garden.glb"
          targetWidth={4.1}
          targetHeight={3.4}
          targetDepth={3.8}
          colorBoost={1.14}
          emissiveColor="#34ffd0"
          emissiveIntensity={0.08}
        />
      </group>
      <OceanBubbleParticles seed={segmentIndex * 11 + 1} side={1} />
      <OceanBubbleParticles seed={segmentIndex * 11 + 2} side={-1} />
      {fishEntries.map((fish) => (
        <OceanFish
          key={fish.id}
          modelPath={fish.modelPath}
          startX={fish.startX}
          startY={fish.startY}
          startZ={fish.startZ}
          radius={fish.radius}
          speed={fish.speed}
          targetWidth={fish.targetWidth}
        />
      ))}
    </>
  );
}

export function OceanTunnel() {
  const segments = useRef<Array<THREE.Group | null>>([]);
  const phase = useGameStore((state) => state.phase);
  const speed = useGameStore((state) => state.speed);

  useFrame((_, delta) => {
    const scrollSpeed =
      (phase === 'PLAYING' ? BASE_WORLD_SPEED * speed : PREVIEW_WORLD_SPEED) *
      delta;
    const totalLength = TUNNEL_SEGMENT_COUNT * TUNNEL_SEGMENT_LENGTH;

    segments.current.forEach((segment) => {
      if (!segment) {
        return;
      }

      segment.position.z += scrollSpeed;

      if (segment.position.z > PLAYER_Z + TUNNEL_SEGMENT_LENGTH / 2) {
        segment.position.z -= totalLength;
      }
    });
  });

  return (
    <group>
      {Array.from({ length: TUNNEL_SEGMENT_COUNT }).map((_, index) => (
        <group
          key={index}
          position={[0, 1.75, -index * TUNNEL_SEGMENT_LENGTH]}
          ref={(node) => {
            segments.current[index] = node;
          }}
        >
          <OceanTunnelDecor segmentIndex={index} />
          <mesh
            position={[0, OCEAN_TUNNEL_CENTER_Y, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            renderOrder={1}
          >
            <cylinderGeometry
              args={[
                OCEAN_TUNNEL_RADIUS,
                OCEAN_TUNNEL_RADIUS,
                TUNNEL_SEGMENT_LENGTH,
                96,
                1,
                true,
                OCEAN_TUNNEL_THETA_START,
                OCEAN_TUNNEL_THETA_LENGTH,
              ]}
            />
            <meshPhysicalMaterial
              transparent
              opacity={0.08}
              color="#00CED1"
              roughness={0.04}
              metalness={0.04}
              transmission={0.94}
              thickness={0.55}
              ior={1.16}
              clearcoat={0.72}
              clearcoatRoughness={0.06}
              attenuationColor="#7fefff"
              attenuationDistance={18}
              envMapIntensity={0.36}
              side={BackSide}
              depthWrite={false}
            />
          </mesh>
          <GlassTunnelShell
            radius={OCEAN_TUNNEL_RADIUS - OCEAN_TUNNEL_GLASS_THICKNESS}
            color="#47f7ff"
            opacity={0.08}
          />
          {OCEAN_RING_OFFSETS.map((z) => (
            <OceanTunnelRing key={z} z={z} />
          ))}
          <group position={[0, -1.62, 0]}>
            <ModelAsset
              path="/models/ocean-world/tunnel_floor_sandy.glb"
              targetWidth={3}
              targetHeight={0.72}
              targetDepth={TUNNEL_SEGMENT_LENGTH - 0.45}
              colorBoost={1.08}
              roughness={0.82}
            />
          </group>
          <mesh position={[0, -1.46, 0]}>
            <boxGeometry args={[OCEAN_ROAD_WIDTH, 0.03, TUNNEL_SEGMENT_LENGTH - 0.3]} />
            <meshStandardMaterial
              color="#93c6a4"
              emissive="#1a8a74"
              emissiveIntensity={0.1}
              roughness={0.94}
              transparent
              opacity={0.34}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
