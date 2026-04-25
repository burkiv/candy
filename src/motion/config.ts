export const MOTION_CONFIG = {
  calibrationNeutralDurationMs: 2000,
  calibrationCrouchDurationMs: 1500,
  calibrationStartHoldMs: 3000,
  calibrationMinSamples: 10,
  detectionIntervalMs: 1000 / 15,
  minPoseConfidence: 0.30,
  guideLeftBoundary: 0.28,
  guideRightBoundary: 0.72,
  laneChangeThreshold: 0.085,
  laneResetThreshold: 0.035,
  laneChangeCooldownMs: 550,
  jumpDisplacementThreshold: 0.035,
  jumpHipDisplacementThreshold: 0.018,
  jumpCooldownMs: 1100,
  squatAngleThreshold: 155,
  squatHipDropThreshold: 0.020,
  squatShoulderDropThreshold: 0.012,
  squatTorsoCompressionThreshold: 0.94,
  motionSmoothing: 0.34,
  laneConfirmFrames: 2,
  squatEnterFrames: 2,
  squatExitFrames: 3,
  jumpConfirmFrames: 2,
  cameraWidth: 320,
  cameraHeight: 240,
  handRaiseShoulderMargin: 0.035,
} as const;

export const POSE_WASM_ROOT =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';

export const POSE_MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
