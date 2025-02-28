'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import styles from './ThreeScene.module.css';
import * as THREE from 'three';

interface FloorProps {
  size?: number;
  divisions?: number;
  color?: string;
}

function Floor({ size = 20, divisions = 20, color = 'red' }: FloorProps) {
  return (
    <gridHelper args={[size, divisions, color, color]} position={[0, 0, 0]} rotation={[0, 0, 0]} />
  );
}

interface CameraControlsProps {
  speed?: number;
}

function CameraControls({ speed = 2.0 }: CameraControlsProps) {
  const { camera } = useThree();
  const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  useEffect(() => {
    camera.position.set(0, 1, 0);

    // Capture the current clock reference
    const clock = clockRef.current;

    // Reset the clock when the component mounts
    clock.start();

    const handleKeyDown = (event: KeyboardEvent) => {
      setKeysPressed(prev => ({ ...prev, [event.key]: true }));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setKeysPressed(prev => ({ ...prev, [event.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clock.stop();
    };
  }, [camera]);

  useFrame(() => {
    // Get delta time (time since last frame in seconds)
    const delta = clockRef.current.getDelta();

    // Calculate movement based on delta time and speed
    const movementDistance = speed * delta;

    // Forward/backward movement
    if (keysPressed['ArrowUp']) {
      camera.position.z -= movementDistance;
    }
    if (keysPressed['ArrowDown']) {
      camera.position.z += movementDistance;
    }

    // Left/right movement
    if (keysPressed['ArrowLeft']) {
      camera.position.x -= movementDistance;
    }
    if (keysPressed['ArrowRight']) {
      camera.position.x += movementDistance;
    }
  });

  return null;
}

export default function ExpandedThreeScene() {
  return (
    <div className={styles.sceneContainer}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 1, 0]} fov={75} />
        <CameraControls speed={20.0} />

        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />

        <Floor size={30} divisions={50} color="red" />
      </Canvas>

      <div className={styles.instructions}>
        Use arrow keys to move camera: ↑ (forward), ↓ (backward), ← (left), → (right)
      </div>
    </div>
  );
}
