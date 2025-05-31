'use client';
import { useThree, useFrame } from '@react-three/fiber';
import React, { useRef, useEffect, RefObject } from 'react';
import * as THREE from 'three';
import { Mesh, BufferGeometry, Material } from 'three';

interface SandDisplacerProps {
  terrainRef: RefObject<Mesh<BufferGeometry, Material | Material[], THREE.Object3DEventMap> | null>;
  scale?: number;
}

export default function SandDisplacer({ terrainRef, scale = 1 }: SandDisplacerProps) {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const isFKeyDown = useRef(false);

  const radius = 10 * scale;
  const strength = 1.2 * scale;

  const handleMouseMove = (event: MouseEvent) => {
    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === 'f') {
      isFKeyDown.current = true;
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === 'f') {
      isFKeyDown.current = false;
    }
  };

  useFrame(() => {
    if (!terrainRef.current || !isFKeyDown.current) return;

    // Raycast from camera to mouse position
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObject(terrainRef.current);

    if (intersects.length === 0) return;

    const point = intersects[0].point;
    const geometry = terrainRef.current.geometry as BufferGeometry;
    const posAttr = geometry.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);

      const dx = vx - point.x;
      const dz = vz - point.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < radius) {
        const influence = (1 - dist / radius) * strength;
        posAttr.setY(i, vy + influence); // lift
      }
    }

    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  useEffect(() => {
    const domElement = gl.domElement;
    domElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      domElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gl.domElement]);

  return null;
}