import type { ComponentType } from 'react';
import type { ObstacleType, WorldId } from '../types';

export interface WorldObstacleModelConfig {
  path: string;
  targetHeight: number;
  targetDepth: number;
  floatAnimation?: {
    amplitude: number;
    speed: number;
  };
  scaleMultiplier?: number;
  scaleYMultiplier?: number;
  colorBoost?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  rotationY?: number;
  y?: number;
}

export interface WorldSceneConfig {
  backgroundColor: string;
  fog: [color: string, near: number, far: number];
  exposure?: number;
}

export interface WorldMenuConfig {
  label: string;
  kicker: string;
  description: string;
  accentColor: string;
  gradient: [string, string];
}

export interface WorldAudioLoopConfig {
  src: string[];
  volume: number;
  html5?: boolean;
}

export interface WorldAudioOccasionalConfig {
  src: string[];
  volume: number;
  minDelayMs: number;
  maxDelayMs: number;
}

export interface WorldAudioConfig {
  music: WorldAudioLoopConfig;
  ambience?: WorldAudioLoopConfig;
  occasional?: WorldAudioOccasionalConfig;
}

export interface WorldDefinition {
  id: WorldId;
  scene: WorldSceneConfig;
  menu: WorldMenuConfig;
  audio: WorldAudioConfig;
  preloadModelPaths: string[];
  obstacleModels: Record<ObstacleType, WorldObstacleModelConfig>;
  Lighting: ComponentType;
  Tunnel: ComponentType;
  Track: ComponentType;
}
