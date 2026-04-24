import { useEffect } from 'react';
import { Scene } from './game/Scene';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useGameStore } from './stores/gameStore';
import { CalibrationScreen } from './ui/CalibrationScreen';
import { CameraFeed } from './ui/CameraFeed';
import { CountdownScreen } from './ui/CountdownScreen';
import { GameOverScreen } from './ui/GameOverScreen';
import { GestureLabel } from './ui/GestureLabel';
import { HUD } from './ui/HUD';
import { MenuScreen } from './ui/MenuScreen';
import { PauseScreen } from './ui/PauseScreen';

function PhaseFlow() {
  const phase = useGameStore((state) => state.phase);
  const setCountdown = useGameStore((state) => state.setCountdown);
  const startRun = useGameStore((state) => state.startRun);

  useEffect(() => {
    if (phase !== 'COUNTDOWN') {
      return;
    }

    let remaining = 3;
    setCountdown(remaining);

    const intervalId = window.setInterval(() => {
      remaining = Math.max(remaining - 1, 0);
      setCountdown(remaining);
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      startRun();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [phase, setCountdown, startRun]);

  return null;
}

function Overlay() {
  const phase = useGameStore((state) => state.phase);
  const controlMode = useGameStore((state) => state.controlMode);
  const showCamera = controlMode === 'CAMERA' && phase !== 'MENU';

  return (
    <div className="absolute inset-0">
      {phase === 'PLAYING' || phase === 'PAUSED' ? <HUD /> : null}
      {showCamera ? (
        <div
          className={
            phase === 'CALIBRATION'
              ? 'absolute inset-0 z-10'
              : 'absolute right-4 top-4 z-20'
          }
        >
          <CameraFeed
            fullscreen={phase === 'CALIBRATION'}
            className={
              phase === 'CALIBRATION'
                ? 'h-full w-full'
                : 'w-44 aspect-[4/3] sm:w-52'
            }
          />
        </div>
      ) : null}
      <GestureLabel />
      {phase === 'MENU' ? <MenuScreen /> : null}
      {phase === 'CALIBRATION' ? <CalibrationScreen /> : null}
      {phase === 'COUNTDOWN' ? <CountdownScreen /> : null}
      {phase === 'PAUSED' ? <PauseScreen /> : null}
      {phase === 'GAME_OVER' ? <GameOverScreen /> : null}
    </div>
  );
}

export default function App() {
  useKeyboardControls();

  return (
    <main className="relative h-screen overflow-hidden bg-tunnel-950 text-white">
      <PhaseFlow />
      <Scene />
      <Overlay />
    </main>
  );
}
