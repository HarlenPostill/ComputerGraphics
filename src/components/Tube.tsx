import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type MovementType = 'straight' | 'turns' | 'spiral' | 'random';

export interface TubeProps {
  startPosition: [number, number, number];
  movementType: MovementType;
  moveSpeed: number;
  color: number | string;
  wireframe: boolean;
  maxLength?: number;
  radius: number;
}

interface SpiralConfig {
  radius: number;
  angle: number;
  height: number;
  direction: THREE.Vector3;
}
const Tube: React.FC<TubeProps> = ({
  startPosition,
  movementType,
  moveSpeed,
  color,
  wireframe,
  maxLength = 250, // set value for now //TODO modularise
  radius,
}) => {
  const [points, setPoints] = useState<THREE.Vector3[]>(() => [
    new THREE.Vector3(...startPosition),
  ]);
  const [isGrowing, setIsGrowing] = useState<boolean>(true);
  const directionRef = useRef<THREE.Vector3>(
    new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize()
  );

  const spiral = useRef<SpiralConfig>({
    radius: 0.5 + Math.random() * 1.5,
    angle: 0,
    height: 0.2 + Math.random() * 0.3,
    direction: new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize(),
  });

  const turnCounter = useRef<number>(0);
  const lastTurnTime = useRef<number>(0);

  useFrame((_, delta) => {
    if (!isGrowing) return;

    const lastPoint = points[points.length - 1].clone();
    let newPoint = lastPoint.clone();

    switch (movementType) {
      case 'straight':
        newPoint.add(directionRef.current.clone().multiplyScalar(moveSpeed * delta));
        break;

      case 'turns':
        turnCounter.current += delta;
        // Force a turn after a random amount of time (1-2 seconds)
        if (turnCounter.current - lastTurnTime.current > 1 + Math.random()) {
          lastTurnTime.current = turnCounter.current;

          // Create a completely new direction vector rather than modifying just one axis
          const newDir = new THREE.Vector3(0, 0, 0);

          // Pick a random axis and set it to 1 or -1
          const axes = ['x', 'y', 'z'] as const;
          const primaryAxis = axes[Math.floor(Math.random() * axes.length)];
          if (primaryAxis === 'x') newDir.x = Math.random() > 0.5 ? 1 : -1;
          else if (primaryAxis === 'y') newDir.y = Math.random() > 0.5 ? 1 : -1;
          else if (primaryAxis === 'z') newDir.z = Math.random() > 0.5 ? 1 : -1;

          // Set this as our new direction
          directionRef.current.copy(newDir.normalize());
        }

        newPoint.add(directionRef.current.clone().multiplyScalar(moveSpeed * delta));
        break;

      case 'spiral':
        spiral.current.angle += 0.1 * moveSpeed * delta;

        // Create a local coordinate system for the spiral
        const forward = spiral.current.direction;
        const right = new THREE.Vector3(1, 0, 0);
        if (Math.abs(forward.y) < 0.99) {
          right.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
        } else {
          right.crossVectors(new THREE.Vector3(0, 0, 1), forward).normalize();
        }
        const up = new THREE.Vector3().crossVectors(forward, right);

        // Calculate spiral point
        const spiralRadius = spiral.current.radius;
        const x = Math.cos(spiral.current.angle) * spiralRadius;
        const y = Math.sin(spiral.current.angle) * spiralRadius;
        const z = spiral.current.angle * spiral.current.height;

        // Transform to world space
        newPoint = new THREE.Vector3();
        newPoint.addScaledVector(right, x);
        newPoint.addScaledVector(up, y);
        newPoint.addScaledVector(forward, z);
        newPoint.add(points[0]); // Add to the start position
        break;

      case 'random':
        directionRef.current
          .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
          .normalize();
        newPoint.add(directionRef.current.clone().multiplyScalar(moveSpeed * delta));
        break;
    }

    // Update points
    setPoints(prevPoints => {
      const newPoints = [...prevPoints, newPoint];

      // If we need more precise control, we can calculate based on time elapsed
      const pointsBasedOnTime = Math.floor(maxLength); //TODO fix value

      // Stop growing if we've reached maximum length based on growTime or absolute max
      if (newPoints.length >= Math.min(pointsBasedOnTime, maxLength)) {
        setIsGrowing(false);
      }

      return newPoints;
    });
  });

  useEffect(() => {
    // Ensure we have a minimum of 2 points for the tube geometry
    if (points.length < 2) {
      const tempPoint = points[0].clone();
      tempPoint.add(directionRef.current.clone().multiplyScalar(0.01));
      setPoints(prevPoints => [prevPoints[0], tempPoint]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // We only want this to run once on mount, and we handle the points dependency with a functional update

  if (points.length < 2) return null;

  // Create the tube geometry
  const path = new THREE.CatmullRomCurve3(points);

  return (
    <mesh>
      <tubeGeometry args={[path, points.length, radius / 10, 8, false]} />
      <meshStandardMaterial
        color={color}
        wireframe={wireframe}
        roughness={0.3}
        metalness={0.9}
        emissive={color}
        emissiveIntensity={0.6}
        toneMapped={false}
      />
    </mesh>
  );
};

export default Tube;
