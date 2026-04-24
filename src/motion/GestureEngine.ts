import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Baseline } from '../types';
import { MOTION_CONFIG } from './config';

const KEY_CONFIDENCE_POINTS = [11, 12, 23, 24, 25, 26] as const;

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function mirroredX(value: number): number {
  return 1 - value;
}

function landmarkScore(landmark: NormalizedLandmark): number {
  const values: number[] = [];

  if (typeof landmark.visibility === 'number') {
    values.push(landmark.visibility);
  }

  if (typeof landmark.presence === 'number') {
    values.push(landmark.presence);
  }

  return average(values);
}

export function calculateAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark,
): number {
  const abX = a.x - b.x;
  const abY = a.y - b.y;
  const cbX = c.x - b.x;
  const cbY = c.y - b.y;

  const dot = abX * cbX + abY * cbY;
  const magnitudeAB = Math.hypot(abX, abY);
  const magnitudeCB = Math.hypot(cbX, cbY);

  if (magnitudeAB === 0 || magnitudeCB === 0) {
    return 180;
  }

  const cosine = Math.min(1, Math.max(-1, dot / (magnitudeAB * magnitudeCB)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

export function createBaselineSample(landmarks: NormalizedLandmark[]): Baseline {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const hipCenterX = (leftHip.x + rightHip.x) / 2;

  return {
    centerX: mirroredX((shoulderCenterX + hipCenterX) / 2),
    shoulderY: (leftShoulder.y + rightShoulder.y) / 2,
    hipY: (leftHip.y + rightHip.y) / 2,
    shoulderWidth: Math.abs(leftShoulder.x - rightShoulder.x),
    torsoHeight: Math.abs(
      (leftHip.y + rightHip.y) / 2 - (leftShoulder.y + rightShoulder.y) / 2,
    ),
  };
}

export function averageBaseline(samples: Baseline[]): Baseline {
  return {
    centerX: average(samples.map((sample) => sample.centerX)),
    shoulderY: average(samples.map((sample) => sample.shoulderY)),
    hipY: average(samples.map((sample) => sample.hipY)),
    shoulderWidth: average(samples.map((sample) => sample.shoulderWidth)),
    torsoHeight: average(samples.map((sample) => sample.torsoHeight)),
  };
}

export function getPoseConfidence(landmarks: NormalizedLandmark[]): number {
  const confidenceValues = KEY_CONFIDENCE_POINTS.flatMap((index) => {
    const landmark = landmarks[index];
    const values: number[] = [];

    if (typeof landmark.visibility === 'number') {
      values.push(landmark.visibility);
    }

    if (typeof landmark.presence === 'number') {
      values.push(landmark.presence);
    }

    return values;
  });

  return average(confidenceValues);
}

export function getPoseMetrics(landmarks: NormalizedLandmark[]) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const hipCenterX = (leftHip.x + rightHip.x) / 2;
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;
  const leftLowerConfidence = average([
    landmarkScore(leftKnee),
    landmarkScore(leftAnkle),
  ]);
  const rightLowerConfidence = average([
    landmarkScore(rightKnee),
    landmarkScore(rightAnkle),
  ]);

  return {
    shoulderCenterX: mirroredX((shoulderCenterX + hipCenterX) / 2),
    shoulderY,
    hipY,
    shoulderWidth: Math.abs(leftShoulder.x - rightShoulder.x),
    torsoHeight: Math.abs(hipY - shoulderY),
    averageKneeAngle:
      (calculateAngle(leftHip, leftKnee, leftAnkle) +
        calculateAngle(rightHip, rightKnee, rightAnkle)) /
      2,
    lowerBodyConfidence: average([leftLowerConfidence, rightLowerConfidence]),
  };
}

export function getLaneOffset(
  metrics: ReturnType<typeof getPoseMetrics>,
  baseline: Baseline,
): number {
  return metrics.shoulderCenterX - baseline.centerX;
}

export function getLaneThreshold(baseline: Baseline): number {
  return Math.max(
    MOTION_CONFIG.laneChangeThreshold,
    baseline.shoulderWidth * 0.45,
  );
}

export function isSquat(
  metrics: ReturnType<typeof getPoseMetrics>,
  baseline: Baseline,
): boolean {
  const personalizedHipThreshold =
    typeof baseline.crouchHipY === 'number'
      ? Math.max(
          MOTION_CONFIG.squatHipDropThreshold * 0.65,
          (baseline.crouchHipY - baseline.hipY) * 0.42,
        )
      : MOTION_CONFIG.squatHipDropThreshold;
  const personalizedShoulderThreshold =
    typeof baseline.crouchShoulderY === 'number'
      ? Math.max(
          MOTION_CONFIG.squatShoulderDropThreshold * 0.65,
          (baseline.crouchShoulderY - baseline.shoulderY) * 0.42,
        )
      : MOTION_CONFIG.squatShoulderDropThreshold;
  const hipDrop = metrics.hipY - baseline.hipY;
  const shoulderDrop = metrics.shoulderY - baseline.shoulderY;
  const torsoRatio =
    baseline.torsoHeight > 0 ? metrics.torsoHeight / baseline.torsoHeight : 1;
  const lowerBodyVisible = metrics.lowerBodyConfidence >= 0.35;
  const kneeDriven =
    lowerBodyVisible &&
    metrics.averageKneeAngle < MOTION_CONFIG.squatAngleThreshold;
  const upperBodyDriven =
    hipDrop > personalizedHipThreshold &&
    shoulderDrop > personalizedShoulderThreshold;
  const compressedTorso =
    hipDrop > personalizedHipThreshold * 0.75 &&
    torsoRatio < MOTION_CONFIG.squatTorsoCompressionThreshold;

  return kneeDriven || upperBodyDriven || compressedTorso;
}

export function isJump(
  metrics: ReturnType<typeof getPoseMetrics>,
  baseline: Baseline,
): boolean {
  const shoulderLift = baseline.shoulderY - metrics.shoulderY;
  const hipLift = baseline.hipY - metrics.hipY;
  const torsoRatio =
    baseline.torsoHeight > 0 ? metrics.torsoHeight / baseline.torsoHeight : 1;

  return (
    shoulderLift > MOTION_CONFIG.jumpDisplacementThreshold &&
    hipLift > MOTION_CONFIG.jumpHipDisplacementThreshold &&
    torsoRatio > 0.94
  );
}
