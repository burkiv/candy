import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';
import {
  BASE_WORLD_SPEED,
  LANE_POSITIONS,
  PLAYER_Z,
  PREVIEW_WORLD_SPEED,
  TUNNEL_SEGMENT_COUNT,
  TUNNEL_SEGMENT_LENGTH,
} from '../../utils/constants';
import { CandyTunnelDecor } from './CandyTunnelDecor';

const ribOffsets = [-8, 0, 8] as const;

export function CandyTunnel() {
  const segments = useRef<Array<THREE.Group | null>>([]);
  const phase = useGameStore((state) => state.phase);
  const speed = useGameStore((state) => state.speed);

  useFrame((_, delta) => {
    const scrollSpeed =
      (phase === 'PLAYING' ? BASE_WORLD_SPEED * speed : PREVIEW_WORLD_SPEED) *
      delta;
    const totalLength = TUNNEL_SEGMENT_COUNT * TUNNEL_SEGMENT_LENGTH;

    segments.current.forEach((segment) => {
      if (!segment) {
        return;
      }

      segment.position.z += scrollSpeed;

      if (segment.position.z > PLAYER_Z + TUNNEL_SEGMENT_LENGTH / 2) {
        segment.position.z -= totalLength;
      }
    });
  });

  return (
    <group>
      {Array.from({ length: TUNNEL_SEGMENT_COUNT }).map((_, index) => (
        <group
          key={index}
          position={[0, 1.75, -index * TUNNEL_SEGMENT_LENGTH]}
          ref={(node) => {
            segments.current[index] = node;
          }}
        >
          <CandyTunnelDecor segmentIndex={index} />
          <mesh position={[0, -1.84, 0]} receiveShadow>
            <boxGeometry args={[15.6, 0.34, TUNNEL_SEGMENT_LENGTH]} />
            <meshStandardMaterial
              color="#5c3977"
              emissive="#3b2058"
              emissiveIntensity={0.42}
              roughness={0.82}
            />
          </mesh>
          <mesh position={[-7.52, 0.86, 0]} receiveShadow>
            <boxGeometry args={[0.34, 5.42, TUNNEL_SEGMENT_LENGTH]} />
            <meshStandardMaterial
              color="#6e43aa"
              emissive="#4d2d7a"
              emissiveIntensity={0.36}
              roughness={0.8}
            />
          </mesh>
          <mesh position={[7.52, 0.86, 0]} receiveShadow>
            <boxGeometry args={[0.34, 5.42, TUNNEL_SEGMENT_LENGTH]} />
            <meshStandardMaterial
              color="#6541a4"
              emissive="#4d2d7a"
              emissiveIntensity={0.36}
              roughness={0.8}
            />
          </mesh>
          <mesh position={[0, 3.7, 0]} receiveShadow>
            <boxGeometry args={[12.9, 0.34, TUNNEL_SEGMENT_LENGTH]} />
            <meshStandardMaterial
              color="#f7d8f7"
              emissive="#ffcae8"
              emissiveIntensity={0.28}
              roughness={0.76}
            />
          </mesh>
          <mesh position={[-6.48, 3.15, 0]} rotation={[0, 0, -0.72]} receiveShadow>
            <boxGeometry args={[0.28, 1.8, TUNNEL_SEGMENT_LENGTH]} />
            <meshStandardMaterial
              color="#a46be0"
              emissive="#7140ab"
              emissiveIntensity={0.25}
              roughness={0.78}
            />
          </mesh>
          <mesh position={[6.48, 3.15, 0]} rotation={[0, 0, 0.72]} receiveShadow>
            <boxGeometry args={[0.28, 1.8, TUNNEL_SEGMENT_LENGTH]} />
            <meshStandardMaterial
              color="#8f68db"
              emissive="#7140ab"
              emissiveIntensity={0.25}
              roughness={0.78}
            />
          </mesh>
          <mesh position={[0, -1.58, 0]}>
            <boxGeometry args={[11.2, 0.16, TUNNEL_SEGMENT_LENGTH - 0.6]} />
            <meshStandardMaterial
              color="#a685bf"
              emissive="#8865a4"
              emissiveIntensity={0.08}
              roughness={0.9}
            />
          </mesh>
          {([-1, 0, 1] as const).map((lane) => (
            <mesh key={lane} position={[LANE_POSITIONS[lane], -1.48, 0]}>
              <boxGeometry args={[1.5, 0.03, TUNNEL_SEGMENT_LENGTH - 0.8]} />
              <meshStandardMaterial
                color="#d4b8ea"
                emissive="#f4d8ff"
                emissiveIntensity={0.06}
                roughness={0.88}
              />
            </mesh>
          ))}
          {([-6.86, 6.86] as const).map((x) => (
            <mesh key={x} position={[x, -1.42, 0]}>
              <boxGeometry args={[0.16, 0.22, TUNNEL_SEGMENT_LENGTH - 0.8]} />
              <meshStandardMaterial
                color="#ffd8f0"
                emissive="#ffb8dc"
                emissiveIntensity={0.18}
                roughness={0.86}
              />
            </mesh>
          ))}
          {ribOffsets.map((z) => (
            <group key={z} position={[0, 0, z]}>
              <mesh position={[0, 3.48, 0]}>
                <boxGeometry args={[12.6, 0.16, 0.32]} />
                <meshStandardMaterial
                  color="#ffe8f8"
                  emissive="#ffd0e8"
                  emissiveIntensity={0.22}
                />
              </mesh>
              <mesh position={[-7.16, 0.92, 0]}>
                <boxGeometry args={[0.18, 5.1, 0.32]} />
                <meshStandardMaterial
                  color="#ffd7ef"
                  emissive="#ffb6df"
                  emissiveIntensity={0.18}
                />
              </mesh>
              <mesh position={[7.16, 0.92, 0]}>
                <boxGeometry args={[0.18, 5.1, 0.32]} />
                <meshStandardMaterial
                  color="#d4f5ff"
                  emissive="#a8e6ff"
                  emissiveIntensity={0.18}
                />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 3.48, 0]}>
            <boxGeometry args={[2.15, 0.12, TUNNEL_SEGMENT_LENGTH - 0.8]} />
            <meshStandardMaterial
              color="#fff1b1"
              emissive="#ffd47d"
              emissiveIntensity={1.32}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[-6.18, 2.76, 0]} rotation={[0, 0, -0.44]}>
            <boxGeometry args={[0.2, 0.42, TUNNEL_SEGMENT_LENGTH - 1.4]} />
            <meshStandardMaterial
              color="#ff9dce"
              emissive="#ff74b7"
              emissiveIntensity={1.05}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[6.18, 2.76, 0]} rotation={[0, 0, 0.44]}>
            <boxGeometry args={[0.2, 0.42, TUNNEL_SEGMENT_LENGTH - 1.4]} />
            <meshStandardMaterial
              color="#9fe9ff"
              emissive="#74dfff"
              emissiveIntensity={1.05}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
