import { create } from 'zustand';
import type {
  Baseline,
  CalibrationUiState,
  Collectible,
  CollectibleType,
  ControlMode,
  GamePhase,
  Gesture,
  Lane,
  LeaderboardEntry,
  LeaderboardStatus,
  Obstacle,
  ObstacleType,
  WorldId,
} from '../types';
import {
  fetchLeaderboardEntries,
  readStoredPlayerName,
  submitLeaderboardEntry,
  writeStoredPlayerName,
} from '../services/leaderboard';
import {
  AVOID_BONUS,
  BASE_WORLD_SPEED,
  COIN_SCORE_BONUS,
  COLLECTIBLE_PICKUP_Z_WINDOW,
  COLLECTIBLE_SPAWN_Z,
  COLLISION_BUFFER_BACK,
  COLLISION_BUFFER_FRONT,
  CROUCH_HEIGHT,
  DEFAULT_CALIBRATION_UI,
  DEFAULT_BASELINE,
  DESPAWN_Z,
  DISTANCE_SCALE,
  EYE_HEIGHT,
  GESTURE_LABEL_DURATION,
  HIT_INVULNERABILITY_DURATION,
  HIT_SCORE_PENALTY,
  JUMP_ARC_HEIGHT,
  JUMP_DURATION,
  MAX_RUN_SPEED,
  PASS_Z,
  PLAYER_Z,
  SCORE_RATE,
  SPEED_STEP_AMOUNT,
  SPEED_STEP_DISTANCE,
  SPAWN_Z,
  START_LIVES,
  STAR_SCORE_BONUS,
  START_RUN_SPEED,
} from '../utils/constants';
import {
  clampLane,
  nextCollectibleId,
  nextObstacleId,
  randomItem,
} from '../utils/math';

type Direction = 'LEFT' | 'RIGHT';

interface AudioSettingsState {
  musicVolume: number;
  ambienceVolume: number;
  effectsVolume: number;
}

interface GameState {
  phase: GamePhase;
  controlMode: ControlMode | null;
  selectedWorld: WorldId;
  audioSettings: AudioSettingsState;
  playerName: string;
  leaderboard: LeaderboardEntry[];
  leaderboardStatus: LeaderboardStatus;
  countdown: number;
  score: number;
  highScore: number;
  time: number;
  distance: number;
  speed: number;
  invincibleMode: boolean;
  collisionCount: number;
  impactTimeLeft: number;
  hitCooldownTimeLeft: number;
  livesRemaining: number;
  currentLane: Lane;
  playerY: number;
  isSquatting: boolean;
  manualSquatting: boolean;
  poseSquatting: boolean;
  isJumping: boolean;
  jumpElapsed: number;
  gesture: Gesture;
  gestureTimeLeft: number;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  obstaclesAvoided: number;
  coinsCollected: number;
  starsCollected: number;
  renderMeshes: number;
  renderTriangles: number;
  renderGeometries: number;
  calibrationUi: CalibrationUiState;
  baseline: Baseline | null;
  poseConfidence: number;
  cameraReady: boolean;
  startKeyboardRun: () => void;
  startCalibration: () => void;
  restartRun: () => void;
  setSelectedWorld: (world: WorldId) => void;
  setAudioSetting: <K extends keyof AudioSettingsState>(
    key: K,
    value: AudioSettingsState[K],
  ) => void;
  setPlayerName: (name: string) => void;
  loadLeaderboard: () => Promise<void>;
  submitLeaderboardScore: () => Promise<void>;
  beginCountdown: () => void;
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  returnToMenu: () => void;
  setCountdown: (value: number) => void;
  setGesture: (gesture: Exclude<Gesture, null>) => void;
  changeLane: (direction: Direction) => void;
  setLane: (lane: Lane) => void;
  setManualSquatting: (value: boolean) => void;
  setPoseSquatting: (value: boolean) => void;
  triggerJump: () => void;
  updateFrame: (delta: number) => void;
  spawnRandomObstacle: () => void;
  spawnRandomCollectible: () => void;
  toggleInvincibleMode: () => void;
  setRenderStats: (stats: {
    meshes: number;
    triangles: number;
    geometries: number;
  }) => void;
  setCalibrationUi: (ui: CalibrationUiState) => void;
  setBaseline: (baseline: Baseline) => void;
  setPoseConfidence: (confidence: number) => void;
  setCameraReady: (ready: boolean) => void;
}

