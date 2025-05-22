'use client';
import React, { useRef, useEffect, useState, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Mesh, Vector3, BufferGeometry, Material } from 'three';

interface SandwormProps {
  terrainRef: RefObject<Mesh<BufferGeometry, Material | Material[], THREE.Object3DEventMap> | null>;
  scale?: number;
}

export default function Sandworm({ terrainRef, scale = 1 }: SandwormProps) {
  const wormRef = useRef<Mesh>(null);
  const speed = 0.5;
  const [direction, setDirection] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setDirection((prev) => {
        const newDir: [number, number, number] = [...prev];
        if (e.key === 'w') newDir[2] = -1;
        if (e.key === 's') newDir[2] = 1;
        if (e.key === 'a') newDir[0] = -1;
        if (e.key === 'd') newDir[0] = 1;
        if (e.key === 'q') newDir[1] = -1;
        if (e.key === 'e') newDir[1] = 1;
        return newDir;
      });
    };

    const handleKeyUp = () => setDirection([0, 0, 0]);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    const worm = wormRef.current;
    if (!worm || !terrainRef.current) return;

    worm.position.x += direction[0] * speed;
    worm.position.y += direction[1] * speed;
    worm.position.z += direction[2] * speed;

    worm.scale.set(scale, scale, scale);

    const terrain = terrainRef.current.geometry;
    const posAttr = terrain.getAttribute('position');
    const wormWorldPos = new THREE.Vector3();
    worm.getWorldPosition(wormWorldPos);

    const radius = 10 * scale;
    const strength = 1.2 * scale;

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      const dx = x - wormWorldPos.x;
      const dy = y - wormWorldPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        const falloff = 1 - distance / radius;
        const deformation = strength * falloff;
        posAttr.setZ(i, z - deformation);
      }
    }

    posAttr.needsUpdate = true;
    terrain.computeVertexNormals();
  });

  return (
    <mesh
      ref={wormRef}
      position={[0, 0, 0]}
      castShadow
      rotation={[0, Math.PI / 2, Math.PI / 2]}
    >
      <capsuleGeometry args={[1 * scale, 2 * scale, 8, 16]} />
      <meshStandardMaterial color="black" />
    </mesh>
  );
}
