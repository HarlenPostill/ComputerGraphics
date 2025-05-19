"use client";
import React, { useRef } from "react";
import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import cloudTextureImg from "/public/cloud.png";

interface DesertSkyProps {
  sunPosition?: [number, number, number];
  cloudCoverage?: number;
  cloudSpeed?: number;
}

export default function DesertSky({
  sunPosition = [1, 0.25, 0.25],
  cloudCoverage = 0.3,
  cloudSpeed = 0.03,
}: DesertSkyProps) {
  const cloudsRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * cloudSpeed;
    }
  });

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={sunPosition}
        inclination={0.6}
        azimuth={0.25}
        mieCoefficient={0.001}
        mieDirectionalG={0.8}
        rayleigh={0.5}
        turbidity={10}
      />

      <group ref={cloudsRef} position={[0, 80, 0]}>
        <DesertClouds
          count={12}
          coverage={cloudCoverage}
          sunPosition={sunPosition}
        />
      </group>
    </>
  );
}

interface CloudProps {
  count: number;
  coverage: number;
  sunPosition: [number, number, number];
}

function DesertClouds({ count, coverage, sunPosition }: CloudProps) {
  const cloudTextureReal = new THREE.TextureLoader().load(cloudTextureImg.src);

  const material = new THREE.MeshLambertMaterial({
    map: cloudTextureReal,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.5,
  });

  const clouds = [];
  for (let i = 0; i < count; i++) {
    // Create random positions in a circle TODO put them on a straigh line following the set wind direction of the shadows
    const angle = (i / count) * Math.PI * 2;
    const radius = 150 + Math.random() * 100;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Random heights
    const y = -20 + Math.random() * 30;

    const size = 30 + Math.random() * 70 * coverage;

    const rotation = Math.random() * Math.PI * 2;

    clouds.push(
      <mesh
        key={i}
        position={[x, y, z]}
        rotation={[Math.PI / 2, 0, rotation]}
        material={material}
      >
        <planeGeometry args={[size, size]} />
      </mesh>
    );

    if (Math.random() > 0.5) {
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetZ = (Math.random() - 0.5) * 40;
      const smallSize = size * 0.6;

      clouds.push(
        <mesh
          key={`small-${i}`}
          position={[x + offsetX, y + Math.random() * 5, z + offsetZ]}
          rotation={[Math.PI / 2, 0, Math.random() * Math.PI * 2]}
          material={material}
        >
          <planeGeometry args={[smallSize, smallSize]} />
        </mesh>
      );
    }
  }

  return <>{clouds}</>;
}
