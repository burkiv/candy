import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { ObstacleType } from '../types';
import { useWorldDefinition } from '../worlds';
import type { WorldObstacleModelConfig } from '../worlds/types';
import { COLLECTIBLE_CONFIGS } from './Collectibles';
import { ModelAsset } from './ModelAsset';

const WARMUP_OBSTACLE_WIDTHS: Record<ObstacleType, number> = {
  BARRIER_TOP: 2.2,
  BARRIER_LOW: 2.2,
  TRAIN_SINGLE: 2.2,
  TRAIN_DOUBLE: 5,
};

function WarmupObstacle({
  type,
  config,
}: {
  type: ObstacleType;
  config: WorldObstacleModelConfig;
}) {
  return (
    <ModelAsset
      path={config.path}
      targetWidth={WARMUP_OBSTACLE_WIDTHS[type]}
      targetHeight={config.targetHeight}
      targetDepth={config.targetDepth}
      scaleMultiplier={config.scaleMultiplier}
      scaleYMultiplier={config.scaleYMultiplier}
      colorBoost={config.colorBoost}
      emissiveColor={config.emissiveColor}
      emissiveIntensity={config.emissiveIntensity}
      roughness={config.roughness}
      metalness={config.metalness}
    />
  );
}

export function SceneWarmup({
  ready,
  onReady,
}: {
  ready: boolean;
  onReady: () => void;
}) {
  const world = useWorldDefinition();
  const groupRef = useRef<Group | null>(null);
  const renderedFramesRef = useRef(0);
  const completedRef = useRef(ready);
  const obstacleEntries = Object.entries(world.obstacleModels) as [
    ObstacleType,
    WorldObstacleModelConfig,
  ][];

  useFrame(() => {
    if (completedRef.current) {
      return;
    }

    if (renderedFramesRef.current === 0) {
      renderedFramesRef.current = 1;
      return;
    }

    completedRef.current = true;

    if (groupRef.current) {
      groupRef.current.visible = false;
    }

    onReady();
  });

  return (
    <group ref={groupRef} visible={!ready} position={[0, 0, -10]}>
      {obstacleEntries.map(([type, config], index) => (
        <group key={type} position={[index * 0.02, 0, 0]}>
          <WarmupObstacle type={type} config={config} />
        </group>
      ))}
      {Object.entries(COLLECTIBLE_CONFIGS).map(([type, config], index) => (
        <group key={type} position={[index * 0.02, 0, 0]}>
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
      ))}
    </group>
  );
}
