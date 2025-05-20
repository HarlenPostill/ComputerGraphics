"use client";
import React, { useRef, useMemo, useEffect } from "react";
import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import cloudTextureImg from "/public/cloud.png";

interface DesertSkyProps {
  sunPosition?: [number, number, number];
  cloudCoverage?: number;
  cloudSpeed?: number;
  cloudDirection?: [number, number];
}

export default function DesertSky({
  sunPosition = [1, 0.25, 0.25],
  cloudCoverage = 4,
  cloudSpeed = 1,
  cloudDirection = [0.5, -0.8],
}: DesertSkyProps) {
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
      <LinearClouds
        count={18}
        coverage={cloudCoverage}
        speed={cloudSpeed}
        direction={cloudDirection}
      />
    </>
  );
}

interface LinearCloudProps {
  count: number;
  coverage: number;
  speed: number;
  direction: [number, number];
}

function LinearClouds({ count, coverage, speed, direction }: LinearCloudProps) {
  const cloudsRef = useRef<THREE.Group>(null);
  const cloudMeshesRef = useRef<THREE.Mesh[]>([]);

  const normalizedDirection = useMemo(() => {
    const dirVector = new THREE.Vector2(direction[0], direction[1]).normalize();
    return [dirVector.x, dirVector.y] as [number, number];
  }, [direction]);

  const cloudAreaSize = useMemo(() => {
    return {
      width: 600,
      height: 60,
      center: new THREE.Vector3(0, 80, 0),
    };
  }, []);

  const cloudTexture = useMemo(() => {
    const texture = new THREE.TextureLoader().load(cloudTextureImg.src);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);

  const clouds = useMemo(() => {
    const tempClouds = [];
    const baseSize = 30 + 40 * coverage;

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * cloudAreaSize.width;
      const z = (Math.random() - 0.5) * cloudAreaSize.width;
      const y =
        cloudAreaSize.center.y + (Math.random() - 0.5) * cloudAreaSize.height;

      const size = baseSize * (0.7 + Math.random() * 0.6);

      tempClouds.push({
        position: [x, y, z],
        rotation: [Math.PI / 2, 0, Math.random() * Math.PI * 2],
        size: size,
      });

      if (Math.random() > 0.4) {
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetZ = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 15;

        tempClouds.push({
          position: [x + offsetX, y + offsetY, z + offsetZ],
          rotation: [Math.PI / 2, 0, Math.random() * Math.PI * 2],
          size: size * 0.7,
        });
      }
    }

    return tempClouds;
  }, [count, coverage, cloudAreaSize]);

  useFrame((state, delta) => {
    if (!cloudsRef.current) return;

    const cameraPosition = state.camera.position;
    const viewDistance = 800; // start of path
    const fadeDistance = 600; // end of path

    cloudMeshesRef.current.forEach((mesh, index) => {
      if (!mesh) return;

      mesh.position.x += normalizedDirection[0] * speed * 15 * delta;
      mesh.position.z += normalizedDirection[1] * speed * 15 * delta;

      // slight height y variation
      mesh.position.y +=
        Math.sin(state.clock.elapsedTime * 0.05 + index * 0.1) * 0.05 * delta;

      if (index % 5 === 0) {
        mesh.rotation.z += 0.008 * delta;
      }

      const distanceToCamera = mesh.position.distanceTo(cameraPosition);

      let targetOpacity = 0.8;

      if (distanceToCamera > fadeDistance) {
        const fadeRatio =
          1 - (distanceToCamera - fadeDistance) / (viewDistance - fadeDistance);
        targetOpacity *= Math.max(0, Math.min(1, fadeRatio));
      }

      if (mesh.material instanceof THREE.MeshLambertMaterial) {
        mesh.material.opacity +=
          (targetOpacity - mesh.material.opacity) * Math.min(1, delta * 2);
      }

      // TODO fix the random entry point interation....

      const distanceFromCenter = new THREE.Vector2(
        mesh.position.x - cloudAreaSize.center.x,
        mesh.position.z - cloudAreaSize.center.z
      ).length();

      if (distanceFromCenter > viewDistance * 0.5) {
        const angle = Math.atan2(
          mesh.position.z - cloudAreaSize.center.z,
          mesh.position.x - cloudAreaSize.center.x
        );

        const oppositeAngle = angle + Math.PI;

        // rando entry point on path
        const entryDistance = viewDistance * 0.5 * (0.8 + Math.random() * 0.3);
        const newX =
          cloudAreaSize.center.x + Math.cos(oppositeAngle) * entryDistance;
        const newZ =
          cloudAreaSize.center.z + Math.sin(oppositeAngle) * entryDistance;

        // rando y height
        const newY =
          cloudAreaSize.center.y + (Math.random() - 0.5) * cloudAreaSize.height;

        mesh.position.set(newX, newY, newZ);

        // fade in
        if (mesh.material instanceof THREE.MeshLambertMaterial) {
          mesh.material.opacity = 0;
        }
      }
    });
  });

  useEffect(() => {
    cloudMeshesRef.current = [];
  }, []);

  return (
    <group ref={cloudsRef} position={[0, 0, 0]}>
      {clouds.map((cloud, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) cloudMeshesRef.current[i] = el;
          }}
          position={new THREE.Vector3(...cloud.position)}
          rotation={new THREE.Euler(...cloud.rotation)}
        >
          <planeGeometry args={[cloud.size, cloud.size]} />
          <meshLambertMaterial
            map={cloudTexture}
            transparent={true}
            opacity={0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
            emissive={new THREE.Color(0xffffff)}
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
