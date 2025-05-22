"use client";
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SandSheetProps {
  count?: number;
  intensity?: number;
  speed?: number;
  direction?: [number, number];
  terrainSize?: number;
  sandColor?: string;
}

export default function SandSheets({
  count = 25,
  intensity = 1,
  speed = 1,
  direction = [0.8, 0.2],
  terrainSize = 500,
  sandColor = "#e1c4a4",
}: SandSheetProps) {
  const sandGroupRef = useRef<THREE.Group>(null);
  const sandMeshesRef = useRef<THREE.Mesh[]>([]);

  // Normalize the direction vector
  const normalizedDirection = useMemo(() => {
    const dirVector = new THREE.Vector2(direction[0], direction[1]).normalize();
    return [dirVector.x, dirVector.y] as [number, number];
  }, [direction]);

  // Define the area where sand sheets can appear
  const sandAreaSize = useMemo(() => {
    return {
      radius: terrainSize * 0.4, // Keep within terrain bounds
      center: new THREE.Vector3(0, 0.1, 0), // Just barely above ground level
    };
  }, [terrainSize]);

  // Create elongated sand sheet texture that looks like wind-blown sand
  const sandTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;

    // Create a linear gradient flowing in wind direction
    const gradient = ctx.createLinearGradient(0, 32, 256, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.1, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.5)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(0.9, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 64);

    // Add horizontal streaks for sand sheet effect
    for (let i = 0; i < 30; i++) {
      const y = Math.random() * 64;
      const width = 50 + Math.random() * 150;
      const startX = Math.random() * 50;
      const opacity = 0.1 + Math.random() * 0.4;

      const streakGradient = ctx.createLinearGradient(
        startX,
        y,
        startX + width,
        y
      );
      streakGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
      streakGradient.addColorStop(0.1, `rgba(255, 255, 255, ${opacity * 0.3})`);
      streakGradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity})`);
      streakGradient.addColorStop(0.9, `rgba(255, 255, 255, ${opacity * 0.3})`);
      streakGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

      ctx.fillStyle = streakGradient;
      ctx.fillRect(startX, y, width, 1 + Math.random() * 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);

  // Generate sand sheet positions, sizes, and rotations
  const sandSheets = useMemo(() => {
    const tempSandSheets = [];
    const baseWidth = 15 + intensity * 5; // Base width influenced by intensity parameter
    const baseHeight = 2 + intensity * 1.5; // Height is much smaller than width

    for (let i = 0; i < count; i++) {
      // Random position within the sand area
      const angle = Math.random() * Math.PI * 2;
      const distanceFromCenter = Math.random() * sandAreaSize.radius;

      const x = Math.cos(angle) * distanceFromCenter;
      const z = Math.sin(angle) * distanceFromCenter;
      const y = 0.1 + Math.random() * 0.2; // Very close to ground

      // Randomize dimensions
      const width = baseWidth * (0.6 + Math.random() * 0.8);
      const height = baseHeight * (0.7 + Math.random() * 0.6);

      // Calculate rotation to align with wind direction
      const windAngle = Math.atan2(
        normalizedDirection[1],
        normalizedDirection[0]
      );

      tempSandSheets.push({
        position: [x, y, z],
        rotation: [0, windAngle, 0], // Align with wind
        width: width,
        height: height,
        speedFactor: 0.8 + Math.random() * 0.4, // Individual speed variation
        lifecycle: Math.random(), // Random lifecycle phase (0-1)
        growthRate: 0.2 + Math.random() * 0.3, // How quickly it forms and dissipates
      });
    }

    return tempSandSheets;
  }, [count, intensity, sandAreaSize, normalizedDirection]);

  // Animation and visibility handling
  useFrame((state, delta) => {
    if (!sandGroupRef.current) return;

    const cameraPosition = state.camera.position;
    const visibilityDistance = sandAreaSize.radius * 1.5;
    const fadeDistance = sandAreaSize.radius * 1.2;

    sandMeshesRef.current.forEach((mesh, index) => {
      if (!mesh) return;

      const sandData = sandSheets[index];

      // Update lifecycle (forming, stable, dissipating)
      sandData.lifecycle += sandData.growthRate * delta;
      if (sandData.lifecycle > 2) {
        sandData.lifecycle = 0; // Reset lifecycle
      }

      // Calculate opacity based on lifecycle
      let lifecycleOpacity = 1;
      if (sandData.lifecycle < 0.5) {
        // Forming phase (0-0.5)
        lifecycleOpacity = sandData.lifecycle * 2; // 0 to 1
      } else if (sandData.lifecycle > 1.5) {
        // Dissipating phase (1.5-2)
        lifecycleOpacity = 2 - sandData.lifecycle; // 0.5 to 0
      }

      // Movement - sand sheets flow with the wind
      mesh.position.x +=
        normalizedDirection[0] * speed * sandData.speedFactor * delta * 10;
      mesh.position.z +=
        normalizedDirection[1] * speed * sandData.speedFactor * delta * 10;

      // Height undulation - very subtle
      mesh.position.y =
        0.1 + Math.sin(state.clock.elapsedTime * 0.8 + index * 0.3) * 0.05;

      // Calculate distance to camera for fading
      const distanceToCamera = mesh.position.distanceTo(cameraPosition);

      // Set opacity based on distance to camera and lifecycle
      let targetOpacity = 0.7 * lifecycleOpacity; // Base opacity adjusted by lifecycle

      if (distanceToCamera > fadeDistance) {
        const fadeRatio =
          1 -
          (distanceToCamera - fadeDistance) /
            (visibilityDistance - fadeDistance);
        targetOpacity *= Math.max(0, Math.min(1, fadeRatio));
      }

      // Apply opacity change with smooth transition
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.opacity +=
          (targetOpacity - mesh.material.opacity) * Math.min(1, delta * 3);
      }

      // Reposition sand sheet when it moves too far from center
      const distanceFromCenter = new THREE.Vector2(
        mesh.position.x - sandAreaSize.center.x,
        mesh.position.z - sandAreaSize.center.z
      ).length();

      if (distanceFromCenter > sandAreaSize.radius || sandData.lifecycle >= 2) {
        // Calculate new entry position perpendicular to wind direction
        const perpAngle =
          Math.atan2(normalizedDirection[1], normalizedDirection[0]) +
          Math.PI / 2;

        // Random position along perimeter in upwind direction
        const entryDistance = sandAreaSize.radius * 0.8;
        const offsetFromWind =
          (Math.random() - 0.5) * sandAreaSize.radius * 0.8;

        // Calculate entry point coordinates
        const entryX =
          sandAreaSize.center.x -
          normalizedDirection[0] * entryDistance +
          Math.cos(perpAngle) * offsetFromWind;
        const entryZ =
          sandAreaSize.center.z -
          normalizedDirection[1] * entryDistance +
          Math.sin(perpAngle) * offsetFromWind;

        // Set new position
        mesh.position.set(entryX, 0.1 + Math.random() * 0.2, entryZ);

        // Reset lifecycle and opacity
        sandData.lifecycle = 0;
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.opacity = 0;
        }
      }
    });
  });

  // Initialize the meshes reference
  useEffect(() => {
    sandMeshesRef.current = [];
  }, []);

  return (
    <group ref={sandGroupRef} position={[0, 0, 0]}>
      {sandSheets.map((sand, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) sandMeshesRef.current[i] = el;
          }}
          position={new THREE.Vector3(...sand.position)}
          rotation={new THREE.Euler(...sand.rotation)}
        >
          <planeGeometry args={[sand.width, sand.height, 1, 1]} />
          <meshBasicMaterial
            map={sandTexture}
            transparent={true}
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            color={sandColor}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
