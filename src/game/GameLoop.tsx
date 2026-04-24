import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

export function GameLoop() {
  const spawnTimer = useRef(1.3);
  const updateFrame = useGameStore((state) => state.updateFrame);
  const spawnRandomObstacle = useGameStore((state) => state.spawnRandomObstacle);
  const phase = useGameStore((state) => state.phase);

  useEffect(() => {
    if (phase !== 'PLAYING') {
      spawnTimer.current = 1.3;
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

    if (spawnTimer.current <= 0) {
      spawnRandomObstacle();

      const updated = useGameStore.getState();
      const baseInterval =
        updated.distance < 180
          ? 2.12
          : updated.distance < 420
            ? 1.78
            : 1.42;

      spawnTimer.current = baseInterval + Math.random() * 0.36;
    }
  });

  return null;
}
