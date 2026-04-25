import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { useWorldDefinition } from '../worlds';
import { Collectibles } from './Collectibles';
import { GameLoop } from './GameLoop';
import { Lighting } from './Lighting';
import { Obstacles } from './Obstacles';
import { PlayerCamera } from './PlayerCamera';
import { Rails } from './Rails';
import { RenderStatsProbe } from './RenderStatsProbe';
import { Tunnel } from './Tunnel';

function SceneContent() {
  const world = useWorldDefinition();
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMappingExposure = world.scene.exposure ?? 1.15;
  }, [gl, world.scene.exposure]);

  return (
    <>
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

export function Scene() {
  return (
    <Canvas
      camera={{ fov: 82, near: 0.1, far: 200, position: [0, 1.6, 6] }}
      dpr={[1, 1.15]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
