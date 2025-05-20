"use client";
import React, { useMemo } from "react";
import * as THREE from "three";
import { Detailed, useTexture } from "@react-three/drei";
import { createNoise2D } from "simplex-noise";
import { SandParticlesEffect } from "./SandParticlesEffect";

interface MultiLevelDesertTerrainProps {
  layers?: number;
  baseSize?: number;
  segments?: number;
  baseHeight?: number;
}

const createDuneNoise = () => {
  const noise2D = createNoise2D(Math.random);

  return (x: number, y: number, scale: number = 1) => {
    const ridgeNoise = Math.abs(noise2D(x * 0.002 * scale, y * 0.002 * scale));
    const mainDune = Math.pow(ridgeNoise, 1.5) * 15;

    const mediumDetails =
      Math.abs(noise2D(x * 0.005 * scale + 100, y * 0.005 * scale + 100)) * 5 +
      Math.abs(noise2D(x * 0.008 * scale - 50, y * 0.008 * scale - 50)) * 3;

    const ripples =
      Math.abs(noise2D(x * 0.0003 * scale + 200, y * 0.03 * scale + 200)) *
        0.5 +
      Math.abs(noise2D(x * 0.05 * scale - 200, y * 0.05 * scale - 200)) * 0.3;

    const windDirection =
      noise2D(x * 0.001 + 300, y * 0.001 + 300) *
      noise2D(x * 0.002 - 300, y * 0.002 - 300) *
      2;

    const baseHeight = mainDune + mediumDetails * 0.4 + ripples * 0.2;
    const windInfluence = 1 + windDirection * 0.2;

    const sharpness = Math.pow(Math.max(0, noise2D(x * 0.01, y * 0.01)), 4) * 2;

    return baseHeight * windInfluence + sharpness;
  };
};

const generateSandMaterial = (resolution = 1024) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = resolution;
  const ctx = canvas.getContext("2d")!;

  const createDesertGradient = () => {
    const gradient = ctx.createLinearGradient(0, 0, resolution, resolution);
    gradient.addColorStop(0, "#e1c391");
    gradient.addColorStop(0.3, "#d3b583");
    gradient.addColorStop(0.6, "#e9cba0");
    gradient.addColorStop(0.8, "#dfc190");
    gradient.addColorStop(1, "#e5c696");
    return gradient;
  };

  ctx.fillStyle = createDesertGradient();
  ctx.fillRect(0, 0, resolution, resolution);

  const grainLayers = [
    { count: 30000, size: [0.5, 1.5], opacity: [0.1, 0.3] },
    { count: 20000, size: [1.0, 2.0], opacity: [0.05, 0.15] },
    { count: 10000, size: [1.5, 2.5], opacity: [0.03, 0.08] },
  ];

  grainLayers.forEach((layer) => {
    for (let i = 0; i < layer.count; i++) {
      const x = Math.random() * resolution;
      const y = Math.random() * resolution;
      const radius =
        Math.random() * (layer.size[1] - layer.size[0]) + layer.size[0];
      const opacity =
        Math.random() * (layer.opacity[1] - layer.opacity[0]) +
        layer.opacity[0];

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${
        Math.random() > 0.5 ? "211,181,131" : "233,203,160"
      },${opacity})`;
      ctx.fill();
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(40, 40);

  return texture;
};

export default function MultiLevelDesertTerrain({
  layers = 1,
  baseSize = 500,
  segments = 128,
  baseHeight = 20,
}: MultiLevelDesertTerrainProps) {
  const duneNoise = useMemo(() => createDuneNoise(), []);
  const sandTexture = useMemo(() => generateSandMaterial(), []);
  const normalMap = useTexture("/sand_normal.jpg");
  const roughnessMap = useTexture("/sand_roughness2.jpg");
  const terrainLayers = useMemo(() => {
    const layers_data = [];

    for (let layer = 0; layer < layers; layer++) {
      const layerSize = baseSize * Math.pow(2, layer);
      const layerSegments = Math.max(
        16,
        Math.floor(segments / Math.pow(1.5, layer))
      );
      const heightScale = baseHeight * (1 - layer * 0.15);

      const lodLevels = [1, 0.5, 0.25].map((detail) => {
        const segments = Math.floor(layerSegments * detail);
        const geo = new THREE.PlaneGeometry(
          layerSize,
          layerSize,
          segments,
          segments
        );
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const z = duneNoise(x, y, 1 / (layer + 1)) * heightScale;
          pos.setZ(i, z);
        }

        geo.computeVertexNormals();
        return geo;
      });

      layers_data.push({
        geometries: lodLevels,
        position: [0, -5, 0],
        size: layerSize,
        color: new THREE.Color().setHSL(
          0.08,
          0.2 - layer * 0.03,
          0.7 - layer * 0.05
        ),
        roughness: 0.8 + layer * 0.03,
      });
    }

    return layers_data;
  }, [layers, baseSize, segments, baseHeight, duneNoise]);

  return (
    <group>
      {terrainLayers.map((layer, index) => (
        <Detailed
          key={`terrain-layer-${index}`}
          distances={[0, 500, 1500]}
          position={layer.position as [number, number, number]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {layer.geometries.map((geo, lodIndex) => (
            <mesh key={`lod-${lodIndex}`} geometry={geo} receiveShadow>
              <SandParticlesEffect
                baseTexture={sandTexture}
                normalMap={normalMap}
                roughnessMap={roughnessMap}
                windDirection={[1, 0.5]}
                particleScale={100.0}
                particleSpeed={1}
                particleIntensity={1}
              />
            </mesh>
          ))}
        </Detailed>
      ))}
    </group>
  );
}
