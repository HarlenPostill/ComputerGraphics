'use client';
import React, {
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import * as THREE from 'three';
import { Mesh } from 'three';

export interface MultiLevelDesertTerrainProps {
  layers?: number;
  baseSize?: number;
  maxDistance?: number;
  segments?: number;
  baseHeight?: number;
}

const MultiLevelDesertTerrain = forwardRef<Mesh, MultiLevelDesertTerrainProps>(
  (
    {
      layers = 5,
      baseSize = 500,
      segments = 128,
      baseHeight = 20,
    },
    ref
  ) => {
    const mainMeshRef = useRef<Mesh>(null);

    useImperativeHandle(ref, () => mainMeshRef.current!, []);

    const sandTexture = useMemo(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#e1c391';
      ctx.fillRect(0, 0, 1024, 1024);

      for (let i = 0; i < 20000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const radius = Math.random() * 2 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = Math.random() > 0.5 ? '#d3b583' : '#e9cba0';
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(40, 40);
      return texture;
    }, []);

    const complexDuneNoise = (x: number, y: number, seed: number = 0) => {
      const frequencies = [0.005, 0.01, 0.02, 0.04];
      const amplitudes = [3, 1.5, 0.8, 0.3];

      let result = 0;
      for (let i = 0; i < frequencies.length; i++) {
        const fx = frequencies[i];
        const fy = frequencies[i];
        const amp = amplitudes[i];

        result += Math.sin(x * fx + seed * 10) * Math.cos(y * fy + seed * 20) * amp;
        result +=
          Math.sin((x + 324) * fx * 1.3 + seed * 30) *
          Math.cos((y + 234) * fy * 1.1 + seed * 15) *
          amp *
          0.8;
      }

      result += Math.sin(x * 0.1 + seed * 5) * Math.sin(y * 0.15 + seed * 10) * 0.3;

      return result;
    };

    const terrainLayers = useMemo(() => {
      const layers_data: {
        geometry: THREE.BufferGeometry;
        position: [number, number, number];
        size: number;
        segments: number;
        color: THREE.Color;
        roughness: number;
      }[] = [];

      for (let layer = 0; layer < layers; layer++) {
        const layerSize = baseSize * Math.pow(2, layer);
        const layerSegments = Math.max(16, Math.floor(segments / Math.pow(1.5, layer)));
        const heightScale = baseHeight * (1 - layer * 0.15);

        const geo = new THREE.PlaneGeometry(layerSize, layerSize, layerSegments, layerSegments);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const z = complexDuneNoise(x, y, layer) * heightScale;
          pos.setZ(i, z);
        }

        geo.computeVertexNormals();

        layers_data.push({
          geometry: geo,
          position: [0, -5, 0],
          size: layerSize,
          segments: layerSegments,
          color: new THREE.Color().setHSL(0.08, 0.2 - layer * 0.03, 0.7 - layer * 0.05),
          roughness: 0.8 + layer * 0.03,
        });
      }

      return layers_data;
    }, [layers, baseSize, segments, baseHeight]);

    return (
      <group>
        {terrainLayers.map((layer, index) => (
          <mesh
            key={`terrain-layer-${index}`}
            ref={index === 0 ? mainMeshRef : undefined}
            geometry={layer.geometry}
            position={layer.position}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow>
            <meshStandardMaterial
              map={sandTexture}
              color={layer.color}
              roughness={layer.roughness}
              metalness={0}
              fog
            />
          </mesh>
        ))}
      </group>
    );
  }
);

export default MultiLevelDesertTerrain;