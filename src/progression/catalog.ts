import type {
  CatalogItem,
  CurrencyType,
  MusicVariantUnlockCatalogItem,
  ProgressionState,
  WalletState,
  WorldId,
  WorldUnlockCatalogItem,
} from '../types';
import { WORLD_IDS } from '../types';

const catalogItems: CatalogItem[] = [
  {
    id: 'world-candy',
    type: 'WORLD_UNLOCK',
    label: 'Candy World',
    description: 'Neon seker tuneli ve tatli engeller.',
    currency: 'STAR',
    cost: 0,
    defaultUnlocked: true,
    active: true,
    worldId: 'CANDY',
  },
  {
    id: 'world-ocean',
    type: 'WORLD_UNLOCK',
    label: 'Ocean World',
    description: 'Cam tunel, mercan bahceleri ve sualti atmosferi.',
    currency: 'STAR',
    cost: 0,
    defaultUnlocked: true,
    active: true,
    worldId: 'OCEAN',
  },
];

function normalizeCount(value: unknown) {
  return Math.max(0, Math.floor(Number(value ?? 0) || 0));
}

function normalizeCurrencyAmount(currency: CurrencyType, wallet: WalletState) {
  return currency === 'COIN' ? wallet.coins : wallet.stars;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function isWorldId(value: unknown): value is WorldId {
  return typeof value === 'string' && WORLD_IDS.includes(value as WorldId);
}

export function createMusicVariantUnlockId(worldId: WorldId, musicVariantId: string) {
  return `${worldId}:${musicVariantId.trim()}`;
}

export function getCatalogItems() {
  return catalogItems;
}

export function getCatalogItemById(itemId: string) {
  return catalogItems.find((item) => item.id === itemId);
}

export function getWorldCatalogItem(worldId: WorldId) {
  return catalogItems.find(
    (item): item is WorldUnlockCatalogItem =>
      item.type === 'WORLD_UNLOCK' && item.worldId === worldId,
  );
}

export function getActiveWorldCatalogItems() {
  return catalogItems.filter(
    (item): item is WorldUnlockCatalogItem =>
      item.type === 'WORLD_UNLOCK' && item.active,
  );
}

export function getActiveMusicCatalogItems() {
  return catalogItems.filter(
    (item): item is MusicVariantUnlockCatalogItem =>
      item.type === 'MUSIC_VARIANT_UNLOCK' && item.active,
  );
}

export function createDefaultProgressionState(): ProgressionState {
  return {
    wallet: {
      coins: 0,
      stars: 0,
    },
    unlockedWorldIds: uniqueStrings(
      catalogItems
        .filter(
          (item): item is WorldUnlockCatalogItem =>
            item.type === 'WORLD_UNLOCK' && item.defaultUnlocked,
        )
        .map((item) => item.worldId),
    ) as WorldId[],
    unlockedMusicVariantIds: uniqueStrings(
      catalogItems
        .filter(
          (item): item is MusicVariantUnlockCatalogItem =>
            item.type === 'MUSIC_VARIANT_UNLOCK' && item.defaultUnlocked,
        )
        .map((item) => createMusicVariantUnlockId(item.worldId, item.musicVariantId)),
    ),
    selectedMusicVariantByWorld: {},
  };
}

export function normalizeProgressionState(
  input?: Partial<ProgressionState> | null,
): ProgressionState {
  const defaults = createDefaultProgressionState();
  const selectionEntries = Object.entries(input?.selectedMusicVariantByWorld ?? {}).filter(
    ([worldId, musicVariantId]) =>
      isWorldId(worldId) &&
      typeof musicVariantId === 'string' &&
      musicVariantId.trim().length > 0,
  ) as Array<[WorldId, string]>;

  return {
    wallet: {
      coins: normalizeCount(input?.wallet?.coins),
      stars: normalizeCount(input?.wallet?.stars),
    },
    unlockedWorldIds: uniqueStrings([
      ...defaults.unlockedWorldIds,
      ...((input?.unlockedWorldIds ?? []).filter(isWorldId) as WorldId[]),
    ]) as WorldId[],
    unlockedMusicVariantIds: uniqueStrings([
      ...defaults.unlockedMusicVariantIds,
      ...(input?.unlockedMusicVariantIds ?? []).filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      ),
    ]),
    selectedMusicVariantByWorld: Object.fromEntries(
      selectionEntries.map(([worldId, musicVariantId]) => [worldId, musicVariantId.trim()]),
    ) as Partial<Record<WorldId, string>>,
  };
}

export function addWalletRewards(
  progression: ProgressionState,
  rewards: { coins?: number; stars?: number },
) {
  const nextCoins = normalizeCount(progression.wallet.coins + (rewards.coins ?? 0));
  const nextStars = normalizeCount(progression.wallet.stars + (rewards.stars ?? 0));

  if (
    nextCoins === progression.wallet.coins &&
    nextStars === progression.wallet.stars
  ) {
    return progression;
  }

  return {
    ...progression,
    wallet: {
      coins: nextCoins,
      stars: nextStars,
    },
  };
}

export function isWorldUnlocked(progression: ProgressionState, worldId: WorldId) {
  return progression.unlockedWorldIds.includes(worldId);
}

export function isMusicVariantUnlocked(
  progression: ProgressionState,
  worldId: WorldId,
  musicVariantId: string,
) {
  return progression.unlockedMusicVariantIds.includes(
    createMusicVariantUnlockId(worldId, musicVariantId),
  );
}

export function isCatalogItemUnlocked(
  progression: ProgressionState,
  item: CatalogItem,
) {
  if (item.defaultUnlocked) {
    return true;
  }

  if (item.type === 'WORLD_UNLOCK') {
    return isWorldUnlocked(progression, item.worldId);
  }

  return isMusicVariantUnlocked(progression, item.worldId, item.musicVariantId);
}

export function canPurchaseCatalogItem(
  progression: ProgressionState,
  item: CatalogItem,
) {
  if (!item.active || isCatalogItemUnlocked(progression, item)) {
    return false;
  }

  return normalizeCurrencyAmount(item.currency, progression.wallet) >= item.cost;
}

export function purchaseCatalogItemInProgression(
  progression: ProgressionState,
  item: CatalogItem,
) {
  if (!item.active) {
    return null;
  }

  if (isCatalogItemUnlocked(progression, item)) {
    return progression;
  }

  if (!canPurchaseCatalogItem(progression, item)) {
    return null;
  }

  const wallet =
    item.currency === 'COIN'
      ? {
          ...progression.wallet,
          coins: progression.wallet.coins - item.cost,
        }
      : {
          ...progression.wallet,
          stars: progression.wallet.stars - item.cost,
        };

  if (item.type === 'WORLD_UNLOCK') {
    return {
      ...progression,
      wallet,
      unlockedWorldIds: uniqueStrings([
        ...progression.unlockedWorldIds,
        item.worldId,
      ]) as WorldId[],
    };
  }

  return {
    ...progression,
    wallet,
    unlockedMusicVariantIds: uniqueStrings([
      ...progression.unlockedMusicVariantIds,
      createMusicVariantUnlockId(item.worldId, item.musicVariantId),
    ]),
  };
}
