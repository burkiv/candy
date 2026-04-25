import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { PointLight } from 'three';
import { useGameStore } from '../../stores/gameStore';
import { LANE_POSITIONS, PLAYER_Z } from '../../utils/constants';

function PlayerFollowLight() {
  const keyLightRef = useRef<PointLight | null>(null);

  useFrame(() => {
    const { currentLane, playerY } = useGameStore.getState();
    const laneX = LANE_POSITIONS[currentLane];

    if (keyLightRef.current) {
      keyLightRef.current.position.x = laneX;
      keyLightRef.current.position.y = playerY + 1.2;
      keyLightRef.current.position.z = PLAYER_Z + 2.2;
    }
  });

  return (
    <pointLight
      ref={keyLightRef}
      color="#72ffe1"
      intensity={10}
      distance={18}
      decay={2}
    />
  );
}

export function OceanLighting() {
  return (
    <>
      <ambientLight intensity={0.2} color="#1a5276" />
      <hemisphereLight args={['#49d8d2', '#041925', 0.62]} position={[0, 12, 0]} />
      <directionalLight position={[3, 7, 8]} intensity={0.28} color="#8beeff" />
      <pointLight position={[0, 3.4, 2]} color="#00FFAA" intensity={6} distance={18} />
      <pointLight position={[-6, 2.6, -22]} color="#00FFAA" intensity={4.8} distance={18} />
      <pointLight position={[6, 3.4, -44]} color="#00FFAA" intensity={4.8} distance={18} />
      <pointLight position={[0, 4.4, -68]} color="#00FFAA" intensity={5.2} distance={18} />
      <PlayerFollowLight />
    </>
  );
}
