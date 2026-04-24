import { useGLTF } from '@react-three/drei';
import { Fragment } from 'react';
import type { Lane, Obstacle, ObstacleType } from '../types';
import { useGameStore } from '../stores/gameStore';
import { laneCenter, obstacleWidth } from '../utils/math';
import { LANE_POSITIONS } from '../utils/constants';
import { ModelAsset } from './ModelAsset';

type ModelConfig = {
  path: string;
  targetHeight: number;
  targetDepth: number;
  scaleMultiplier?: number;
  scaleYMultiplier?: number;
  colorBoost?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  rotationY?: number;
  y?: number;
};

const OBSTACLE_GROUND_Y = 0.14;

const MODEL_CONFIGS: Record<ObstacleType, ModelConfig> = {
  BARRIER_TOP: {
    path: '/models/barrier_top.glb',
    targetHeight: 2.12,
    targetDepth: 1.5,
    scaleMultiplier: 1.7,
    scaleYMultiplier: 1.14,
    colorBoost: 1.16,
    emissiveColor: '#ffb3c9',
    emissiveIntensity: 0.16,
    y: OBSTACLE_GROUND_Y,
  },
  BARRIER_LOW: {
    path: '/models/barrier_low.glb',
    targetHeight: 1.26,
    targetDepth: 1.52,
    scaleMultiplier: 0.95,
    scaleYMultiplier: 1.22,
    colorBoost: 1.08,
    y: OBSTACLE_GROUND_Y,
  },
  TRAIN_SINGLE: {
    path: '/models/train.glb',
    targetHeight: 3.2,
    targetDepth: 8.6,
    colorBoost: 1.48,
    emissiveColor: '#ff7ab6',
    emissiveIntensity: 0.22,
    roughness: 0.6,
    metalness: 0.12,
    y: OBSTACLE_GROUND_Y,
  },
  TRAIN_DOUBLE: {
    path: '/models/train_double.glb',
    targetHeight: 3.2,
    targetDepth: 8.6,
    colorBoost: 1.48,
    emissiveColor: '#ff7ab6',
    emissiveIntensity: 0.22,
    roughness: 0.6,
    metalness: 0.12,
    y: OBSTACLE_GROUND_Y,
  },
};

function BarrierLaneSet({
  obstacle,
  config,
}: {
  obstacle: Obstacle;
  config: ModelConfig;
}) {
  const laneWidth = 2.2;

  return (
    <group position={[0, config.y ?? 0, obstacle.z]} rotation={[0, config.rotationY ?? 0, 0]}>
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
    </group>
  );
}

function TrainSet({
  obstacle,
  config,
}: {
  obstacle: Obstacle;
  config: ModelConfig;
}) {
  const width = obstacleWidth(obstacle.lanes);
  const x = laneCenter(obstacle.lanes);

  return (
    <group position={[x, config.y ?? 0, obstacle.z]} rotation={[0, config.rotationY ?? 0, 0]}>
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
  );
}

function ModelObstacle({ obstacle }: { obstacle: Obstacle }) {
  const config = MODEL_CONFIGS[obstacle.type];

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

useGLTF.preload('/models/barrier_top.glb');
useGLTF.preload('/models/barrier_low.glb');
useGLTF.preload('/models/train.glb');
useGLTF.preload('/models/train_double.glb');
