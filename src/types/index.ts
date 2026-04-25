export type GamePhase =
  | 'MENU'
  | 'CALIBRATION'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAME_OVER';

export type ControlMode = 'KEYBOARD' | 'CAMERA';
export type CalibrationStep = 'CENTER' | 'CROUCH' | 'READY';
export type LeaderboardStatus = 'idle' | 'loading' | 'ready' | 'error';

export type WorldId = 'CANDY' | 'OCEAN';

export type Lane = -1 | 0 | 1;

export type Gesture = 'LEFT' | 'RIGHT' | 'SQUAT' | 'JUMP' | null;

export type ObstacleType =
  | 'BARRIER_TOP'
  | 'BARRIER_LOW'
  | 'TRAIN_SINGLE'
  | 'TRAIN_DOUBLE';

export type CollectibleType = 'COIN' | 'STAR';

export interface Baseline {
  centerX: number;
  shoulderY: number;
  hipY: number;
  shoulderWidth: number;
  torsoHeight: number;
  crouchShoulderY?: number;
  crouchHipY?: number;
  crouchTorsoHeight?: number;
}

export interface CalibrationUiState {
  step: CalibrationStep;
  progress: number;
  title: string;
  subtitle: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  lanes: Lane[];
  z: number;
  passed: boolean;
  collisionReported: boolean;
  clearanceBuffered: boolean;
  laneBypassed: boolean;
}

export interface Collectible {
  id: string;
  type: CollectibleType;
  lane: Lane;
  z: number;
  collected: boolean;
}
