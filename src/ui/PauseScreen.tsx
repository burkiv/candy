import { useGameStore } from '../stores/gameStore';
import { AudioSettingsDialog } from './AudioSettingsDialog';

export function PauseScreen() {
  const score = useGameStore((state) => state.score);
  const livesRemaining = useGameStore((state) => state.livesRemaining);
  const resumeRun = useGameStore((state) => state.resumeRun);
  const returnToMenu = useGameStore((state) => state.returnToMenu);

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-black/50 p-6 shadow-hud backdrop-blur-md sm:p-8">
        <div className="text-sm uppercase tracking-[0.24em] text-cyan-200/80">
          Duraklatildi
        </div>
        <div className="mt-3 text-5xl font-black leading-none sm:text-6xl">
          Candy Run beklemede
        </div>
        <p className="mt-4 text-sm leading-6 text-white/72 sm:text-base">
          Nefes al, ellerini topla, sonra devam ederiz.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              Skor
            </div>
            <div className="mt-2 text-2xl font-black">{Math.floor(score)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              Can
            </div>
            <div className="mt-2 text-2xl font-black text-amber-300">
              {Array.from({ length: livesRemaining })
                .map(() => 'O')
                .join(' ')}
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
          Esc ile devam et, istersen asagidan menuye don.
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={resumeRun}
            className="rounded-lg bg-cyan-300 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-950 transition hover:bg-cyan-200"
          >
            Devam Et
          </button>
          <AudioSettingsDialog
            buttonLabel="Ayarlar"
            subtitle="Duraklatma ekranindan cikmadan ses seviyelerini aninda duzenleyebilirsin."
            buttonClassName="rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
          />
          <button
            type="button"
            onClick={returnToMenu}
            className="rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
          >
            Ana Menu
          </button>
        </div>
      </div>
    </div>
  );
}
