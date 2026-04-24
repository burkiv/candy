import { useGameStore } from '../stores/gameStore';

export function CountdownScreen() {
  const countdown = useGameStore((state) => state.countdown);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
      <div className="rounded-lg border border-white/10 bg-black/22 px-8 py-10 text-center shadow-hud backdrop-blur-md">
        <div className="text-sm uppercase tracking-[0.24em] text-cyan-200/80">
          Hazir Ol
        </div>
        <div className="mt-3 text-7xl font-black leading-none text-white sm:text-8xl">
          {countdown}
        </div>
      </div>
    </div>
  );
}
