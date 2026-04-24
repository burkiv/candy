import { useGameStore } from '../stores/gameStore';

export function CalibrationScreen() {
  const calibrationUi = useGameStore((state) => state.calibrationUi);
  const poseConfidence = useGameStore((state) => state.poseConfidence);
  const stepIndex =
    calibrationUi.step === 'CENTER' ? 1 : calibrationUi.step === 'CROUCH' ? 2 : 3;

  return (
    <div className="absolute inset-0 flex items-end justify-center bg-black/20 px-4 pb-6 sm:pb-8">
      <div className="w-full max-w-3xl rounded-lg border border-white/10 bg-black/48 px-6 py-8 text-center shadow-hud backdrop-blur-md sm:px-8">
        <div className="text-sm uppercase tracking-[0.24em] text-cyan-200/80">
          Kamera Kalibrasyonu
        </div>
        <div className="mt-3 text-4xl font-black leading-none sm:text-6xl">
          {calibrationUi.title}
        </div>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/72 sm:text-base">
          {calibrationUi.subtitle}
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.22em] text-white/55">
          <span className={stepIndex >= 1 ? 'text-cyan-200' : ''}>1 Merkez</span>
          <span>/</span>
          <span className={stepIndex >= 2 ? 'text-cyan-200' : ''}>2 Egil</span>
          <span>/</span>
          <span className={stepIndex >= 3 ? 'text-cyan-200' : ''}>3 Eli Kaldir</span>
        </div>
        <div className="mx-auto mt-5 h-3 w-full max-w-xl overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-300 transition-[width] duration-150"
            style={{ width: `${Math.round(calibrationUi.progress * 100)}%` }}
          />
        </div>
        <div className="mt-4 text-3xl font-black text-amber-300">
          %{Math.round(calibrationUi.progress * 100)}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.22em] text-cyan-200/80">
          <span>Pose confidence {Math.round(poseConfidence * 100)}%</span>
          <span>Esc = menu</span>
        </div>
      </div>
    </div>
  );
}
