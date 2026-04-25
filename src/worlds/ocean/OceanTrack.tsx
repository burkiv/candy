import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';
import {
  BASE_WORLD_SPEED,
  LANE_POSITIONS,
  PLAYER_Z,
  PREVIEW_WORLD_SPEED,
  TRACK_SEGMENT_COUNT,
  TRACK_SEGMENT_LENGTH,
} from '../../utils/constants';

export function OceanTrack() {
  const segments = useRef<Array<THREE.Group | null>>([]);
  const phase = useGameStore((state) => state.phase);
  const speed = useGameStore((state) => state.speed);

  useFrame((_, delta) => {
    const scrollSpeed =
      (phase === 'PLAYING' ? BASE_WORLD_SPEED * speed : PREVIEW_WORLD_SPEED) *
      delta;
    const totalLength = TRACK_SEGMENT_COUNT * TRACK_SEGMENT_LENGTH;

    segments.current.forEach((segment) => {
      if (!segment) {
        return;
      }

      segment.position.z += scrollSpeed;

      if (segment.position.z > PLAYER_Z + TRACK_SEGMENT_LENGTH) {
        segment.position.z -= totalLength;
      }
    });
  });

  return (
    <group>
      {Array.from({ length: TRACK_SEGMENT_COUNT }).map((_, index) => (
        <group
          key={index}
          position={[0, 0, -index * TRACK_SEGMENT_LENGTH]}
          ref={(node) => {
            segments.current[index] = node;
          }}
        >
          {([-1, 0, 1] as const).map((lane) => (
            <mesh
              key={lane}
              position={[LANE_POSITIONS[lane], 0.05, 0]}
              rotation={[-0.01, 0, 0]}
            >
              <boxGeometry args={[1.42, 0.035, TRACK_SEGMENT_LENGTH - 0.24]} />
              <meshStandardMaterial
                color="#8deaff"
                emissive="#00c7c0"
                emissiveIntensity={0.34}
                roughness={0.36}
                metalness={0.08}
                transparent
                opacity={0.72}
              />
            </mesh>
          ))}
          {([-4.4, 4.4] as const).map((x) => (
            <mesh key={x} position={[x, 0.08, 0]}>
              <boxGeometry args={[0.08, 0.08, TRACK_SEGMENT_LENGTH - 0.2]} />
              <meshStandardMaterial
                color="#c8ffff"
                emissive="#64fff1"
                emissiveIntensity={0.24}
                roughness={0.22}
                transparent
                opacity={0.68}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
