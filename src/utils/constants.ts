import type { Baseline, CalibrationUiState, Lane } from '../types';

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
export const MAX_RUN_SPEED = 1.42;
export const SPEED_STEP_DISTANCE = 150;
export const SPEED_STEP_AMOUNT = 0.07;
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
