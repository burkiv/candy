import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Collectibles } from './Collectibles';
import { GameLoop } from './GameLoop';
import { Lighting } from './Lighting';
import { Obstacles } from './Obstacles';
import { PlayerCamera } from './PlayerCamera';
import { Rails } from './Rails';
import { RenderStatsProbe } from './RenderStatsProbe';
import { Tunnel } from './Tunnel';

export function Scene() {
  return (
    <Canvas
      camera={{ fov: 82, near: 0.1, far: 200, position: [0, 1.6, 6] }}
      dpr={[1, 1.15]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.15;
      }}
    >
      <color attach="background" args={['#140c22']} />
      <fog attach="fog" args={['#26153c', 24, 106]} />
      <Suspense fallback={null}>
        <Lighting />
        <Tunnel />
        <Rails />
        <Obstacles />
        <Collectibles />
        <PlayerCamera />
        <GameLoop />
        <RenderStatsProbe />
      </Suspense>
    </Canvas>
  );
}
