import { useGLTF } from '@react-three/drei';
import type { WorldDefinition } from '../types';
import { CandyLighting } from './CandyLighting';
import { CandyTrack } from './CandyTrack';
import { CandyTunnel } from './CandyTunnel';

const OBSTACLE_GROUND_Y = 0.14;

export const candyWorld: WorldDefinition = {
  id: 'CANDY',
  scene: {
    backgroundColor: '#140c22',
    fog: ['#26153c', 24, 106],
    exposure: 1.15,
  },
  menu: {
    label: 'Candy World',
    kicker: 'Original',
    description: 'Neon seker tuneli, kristaller ve tatli engeller.',
    accentColor: '#7dd3fc',
    gradient: ['#2f183f', '#8b4fd4'],
  },
  audio: {
    music: {
      src: ['/sounds/music.mp3', '/sounds/bgm.mp3', '/sounds/music.ogg'],
      volume: 0.32,
      html5: true,
    },
  },
  obstacleModels: {
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
  },
  Lighting: CandyLighting,
  Tunnel: CandyTunnel,
  Track: CandyTrack,
};

useGLTF.preload('/models/barrier_top.glb');
useGLTF.preload('/models/barrier_low.glb');
useGLTF.preload('/models/train.glb');
useGLTF.preload('/models/train_double.glb');
