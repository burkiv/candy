export const MOTION_CONFIG = {
  calibrationDurationMs: 3000,
  calibrationMinSamples: 12,
  detectionIntervalMs: 1000 / 18,
  minPoseConfidence: 0.42,
  guideLeftBoundary: 0.36,
  guideRightBoundary: 0.64,
  laneChangeThreshold: 0.085,
  laneResetThreshold: 0.035,
  laneChangeCooldownMs: 550,
  jumpDisplacementThreshold: 0.068,
  jumpHipDisplacementThreshold: 0.038,
  jumpCooldownMs: 1100,
  squatAngleThreshold: 138,
  squatHipDropThreshold: 0.048,
  squatShoulderDropThreshold: 0.032,
  squatTorsoCompressionThreshold: 0.92,
  motionSmoothing: 0.34,
  laneConfirmFrames: 2,
  squatEnterFrames: 2,
  squatExitFrames: 3,
  jumpConfirmFrames: 2,
  cameraWidth: 640,
  cameraHeight: 480,
} as const;

export const POSE_WASM_ROOT =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';

export const POSE_MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
