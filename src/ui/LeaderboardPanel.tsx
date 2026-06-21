import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { ControlMode } from '../types';
import { worldDefinitions } from '../worlds';

interface LeaderboardPanelProps {
  title?: string;
  className?: string;
  limit?: number;
}

function formatDateLabel(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return '--';
  }

  return new Date(parsed).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function LeaderboardPanel({
  title = 'Liderlik Tablosu',
  className = '',
  limit = 20,
}: LeaderboardPanelProps) {
  const leaderboard = useGameStore((state) => state.leaderboard);
  const leaderboardStatus = useGameStore((state) => state.leaderboardStatus);
  const playerName = useGameStore((state) => state.playerName);
  const selectedWorld = useGameStore((state) => state.selectedWorld);
  const currentControlMode = useGameStore((state) => state.controlMode);
  const loadLeaderboard = useGameStore((state) => state.loadLeaderboard);
  const [activeControlMode, setActiveControlMode] = useState<ControlMode>(
    currentControlMode ?? 'CAMERA',
  );
  const visibleLimit = Math.max(1, Math.floor(limit));
  const visibleEntries = leaderboard.slice(0, visibleLimit);
  const worldLabel = worldDefinitions[selectedWorld].menu.label;

  useEffect(() => {
    if (currentControlMode) {
      setActiveControlMode(currentControlMode);
    }
  }, [currentControlMode]);

  useEffect(() => {
    void loadLeaderboard(selectedWorld, activeControlMode);
  }, [activeControlMode, loadLeaderboard, selectedWorld]);

  return (
    <div
      className={`rounded-lg border border-white/10 bg-black/28 p-5 shadow-hud backdrop-blur-md ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">
            {title}
          </div>
          <div className="mt-1 text-xs font-semibold text-cyan-200/75">
            {worldLabel}
          </div>
        </div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/75">
          Ilk {visibleLimit}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/20 p-1">
        {(['CAMERA', 'KEYBOARD'] as const).map((mode) => {
          const isActive = activeControlMode === mode;

          return (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveControlMode(mode)}
              aria-pressed={isActive}
              className={`rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                isActive
                  ? 'bg-cyan-300 text-slate-950'
                  : 'text-white/60 hover:bg-white/8 hover:text-white'
              }`}
            >
              {mode === 'CAMERA' ? 'Kamera' : 'Klavye'}
            </button>
          );
        })}
      </div>

      {leaderboardStatus === 'loading' && leaderboard.length === 0 ? (
        <div className="mt-5 text-sm text-white/65">Skorlar yukleniyor...</div>
      ) : null}

      {leaderboardStatus !== 'loading' && leaderboard.length === 0 ? (
        <div className="mt-5 text-sm text-white/65">Henuz skor yok.</div>
      ) : null}

      {visibleEntries.length > 0 ? (
        <div className="mt-4 space-y-2">
          {visibleEntries.map((entry, index) => {
            const isOwnEntry = playerName.length > 0 && entry.name === playerName;

            return (
              <div
                key={`${entry.name}-${entry.score}-${entry.date}-${index}`}
                className={`grid grid-cols-[2.2rem_minmax(0,1fr)_5.5rem_3.5rem] items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isOwnEntry
                    ? 'bg-cyan-300/14 text-white ring-1 ring-cyan-300/30'
                    : 'bg-white/5 text-white/82'
                }`}
              >
                <div className="font-semibold text-white/55">{index + 1}</div>
                <div className="truncate font-semibold">{entry.name}</div>
                <div className="text-right font-black text-amber-200">
                  {entry.score.toLocaleString('tr-TR')}
                </div>
                <div className="text-right text-xs text-white/45">
                  {formatDateLabel(entry.date)}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
