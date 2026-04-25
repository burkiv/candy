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

export const WORLD_IDS = ['CANDY', 'OCEAN'] as const;
export type WorldId = (typeof WORLD_IDS)[number];

export type Lane = -1 | 0 | 1;

export type Gesture = 'LEFT' | 'RIGHT' | 'SQUAT' | 'JUMP' | null;

export type ObstacleType =
  | 'BARRIER_TOP'
  | 'BARRIER_LOW'
  | 'TRAIN_SINGLE'
  | 'TRAIN_DOUBLE';

export type CollectibleType = 'COIN' | 'STAR';
export type CurrencyType = 'COIN' | 'STAR';
export type CatalogItemType = 'WORLD_UNLOCK' | 'MUSIC_VARIANT_UNLOCK';

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

export interface WalletState {
  coins: number;
  stars: number;
}

export interface ProgressionState {
  wallet: WalletState;
  unlockedWorldIds: WorldId[];
  unlockedMusicVariantIds: string[];
  selectedMusicVariantByWorld: Partial<Record<WorldId, string>>;
}

interface CatalogItemBase {
  id: string;
  type: CatalogItemType;
  label: string;
  description: string;
  currency: CurrencyType;
  cost: number;
  defaultUnlocked: boolean;
  active: boolean;
}

export interface WorldUnlockCatalogItem extends CatalogItemBase {
  type: 'WORLD_UNLOCK';
  worldId: WorldId;
}

export interface MusicVariantUnlockCatalogItem extends CatalogItemBase {
  type: 'MUSIC_VARIANT_UNLOCK';
  worldId: WorldId;
  musicVariantId: string;
}

export type CatalogItem = WorldUnlockCatalogItem | MusicVariantUnlockCatalogItem;

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
