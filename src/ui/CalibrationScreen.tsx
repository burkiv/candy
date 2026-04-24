import { useGameStore } from '../stores/gameStore';

export function CalibrationScreen() {
  const countdown = useGameStore((state) => state.countdown);
  const poseConfidence = useGameStore((state) => state.poseConfidence);

  return (
    <div className="absolute inset-0 flex items-end justify-center bg-black/20 px-4 pb-6 sm:pb-8">
      <div className="w-full max-w-3xl rounded-lg border border-white/10 bg-black/48 px-6 py-8 text-center shadow-hud backdrop-blur-md sm:px-8">
        <div className="text-sm uppercase tracking-[0.24em] text-cyan-200/80">
          Kalibrasyon
        </div>
        <div className="mt-3 text-4xl font-black leading-none sm:text-6xl">
          Ortadaki bolmede sabit kal
        </div>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/72 sm:text-base">
          Iki cizgi ekrani sol, orta ve sag olarak ayiriyor. Once rahat durusunu
          aliyoruz. Sonra oyunda sol ve sag bolmeye gecerek serit degistirecek,
          ust govde hareketinle squat ve jump tetikleyeceksin.
        </p>
        <div className="mt-6 text-5xl font-black text-amber-300 sm:text-6xl">
          {countdown}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.22em] text-cyan-200/80">
          <span>Pose confidence {Math.round(poseConfidence * 100)}%</span>
          <span>Enter = direkt basla</span>
          <span>Esc = menu</span>
        </div>
      </div>
    </div>
  );
}
