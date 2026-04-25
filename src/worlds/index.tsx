import { useGameStore } from '../stores/gameStore';
import type { WorldId } from '../types';
import { candyWorld } from './candy';
import { oceanWorld } from './ocean';
import type { WorldDefinition } from './types';

export const worldDefinitions: Record<WorldId, WorldDefinition> = {
  CANDY: candyWorld,
  OCEAN: oceanWorld,
};

export const worldOrder: WorldId[] = ['CANDY', 'OCEAN'];

export function getWorldDefinition(worldId: WorldId) {
  return worldDefinitions[worldId];
}

export function useWorldDefinition() {
  const selectedWorld = useGameStore((state) => state.selectedWorld);
  return getWorldDefinition(selectedWorld);
}
