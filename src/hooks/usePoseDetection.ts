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
import type { Baseline, CalibrationStep } from '../types';
import { DEFAULT_CALIBRATION_UI } from '../utils/constants';

type BodyZone = 'LEFT' | 'CENTER' | 'RIGHT' | 'NONE';
type PoseModule = typeof import('@mediapipe/tasks-vision');
type PoseMetrics = ReturnType<typeof getPoseMetrics>;

interface PoseDetectionState {
  statusLabel: string;
  error: string | null;
  guideZone: BodyZone;
}

interface CalibrationState {
  step: CalibrationStep;
  neutralStartedAt: number;
  neutralSamples: ReturnType<typeof createBaselineSample>[];
  crouchStartedAt: number;
  crouchSamples: ReturnType<typeof createBaselineSample>[];
  handRaisedAt: number;
  neutralBaseline: Baseline | null;
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

function createCalibrationState(): CalibrationState {
  return {
    step: 'CENTER',
    neutralStartedAt: 0,
    neutralSamples: [],
    crouchStartedAt: 0,
    crouchSamples: [],
    handRaisedAt: 0,
    neutralBaseline: null,
  };
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Pose algılama başlatılamadı.';
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

function isHandRaised(landmarks: NormalizedLandmark[]) {
  const leftRaised =
    landmarks[15].y < landmarks[11].y - MOTION_CONFIG.handRaiseShoulderMargin;
  const rightRaised =
    landmarks[16].y < landmarks[12].y - MOTION_CONFIG.handRaiseShoulderMargin;

  return leftRaised || rightRaised;
}

function drawCalibrationGhost(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  step: CalibrationStep,
  handRaised: boolean,
) {
  const centerX = canvas.width / 2;
  const crouched = step === 'CROUCH';
  const headRadius = 26;
  const headY = crouched ? canvas.height * 0.3 : canvas.height * 0.22;
  const torsoTop = headY + 44;
  const torsoHeight = crouched ? 92 : 136;
  const torsoWidth = 76;
  const hipY = torsoTop + torsoHeight;

  context.save();
  context.strokeStyle = 'rgba(255, 255, 255, 0.32)';
  context.lineWidth = 3;
  context.setLineDash([10, 8]);

  context.beginPath();
  context.arc(centerX, headY, headRadius, 0, Math.PI * 2);
  context.stroke();

  context.strokeRect(
    centerX - torsoWidth / 2,
    torsoTop,
    torsoWidth,
    torsoHeight,
  );

  context.beginPath();
  context.moveTo(centerX - torsoWidth / 2, torsoTop + 28);
  context.lineTo(centerX - torsoWidth / 2 - 34, torsoTop + (crouched ? 42 : 58));
  context.moveTo(centerX + torsoWidth / 2, torsoTop + 28);
  context.lineTo(
    centerX + torsoWidth / 2 + 34,
    torsoTop + (step === 'READY' ? -24 : crouched ? 42 : 58),
  );
  context.moveTo(centerX - 18, hipY);
  context.lineTo(centerX - (crouched ? 48 : 28), hipY + (crouched ? 22 : 70));
  context.moveTo(centerX + 18, hipY);
  context.lineTo(centerX + (crouched ? 48 : 28), hipY + (crouched ? 22 : 70));
  context.stroke();

  if (step === 'READY') {
    context.fillStyle = handRaised
      ? 'rgba(34, 197, 94, 0.3)'
      : 'rgba(250, 204, 21, 0.16)';
    context.fillRect(centerX + torsoWidth / 2 + 14, torsoTop - 94, 44, 92);
  }

  context.restore();
}

function drawGuide(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  marker: BodyMarker | null,
  options: {
    calibrationStep: CalibrationStep;
    showCalibrationGhost: boolean;
    handRaised: boolean;
  },
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

  if (options.showCalibrationGhost) {
    drawCalibrationGhost(
      context,
      canvas,
      options.calibrationStep,
      options.handRaised,
    );
  }

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
  const setCalibrationUi = useGameStore((state) => state.setCalibrationUi);
  const setCameraReady = useGameStore((state) => state.setCameraReady);
  const setPoseConfidence = useGameStore((state) => state.setPoseConfidence);
  const setPoseSquatting = useGameStore((state) => state.setPoseSquatting);
  const triggerJump = useGameStore((state) => state.triggerJump);

  const [statusLabel, setStatusLabel] = useState('Kamera açılıyor');
  const [error, setError] = useState<string | null>(null);
  const [guideZone, setGuideZone] = useState<BodyZone>('NONE');

  const phaseRef = useRef(phase);
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
  const calibrationRef = useRef<CalibrationState>(createCalibrationState());

  function setCalibrationCopy(
    step: CalibrationStep,
    progress: number,
    title: string,
    subtitle: string,
    nextStatusLabel = title,
  ) {
    setCalibrationUi({
      step,
      progress: clamp01(progress),
      title,
      subtitle,
    });
    setStatusLabel(nextStatusLabel);
  }

  function resetCalibrationFlow(nextStatusLabel = DEFAULT_CALIBRATION_UI.title) {
    calibrationRef.current = createCalibrationState();
    setCalibrationUi(DEFAULT_CALIBRATION_UI);
    setStatusLabel(nextStatusLabel);
  }

  useEffect(() => {
    phaseRef.current = phase;

    if (phase === 'CALIBRATION') {
      resetCalibrationFlow();
      guideCenterXRef.current = 0.5;
      guideCenterLockedRef.current = false;
      setGuideZone('NONE');
      setError(null);
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
  }, [phase, setCalibrationUi, setPoseSquatting]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Tarayıcı kamera erişimi vermiyor.');
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
        setStatusLabel('Pose modeli yükleniyor');

        const poseModule: PoseModule = await import('@mediapipe/tasks-vision');
        if (cancelled) {
          return;
        }

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
          phaseRef.current === 'CALIBRATION'
            ? DEFAULT_CALIBRATION_UI.title
            : 'Takip hazır',
        );
      } catch (initializationError) {
        setCameraReady(false);
        setPoseConfidence(0);
        setError(getErrorMessage(initializationError));
        setStatusLabel('Klavye ile devam edebilirsin');
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
          drawGuide(context, canvas, bodyMarkerRef.current, {
            calibrationStep: calibrationRef.current.step,
            showCalibrationGhost: phaseRef.current === 'CALIBRATION',
            handRaised: calibrationRef.current.handRaisedAt > 0,
          });

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
                resetCalibrationFlow('Kamerada daha net görün');
              }

              setStatusLabel(
                phaseRef.current === 'CALIBRATION'
                  ? 'Kamerada daha net görün'
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
                  resetCalibrationFlow('Biraz daha aydınlık dene');
                }

                setStatusLabel(
                  phaseRef.current === 'CALIBRATION'
                    ? 'Biraz daha aydınlık dene'
                    : 'Görüntü zayıf',
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
                  const calibration = calibrationRef.current;

                  if (calibration.step === 'CENTER') {
                    if (zone !== 'CENTER') {
                      calibration.neutralStartedAt = 0;
                      calibration.neutralSamples = [];
                      setCalibrationCopy(
                        'CENTER',
                        0,
                        'Ortada dik dur',
                        'İki çizginin arasına geçip rahat duruşunu sabitle.',
                        'Ortadaki bölgeye geç',
                      );
                    } else {
                      if (calibration.neutralStartedAt === 0) {
                        calibration.neutralStartedAt = now;
                      }

                      calibration.neutralSamples.push(createBaselineSample(landmarks));
                      const elapsed = now - calibration.neutralStartedAt;
                      const progress =
                        elapsed / MOTION_CONFIG.calibrationNeutralDurationMs;

                      setCalibrationCopy(
                        'CENTER',
                        progress,
                        'Ortada dik dur',
                        'İki çizginin arasında rahat duruşunu alıp sabit kal.',
                        'Doğal duruşunu alıyoruz',
                      );

                      if (
                        elapsed >= MOTION_CONFIG.calibrationNeutralDurationMs &&
                        calibration.neutralSamples.length >=
                          MOTION_CONFIG.calibrationMinSamples
                      ) {
                        const neutralBaseline = averageBaseline(
                          calibration.neutralSamples,
                        );
                        calibration.step = 'CROUCH';
                        calibration.neutralBaseline = neutralBaseline;
                        calibration.crouchStartedAt = 0;
                        calibration.crouchSamples = [];
                        guideCenterXRef.current = neutralBaseline.centerX;

                        setCalibrationCopy(
                          'CROUCH',
                          0,
                          'Şimdi eğil',
                          'Ortada kal ve hafif squat pozunda bir an sabit dur.',
                          'Biraz eğil ve bekle',
                        );
                      }
                    }
                  } else if (calibration.step === 'CROUCH') {
                    const neutralBaseline =
                      calibration.neutralBaseline ??
                      averageBaseline(calibration.neutralSamples);

                    if (zone !== 'CENTER') {
                      calibration.crouchStartedAt = 0;
                      calibration.crouchSamples = [];
                      setCalibrationCopy(
                        'CROUCH',
                        0,
                        'Şimdi eğil',
                        'Ortaya dönüp squat pozunu orada sabitle.',
                        'Ortaya dön ve eğil',
                      );
                    } else {
                      const squatCandidate = isSquat(metrics, neutralBaseline);

                      if (!squatCandidate) {
                        calibration.crouchStartedAt = 0;
                        calibration.crouchSamples = [];
                        setCalibrationCopy(
                          'CROUCH',
                          0,
                          'Şimdi eğil',
                          'Omuz ve kalçan biraz daha aşağı gelsin; squat pozunda kal.',
                          'Biraz daha eğil',
                        );
                      } else {
                        if (calibration.crouchStartedAt === 0) {
                          calibration.crouchStartedAt = now;
                        }

                        calibration.crouchSamples.push(createBaselineSample(landmarks));
                        const elapsed = now - calibration.crouchStartedAt;
                        const progress =
                          elapsed / MOTION_CONFIG.calibrationCrouchDurationMs;

                        setCalibrationCopy(
                          'CROUCH',
                          progress,
                          'Şimdi eğil',
                          'Harika. Aynen böyle bir an daha kal.',
                          'Squat pozunu tut',
                        );

                        if (
                          elapsed >= MOTION_CONFIG.calibrationCrouchDurationMs &&
                          calibration.crouchSamples.length >=
                            MOTION_CONFIG.calibrationMinSamples
                        ) {
                          const crouchBaseline = averageBaseline(
                            calibration.crouchSamples,
                          );
                          const personalizedBaseline: Baseline = {
                            ...neutralBaseline,
                            crouchShoulderY: crouchBaseline.shoulderY,
                            crouchHipY: crouchBaseline.hipY,
                            crouchTorsoHeight: crouchBaseline.torsoHeight,
                          };

                          calibration.step = 'READY';
                          calibration.handRaisedAt = 0;
                          calibration.neutralBaseline = personalizedBaseline;
                          setBaseline(personalizedBaseline);

                          setCalibrationCopy(
                            'READY',
                            0,
                            'Hazır olduğunda elini kaldır',
                            'Dik dur. Tek elini 3 saniye yukarıda tutunca oyun başlayacak.',
                            'Dik dur ve elini kaldır',
                          );
                        }
                      }
                    }
                  } else {
                    const personalizedBaseline = calibration.neutralBaseline;
                    const handRaised = isHandRaised(landmarks);
                    const uprightEnough =
                      personalizedBaseline != null &&
                      !isSquat(metrics, personalizedBaseline);

                    if (zone !== 'CENTER' || !uprightEnough) {
                      calibration.handRaisedAt = 0;
                      setCalibrationCopy(
                        'READY',
                        0,
                        'Hazır olduğunda elini kaldır',
                        'Dik durup ortaya yerleş. Sonra tek elini yukarı kaldır.',
                        zone !== 'CENTER' ? 'Ortaya yerleş' : 'Önce dik dur',
                      );
                    } else if (!handRaised) {
                      calibration.handRaisedAt = 0;
                      setCalibrationCopy(
                        'READY',
                        0,
                        'Hazır olduğunda elini kaldır',
                        'Tek elini yukarı kaldır ve 3 saniye boyunca indirme.',
                        'Hazırsa elini yukarı kaldır',
                      );
                    } else {
                      if (calibration.handRaisedAt === 0) {
                        calibration.handRaisedAt = now;
                      }

                      const elapsed = now - calibration.handRaisedAt;
                      const progress =
                        elapsed / MOTION_CONFIG.calibrationStartHoldMs;

                      setCalibrationCopy(
                        'READY',
                        progress,
                        'Hazır olduğunda elini kaldır',
                        'Mükemmel. Elini 3 saniye yukarıda tut ve başlayalım.',
                        'Elini yukarıda tut',
                      );

                      if (elapsed >= MOTION_CONFIG.calibrationStartHoldMs) {
                        setCalibrationCopy(
                          'READY',
                          1,
                          'Başlıyoruz',
                          'Kalibrasyon tamamlandı. Geri sayım başladı.',
                          'Başlıyoruz',
                        );
                        beginCountdown();
                      }
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
                    now - lastJumpAtRef.current >= MOTION_CONFIG.jumpCooldownMs
                  ) {
                    lastJumpAtRef.current = now;
                    jumpFramesRef.current = 0;
                    triggerJump();
                  }

                  setStatusLabel(
                    useGameStore.getState().isSquatting
                      ? 'Eğil aktif'
                      : zone === 'CENTER'
                        ? 'Ortadasın'
                        : zone === 'LEFT'
                          ? 'Sol şerit'
                          : 'Sağ şerit',
                  );
                } else {
                  setStatusLabel(
                    zone === 'CENTER'
                      ? 'Ortadasın'
                      : zone === 'LEFT'
                        ? 'Sol'
                        : 'Sağ',
                  );
                }
              }
            }

            drawGuide(context, canvas, bodyMarkerRef.current, {
              calibrationStep: calibrationRef.current.step,
              showCalibrationGhost: phaseRef.current === 'CALIBRATION',
              handRaised: calibrationRef.current.handRaisedAt > 0,
            });
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
    setCalibrationUi,
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
