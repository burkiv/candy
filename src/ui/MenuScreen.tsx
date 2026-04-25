import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { worldDefinitions, worldOrder } from '../worlds';
import { AudioSettingsDialog } from './AudioSettingsDialog';
import { LeaderboardPanel } from './LeaderboardPanel';

export function MenuScreen() {
  const highScore = useGameStore((state) => state.highScore);
  const playerName = useGameStore((state) => state.playerName);
  const selectedWorld = useGameStore((state) => state.selectedWorld);
  const setSelectedWorld = useGameStore((state) => state.setSelectedWorld);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const loadLeaderboard = useGameStore((state) => state.loadLeaderboard);
  const startKeyboardRun = useGameStore((state) => state.startKeyboardRun);
  const startCalibration = useGameStore((state) => state.startCalibration);
  const [draftName, setDraftName] = useState(playerName);
  const [isEditingName, setIsEditingName] = useState(playerName.length === 0);
  const canStart = Boolean(playerName || draftName.trim());

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    setDraftName(playerName);
    if (!playerName) {
      setIsEditingName(true);
    }
  }, [playerName]);

  function commitPlayerName() {
    const trimmed = draftName.trim();
    if (!trimmed) {
      return false;
    }

    setPlayerName(trimmed);
    setIsEditingName(false);
    return true;
  }

  function ensurePlayerName() {
    if (playerName && !isEditingName) {
      return true;
    }

    return commitPlayerName();
  }

  function handleKeyboardStart() {
    if (!ensurePlayerName()) {
      return;
    }

    startKeyboardRun();
  }

  function handleCameraStart() {
    if (!ensurePlayerName()) {
      return;
    }

    startCalibration();
  }

  return (
    <div className="absolute inset-0 overflow-y-auto px-4 py-4 sm:py-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-lg border border-white/10 bg-black/28 p-6 shadow-hud backdrop-blur-md sm:p-8">
            <div className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">
              Tunnel Runner
            </div>
            <h1 className="mt-3 text-4xl font-black leading-none sm:text-6xl">
              Candy Run
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
              Uc seritli kosuyu klavye ile hemen baslatabilir ya da kamera ile
              rehberli kalibrasyona girebilirsin. Haritayi menuden sec, sonra
              ayni oyun akisini farkli dunyalarda oyna.
            </p>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                Harita Secimi
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {worldOrder.map((worldId) => {
                  const world = worldDefinitions[worldId];
                  const isActive = selectedWorld === worldId;

                  return (
                    <button
                      key={worldId}
                      type="button"
                      onClick={() => setSelectedWorld(worldId)}
                      aria-pressed={isActive}
                      className={`rounded-xl border px-4 py-4 text-left transition ${
                        isActive
                          ? 'border-white/40 shadow-[0_0_0_1px_rgba(255,255,255,0.16)_inset]'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${world.menu.gradient[0]}, ${world.menu.gradient[1]})`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                          {world.menu.kicker}
                        </div>
                        {isActive ? (
                          <div
                            className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950"
                            style={{ backgroundColor: world.menu.accentColor }}
                          >
                            Secili
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-3 text-xl font-black leading-none text-white">
                        {world.menu.label}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-white/80">
                        {world.menu.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                Oyuncu Adi
              </div>
              {isEditingName ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  <input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    maxLength={24}
                    placeholder="Adini yaz"
                    className="min-w-[14rem] flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/40"
                  />
                  <button
                    type="button"
                    onClick={commitPlayerName}
                    className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-white/15"
                  >
                    Kaydet
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="rounded-lg bg-cyan-300/12 px-4 py-3 text-sm text-cyan-100">
                    Oyuncu: <span className="font-bold text-white">{playerName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                  >
                    Degistir
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleKeyboardStart}
                disabled={!canStart}
                className="rounded-lg border border-cyan-300/30 bg-cyan-300 px-5 py-4 text-left text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                onClick={handleCameraStart}
                disabled={!canStart}
                className="rounded-lg border border-white/15 bg-white/5 px-5 py-4 text-left text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                  Kamera
                </div>
                <div className="mt-2 text-xl font-black leading-none">
                  Rehberli Kalibrasyon
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

          <div className="space-y-4">
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
                  <span className="font-semibold text-cyan-200">3 adimli senkron</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Harita</span>
                  <span className="font-semibold text-cyan-200">
                    {worldDefinitions[selectedWorld].menu.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Duraklat</span>
                  <span className="font-semibold text-cyan-200">Esc</span>
                </div>
              </div>
              <div className="mt-8 rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                En iyi skor: <span className="font-bold text-amber-300">{highScore}</span>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/28 p-6 shadow-hud backdrop-blur-md">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                Ayarlar
              </div>
              <div className="mt-3 text-sm leading-6 text-white/72">
                Ses seviyelerini ekrani kalabaliklastirmadan acilir pencereden ayarla.
              </div>
              <AudioSettingsDialog
                buttonLabel="Ses Ayarlari"
                subtitle="Ana menuden muzik, ambiyans ve efekt seviyelerini rahatca duzenleyebilirsin."
                buttonClassName="mt-5 w-full rounded-lg border border-white/15 bg-white/8 px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/12"
              />
            </div>

            <LeaderboardPanel title="Liderlik Tablosu" limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
}
