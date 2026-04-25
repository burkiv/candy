import type { Baseline, CalibrationUiState, ControlMode, Lane } from '../types';

export const LANE_WIDTH = 2.8;

export const LANE_POSITIONS: Record<Lane, number> = {
  [-1]: -LANE_WIDTH,
  0: 0,
  1: LANE_WIDTH,
};

export const PLAYER_Z = 6;
export const EYE_HEIGHT = 1.6;
export const CROUCH_HEIGHT = 0.92;
export const JUMP_ARC_HEIGHT = 1.15;
export const JUMP_DURATION = 0.72;
export const START_LIVES = 3;
export const HIT_SCORE_PENALTY = 180;
export const HIT_INVULNERABILITY_DURATION = 1.2;

export const BASE_WORLD_SPEED = 22;
export const PREVIEW_WORLD_SPEED = 8;
export const START_RUN_SPEED = 0.72;
export const DISTANCE_SCALE = 0.42;
export const SPAWN_Z = -92;
export const PASS_Z = 8;
export const DESPAWN_Z = 18;
export const COLLISION_BUFFER_FRONT = 2;
export const COLLISION_BUFFER_BACK = 1;
export const COLLECTIBLE_SPAWN_Z = -84;
export const COLLECTIBLE_PICKUP_Z_WINDOW = 1.15;
export const COIN_SCORE_BONUS = 90;
export const STAR_SCORE_BONUS = 280;

export const SCORE_RATE = 110;
export const AVOID_BONUS = 50;

export const TUNNEL_SEGMENT_LENGTH = 24;
export const TUNNEL_SEGMENT_COUNT = 9;

export const TRACK_SEGMENT_LENGTH = 6;
export const TRACK_SEGMENT_COUNT = 24;

export const GESTURE_LABEL_DURATION = 0.42;

export const DEFAULT_BASELINE: Baseline = {
  centerX: 0.5,
  shoulderY: 0.42,
  hipY: 0.62,
  shoulderWidth: 0.18,
  torsoHeight: 0.2,
};

export const DEFAULT_CALIBRATION_UI: CalibrationUiState = {
  step: 'CENTER',
  progress: 0,
  title: 'Ortada dik dur',
  subtitle: 'Iki cizginin arasinda rahat durusunu alip sabit kal.',
};

type DifficultyBand = {
  distance: number;
  spawnInterval: number;
  spawnVariance: number;
  comboChance: number;
};

type RunDifficultyProfile = {
  maxRunSpeed: number;
  speedStepDistance: number;
  speedStepAmount: number;
  bands: DifficultyBand[];
};

const RUN_DIFFICULTY_PROFILES: Record<ControlMode, RunDifficultyProfile> = {
  KEYBOARD: {
    maxRunSpeed: 1.82,
    speedStepDistance: 120,
    speedStepAmount: 0.085,
    bands: [
      { distance: 0, spawnInterval: 2.08, spawnVariance: 0.34, comboChance: 0 },
      { distance: 160, spawnInterval: 1.82, spawnVariance: 0.3, comboChance: 0.1 },
      { distance: 340, spawnInterval: 1.56, spawnVariance: 0.24, comboChance: 0.18 },
      { distance: 620, spawnInterval: 1.34, spawnVariance: 0.2, comboChance: 0.28 },
      { distance: 980, spawnInterval: 1.18, spawnVariance: 0.16, comboChance: 0.36 },
    ],
  },
  CAMERA: {
    maxRunSpeed: 1.56,
    speedStepDistance: 145,
    speedStepAmount: 0.06,
    bands: [
      { distance: 0, spawnInterval: 2.14, spawnVariance: 0.36, comboChance: 0 },
      { distance: 200, spawnInterval: 1.92, spawnVariance: 0.32, comboChance: 0.06 },
      { distance: 420, spawnInterval: 1.7, spawnVariance: 0.28, comboChance: 0.12 },
      { distance: 760, spawnInterval: 1.54, spawnVariance: 0.22, comboChance: 0.18 },
      { distance: 1120, spawnInterval: 1.42, spawnVariance: 0.18, comboChance: 0.24 },
    ],
  },
};

function getRunDifficultyProfile(controlMode: ControlMode | null) {
  return RUN_DIFFICULTY_PROFILES[controlMode === 'CAMERA' ? 'CAMERA' : 'KEYBOARD'];
}

export function getRunSpeed(controlMode: ControlMode | null, distance: number) {
  const profile = getRunDifficultyProfile(controlMode);

  return Math.min(
    profile.maxRunSpeed,
    START_RUN_SPEED +
      Math.floor(distance / profile.speedStepDistance) * profile.speedStepAmount,
  );
}

export function getSpeedStepDistance(controlMode: ControlMode | null) {
  return getRunDifficultyProfile(controlMode).speedStepDistance;
}

export function getSpawnSettings(controlMode: ControlMode | null, distance: number) {
  const profile = getRunDifficultyProfile(controlMode);

  return profile.bands.reduce(
    (selected, band) => (distance >= band.distance ? band : selected),
    profile.bands[0],
  );
}
