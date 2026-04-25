import { useGLTF } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo } from 'react';
import type { WorldId } from '../types';
import { useWorldDefinition } from '../worlds';
import { Collectibles } from './Collectibles';
import { GameLoop } from './GameLoop';
import { Lighting } from './Lighting';
import { Obstacles } from './Obstacles';
import { PlayerCamera } from './PlayerCamera';
import { Rails } from './Rails';
import { RenderStatsProbe } from './RenderStatsProbe';
import { Tunnel } from './Tunnel';

const COMMON_PRELOAD_MODEL_PATHS = ['/models/coin.glb', '/models/star.glb'];

function WorldAssetPreloader({ paths }: { paths: string[] }) {
  useGLTF(paths);
  return null;
}

function SceneContent({
  onWorldReady,
}: {
  onWorldReady: (worldId: WorldId) => void;
}) {
  const world = useWorldDefinition();
  const { gl } = useThree();
  const preloadPaths = useMemo(
    () => [...COMMON_PRELOAD_MODEL_PATHS, ...world.preloadModelPaths],
    [world.preloadModelPaths],
  );

  useEffect(() => {
    gl.toneMappingExposure = world.scene.exposure ?? 1.15;
  }, [gl, world.scene.exposure]);

  useEffect(() => {
    onWorldReady(world.id);
  }, [onWorldReady, world.id]);

  return (
    <>
      <WorldAssetPreloader paths={preloadPaths} />
      <color attach="background" args={[world.scene.backgroundColor]} />
      <fog attach="fog" args={world.scene.fog} />
      <group key={world.id}>
        <Lighting />
        <Tunnel />
        <Rails />
        <Obstacles />
        <Collectibles />
        <PlayerCamera />
        <GameLoop />
        <RenderStatsProbe />
      </group>
    </>
  );
}

export function Scene({
  onWorldReady,
}: {
  onWorldReady: (worldId: WorldId) => void;
}) {
  return (
    <Canvas
      camera={{ fov: 82, near: 0.1, far: 200, position: [0, 1.6, 6] }}
      dpr={[1, 1.15]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <SceneContent onWorldReady={onWorldReady} />
      </Suspense>
    </Canvas>
  );
}
