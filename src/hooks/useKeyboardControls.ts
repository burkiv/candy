import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

const KEYBOARD_SQUAT_MIN_MS = 260;

export function useKeyboardControls() {
  const squatStartedAtRef = useRef(0);
  const squatReleaseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function clearPendingSquatRelease() {
      if (squatReleaseTimeoutRef.current !== null) {
        window.clearTimeout(squatReleaseTimeoutRef.current);
        squatReleaseTimeoutRef.current = null;
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      const {
        phase,
        startCalibration,
        beginCountdown,
        changeLane,
        pauseRun,
        resumeRun,
        returnToMenu,
        setManualSquatting,
        triggerJump,
        toggleInvincibleMode,
      } = useGameStore.getState();
      const key = event.key.toLowerCase();

      if (key === 'escape' && !event.repeat) {
        event.preventDefault();

        if (phase === 'PLAYING') {
          pauseRun();
          return;
        }

        if (phase === 'PAUSED') {
          resumeRun();
          return;
        }

        if (phase === 'CALIBRATION' || phase === 'COUNTDOWN' || phase === 'GAME_OVER') {
          returnToMenu();
          return;
        }
      }

      if (phase === 'MENU' && event.key === 'Enter') {
        startCalibration();
        return;
      }

      if (phase === 'GAME_OVER' && event.key === 'Enter') {
        startCalibration();
        return;
      }

      if (phase === 'CALIBRATION' && event.key === 'Enter') {
        beginCountdown();
        return;
      }

      if (phase === 'PAUSED' && key === 'm' && !event.repeat) {
        event.preventDefault();
        returnToMenu();
        return;
      }

      if (phase !== 'PLAYING') {
        return;
      }

      if (key === 'i' && !event.repeat) {
        event.preventDefault();
        toggleInvincibleMode();
        return;
      }

      if ((key === 'arrowleft' || key === 'a') && !event.repeat) {
        event.preventDefault();
        changeLane('LEFT');
      }

      if ((key === 'arrowright' || key === 'd') && !event.repeat) {
        event.preventDefault();
        changeLane('RIGHT');
      }

      if (key === 'arrowdown' || key === 's') {
        event.preventDefault();
        clearPendingSquatRelease();

        if (squatStartedAtRef.current === 0) {
          squatStartedAtRef.current = performance.now();
        }

        setManualSquatting(true);
      }

      if ((key === 'arrowup' || key === 'w' || key === ' ') && !event.repeat) {
        event.preventDefault();
        triggerJump();
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      const { phase, setManualSquatting } = useGameStore.getState();

      if (phase !== 'PLAYING') {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 'arrowdown' || key === 's') {
        event.preventDefault();
        const elapsed = performance.now() - squatStartedAtRef.current;
        const remaining = Math.max(0, KEYBOARD_SQUAT_MIN_MS - elapsed);

        clearPendingSquatRelease();

        if (remaining === 0) {
          squatStartedAtRef.current = 0;
          setManualSquatting(false);
          return;
        }

        squatReleaseTimeoutRef.current = window.setTimeout(() => {
          squatStartedAtRef.current = 0;
          setManualSquatting(false);
          squatReleaseTimeoutRef.current = null;
        }, remaining);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      clearPendingSquatRelease();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
}
