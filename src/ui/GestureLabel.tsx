import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';

const labels: Record<string, string> = {
  LEFT: 'SOL',
  RIGHT: 'SAG',
  SQUAT: 'EGIL',
  JUMP: 'ZIPLA',
};

export function GestureLabel() {
  const phase = useGameStore((state) => state.phase);
  const gesture = useGameStore((state) => state.gesture);
  const impactTimeLeft = useGameStore((state) => state.impactTimeLeft);

  if (phase !== 'PLAYING') {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[18vh] flex justify-center">
      <AnimatePresence mode="wait">
        {impactTimeLeft > 0 ? (
          <motion.div
            key="impact"
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.92 }}
            transition={{ duration: 0.16 }}
            className="rounded-lg border border-red-300/40 bg-red-950/35 px-5 py-3 text-2xl font-black tracking-[0.12em] text-red-300 shadow-hud backdrop-blur-sm"
          >
            TEMAS
          </motion.div>
        ) : null}
        {gesture ? (
          <motion.div
            key={gesture}
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="rounded-lg border border-amber-300/40 bg-black/28 px-5 py-3 text-2xl font-black tracking-[0.12em] text-amber-300 shadow-hud backdrop-blur-sm"
          >
            {labels[gesture] ?? gesture}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
