import type { WorldDefinition } from '../types';
import { OceanLighting } from './OceanLighting';
import { OceanTrack } from './OceanTrack';
import { OceanTunnel } from './OceanTunnel';

const OCEAN_OBSTACLE_GROUND_Y = 0.14;

export const oceanWorld: WorldDefinition = {
  id: 'OCEAN',
  scene: {
    backgroundColor: '#06263b',
    fog: ['#0a3d5c', 10, 80],
    exposure: 1,
  },
  menu: {
    label: 'Ocean World',
    kicker: 'New',
    description: 'Cam tunel, mercan bahceleri ve sualti engelleri.',
    accentColor: '#5eead4',
    gradient: ['#073b4c', '#0ea5a3'],
  },
  audio: {
    music: {
      src: [
        '/sounds/ocean/ocean_bg.mp3',
        '/sounds/ocean/ocean_bg.ogg',
        '/sounds/ocean/ocean_bg.wav',
      ],
      volume: 0.28,
      html5: true,
    },
    ambience: {
      src: [
        '/sounds/ocean/underwater_ambience.mp3',
        '/sounds/ocean/underwater_ambience.ogg',
        '/sounds/ocean/underwater_ambience.wav',
      ],
      volume: 0.12,
      html5: true,
    },
    occasional: {
      src: [
        '/sounds/ocean/Whale.mp3',
        '/sounds/ocean/whale.mp3',
        '/sounds/ocean/Whale.ogg',
        '/sounds/ocean/whale.ogg',
        '/sounds/ocean/Whale.wav',
        '/sounds/ocean/whale.wav',
      ],
      volume: 0.2,
      minDelayMs: 16000,
      maxDelayMs: 32000,
    },
  },
  obstacleModels: {
    BARRIER_TOP: {
      path: '/models/ocean-world/obstacle_jellyfish_curtain.glb',
      targetHeight: 2.6,
      targetDepth: 1.8,
      floatAnimation: {
        amplitude: 0.14,
        speed: 1.5,
      },
      scaleMultiplier: 1.14,
      scaleYMultiplier: 1.08,
      colorBoost: 1.06,
      emissiveColor: '#73fff4',
      emissiveIntensity: 0.12,
      y: OCEAN_OBSTACLE_GROUND_Y + 1.25,
    },
    BARRIER_LOW: {
      path: '/models/ocean-world/obstacle_coral_reef.glb',
      targetHeight: 1.55,
      targetDepth: 1.9,
      scaleMultiplier: 1.05,
      colorBoost: 1.08,
      emissiveColor: '#18efb5',
      emissiveIntensity: 0.08,
      y: OCEAN_OBSTACLE_GROUND_Y,
    },
    TRAIN_SINGLE: {
      path: '/models/ocean-world/obstacle_sea_turtle.glb',
      targetHeight: 1.9,
      targetDepth: 2.9,
      scaleMultiplier: 1.5,
      colorBoost: 1.06,
      emissiveColor: '#4dffd5',
      emissiveIntensity: 0.06,
      roughness: 0.74,
      metalness: 0.04,
      y: OCEAN_OBSTACLE_GROUND_Y,
    },
    TRAIN_DOUBLE: {
      path: '/models/ocean-world/obstacle_shipwreck.glb',
      targetHeight: 2.8,
      targetDepth: 6.4,
      scaleMultiplier: 1.5,
      colorBoost: 1.04,
      roughness: 0.82,
      metalness: 0.06,
      y: OCEAN_OBSTACLE_GROUND_Y,
    },
  },
  Lighting: OceanLighting,
  Tunnel: OceanTunnel,
  Track: OceanTrack,
};
