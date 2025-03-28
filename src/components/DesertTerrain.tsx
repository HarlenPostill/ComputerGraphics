'use client';
import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

interface SimpleDesertTerrainProps {
  size?: number;
  segments?: number;
  height?: number;
  position?: [number, number, number];
}

export default function DesertTerrain({
  size = 1000,
  segments = 128,
  height = 5,
  position = [0, -5, 0],
}: SimpleDesertTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Procedural sand texture
  // TODO use real sand textures, normal maps & ambient maps
  const sandTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base color
    ctx.fillStyle = '#e1c391';
    ctx.fillRect(0, 0, 1024, 1024);

    // noise
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
    texture.repeat.set(20, 20);
    return texture;
  }, []);

  // Dunes
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geo.attributes.position;

    const simplexLike = (x: number, y: number) => {
      return (
        Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 +
        Math.sin(x * 0.05 + 10) * Math.cos(y * 0.05) * 1 +
        Math.sin(x * 0.01 + 20) * Math.cos(y * 0.01 + 30) * 2.5
      );
    };

    // height offsets
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = simplexLike(x, y) * height;
      pos.setZ(i, z);
    }

    geo.computeVertexNormals();
    return geo;
  }, [size, segments, height]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow>
      <axesHelper args={[50]} />
      <meshStandardMaterial map={sandTexture} color="#e1c391" roughness={0.8} metalness={0} />
    </mesh>
  );
}
