import { create } from 'zustand';
import type {
  Baseline,
  Collectible,
  CollectibleType,
  GamePhase,
  Gesture,
  Lane,
  Obstacle,
  ObstacleType,
} from '../types';
import {
  AVOID_BONUS,
  BASE_WORLD_SPEED,
  COIN_SCORE_BONUS,
  COLLECTIBLE_PICKUP_Z_WINDOW,
  COLLECTIBLE_SPAWN_Z,
  COLLISION_BUFFER_BACK,
  COLLISION_BUFFER_FRONT,
  CROUCH_HEIGHT,
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

interface GameState {
  phase: GamePhase;
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
  baseline: Baseline | null;
  poseConfidence: number;
  cameraReady: boolean;
  startCalibration: () => void;
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

function createObstacle(distance: number): Obstacle {
  const stage = distance < 180 ? 1 : distance < 420 ? 2 : 3;
  const singleLanePatterns: Array<{ type: ObstacleType; lanes: Lane[] }> = [
    { type: 'BARRIER_TOP', lanes: [-1] },
    { type: 'BARRIER_TOP', lanes: [0] },
    { type: 'BARRIER_TOP', lanes: [1] },
    { type: 'TRAIN_SINGLE', lanes: [-1] },
    { type: 'TRAIN_SINGLE', lanes: [0] },
    { type: 'TRAIN_SINGLE', lanes: [1] },
  ];
  const stageTwoPatterns: Array<{ type: ObstacleType; lanes: Lane[] }> = [
    { type: 'BARRIER_LOW', lanes: [-1] },
    { type: 'BARRIER_LOW', lanes: [0] },
    { type: 'BARRIER_LOW', lanes: [1] },
  ];
  const stageThreePatterns: Array<{ type: ObstacleType; lanes: Lane[] }> = [
    { type: 'TRAIN_DOUBLE', lanes: [-1, 0] },
    { type: 'TRAIN_DOUBLE', lanes: [0, 1] },
  ];

  const pool = [...singleLanePatterns];

  if (stage >= 2) {
    pool.push(...stageTwoPatterns);
  }

  if (stage >= 3) {
    pool.push(...stageThreePatterns);
  }

  const pattern = randomItem(pool);

  return {
    id: nextObstacleId(),
    type: pattern.type,
    lanes: pattern.lanes,
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

export const useGameStore = create<GameState>((set) => ({
  phase: 'MENU',
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
  baseline: DEFAULT_BASELINE,
  poseConfidence: 0,
  cameraReady: false,
  startCalibration: () =>
    set((state) => ({
      phase: 'CALIBRATION',
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
      poseConfidence: 0,
    })),
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
      phase: 'MENU',
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

      return {
        obstacles: [...state.obstacles, createObstacle(state.distance)],
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
  setBaseline: (baseline) => set({ baseline }),
  setPoseConfidence: (confidence) =>
    set((state) =>
      state.poseConfidence === confidence ? state : { poseConfidence: confidence },
    ),
  setCameraReady: (ready) =>
    set((state) => (state.cameraReady === ready ? state : { cameraReady: ready })),
}));