function readHighScore(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  const raw =
    window.localStorage.getItem('candy-run-high-score') ??
    window.localStorage.getItem('subway-runner-high-score');
  return raw ? Number.parseInt(raw, 10) || 0 : 0;
}

function saveHighScore(score: number) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('candy-run-high-score', String(score));
  }
}

function readSelectedWorld(): WorldId {
  if (typeof window === 'undefined') {
    return 'CANDY';
  }

  const raw = window.localStorage.getItem('candy-run-selected-world');
  return raw === 'OCEAN' ? 'OCEAN' : 'CANDY';
}

function writeSelectedWorld(world: WorldId) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('candy-run-selected-world', world);
  }

  return world;
}

function normalizeVolume(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));
}

function readAudioSettings(): AudioSettingsState {
  if (typeof window === 'undefined') {
    return {
      musicVolume: 1,
      ambienceVolume: 1,
      effectsVolume: 1,
    };
  }

  const raw = window.localStorage.getItem('candy-run-audio-settings');

  if (!raw) {
    return {
      musicVolume: 1,
      ambienceVolume: 1,
      effectsVolume: 1,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AudioSettingsState>;

    return {
      musicVolume: normalizeVolume(parsed.musicVolume ?? 1),
      ambienceVolume: normalizeVolume(parsed.ambienceVolume ?? 1),
      effectsVolume: normalizeVolume(parsed.effectsVolume ?? 1),
    };
  } catch {
    return {
      musicVolume: 1,
      ambienceVolume: 1,
      effectsVolume: 1,
    };
  }
}

function writeAudioSettings(settings: AudioSettingsState) {
  const normalized = {
    musicVolume: normalizeVolume(settings.musicVolume),
    ambienceVolume: normalizeVolume(settings.ambienceVolume),
    effectsVolume: normalizeVolume(settings.effectsVolume),
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem('candy-run-audio-settings', JSON.stringify(normalized));
  }

  return normalized;
}

function createObstacle(distance: number): Obstacle {
  const allLanes: Lane[] = [-1, 0, 1];
  const doubleLanePatterns: Lane[][] = [
    [-1, 0],
    [0, 1],
  ];
  const roll = Math.random();

  let type: ObstacleType;
  let lanes: Lane[];

  if (roll < 0.3) {
    type = 'BARRIER_TOP';
    lanes = allLanes;
  } else if (roll < 0.6) {
    type = 'BARRIER_LOW';
    lanes = allLanes;
  } else if (roll < 0.85) {
    type = 'TRAIN_SINGLE';
    lanes = [randomItem(allLanes)];
  } else {
    type = 'TRAIN_DOUBLE';
    lanes = randomItem(doubleLanePatterns);
  }

  return {
    id: nextObstacleId(),
    type,
    lanes,
    z: SPAWN_Z,
    passed: false,
    collisionReported: false,
    clearanceBuffered: false,
    laneBypassed: false,
  };
}

function createCollectible(distance: number): Collectible {
  const lane = randomItem([-1, 0, 1] as Lane[]);
  const starChance = distance < 180 ? 0.15 : distance < 420 ? 0.2 : 0.26;
  const type: CollectibleType = Math.random() < starChance ? 'STAR' : 'COIN';

  return {
    id: nextCollectibleId(),
    type,
    lane,
    z: COLLECTIBLE_SPAWN_Z,
    collected: false,
  };
}

function createPatternCollectible(
  lane: Lane,
  z: number,
  type: CollectibleType = 'COIN',
): Collectible {
  return {
    id: nextCollectibleId(),
    type,
    lane,
    z,
    collected: false,
  };
}

function createLaneRewardTrail(
  lane: Lane,
  startZ: number,
  count: number,
  spacing = 3.2,
  finalType: CollectibleType = 'COIN',
) {
  return Array.from({ length: count }, (_, index) =>
    createPatternCollectible(
      lane,
      startZ - index * spacing,
      index === count - 1 ? finalType : 'COIN',
    ),
  );
}

function createObstacleBundle(distance: number) {
  const obstacle = createObstacle(distance);
  const rewardStartZ = SPAWN_Z - 8;
  const starChance = distance < 180 ? 0.12 : distance < 420 ? 0.18 : 0.24;
  const bonusType: CollectibleType = Math.random() < starChance ? 'STAR' : 'COIN';
  const allLanes: Lane[] = [-1, 0, 1];
  let collectibles: Collectible[] = [];

  switch (obstacle.type) {
    case 'BARRIER_TOP':
    case 'BARRIER_LOW':
      collectibles = allLanes.map((lane) =>
        createPatternCollectible(lane, rewardStartZ, 'COIN'),
      );

      if (bonusType === 'STAR') {
        collectibles.push(createPatternCollectible(0, rewardStartZ - 5.2, 'STAR'));
      }
      break;
    case 'TRAIN_SINGLE': {
      const safeLanes = allLanes.filter((lane) => !obstacle.lanes.includes(lane));
      collectibles = safeLanes.flatMap((lane, index) =>
        createLaneRewardTrail(
          lane,
          rewardStartZ - index * 1.4,
          2,
          3,
          bonusType === 'STAR' ? 'STAR' : 'COIN',
        ),
      );
      break;
    }
    case 'TRAIN_DOUBLE': {
      const safeLane = allLanes.find((lane) => !obstacle.lanes.includes(lane)) ?? 0;
      collectibles = createLaneRewardTrail(
        safeLane,
        rewardStartZ,
        3,
        3,
        bonusType,
      );
      break;
    }
    default:
      break;
  }

  return {
    obstacle,
    collectibles,
  };
}

function playerClearsObstacle(obstacle: Obstacle, state: Pick<GameState, 'isSquatting' | 'playerY'>): boolean {
  switch (obstacle.type) {
    case 'BARRIER_TOP':
      return state.isSquatting || state.playerY <= 1.04;
    case 'BARRIER_LOW':
      return state.playerY >= 2.02;
    case 'TRAIN_SINGLE':
    case 'TRAIN_DOUBLE':
      return false;
    default:
      return false;
  }
}

function createRunReset(
  state: Pick<
    GameState,
    | 'baseline'
    | 'controlMode'
    | 'highScore'
    | 'renderMeshes'
    | 'renderTriangles'
    | 'renderGeometries'
  >,
  phase: GamePhase,
  controlMode: ControlMode | null,
) {
  return {
    phase,
    controlMode,
    countdown: 3,
    score: 0,
    time: 0,
    distance: 0,
    speed: START_RUN_SPEED,
    collisionCount: 0,
    impactTimeLeft: 0,
    hitCooldownTimeLeft: 0,
    livesRemaining: START_LIVES,
    currentLane: 0 as Lane,
    playerY: EYE_HEIGHT,
    isSquatting: false,
    manualSquatting: false,
    poseSquatting: false,
    isJumping: false,
    jumpElapsed: 0,
    gesture: null as Gesture,
    gestureTimeLeft: 0,
    obstacles: [] as Obstacle[],
    collectibles: [] as Collectible[],
    obstaclesAvoided: 0,
    coinsCollected: 0,
    starsCollected: 0,
    renderMeshes: state.renderMeshes,
    renderTriangles: state.renderTriangles,
    renderGeometries: state.renderGeometries,
    calibrationUi: DEFAULT_CALIBRATION_UI,
    baseline: state.baseline ?? DEFAULT_BASELINE,
    poseConfidence: 0,
    cameraReady: false,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'MENU',
  controlMode: null,
  selectedWorld: readSelectedWorld(),
  audioSettings: readAudioSettings(),
  playerName: readStoredPlayerName(),
  leaderboard: [],
  leaderboardStatus: 'idle',
  countdown: 3,
  score: 0,
  highScore: readHighScore(),
  time: 0,
  distance: 0,
  speed: START_RUN_SPEED,
  invincibleMode: false,
  collisionCount: 0,
  impactTimeLeft: 0,
  hitCooldownTimeLeft: 0,
  livesRemaining: START_LIVES,
  currentLane: 0,
  playerY: EYE_HEIGHT,
  isSquatting: false,
  manualSquatting: false,
  poseSquatting: false,
  isJumping: false,
  jumpElapsed: 0,
  gesture: null,
  gestureTimeLeft: 0,
  obstacles: [],
  collectibles: [],
  obstaclesAvoided: 0,
  coinsCollected: 0,
  starsCollected: 0,
  renderMeshes: 0,
  renderTriangles: 0,
  renderGeometries: 0,
  calibrationUi: DEFAULT_CALIBRATION_UI,
  baseline: DEFAULT_BASELINE,
  poseConfidence: 0,
  cameraReady: false,
  startKeyboardRun: () =>
    set((state) => ({
      ...createRunReset(state, 'COUNTDOWN', 'KEYBOARD'),
      highScore: state.highScore,
    })),
  startCalibration: () =>
    set((state) => ({
      ...createRunReset(state, 'CALIBRATION', 'CAMERA'),
      highScore: state.highScore,
    })),
  restartRun: () =>
    set((state) => {
      const controlMode = state.controlMode ?? 'KEYBOARD';

      return {
        ...createRunReset(
          state,
          controlMode === 'CAMERA' ? 'CALIBRATION' : 'COUNTDOWN',
          controlMode,
        ),
        highScore: state.highScore,
      };
    }),
  setSelectedWorld: (world) =>
    set((state) =>
      state.selectedWorld === world
        ? state
        : {
            selectedWorld: writeSelectedWorld(world),
          },
    ),
  setAudioSetting: (key, value) =>
    set((state) => {
      const normalizedValue = normalizeVolume(value);

      if (state.audioSettings[key] === normalizedValue) {
        return state;
      }

      const audioSettings = writeAudioSettings({
        ...state.audioSettings,
        [key]: normalizedValue,
      });

      return { audioSettings };
    }),
  setPlayerName: (name) =>
    set({
      playerName: writeStoredPlayerName(name),
    }),
  loadLeaderboard: async () => {
    set({ leaderboardStatus: 'loading' });

    try {
      const leaderboard = await fetchLeaderboardEntries();
      set({
        leaderboard,
        leaderboardStatus: 'ready',
      });
    } catch {
      set({ leaderboardStatus: 'error' });
    }
  },
  submitLeaderboardScore: async () => {
    const state = get();
    const name = state.playerName.trim();

    if (!name) {
      return;
    }

    set({ leaderboardStatus: 'loading' });

    try {
      const leaderboard = await submitLeaderboardEntry({
        name,
        score: state.score,
        date: new Date().toISOString(),
      });

      set({
        leaderboard,
        leaderboardStatus: 'ready',
      });
    } catch {
      set({ leaderboardStatus: 'error' });
    }
  },
  beginCountdown: () =>
    set({
      phase: 'COUNTDOWN',
      countdown: 3,
      gesture: null,
      gestureTimeLeft: 0,
    }),
  startRun: () =>
    set((state) => ({
      phase: 'PLAYING',
      countdown: 3,
      score: 0,
      time: 0,
      distance: 0,
      speed: START_RUN_SPEED,
      collisionCount: 0,
      impactTimeLeft: 0,
      hitCooldownTimeLeft: 0,
      livesRemaining: START_LIVES,
      currentLane: 0,
      playerY: EYE_HEIGHT,
      isSquatting: false,
      manualSquatting: false,
      poseSquatting: false,
      isJumping: false,
      jumpElapsed: 0,
      gesture: null,
      gestureTimeLeft: 0,
      obstacles: [],
      collectibles: [],
      obstaclesAvoided: 0,
      coinsCollected: 0,
      starsCollected: 0,
      renderMeshes: state.renderMeshes,
      renderTriangles: state.renderTriangles,
      renderGeometries: state.renderGeometries,
      baseline: state.baseline ?? DEFAULT_BASELINE,
      poseConfidence: state.poseConfidence,
    })),
  pauseRun: () =>
    set((state) =>
      state.phase !== 'PLAYING'
        ? state
        : {
            phase: 'PAUSED',
          },
    ),
  resumeRun: () =>
    set((state) =>
      state.phase !== 'PAUSED'
        ? state
        : {
            phase: 'PLAYING',
          },
    ),
  returnToMenu: () =>
    set((state) => ({
      ...createRunReset(state, 'MENU', state.controlMode),
      highScore: state.highScore,
    })),
  setCountdown: (value) => set({ countdown: value }),
  setGesture: (gesture) =>
    set({
      gesture,
      gestureTimeLeft: GESTURE_LABEL_DURATION,
    }),
  changeLane: (direction) =>
    set((state) => {
      const delta = direction === 'LEFT' ? -1 : 1;
      const nextLane = clampLane(state.currentLane + delta);

      if (nextLane === state.currentLane) {
        return state;
      }

      return {
        currentLane: nextLane,
        gesture: direction,
        gestureTimeLeft: GESTURE_LABEL_DURATION,
      };
    }),
  setLane: (lane) =>
    set((state) => {
      if (lane === state.currentLane) {
        return state;
      }

      const gesture =
        lane < state.currentLane ? 'LEFT' : lane > state.currentLane ? 'RIGHT' : null;

      return {
        currentLane: lane,
        gesture,
        gestureTimeLeft: gesture ? GESTURE_LABEL_DURATION : state.gestureTimeLeft,
      };
    }),
  setManualSquatting: (value) =>
    set((state) => {
      if (state.manualSquatting === value) {
        return state;
      }

      const nextIsSquatting = value || state.poseSquatting;

      return {
        manualSquatting: value,
        isSquatting: nextIsSquatting,
        gesture: nextIsSquatting ? 'SQUAT' : state.gesture,
        gestureTimeLeft: nextIsSquatting
          ? GESTURE_LABEL_DURATION
          : state.gestureTimeLeft,
      };
    }),
  setPoseSquatting: (value) =>
    set((state) => {
      if (state.poseSquatting === value) {
        return state;
      }

      const nextIsSquatting = state.manualSquatting || value;

      return {
        poseSquatting: value,
        isSquatting: nextIsSquatting,
        gesture: nextIsSquatting ? 'SQUAT' : state.gesture,
        gestureTimeLeft: nextIsSquatting
          ? GESTURE_LABEL_DURATION
          : state.gestureTimeLeft,
      };
    }),
  triggerJump: () =>
    set((state) => {
      if (state.isJumping) {
        return state;
      }

      return {
        isJumping: true,
        jumpElapsed: 0,
        gesture: 'JUMP',
        gestureTimeLeft: GESTURE_LABEL_DURATION,
      };
    }),
  updateFrame: (delta) =>
    set((state) => {
      if (state.phase !== 'PLAYING') {
        return state;
      }

      const nextTime = state.time + delta;
      const nextDistance =
        state.distance + BASE_WORLD_SPEED * state.speed * delta * DISTANCE_SCALE;
      const nextSpeed = Math.min(
        MAX_RUN_SPEED,
        START_RUN_SPEED +
          Math.floor(nextDistance / SPEED_STEP_DISTANCE) * SPEED_STEP_AMOUNT,
      );

      let nextJumpElapsed = state.jumpElapsed;
      let nextIsJumping = state.isJumping;
      let nextPlayerY = state.playerY;

      if (state.isJumping) {
        nextJumpElapsed += delta;
        const progress = Math.min(nextJumpElapsed / JUMP_DURATION, 1);
        nextPlayerY = EYE_HEIGHT + Math.sin(progress * Math.PI) * JUMP_ARC_HEIGHT;

        if (progress >= 1) {
          nextIsJumping = false;
          nextJumpElapsed = 0;
          nextPlayerY = state.isSquatting ? CROUCH_HEIGHT : EYE_HEIGHT;
        }
      } else {
        nextPlayerY = state.isSquatting ? CROUCH_HEIGHT : EYE_HEIGHT;
      }

      let avoided = state.obstaclesAvoided;
      let coinsCollected = state.coinsCollected;
      let starsCollected = state.starsCollected;
      let nextScore = state.score + delta * SCORE_RATE * nextSpeed;
      let collisionsThisFrame = 0;

      const movedObstacles = state.obstacles
        .map((obstacle) => {
          const nextZ = obstacle.z + BASE_WORLD_SPEED * nextSpeed * delta;
          const toleranceStartZ = PLAYER_Z - COLLISION_BUFFER_FRONT;
          const toleranceEndZ = PLAYER_Z + COLLISION_BUFFER_BACK;
          const hitsLane = obstacle.lanes.includes(state.currentLane);
          const crossedPlayerPlane =
            obstacle.z < PLAYER_Z && nextZ >= PLAYER_Z;
          const laneBypassed =
            obstacle.laneBypassed || (crossedPlayerPlane && !hitsLane);
          const isInsideToleranceWindow =
            nextZ >= toleranceStartZ && nextZ <= toleranceEndZ;
          const clearanceBuffered =
            obstacle.clearanceBuffered ||
            (hitsLane &&
              isInsideToleranceWindow &&
              playerClearsObstacle(obstacle, {
                isSquatting: state.isSquatting,
                playerY: nextPlayerY,
              }));
          const collisionWindowExpired = nextZ > toleranceEndZ;
          const collides =
            !laneBypassed &&
            hitsLane &&
            collisionWindowExpired &&
            !clearanceBuffered;
          const collisionReported = obstacle.collisionReported || collides;
          const passed =
            obstacle.passed || (nextZ >= PASS_Z && obstacle.z < PASS_Z);

          if (!obstacle.passed && passed && !collisionReported) {
            avoided += 1;
            nextScore += AVOID_BONUS;
          }

          if (
            collides &&
            !obstacle.collisionReported &&
            (state.invincibleMode || state.hitCooldownTimeLeft <= 0)
          ) {
            collisionsThisFrame += 1;
          }

          return {
            ...obstacle,
            z: nextZ,
            passed,
            collisionReported,
            clearanceBuffered,
            laneBypassed,
          };
        })
        .filter((obstacle) => obstacle.z < DESPAWN_Z);
      const movedCollectibles = state.collectibles
        .map((collectible) => {
          const nextZ = collectible.z + BASE_WORLD_SPEED * nextSpeed * delta;
          const collected =
            collectible.collected ||
            (collectible.lane === state.currentLane &&
              Math.abs(nextZ - PLAYER_Z) <= COLLECTIBLE_PICKUP_Z_WINDOW);

          if (!collectible.collected && collected) {
            if (collectible.type === 'STAR') {
              starsCollected += 1;
              nextScore += STAR_SCORE_BONUS;
            } else {
              coinsCollected += 1;
              nextScore += COIN_SCORE_BONUS;
            }
          }

          return {
            ...collectible,
            z: nextZ,
            collected,
          };
        })
        .filter((collectible) => !collectible.collected && collectible.z < DESPAWN_Z);
      const collision = collisionsThisFrame > 0;
      const nextHitCooldownTime = Math.max(0, state.hitCooldownTimeLeft - delta);

      const nextGestureTime = Math.max(0, state.gestureTimeLeft - delta);
      const nextGesture = nextGestureTime > 0 ? state.gesture : null;
      const nextImpactTime = Math.max(
        0,
        (collision ? 0.48 : state.impactTimeLeft) - delta,
      );

      if (collision && !state.invincibleMode && nextHitCooldownTime <= 0) {
        const nextLives = Math.max(0, state.livesRemaining - 1);
        const penalizedScore = Math.max(0, nextScore - HIT_SCORE_PENALTY);

        if (nextLives === 0) {
          const finalScore = Math.floor(penalizedScore);
          const nextHighScore = Math.max(state.highScore, finalScore);
          saveHighScore(nextHighScore);

          return {
            phase: 'GAME_OVER' as GamePhase,
            score: finalScore,
            highScore: nextHighScore,
            time: nextTime,
            distance: nextDistance,
            speed: nextSpeed,
            collisionCount: state.collisionCount + collisionsThisFrame,
            impactTimeLeft: nextImpactTime,
            hitCooldownTimeLeft: 0,
            livesRemaining: nextLives,
            playerY: nextPlayerY,
            isJumping: false,
            jumpElapsed: 0,
            gesture: null,
            gestureTimeLeft: 0,
            obstacles: movedObstacles,
            collectibles: movedCollectibles,
            obstaclesAvoided: avoided,
            coinsCollected,
            starsCollected,
          };
        }

        return {
          time: nextTime,
          distance: nextDistance,
          speed: nextSpeed,
          collisionCount: state.collisionCount + collisionsThisFrame,
          impactTimeLeft: nextImpactTime,
          hitCooldownTimeLeft: HIT_INVULNERABILITY_DURATION,
          livesRemaining: nextLives,
          score: penalizedScore,
          playerY: nextPlayerY,
          isJumping: nextIsJumping,
          jumpElapsed: nextJumpElapsed,
          gesture: nextGesture,
          gestureTimeLeft: nextGestureTime,
          obstacles: movedObstacles,
          collectibles: movedCollectibles,
          obstaclesAvoided: avoided,
          coinsCollected,
          starsCollected,
        };
      }

      return {
        time: nextTime,
        distance: nextDistance,
        speed: nextSpeed,
        collisionCount: state.collisionCount + collisionsThisFrame,
        impactTimeLeft: nextImpactTime,
        hitCooldownTimeLeft: nextHitCooldownTime,
        livesRemaining: state.livesRemaining,
        score: nextScore,
        playerY: nextPlayerY,
        isJumping: nextIsJumping,
        jumpElapsed: nextJumpElapsed,
        gesture: nextGesture,
        gestureTimeLeft: nextGestureTime,
        obstacles: movedObstacles,
        collectibles: movedCollectibles,
        obstaclesAvoided: avoided,
        coinsCollected,
        starsCollected,
      };
    }),
  spawnRandomObstacle: () =>
    set((state) => {
      if (state.phase !== 'PLAYING') {
        return state;
      }

      const bundle = createObstacleBundle(state.distance);

      return {
        obstacles: [...state.obstacles, bundle.obstacle],
        collectibles: [...state.collectibles, ...bundle.collectibles],
      };
    }),
  spawnRandomCollectible: () =>
    set((state) => {
      if (state.phase !== 'PLAYING') {
        return state;
      }

      return {
        collectibles: [...state.collectibles, createCollectible(state.distance)],
      };
    }),
  toggleInvincibleMode: () =>
    set((state) => ({
      invincibleMode: !state.invincibleMode,
    })),
  setRenderStats: ({ meshes, triangles, geometries }) =>
    set((state) =>
      state.renderMeshes === meshes &&
      state.renderTriangles === triangles &&
      state.renderGeometries === geometries
        ? state
        : {
            renderMeshes: meshes,
            renderTriangles: triangles,
            renderGeometries: geometries,
          },
    ),
  setCalibrationUi: (calibrationUi) =>
    set((state) =>
      state.calibrationUi.step === calibrationUi.step &&
      state.calibrationUi.progress === calibrationUi.progress &&
      state.calibrationUi.title === calibrationUi.title &&
      state.calibrationUi.subtitle === calibrationUi.subtitle
        ? state
        : { calibrationUi },
    ),
  setBaseline: (baseline) => set({ baseline }),
  setPoseConfidence: (confidence) =>
    set((state) =>
      state.poseConfidence === confidence ? state : { poseConfidence: confidence },
    ),
  setCameraReady: (ready) =>
    set((state) => (state.cameraReady === ready ? state : { cameraReady: ready })),
}));
