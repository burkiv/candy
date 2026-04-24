import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

export function GameLoop() {
  const spawnTimer = useRef(1.2);
  const collectibleTimer = useRef(0.85);
  const updateFrame = useGameStore((state) => state.updateFrame);
  const spawnRandomObstacle = useGameStore((state) => state.spawnRandomObstacle);
  const spawnRandomCollectible = useGameStore(
    (state) => state.spawnRandomCollectible,
  );
  const phase = useGameStore((state) => state.phase);

  useEffect(() => {
    if (phase !== 'PLAYING') {
      spawnTimer.current = 1.2;
      collectibleTimer.current = 0.85;
    }
  }, [phase]);

  useFrame((_, delta) => {
    const snapshot = useGameStore.getState();

    if (snapshot.phase !== 'PLAYING') {
      return;
    }

    const clampedDelta = Math.min(delta, 0.05);
    updateFrame(clampedDelta);
    spawnTimer.current -= clampedDelta;
    collectibleTimer.current -= clampedDelta;

    if (spawnTimer.current <= 0) {
      spawnRandomObstacle();

      const updated = useGameStore.getState();
      const baseInterval =
        updated.distance < 180
          ? 1.95
          : updated.distance < 420
            ? 1.58
            : 1.24;

      spawnTimer.current = baseInterval + Math.random() * 0.32;
    }

    if (collectibleTimer.current <= 0) {
      spawnRandomCollectible();

      const updated = useGameStore.getState();
      const baseInterval =
        updated.distance < 180
          ? 1.22
          : updated.distance < 420
            ? 0.98
            : 0.84;

      collectibleTimer.current = baseInterval + Math.random() * 0.4;
    }
  });

  return null;
}
