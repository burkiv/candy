import { useRef } from 'react';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useGameStore } from '../stores/gameStore';

interface CameraFeedProps {
  className?: string;
  fullscreen?: boolean;
}

const zoneLabels: Record<string, string> = {
  LEFT: 'SOL',
  CENTER: 'ORTA',
  RIGHT: 'SAĞ',
  NONE: '--',
};

export function CameraFeed({
  className = '',
  fullscreen = false,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase = useGameStore((state) => state.phase);
  const cameraReady = useGameStore((state) => state.cameraReady);
  const calibrationUi = useGameStore((state) => state.calibrationUi);
  const poseConfidence = useGameStore((state) => state.poseConfidence);
  const { error, statusLabel, guideZone } = usePoseDetection({
    videoRef,
    canvasRef,
  });

  return (
    <div
      className={`relative overflow-hidden bg-black ${fullscreen ? '' : 'rounded-lg border border-white/15 shadow-hud backdrop-blur-md'} ${className}`}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full scale-x-[-1] object-contain bg-black"
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]"
      />
      <div className={`absolute left-3 top-3 rounded bg-black/60 px-2 py-1 font-semibold uppercase tracking-[0.18em] text-cyan-200 ${fullscreen ? 'text-xs' : 'text-[10px]'}`}>
        Kamera Modu
      </div>
      <div className={`absolute inset-x-0 flex justify-center ${fullscreen ? 'top-4' : 'top-2'}`}>
        <div className={`rounded bg-black/55 px-3 py-1 text-white/75 ${fullscreen ? 'text-sm' : 'text-[10px]'}`}>
          {phase === 'CALIBRATION'
            ? calibrationUi.title
            : 'Sol / Orta / Sağ şerit takibi'}
        </div>
      </div>
      <div
        className={`absolute bottom-3 left-3 rounded px-2 py-1 font-semibold uppercase tracking-[0.18em] ${
          cameraReady
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-amber-500/20 text-amber-300'
        } ${fullscreen ? 'text-xs' : 'text-[10px]'}`}
      >
        {cameraReady ? statusLabel : 'Hazırlanıyor'}
      </div>
      <div className={`absolute right-3 top-3 rounded bg-black/60 px-2 py-1 font-semibold uppercase tracking-[0.18em] text-amber-200 ${fullscreen ? 'text-xs' : 'text-[10px]'}`}>
        {Math.round(poseConfidence * 100)}%
      </div>
      <div className={`absolute right-3 bottom-3 rounded px-3 py-1 font-bold uppercase tracking-[0.2em] ${
        guideZone === 'CENTER'
          ? 'bg-emerald-500/20 text-emerald-300'
          : guideZone === 'LEFT'
            ? 'bg-blue-500/20 text-blue-200'
            : guideZone === 'RIGHT'
              ? 'bg-orange-500/20 text-orange-200'
              : 'bg-black/60 text-white/60'
      } ${fullscreen ? 'text-sm' : 'text-[10px]'}`}>
        {zoneLabels[guideZone]}
      </div>
      {error ? (
        <div className={`absolute inset-x-3 rounded bg-black/65 px-3 py-2 text-white/80 ${fullscreen ? 'bottom-16 text-sm' : 'bottom-10 text-[11px]'}`}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
