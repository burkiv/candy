import { useGameStore } from '../stores/gameStore';

export function MenuScreen() {
  const highScore = useGameStore((state) => state.highScore);
  const startCalibration = useGameStore((state) => state.startCalibration);

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-lg border border-white/10 bg-black/28 p-6 shadow-hud backdrop-blur-md sm:p-8">
            <div className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">
              First Person Endless Runner
            </div>
            <h1 className="mt-3 text-4xl font-black leading-none sm:text-6xl">
              Subway Runner
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
              Uc seritli tunnel kosusu hazir. Bu ilk kurulumda klavye ile
              oynanabilir temel loop acildi; kamera katmani bunun ustune
              eklenecek.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startCalibration}
                className="rounded-lg bg-cyan-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-950 transition hover:bg-cyan-200"
              >
                Baslat
              </button>
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
                Enter ile de baslayabilir.
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/28 p-6 shadow-hud backdrop-blur-md sm:p-8">
            <div className="text-xs uppercase tracking-[0.24em] text-white/45">
              Kontroller
            </div>
            <div className="mt-5 space-y-3 text-sm text-white/78">
              <div className="flex items-center justify-between gap-4">
                <span>Serit</span>
                <span className="font-semibold text-cyan-200">A / D</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Egil</span>
                <span className="font-semibold text-cyan-200">S</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Zipla</span>
                <span className="font-semibold text-cyan-200">W / Space</span>
              </div>
            </div>
            <div className="mt-8 rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              High score: <span className="font-bold text-amber-300">{highScore}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
