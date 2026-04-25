import { useProgress } from '@react-three/drei';
import { useGameStore } from '../stores/gameStore';
import { worldDefinitions } from '../worlds';

function formatPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatItemLabel(item: string) {
  if (!item) {
    return 'Modeller hazirlaniyor';
  }

  const normalized = item.replace(/^.*[\\/]/, '');
  return normalized.length > 38 ? `${normalized.slice(0, 35)}...` : normalized;
}

export function SceneLoadingOverlay() {
  const selectedWorld = useGameStore((state) => state.selectedWorld);
  const readyWorlds = useGameStore((state) => state.readyWorlds);
  const isReady = readyWorlds[selectedWorld] === true;
  const { progress, item, loaded, total } = useProgress();

  if (isReady) {
    return null;
  }

  const world = worldDefinitions[selectedWorld];
  const percent = formatPercent(progress);
  const resolvedPercent = total > 0 && loaded >= total ? 100 : percent;

  return (
    <div className="absolute inset-0 z-40 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${world.menu.gradient[0]}, ${world.menu.gradient[1]})`,
        }}
      />
      <div className="absolute inset-0 bg-slate-950/82 backdrop-blur-md" />
      <div className="relative flex h-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/12 bg-black/30 p-6 shadow-hud backdrop-blur-xl sm:p-7">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/72">
            {world.menu.label}
          </div>
          <div className="mt-3 text-3xl font-black leading-none text-white sm:text-4xl">
            Sahne Yukleniyor
          </div>
          <p className="mt-4 text-sm leading-6 text-white/72">
            Modeller ve ortam hazirlaniyor. Sahne gorunmeden oyunu baslatmiyoruz.
          </p>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-300 transition-[width] duration-300"
              style={{ width: `${resolvedPercent}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-4 text-sm">
            <div className="font-semibold text-white/72">{formatItemLabel(item)}</div>
            <div className="font-black text-cyan-200">{resolvedPercent}%</div>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/62">
            Ilk acilista biraz uzun surebilir. Sonraki ziyaretlerde tarayici onbellekten
            faydalanacagi icin belirgin bicimde hizlanir.
          </div>
        </div>
      </div>
    </div>
  );
}
