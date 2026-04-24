import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';
import { LANE_POSITIONS, PLAYER_Z } from '../utils/constants';

export function PlayerCamera() {
  const camera = useThree((state) => state.camera);
  const currentLane = useGameStore((state) => state.currentLane);
  const playerY = useGameStore((state) => state.playerY);

  useFrame(() => {
    const targetX = LANE_POSITIONS[currentLane];
    const targetY = playerY;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.12);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.16);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, PLAYER_Z, 0.12);
    camera.lookAt(camera.position.x, camera.position.y - 0.1, PLAYER_Z - 18);
  });

  return null;
}
