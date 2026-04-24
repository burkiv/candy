import { useGameStore } from '../stores/gameStore';

export function MenuScreen() {
  const highScore = useGameStore((state) => state.highScore);
  const startKeyboardRun = useGameStore((state) => state.startKeyboardRun);
  const startCalibration = useGameStore((state) => state.startCalibration);

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-lg border border-white/10 bg-black/28 p-6 shadow-hud backdrop-blur-md sm:p-8">
            <div className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">
              First Person Candy Runner
            </div>
            <h1 className="mt-3 text-4xl font-black leading-none sm:text-6xl">
              Candy Run
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
              Uc seritli seker tunel kosusu hazir. Klavye ile aninda
              baslayabilir ya da kamera modunda guided calibration ile
              serit, squat ve jump hareketlerini esleyebilirsin.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={startKeyboardRun}
                className="rounded-lg border border-cyan-300/30 bg-cyan-300 px-5 py-4 text-left text-slate-950 transition hover:bg-cyan-200"
              >
                <div className="text-xs font-bold uppercase tracking-[0.18em]">
                  Klavye
                </div>
                <div className="mt-2 text-xl font-black leading-none">
                  Hemen Basla
                </div>
                <div className="mt-2 text-sm text-slate-900/72">
                  Kamera acmadan direkt geri sayima girer.
                </div>
              </button>
              <button
                type="button"
                onClick={startCalibration}
                className="rounded-lg border border-white/15 bg-white/5 px-5 py-4 text-left text-white transition hover:bg-white/10"
              >
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                  Kamera
                </div>
                <div className="mt-2 text-xl font-black leading-none">
                  Guided Calibration
                </div>
                <div className="mt-2 text-sm text-white/72">
                  Ortada dur, egil, sonra elini kaldirarak bilerek baslat.
                </div>
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/72">
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                Enter = klavye ile basla
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                C = kamera modu
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                Esc = duraklat / geri don
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/28 p-6 shadow-hud backdrop-blur-md sm:p-8">
            <div className="text-xs uppercase tracking-[0.24em] text-white/45">
              Modlar
            </div>
            <div className="mt-5 space-y-3 text-sm text-white/78">
              <div className="flex items-center justify-between gap-4">
                <span>Klavye</span>
                <span className="font-semibold text-cyan-200">Aninda baslar</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Kamera</span>
                <span className="font-semibold text-cyan-200">3 adimli sync</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Onay</span>
                <span className="font-semibold text-cyan-200">Eli kaldir</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Duraklat</span>
                <span className="font-semibold text-cyan-200">Esc</span>
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
