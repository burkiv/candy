import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';
import {
  BASE_WORLD_SPEED,
  LANE_POSITIONS,
  PLAYER_Z,
  PREVIEW_WORLD_SPEED,
  TRACK_SEGMENT_COUNT,
  TRACK_SEGMENT_LENGTH,
} from '../utils/constants';

const railOffsets = [-0.46, 0.46] as const;

export function Rails() {
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
    <group position={[0, 0, 0]}>
      {Array.from({ length: TRACK_SEGMENT_COUNT }).map((_, index) => (
        <group
          key={index}
          position={[0, 0, -index * TRACK_SEGMENT_LENGTH]}
          ref={(node) => {
            segments.current[index] = node;
          }}
        >
          <mesh position={[0, -0.03, 0]} receiveShadow>
            <boxGeometry args={[9.8, 0.16, 0.48]} />
            <meshStandardMaterial color="#80543d" roughness={0.9} />
          </mesh>
          {([-1, 0, 1] as const).map((lane) =>
            railOffsets.map((offset) => (
              <mesh
                key={`${lane}-${offset}`}
                position={[LANE_POSITIONS[lane] + offset, 0.08, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[0.12, 0.12, TRACK_SEGMENT_LENGTH + 0.7]} />
                <meshStandardMaterial
                  color="#d8d9ff"
                  emissive="#ff8db6"
                  emissiveIntensity={0.08}
                  metalness={0.72}
                  roughness={0.24}
                />
              </mesh>
            )),
          )}
        </group>
      ))}
    </group>
  );
}
