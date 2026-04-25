import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSpawnSettings } from '../utils/constants';

const FIXED_TIME_STEP_SECONDS = 1 / 30;
const MAX_FRAME_DELTA_SECONDS = 0.2;
const MAX_SIMULATION_STEPS_PER_FRAME = 5;

export function GameLoop() {
  const spawnTimer = useRef(1.3);
  const accumulator = useRef(0);
  const updateFrame = useGameStore((state) => state.updateFrame);
  const spawnRandomObstacle = useGameStore((state) => state.spawnRandomObstacle);
  const phase = useGameStore((state) => state.phase);

  useEffect(() => {
    if (phase !== 'PLAYING') {
      spawnTimer.current = 1.3;
      accumulator.current = 0;
    }
  }, [phase]);

  useFrame((_, delta) => {
    const snapshot = useGameStore.getState();

    if (snapshot.phase !== 'PLAYING') {
      accumulator.current = 0;
      return;
    }

    accumulator.current += Math.min(delta, MAX_FRAME_DELTA_SECONDS);

    let steps = 0;

    while (
      accumulator.current >= FIXED_TIME_STEP_SECONDS &&
      steps < MAX_SIMULATION_STEPS_PER_FRAME
    ) {
      updateFrame(FIXED_TIME_STEP_SECONDS);
      spawnTimer.current -= FIXED_TIME_STEP_SECONDS;

      if (spawnTimer.current <= 0) {
        spawnRandomObstacle();

        const updated = useGameStore.getState();
        const spawnSettings = getSpawnSettings(updated.controlMode, updated.distance);
        spawnTimer.current =
          spawnSettings.spawnInterval + Math.random() * spawnSettings.spawnVariance;
      }

      accumulator.current -= FIXED_TIME_STEP_SECONDS;
      steps += 1;
    }

    if (steps === MAX_SIMULATION_STEPS_PER_FRAME) {
      accumulator.current = Math.min(accumulator.current, FIXED_TIME_STEP_SECONDS);
    }
  });

  return null;
}
