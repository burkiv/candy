import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

export function RenderStatsProbe() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const cooldownRef = useRef(0);
  const setRenderStats = useGameStore((state) => state.setRenderStats);

  useFrame((_, delta) => {
    cooldownRef.current -= delta;

    if (cooldownRef.current > 0) {
      return;
    }

    cooldownRef.current = 0.2;

    let meshCount = 0;
    scene.traverseVisible((object) => {
      if (object instanceof THREE.Mesh) {
        meshCount += 1;
      }
    });

    setRenderStats({
      meshes: meshCount,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
    });
  });

  return null;
}
