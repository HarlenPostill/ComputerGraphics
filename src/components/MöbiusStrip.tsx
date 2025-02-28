'use client';
import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface MöbiusStripProps {
  radius?: number;
  tubularSegments?: number;
  tubeRadius?: number;
  tubularRadiusSegments?: number;
  color?: string;
  wireframe?: boolean;
  rotation?: boolean;
  rotationSpeed?: number;
  position?: [number, number, number];
}

export default function MöbiusStrip({
  radius = 2,
  tubularSegments = 64,
  tubeRadius = 0.4,
  tubularRadiusSegments = 16,
  color = '#6a0dad', // Purple color for the Möbius strip
  wireframe = false,
  rotation = true,
  rotationSpeed = 0.3,
  position = [0, 2, 0],
}: MöbiusStripProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create the Möbius strip geometry using BufferGeometry
  const geometry = useMemo(() => {
    // Create a new BufferGeometry
    const geometry = new THREE.BufferGeometry();

    // Create arrays to hold the vertices and faces
    const vertices = [];
    const indices = [];

    // Generate vertices for the Möbius strip
    for (let i = 0; i <= tubularSegments; i++) {
      const u = (i / tubularSegments) * Math.PI * 2;

      for (let j = 0; j <= tubularRadiusSegments; j++) {
        const v = (j / tubularRadiusSegments) * 2 - 1;

        const halfWidth = tubeRadius;

        // Calculate the position on the Möbius strip
        const x = (radius + halfWidth * v * Math.cos(u / 2)) * Math.cos(u);
        const y = (radius + halfWidth * v * Math.cos(u / 2)) * Math.sin(u);
        const z = halfWidth * v * Math.sin(u / 2);

        // Add the vertex
        vertices.push(x, y, z);
      }
    }

    // Generate faces (triangles)
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < tubularRadiusSegments; j++) {
        const a = (tubularRadiusSegments + 1) * i + j;
        const b = (tubularRadiusSegments + 1) * i + j + 1;
        const c = (tubularRadiusSegments + 1) * (i + 1) + j;
        const d = (tubularRadiusSegments + 1) * (i + 1) + j + 1;

        // Add two triangles to form a quad
        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }

    // Set the attributes of the geometry
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    // Compute vertex normals for proper lighting
    geometry.computeVertexNormals();

    return geometry;
  }, [radius, tubularSegments, tubeRadius, tubularRadiusSegments]);

  // Animate the Möbius strip if rotation is enabled
  useFrame((_, delta) => {
    if (rotation && meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed;
      meshRef.current.rotation.x += delta * rotationSpeed * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={new THREE.Vector3(...position)} geometry={geometry}>
      <meshPhongMaterial
        color={color}
        side={THREE.DoubleSide}
        wireframe={wireframe}
        flatShading={true}
      />
    </mesh>
  );
}
