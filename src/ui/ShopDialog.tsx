import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  canPurchaseCatalogItem,
  getActiveMusicCatalogItems,
  getActiveWorldCatalogItems,
  isCatalogItemUnlocked,
} from '../progression/catalog';
import { useGameStore } from '../stores/gameStore';
import { worldDefinitions } from '../worlds';

function formatPriceLabel(cost: number, currency: 'COIN' | 'STAR') {
  if (cost <= 0) {
    return 'Ucretsiz';
  }

  return `${cost} ${currency === 'COIN' ? 'Coin' : 'Star'}`;
}

function WalletChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className={`mt-2 text-2xl font-black ${tone}`}>
        {value.toLocaleString('tr-TR')}
      </div>
    </div>
  );
}

export function ShopDialog({
  buttonLabel = 'Magaza / Koleksiyon',
  buttonClassName = '',
}: {
  buttonLabel?: string;
  buttonClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedWorld = useGameStore((state) => state.selectedWorld);
  const progression = useGameStore((state) => state.progression);
  const purchaseCatalogItem = useGameStore((state) => state.purchaseCatalogItem);
  const setSelectedWorld = useGameStore((state) => state.setSelectedWorld);
  const selectMusicVariant = useGameStore((state) => state.selectMusicVariant);

  const worldItems = getActiveWorldCatalogItems();
  const musicItems = getActiveMusicCatalogItems();
  const hasMusicItems = musicItems.length > 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      if (key === 'escape' && !event.repeat) {
        event.preventDefault();
        setIsOpen(false);
      }

      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  const dialog =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/62 p-4 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/12 bg-slate-950/95 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                    Koleksiyon
                  </div>
                  <div className="mt-2 text-2xl font-black text-white sm:text-3xl">
                    Coin ve Star Bakiyesi
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/82 transition hover:bg-white/10"
                >
                  Kapat
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <WalletChip
                  label="Coin"
                  value={progression.wallet.coins}
                  tone="text-amber-200"
                />
                <WalletChip
                  label="Star"
                  value={progression.wallet.stars}
                  tone="text-cyan-200"
                />
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                  Haritalar
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {worldItems.map((item) => {
                    const world = worldDefinitions[item.worldId];
                    const unlocked = isCatalogItemUnlocked(progression, item);
                    const canPurchase = canPurchaseCatalogItem(progression, item);
                    const isSelected = selectedWorld === item.worldId;

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/10 bg-white/6 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                              {world.menu.kicker}
                            </div>
                            <div className="mt-2 text-xl font-black text-white">
                              {item.label}
                            </div>
                          </div>
                          <div
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                              unlocked
                                ? 'bg-emerald-300/20 text-emerald-100'
                                : 'bg-white/10 text-white/78'
                            }`}
                          >
                            {unlocked ? 'Acik' : formatPriceLabel(item.cost, item.currency)}
                          </div>
                        </div>

                        <div className="mt-3 text-sm leading-6 text-white/72">
                          {item.description}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            unlocked
                              ? setSelectedWorld(item.worldId)
                              : purchaseCatalogItem(item.id)
                          }
                          disabled={unlocked ? isSelected : !canPurchase}
                          className={`mt-4 w-full rounded-lg border px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${
                            unlocked
                              ? isSelected
                                ? 'cursor-default border-cyan-300/25 bg-cyan-300/15 text-cyan-100'
                                : 'border-white/15 bg-white/8 text-white hover:bg-white/12'
                              : canPurchase
                                ? 'border-amber-300/30 bg-amber-300/12 text-amber-100 hover:bg-amber-300/18'
                                : 'cursor-not-allowed border-white/10 bg-white/5 text-white/40'
                          }`}
                        >
                          {unlocked
                            ? isSelected
                              ? 'Secili'
                              : 'Sec'
                            : `Kilidi Ac (${formatPriceLabel(item.cost, item.currency)})`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {hasMusicItems ? (
                <div className="mt-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                    Muzik
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {musicItems.map((item) => {
                      const unlocked = isCatalogItemUnlocked(progression, item);
                      const canPurchase = canPurchaseCatalogItem(progression, item);
                      const isSelected =
                        progression.selectedMusicVariantByWorld[item.worldId] ===
                        item.musicVariantId;

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-white/10 bg-white/6 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                                {worldDefinitions[item.worldId].menu.label}
                              </div>
                              <div className="mt-2 text-xl font-black text-white">
                                {item.label}
                              </div>
                            </div>
                            <div
                              className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                                unlocked
                                  ? 'bg-emerald-300/20 text-emerald-100'
                                  : 'bg-white/10 text-white/78'
                              }`}
                            >
                              {unlocked
                                ? 'Acildi'
                                : formatPriceLabel(item.cost, item.currency)}
                            </div>
                          </div>

                          <div className="mt-3 text-sm leading-6 text-white/72">
                            {item.description}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              unlocked
                                ? selectMusicVariant(item.worldId, item.musicVariantId)
                                : purchaseCatalogItem(item.id)
                            }
                            disabled={unlocked ? isSelected : !canPurchase}
                            className={`mt-4 w-full rounded-lg border px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${
                              unlocked
                                ? isSelected
                                  ? 'cursor-default border-cyan-300/25 bg-cyan-300/15 text-cyan-100'
                                  : 'border-white/15 bg-white/8 text-white hover:bg-white/12'
                                : canPurchase
                                  ? 'border-amber-300/30 bg-amber-300/12 text-amber-100 hover:bg-amber-300/18'
                                  : 'cursor-not-allowed border-white/10 bg-white/5 text-white/40'
                            }`}
                          >
                            {unlocked
                              ? isSelected
                                ? 'Kullaniyor'
                                : 'Kullan'
                              : `Kilidi Ac (${formatPriceLabel(item.cost, item.currency)})`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-white/68">
                  Yeni muzik paketleri ve ozel unlocklar eklendikce burada gorunecek.
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
      >
        {buttonLabel}
      </button>
      {dialog}
    </>
  );
}
