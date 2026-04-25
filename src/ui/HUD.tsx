import { useGameStore } from '../stores/gameStore';
import { getSpeedStepDistance } from '../utils/constants';
import { formatTime } from '../utils/math';

function formatStat(value: number) {
  return value.toLocaleString('en-US');
}

function LaneIndicator() {
  const currentLane = useGameStore((state) => state.currentLane);

  return (
    <div className="flex items-center gap-2">
      {([-1, 0, 1] as const).map((lane) => (
        <div
          key={lane}
          className={`h-2.5 w-10 rounded-sm transition ${
            currentLane === lane
              ? 'bg-cyan-300 shadow-[0_0_22px_rgba(103,232,249,0.7)]'
              : 'bg-white/15'
          }`}
        />
      ))}
    </div>
  );
}

function LivesBanner() {
  const livesRemaining = useGameStore((state) => state.livesRemaining);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
      <div className="rounded-lg border border-white/10 bg-black/40 px-5 py-3 shadow-hud backdrop-blur-md">
        <div className="text-center text-[11px] uppercase tracking-[0.2em] text-white/55">
          Can
        </div>
        <div className="mt-1 flex items-center justify-center gap-2 text-3xl leading-none sm:text-4xl">
          {Array.from({ length: livesRemaining }).map((_, index) => (
            <span key={index} aria-hidden="true">
              {'\u2764\uFE0F'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HUD() {
  const score = useGameStore((state) => state.score);
  const highScore = useGameStore((state) => state.highScore);
  const time = useGameStore((state) => state.time);
  const distance = useGameStore((state) => state.distance);
  const speed = useGameStore((state) => state.speed);
  const controlMode = useGameStore((state) => state.controlMode);
  const invincibleMode = useGameStore((state) => state.invincibleMode);
  const collisionCount = useGameStore((state) => state.collisionCount);
  const impactTimeLeft = useGameStore((state) => state.impactTimeLeft);
  const obstaclesAvoided = useGameStore((state) => state.obstaclesAvoided);
  const coinsCollected = useGameStore((state) => state.coinsCollected);
  const starsCollected = useGameStore((state) => state.starsCollected);
  const renderMeshes = useGameStore((state) => state.renderMeshes);
  const renderTriangles = useGameStore((state) => state.renderTriangles);
  const renderGeometries = useGameStore((state) => state.renderGeometries);

  const distanceLabel =
    distance >= 1000
      ? `${(distance / 1000).toFixed(2)} km`
      : `${Math.floor(distance)} m`;
  const speedStepDistance = getSpeedStepDistance(controlMode);
  const remainingToNextSpeed =
    speedStepDistance - (distance % speedStepDistance || 0);

  return (
    <>
      <LivesBanner />
      <div className="absolute left-4 top-4 pointer-events-none">
        <div className="w-[min(19rem,calc(100vw-2rem))] rounded-lg border border-white/10 bg-black/45 p-4 text-white shadow-hud backdrop-blur-md">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
            Candy Run
          </div>
          <div className="mt-2 flex items-center gap-2">
            {invincibleMode ? (
              <div className="rounded bg-emerald-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                Test Modu
              </div>
            ) : null}
            {impactTimeLeft > 0 ? (
              <div className="rounded bg-red-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">
                Temas
              </div>
            ) : null}
          </div>
          <div className="mt-2 text-4xl font-black leading-none">
            {Math.floor(score)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-white/80">
            <div>
              <div className="text-white/45">Mesafe</div>
              <div className="mt-1 font-semibold text-white">{distanceLabel}</div>
            </div>
            <div>
              <div className="text-white/45">Hız</div>
              <div className="mt-1 font-semibold text-white">{speed.toFixed(2)}x</div>
            </div>
            <div>
              <div className="text-white/45">Süre</div>
              <div className="mt-1 font-semibold text-white">{formatTime(time)}s</div>
            </div>
            <div>
              <div className="text-white/45">Kaçış</div>
              <div className="mt-1 font-semibold text-white">{obstaclesAvoided}</div>
            </div>
            <div>
              <div className="text-white/45">Temas</div>
              <div className="mt-1 font-semibold text-red-300">{collisionCount}</div>
            </div>
            <div>
              <div className="text-white/45">Rekor</div>
              <div className="mt-1 font-semibold text-amber-300">{highScore}</div>
            </div>
            <div>
              <div className="text-white/45">Sonraki Hız</div>
              <div className="mt-1 font-semibold text-cyan-200">
                {Math.ceil(remainingToNextSpeed)} m
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3 text-sm">
            <div className="rounded bg-amber-300/12 px-3 py-2 text-amber-200">
              Coin <span className="ml-2 font-bold text-white">{coinsCollected}</span>
            </div>
            <div className="rounded bg-yellow-300/12 px-3 py-2 text-yellow-200">
              Star <span className="ml-2 font-bold text-white">{starsCollected}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">
              Şerit
            </div>
            <LaneIndicator />
          </div>
          {invincibleMode ? (
            <div className="mt-4 rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              <div className="mb-2 uppercase tracking-[0.18em] text-white/45">
                Render Debug
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-white/45">Mesh</div>
                  <div className="mt-1 font-semibold text-white">
                    {formatStat(renderMeshes)}
                  </div>
                </div>
                <div>
                  <div className="text-white/45">Triangles</div>
                  <div className="mt-1 font-semibold text-white">
                    {formatStat(renderTriangles)}
                  </div>
                </div>
                <div>
                  <div className="text-white/45">Geometries</div>
                  <div className="mt-1 font-semibold text-white">
                    {formatStat(renderGeometries)}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
