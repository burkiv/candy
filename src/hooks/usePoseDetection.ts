import { useEffect, useRef, useState } from 'react';
import type {
  NormalizedLandmark,
  PoseLandmarker as PoseLandmarkerType,
} from '@mediapipe/tasks-vision';
import {
  averageBaseline,
  createBaselineSample,
  getPoseConfidence,
  getPoseMetrics,
  isJump,
  isSquat,
} from '../motion/GestureEngine';
import {
  MOTION_CONFIG,
  POSE_MODEL_ASSET_PATH,
  POSE_WASM_ROOT,
} from '../motion/config';
import { useGameStore } from '../stores/gameStore';

type BodyZone = 'LEFT' | 'CENTER' | 'RIGHT' | 'NONE';
type PoseModule = typeof import('@mediapipe/tasks-vision');
type PoseMetrics = ReturnType<typeof getPoseMetrics>;

interface PoseDetectionState {
  statusLabel: string;
  error: string | null;
  guideZone: BodyZone;
}

interface CalibrationState {
  startedAt: number;
  samples: ReturnType<typeof createBaselineSample>[];
  done: boolean;
}

interface UsePoseDetectionArgs {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

interface BodyMarker {
  centerX: number;
  shoulderY: number;
  hipY: number;
  zone: BodyZone;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Pose algilama baslatilamadi.';
}

function getBodyZone(centerX: number): BodyZone {
  if (centerX < MOTION_CONFIG.guideLeftBoundary) {
    return 'LEFT';
  }

  if (centerX > MOTION_CONFIG.guideRightBoundary) {
    return 'RIGHT';
  }

  return 'CENTER';
}

function drawGuide(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  marker: BodyMarker | null,
) {
  const leftBoundary = canvas.width * MOTION_CONFIG.guideLeftBoundary;
  const rightBoundary = canvas.width * MOTION_CONFIG.guideRightBoundary;

  context.clearRect(0, 0, canvas.width, canvas.height);

  const zoneColors: Record<Exclude<BodyZone, 'NONE'>, string> = {
    LEFT: 'rgba(59, 130, 246, 0.14)',
    CENTER: 'rgba(34, 197, 94, 0.14)',
    RIGHT: 'rgba(249, 115, 22, 0.14)',
  };

  const zones = [
    { zone: 'LEFT' as const, x: 0, width: leftBoundary },
    {
      zone: 'CENTER' as const,
      x: leftBoundary,
      width: rightBoundary - leftBoundary,
    },
    {
      zone: 'RIGHT' as const,
      x: rightBoundary,
      width: canvas.width - rightBoundary,
    },
  ];

  zones.forEach(({ zone, x, width }) => {
    context.fillStyle =
      marker?.zone === zone ? zoneColors[zone] : 'rgba(255, 255, 255, 0.04)';
    context.fillRect(x, 0, width, canvas.height);
  });

  context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  context.lineWidth = 1;
  context.setLineDash([]);
  context.beginPath();
  context.moveTo(leftBoundary, 0);
  context.lineTo(leftBoundary, canvas.height);
  context.moveTo(rightBoundary, 0);
  context.lineTo(rightBoundary, canvas.height);
  context.stroke();

  if (!marker) {
    return;
  }

  const shoulderX = (1 - marker.centerX) * canvas.width;
  const shoulderY = marker.shoulderY * canvas.height;
  const hipY = marker.hipY * canvas.height;

  context.strokeStyle = 'rgba(250, 204, 21, 0.92)';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(shoulderX, shoulderY);
  context.lineTo(shoulderX, hipY);
  context.stroke();

  context.fillStyle = 'rgba(250, 204, 21, 0.98)';
  context.beginPath();
  context.arc(shoulderX, shoulderY, 10, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  context.beginPath();
  context.arc(shoulderX, hipY, 6, 0, Math.PI * 2);
  context.fill();
}

function smoothMetrics(previous: PoseMetrics | null, next: PoseMetrics): PoseMetrics {
  if (!previous) {
    return next;
  }

  const alpha = MOTION_CONFIG.motionSmoothing;

  return {
    shoulderCenterX:
      previous.shoulderCenterX +
      (next.shoulderCenterX - previous.shoulderCenterX) * alpha,
    shoulderY:
      previous.shoulderY + (next.shoulderY - previous.shoulderY) * alpha,
    hipY: previous.hipY + (next.hipY - previous.hipY) * alpha,
    shoulderWidth:
      previous.shoulderWidth +
      (next.shoulderWidth - previous.shoulderWidth) * alpha,
    torsoHeight:
      previous.torsoHeight + (next.torsoHeight - previous.torsoHeight) * alpha,
    averageKneeAngle:
      previous.averageKneeAngle +
      (next.averageKneeAngle - previous.averageKneeAngle) * alpha,
    lowerBodyConfidence:
      previous.lowerBodyConfidence +
      (next.lowerBodyConfidence - previous.lowerBodyConfidence) * alpha,
  };
}

export function usePoseDetection({
  videoRef,
  canvasRef,
}: UsePoseDetectionArgs): PoseDetectionState {
  const phase = useGameStore((state) => state.phase);
  const beginCountdown = useGameStore((state) => state.beginCountdown);
  const setLane = useGameStore((state) => state.setLane);
  const setBaseline = useGameStore((state) => state.setBaseline);
  const setCameraReady = useGameStore((state) => state.setCameraReady);
  const setCountdown = useGameStore((state) => state.setCountdown);
  const setPoseConfidence = useGameStore((state) => state.setPoseConfidence);
  const setPoseSquatting = useGameStore((state) => state.setPoseSquatting);
  const triggerJump = useGameStore((state) => state.triggerJump);

  const [statusLabel, setStatusLabel] = useState('Kamera aciliyor');
  const [error, setError] = useState<string | null>(null);
  const [guideZone, setGuideZone] = useState<BodyZone>('NONE');

  const phaseRef = useRef(phase);
  const poseModuleRef = useRef<PoseModule | null>(null);
  const landmarkerRef = useRef<PoseLandmarkerType | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastInferenceAtRef = useRef(0);
  const lastJumpAtRef = useRef(0);
  const guideCenterXRef = useRef(0.5);
  const guideCenterLockedRef = useRef(false);
  const bodyMarkerRef = useRef<BodyMarker | null>(null);
  const lostFramesRef = useRef(0);
  const smoothedMetricsRef = useRef<PoseMetrics | null>(null);
  const laneIntentRef = useRef<{ zone: BodyZone; count: number }>({
    zone: 'NONE',
    count: 0,
  });
  const squatFramesRef = useRef({ on: 0, off: 0 });
  const jumpFramesRef = useRef(0);
  const calibrationRef = useRef<CalibrationState>({
    startedAt: 0,
    samples: [],
    done: false,
  });

  useEffect(() => {
    phaseRef.current = phase;

    if (phase === 'CALIBRATION') {
      calibrationRef.current = {
        startedAt: 0,
        samples: [],
        done: false,
      };
      guideCenterXRef.current = 0.5;
      guideCenterLockedRef.current = false;
      setCountdown(3);
      setGuideZone('NONE');
      setStatusLabel('Ortada dur');
    }

    if (phase !== 'PLAYING') {
      laneIntentRef.current = { zone: 'NONE', count: 0 };
      squatFramesRef.current = { on: 0, off: 0 };
      jumpFramesRef.current = 0;
      lostFramesRef.current = 0;
      smoothedMetricsRef.current = null;
      lastJumpAtRef.current = 0;
      bodyMarkerRef.current = null;
      setPoseSquatting(false);
    }
  }, [phase, setCountdown, setPoseSquatting]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Tarayici kamera erisimi vermiyor.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: MOTION_CONFIG.cameraWidth },
            height: { ideal: MOTION_CONFIG.cameraHeight },
            aspectRatio: { ideal: 4 / 3 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;

        if (!video) {
          return;
        }

        video.srcObject = stream;
        await video.play().catch(() => undefined);
        setCameraReady(true);
        setStatusLabel('Pose modeli yukleniyor');

        const poseModule = await import('@mediapipe/tasks-vision');
        if (cancelled) {
          return;
        }

        poseModuleRef.current = poseModule;
        const vision = await poseModule.FilesetResolver.forVisionTasks(
          POSE_WASM_ROOT,
        );

        if (cancelled) {
          return;
        }

        const landmarker = await poseModule.PoseLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: POSE_MODEL_ASSET_PATH,
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          },
        );

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setStatusLabel(
          phaseRef.current === 'CALIBRATION' ? 'Ortada dur' : 'Takip hazir',
        );
      } catch (initializationError) {
        setCameraReady(false);
        setPoseConfidence(0);
        setError(getErrorMessage(initializationError));
        setStatusLabel('Klavye fallback');
      }
    }

    initialize();

    return () => {
      cancelled = true;
      setCameraReady(false);
      setPoseConfidence(0);
      setPoseSquatting(false);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      landmarkerRef.current?.close();
      landmarkerRef.current = null;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [setCameraReady, setPoseConfidence, setPoseSquatting, videoRef]);

  useEffect(() => {
    let active = true;

    const renderLoop = () => {
      if (!active) {
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas) {
        if (
          canvas.width !== MOTION_CONFIG.cameraWidth ||
          canvas.height !== MOTION_CONFIG.cameraHeight
        ) {
          canvas.width = MOTION_CONFIG.cameraWidth;
          canvas.height = MOTION_CONFIG.cameraHeight;
        }

        const context = canvas.getContext('2d');
        if (context) {
          drawGuide(context, canvas, bodyMarkerRef.current);

          const landmarker = landmarkerRef.current;
          const now = performance.now();
          const shouldDetect =
            landmarker &&
            video &&
            video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            video.currentTime !== lastVideoTimeRef.current &&
            now - lastInferenceAtRef.current >= MOTION_CONFIG.detectionIntervalMs;

          if (shouldDetect && video && landmarker) {
            const result = landmarker.detectForVideo(video, now);
            const landmarks = result.landmarks[0] ?? null;

            lastInferenceAtRef.current = now;
            lastVideoTimeRef.current = video.currentTime;

            if (!landmarks) {
              lostFramesRef.current += 1;
              bodyMarkerRef.current = null;
              setGuideZone('NONE');
              setPoseConfidence(0);

              if (phaseRef.current === 'PLAYING' && lostFramesRef.current >= 3) {
                setPoseSquatting(false);
                jumpFramesRef.current = 0;
              }

              if (phaseRef.current === 'CALIBRATION') {
                calibrationRef.current = {
                  startedAt: 0,
                  samples: [],
                  done: false,
                };
                setCountdown(3);
              }

              setStatusLabel(
                phaseRef.current === 'CALIBRATION'
                  ? 'Kamerada gorun'
                  : 'Pose bekleniyor',
              );
            } else {
              const confidence = getPoseConfidence(landmarks);
              setPoseConfidence(confidence);

              if (confidence < MOTION_CONFIG.minPoseConfidence) {
                lostFramesRef.current += 1;
                bodyMarkerRef.current = null;
                setGuideZone('NONE');

                if (phaseRef.current === 'PLAYING' && lostFramesRef.current >= 3) {
                  setPoseSquatting(false);
                  jumpFramesRef.current = 0;
                }

                if (phaseRef.current === 'CALIBRATION') {
                  calibrationRef.current = {
                    startedAt: 0,
                    samples: [],
                    done: false,
                  };
                  setCountdown(3);
                }

                setStatusLabel(
                  phaseRef.current === 'CALIBRATION'
                    ? 'Biraz daha aydinlik'
                    : 'Goruntu zayif',
                );
              } else {
                lostFramesRef.current = 0;
                const metrics = smoothMetrics(
                  smoothedMetricsRef.current,
                  getPoseMetrics(landmarks),
                );
                smoothedMetricsRef.current = metrics;

                if (
                  phaseRef.current === 'CALIBRATION' &&
                  !guideCenterLockedRef.current
                ) {
                  guideCenterXRef.current = metrics.shoulderCenterX;
                  guideCenterLockedRef.current = true;
                }

                const adjustedCenterX = clamp01(
                  metrics.shoulderCenterX + (0.5 - guideCenterXRef.current),
                );
                const zone = getBodyZone(adjustedCenterX);

                bodyMarkerRef.current = {
                  centerX: adjustedCenterX,
                  shoulderY: metrics.shoulderY,
                  hipY: metrics.hipY,
                  zone,
                };
                setGuideZone(zone);

                if (phaseRef.current === 'CALIBRATION') {
                  if (zone !== 'CENTER') {
                    calibrationRef.current = {
                      startedAt: 0,
                      samples: [],
                      done: false,
                    };
                    setCountdown(3);
                    setStatusLabel('Ortadaki alana gec');
                  } else {
                    const calibration = calibrationRef.current;

                    if (calibration.startedAt === 0) {
                      calibration.startedAt = now;
                    }

                    calibration.samples.push(createBaselineSample(landmarks));
                    const elapsed = now - calibration.startedAt;
                    const remainingSeconds = Math.max(
                      1,
                      Math.ceil(
                        (MOTION_CONFIG.calibrationDurationMs - elapsed) / 1000,
                      ),
                    );
                    setCountdown(remainingSeconds);

                    if (
                      !calibration.done &&
                      elapsed >= MOTION_CONFIG.calibrationDurationMs &&
                      calibration.samples.length >=
                        MOTION_CONFIG.calibrationMinSamples
                    ) {
                      calibration.done = true;
                      const baseline = averageBaseline(calibration.samples);
                      guideCenterXRef.current = baseline.centerX;
                      setBaseline(baseline);
                      setStatusLabel('Senkron tamam');
                      beginCountdown();
                    } else {
                      setStatusLabel('Ortada sabit kal');
                    }
                  }
                } else if (phaseRef.current === 'PLAYING') {
                  const baseline =
                    useGameStore.getState().baseline ??
                    createBaselineSample(landmarks);
                  guideCenterXRef.current = baseline.centerX;

                  if (laneIntentRef.current.zone === zone) {
                    laneIntentRef.current.count += 1;
                  } else {
                    laneIntentRef.current = { zone, count: 1 };
                  }

                  if (
                    zone !== 'NONE' &&
                    laneIntentRef.current.count >= MOTION_CONFIG.laneConfirmFrames
                  ) {
                    const targetLane = zone === 'LEFT' ? -1 : zone === 'RIGHT' ? 1 : 0;
                    setLane(targetLane);
                  }

                  const squatCandidate = isSquat(metrics, baseline);
                  const currentGame = useGameStore.getState();

                  if (squatCandidate) {
                    squatFramesRef.current.on += 1;
                    squatFramesRef.current.off = 0;
                  } else {
                    squatFramesRef.current.off += 1;
                    squatFramesRef.current.on = 0;
                  }

                  if (
                    !currentGame.poseSquatting &&
                    squatFramesRef.current.on >= MOTION_CONFIG.squatEnterFrames
                  ) {
                    setPoseSquatting(true);
                  } else if (
                    currentGame.poseSquatting &&
                    squatFramesRef.current.off >= MOTION_CONFIG.squatExitFrames
                  ) {
                    setPoseSquatting(false);
                  }

                  if (!squatCandidate && isJump(metrics, baseline)) {
                    jumpFramesRef.current += 1;
                  } else {
                    jumpFramesRef.current = 0;
                  }

                  if (
                    !squatCandidate &&
                    jumpFramesRef.current >= MOTION_CONFIG.jumpConfirmFrames &&
                    now - lastJumpAtRef.current >=
                      MOTION_CONFIG.jumpCooldownMs
                  ) {
                    lastJumpAtRef.current = now;
                    jumpFramesRef.current = 0;
                    triggerJump();
                  }

                  setStatusLabel(
                    useGameStore.getState().isSquatting
                      ? 'Egil aktif'
                      : zone === 'CENTER'
                        ? 'Ortadasin'
                        : zone === 'LEFT'
                          ? 'Sol serit'
                          : 'Sag serit',
                  );
                } else {
                  setStatusLabel(
                    zone === 'CENTER'
                      ? 'Ortadasin'
                      : zone === 'LEFT'
                        ? 'Sol'
                        : 'Sag',
                  );
                }
              }
            }

            drawGuide(context, canvas, bodyMarkerRef.current);
            result.close();
          }
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = window.requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    beginCountdown,
    canvasRef,
    setBaseline,
    setCountdown,
    setLane,
    setPoseConfidence,
    setPoseSquatting,
    triggerJump,
    videoRef,
  ]);

  return {
    statusLabel,
    error,
    guideZone,
  };
}
