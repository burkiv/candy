import { useFrame } from '@react-three/fiber';
import { Fragment, useMemo, useRef } from 'react';
import type { Group } from 'three';
import type { Obstacle } from '../types';
import { useGameStore } from '../stores/gameStore';
import { LANE_POSITIONS } from '../utils/constants';
import { laneCenter, obstacleWidth } from '../utils/math';
import type { WorldObstacleModelConfig } from '../worlds/types';
import { useWorldDefinition } from '../worlds';
import { ModelAsset } from './ModelAsset';

function AnimatedObstacleGroup({
  obstacle,
  config,
  children,
}: {
  obstacle: Obstacle;
  config: WorldObstacleModelConfig;
  children: React.ReactNode;
}) {
  const groupRef = useRef<Group | null>(null);
  const baseY = config.y ?? 0;
  const phaseOffset = useMemo(
    () =>
      Array.from(obstacle.id).reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0) *
      0.013,
    [obstacle.id],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    if (!config.floatAnimation) {
      groupRef.current.position.y = baseY;
      return;
    }

    const { amplitude, speed } = config.floatAnimation;
    groupRef.current.position.y =
      baseY + Math.sin(clock.getElapsedTime() * speed + phaseOffset) * amplitude;
  });

  return (
    <group
      ref={groupRef}
      position={[0, baseY, obstacle.z]}
      rotation={[0, config.rotationY ?? 0, 0]}
    >
      {children}
    </group>
  );
}

function BarrierLaneSet({
  obstacle,
  config,
}: {
  obstacle: Obstacle;
  config: WorldObstacleModelConfig;
}) {
  const laneWidth = 2.2;

  return (
    <AnimatedObstacleGroup obstacle={obstacle} config={config}>
      {obstacle.lanes.map((lane) => (
        <group key={`${obstacle.id}-${lane}`} position={[LANE_POSITIONS[lane], 0, 0]}>
          <ModelAsset
            path={config.path}
            targetWidth={laneWidth}
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
        </group>
      ))}
    </AnimatedObstacleGroup>
  );
}

function TrainSet({
  obstacle,
  config,
}: {
  obstacle: Obstacle;
  config: WorldObstacleModelConfig;
}) {
  const width = obstacleWidth(obstacle.lanes);
  const x = laneCenter(obstacle.lanes);

  return (
    <AnimatedObstacleGroup obstacle={obstacle} config={config}>
      <group position={[x, 0, 0]}>
        <ModelAsset
          path={config.path}
          targetWidth={width}
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
      </group>
    </AnimatedObstacleGroup>
  );
}

function ModelObstacle({ obstacle }: { obstacle: Obstacle }) {
  const world = useWorldDefinition();
  const config = world.obstacleModels[obstacle.type];

  if (obstacle.type === 'BARRIER_TOP' || obstacle.type === 'BARRIER_LOW') {
    return <BarrierLaneSet obstacle={obstacle} config={config} />;
  }

  return <TrainSet obstacle={obstacle} config={config} />;
}

export function Obstacles() {
  const obstacles = useGameStore((state) => state.obstacles);

  return (
    <Fragment>
      {obstacles.map((obstacle) => (
        <ModelObstacle key={obstacle.id} obstacle={obstacle} />
      ))}
    </Fragment>
  );
}
