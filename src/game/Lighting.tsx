import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { PointLight } from 'three';
import { useGameStore } from '../stores/gameStore';
import { LANE_POSITIONS, PLAYER_Z } from '../utils/constants';

function PlayerFollowLight() {
  const keyLightRef = useRef<PointLight | null>(null);

  useFrame(() => {
    const { currentLane, playerY } = useGameStore.getState();
    const laneX = LANE_POSITIONS[currentLane];

    if (keyLightRef.current) {
      keyLightRef.current.position.x = laneX;
      keyLightRef.current.position.y = playerY + 1.45;
      keyLightRef.current.position.z = PLAYER_Z + 2.4;
    }
  });

  return (
    <pointLight
      ref={keyLightRef}
      color="#ffe2bd"
      intensity={16}
      distance={14}
      decay={2}
    />
  );
}

export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.62} color="#ffe7f6" />
      <hemisphereLight
        args={['#ffd8ef', '#6a4b7f', 0.92]}
        position={[0, 10, 0]}
      />
      <directionalLight
        position={[2, 8, 10]}
        intensity={0.95}
        color="#fff0d3"
      />
      <pointLight position={[0, 3.2, 3]} color="#ffd9b0" intensity={10} distance={16} />
      <pointLight position={[-5, 2.8, -24]} color="#ff9dcf" intensity={5.5} distance={16} />
      <pointLight position={[5, 2.8, -48]} color="#87e6ff" intensity={5.5} distance={16} />
      <pointLight position={[0, 3.1, -72]} color="#ffd9b0" intensity={5.5} distance={16} />
      <PlayerFollowLight />
    </>
  );
}
