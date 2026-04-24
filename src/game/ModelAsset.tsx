import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

interface ModelAssetProps {
  path: string;
  targetWidth?: number;
  targetHeight?: number;
  targetDepth?: number;
  scaleMultiplier?: number;
  scaleYMultiplier?: number;
  colorBoost?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
}

export function ModelAsset({
  path,
  targetWidth,
  targetHeight,
  targetDepth,
  scaleMultiplier = 1,
  scaleYMultiplier = 1,
  colorBoost = 1,
  emissiveColor,
  emissiveIntensity = 0,
  roughness,
  metalness,
}: ModelAssetProps) {
  const gltf = useGLTF(path);

  const normalized = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const safeSize = new THREE.Vector3(
      Math.max(size.x, 0.001),
      Math.max(size.y, 0.001),
      Math.max(size.z, 0.001),
    );

    const xScale = targetWidth ? targetWidth / safeSize.x : Number.POSITIVE_INFINITY;
    const yScale = targetHeight ? targetHeight / safeSize.y : Number.POSITIVE_INFINITY;
    const zScale = targetDepth ? targetDepth / safeSize.z : Number.POSITIVE_INFINITY;
    const fitScale = Math.min(xScale, yScale, zScale);
    const scale = (Number.isFinite(fitScale) ? fitScale : 1) * scaleMultiplier;

    return {
      scale,
      offset: [-center.x, -box.min.y, -center.z] as [number, number, number],
    };
  }, [
    gltf.scene,
    scaleMultiplier,
    targetDepth,
    targetHeight,
    targetWidth,
  ]);

  const sceneClone = useMemo(() => {
    const clone = gltf.scene.clone(true);

    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (!mesh.isMesh) {
        return;
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const applyMaterialTuning = (sourceMaterial: THREE.Material) => {
        const tunedMaterial = sourceMaterial.clone() as THREE.Material & {
          color?: THREE.Color;
          emissive?: THREE.Color;
          emissiveIntensity?: number;
          roughness?: number;
          metalness?: number;
          envMapIntensity?: number;
        };

        if (tunedMaterial.color && colorBoost !== 1) {
          tunedMaterial.color.multiplyScalar(colorBoost);
        }

        if (emissiveColor && tunedMaterial.emissive) {
          tunedMaterial.emissive = new THREE.Color(emissiveColor);
          tunedMaterial.emissiveIntensity = emissiveIntensity;
        } else if (tunedMaterial.emissive && emissiveIntensity > 0 && tunedMaterial.color) {
          tunedMaterial.emissive = tunedMaterial.color.clone().multiplyScalar(0.35);
          tunedMaterial.emissiveIntensity = emissiveIntensity;
        }

        if (typeof roughness === 'number' && typeof tunedMaterial.roughness === 'number') {
          tunedMaterial.roughness = roughness;
        }

        if (typeof metalness === 'number' && typeof tunedMaterial.metalness === 'number') {
          tunedMaterial.metalness = metalness;
        }

        if (typeof tunedMaterial.envMapIntensity === 'number') {
          tunedMaterial.envMapIntensity = Math.max(tunedMaterial.envMapIntensity, 1.15);
        }

        return tunedMaterial;
      };

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(applyMaterialTuning);
      } else if (mesh.material) {
        mesh.material = applyMaterialTuning(mesh.material);
      }
    });

    return clone;
  }, [
    colorBoost,
    emissiveColor,
    emissiveIntensity,
    gltf.scene,
    metalness,
    roughness,
  ]);

  return (
    <group scale={[normalized.scale, normalized.scale * scaleYMultiplier, normalized.scale]}>
      <group position={normalized.offset}>
        <primitive object={sceneClone} />
      </group>
    </group>
  );
}
