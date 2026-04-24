import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Fragment, useRef } from 'react';
import type { Group } from 'three';
import type { Collectible, CollectibleType } from '../types';
import { useGameStore } from '../stores/gameStore';
import { LANE_POSITIONS } from '../utils/constants';
import { ModelAsset } from './ModelAsset';

type CollectibleConfig = {
  path: string;
  targetWidth: number;
  targetHeight: number;
  targetDepth: number;
  y: number;
  scaleMultiplier?: number;
  colorBoost?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  baseRotation?: [number, number, number];
};

const COLLECTIBLE_CONFIGS: Record<CollectibleType, CollectibleConfig> = {
  COIN: {
    path: '/models/coin.glb',
    targetWidth: 0.95,
    targetHeight: 0.95,
    targetDepth: 0.36,
    y: 1.06,
    scaleMultiplier: 1.16,
    colorBoost: 2.2,
    emissiveColor: '#ffd76d',
    emissiveIntensity: 0.95,
    roughness: 0.26,
    metalness: 0.18,
    baseRotation: [Math.PI / 2, 0, 0],
  },
  STAR: {
    path: '/models/star.glb',
    targetWidth: 1.15,
    targetHeight: 1.15,
    targetDepth: 0.48,
    y: 1.12,
    scaleMultiplier: 1.12,
    colorBoost: 1.6,
    emissiveColor: '#fff2a8',
    emissiveIntensity: 1.05,
    roughness: 0.38,
    metalness: 0.04,
    baseRotation: [0, 0, 0],
  },
};

function CollectibleItem({ collectible }: { collectible: Collectible }) {
  const groupRef = useRef<Group | null>(null);
  const config = COLLECTIBLE_CONFIGS[collectible.type];
  const laneX = LANE_POSITIONS[collectible.lane];
  const pulseOffset = collectible.type === 'STAR' ? 1.3 : 0.4;

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    const elapsed = clock.getElapsedTime() + pulseOffset;
    groupRef.current.rotation.x = (config.baseRotation?.[0] ?? 0) + Math.sin(elapsed * 1.1) * 0.08;
    groupRef.current.rotation.y = (config.baseRotation?.[1] ?? 0) + elapsed * 1.9;
    groupRef.current.rotation.z = (config.baseRotation?.[2] ?? 0) + Math.sin(elapsed * 1.7) * 0.16;
    groupRef.current.position.y = config.y + Math.sin(elapsed * 2.2) * 0.09;
  });

  return (
    <group ref={groupRef} position={[laneX, config.y, collectible.z]}>
      <ModelAsset
        path={config.path}
        targetWidth={config.targetWidth}
        targetHeight={config.targetHeight}
        targetDepth={config.targetDepth}
        scaleMultiplier={config.scaleMultiplier}
        colorBoost={config.colorBoost}
        emissiveColor={config.emissiveColor}
        emissiveIntensity={config.emissiveIntensity}
        roughness={config.roughness}
        metalness={config.metalness}
      />
    </group>
  );
}

export function Collectibles() {
  const collectibles = useGameStore((state) => state.collectibles);

  return (
    <Fragment>
      {collectibles.map((collectible) => (
        <CollectibleItem key={collectible.id} collectible={collectible} />
      ))}
    </Fragment>
  );
}

useGLTF.preload('/models/coin.glb');
useGLTF.preload('/models/star.glb');
