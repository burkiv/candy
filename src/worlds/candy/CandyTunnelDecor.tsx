import { useGLTF } from '@react-three/drei';
import { Fragment } from 'react';
import { ModelAsset } from '../../game/ModelAsset';

interface CandyTunnelDecorProps {
  segmentIndex: number;
}

export function CandyTunnelDecor({ segmentIndex }: CandyTunnelDecorProps) {
  const swap = segmentIndex % 2 === 0 ? 1 : -1;
  const pattern = segmentIndex % 5;
  const showFrontLamp = pattern === 0 || pattern === 3;
  const showBackLamp = pattern === 2;
  const showLowerCrystal = pattern === 1 || pattern === 4;
  const showUpperCrystal = pattern === 3;
  const showPillar = pattern === 2;
  const showTree = pattern === 0 || pattern === 4;

  return (
    <Fragment>
      {showFrontLamp ? (
        <group
          position={[swap * 7.42, 2.18, -8.3]}
          rotation={[0, swap > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
        >
          <ModelAsset
            path="/models/tunel_segment.glb"
            targetWidth={1.8}
            targetHeight={2.25}
            targetDepth={1.45}
            colorBoost={1.28}
            emissiveColor="#ffd9b0"
            emissiveIntensity={0.45}
          />
        </group>
      ) : null}
      {showBackLamp ? (
        <group
          position={[-swap * 7.42, 2.26, 4.9]}
          rotation={[0, swap > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <ModelAsset
            path="/models/tunel_segment.glb"
            targetWidth={1.8}
            targetHeight={2.25}
            targetDepth={1.45}
            colorBoost={1.28}
            emissiveColor="#ffd9b0"
            emissiveIntensity={0.45}
          />
        </group>
      ) : null}

      {showLowerCrystal ? (
        <group position={[-swap * 6.45, 1.22, -1.5]} rotation={[0.1, swap * 0.5, 0]}>
          <ModelAsset
            path="/models/jelly_crystal.glb"
            targetWidth={1.8}
            targetHeight={1.8}
            targetDepth={1.8}
            scaleMultiplier={1.1}
            colorBoost={1.25}
            emissiveColor="#eaa2ff"
            emissiveIntensity={0.52}
          />
        </group>
      ) : null}
      {showUpperCrystal ? (
        <group position={[swap * 6.18, 3.02, 8.4]} rotation={[0, -swap * 0.3, 0.25]}>
          <ModelAsset
            path="/models/jelly_crystal.glb"
            targetWidth={1.45}
            targetHeight={1.45}
            targetDepth={1.45}
            colorBoost={1.22}
            emissiveColor="#c89dff"
            emissiveIntensity={0.42}
          />
        </group>
      ) : null}

      {showPillar ? (
        <group position={[swap * 5.72, -1.62, -7.4]} rotation={[0, -swap * 0.22, 0]}>
          <ModelAsset
            path="/models/icecream_pillar.glb"
            targetWidth={1.45}
            targetHeight={3.3}
            targetDepth={1.45}
            colorBoost={1.18}
          />
        </group>
      ) : null}

      {showTree ? (
        <group position={[-swap * 5.62, -1.62, 7.9]} rotation={[0, swap * 0.42, 0]}>
          <ModelAsset
            path="/models/cotton_candy_tree.glb"
            targetWidth={2.6}
            targetHeight={2.9}
            targetDepth={2.4}
            colorBoost={1.2}
            emissiveColor="#ffc7e8"
            emissiveIntensity={0.14}
          />
        </group>
      ) : null}
    </Fragment>
  );
}

useGLTF.preload('/models/tunel_segment.glb');
useGLTF.preload('/models/jelly_crystal.glb');
useGLTF.preload('/models/icecream_pillar.glb');
useGLTF.preload('/models/cotton_candy_tree.glb');
