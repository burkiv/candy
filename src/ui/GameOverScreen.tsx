import { useGameStore } from '../stores/gameStore';
import { formatTime } from '../utils/math';

export function GameOverScreen() {
  const score = useGameStore((state) => state.score);
  const highScore = useGameStore((state) => state.highScore);
  const time = useGameStore((state) => state.time);
  const speed = useGameStore((state) => state.speed);
  const obstaclesAvoided = useGameStore((state) => state.obstaclesAvoided);
  const startCalibration = useGameStore((state) => state.startCalibration);
  const returnToMenu = useGameStore((state) => state.returnToMenu);

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-lg border border-red-300/20 bg-black/48 p-6 shadow-hud backdrop-blur-md sm:p-8">
        <div className="text-sm uppercase tracking-[0.24em] text-red-300/80">
          Game Over
        </div>
        <div className="mt-3 text-5xl font-black leading-none sm:text-6xl">
          Tren kacmadi.
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              Skor
            </div>
            <div className="mt-2 text-2xl font-black">{Math.floor(score)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              High
            </div>
            <div className="mt-2 text-2xl font-black text-amber-300">{highScore}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              Sure
            </div>
            <div className="mt-2 text-2xl font-black">{formatTime(time)}s</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              Kacis
            </div>
            <div className="mt-2 text-2xl font-black">{obstaclesAvoided}</div>
          </div>
        </div>
        <div className="mt-5 text-sm text-white/70">
          Son hiz: <span className="font-semibold text-cyan-200">{speed.toFixed(2)}x</span>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startCalibration}
            className="rounded-lg bg-cyan-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-950 transition hover:bg-cyan-200"
          >
            Tekrar Oyna
          </button>
          <button
            type="button"
            onClick={returnToMenu}
            className="rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}
