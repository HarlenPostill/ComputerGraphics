'use client';

import React, { useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import styles from './ThreeScene.module.css';

interface FloorProps {
  size?: number;
  divisions?: number;
  color?: string;
}

function Floor({ size = 20, divisions = 20, color = 'red' }: FloorProps) {
  return (
    <gridHelper args={[size, divisions, color, color]} position={[0, -5, 0]} rotation={[0, 0, 0]} />
  );
}

interface CameraControlsProps {
  speed?: number;
}

function CameraControls({ speed = 0.5 }: CameraControlsProps) {
  const { camera } = useThree();
  const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, 0, 10);

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
    };
  }, [camera]);

  useFrame(() => {
    // Forward/backward movement
    if (keysPressed['ArrowUp']) {
      camera.position.z -= speed;
    }
    if (keysPressed['ArrowDown']) {
      camera.position.z += speed;
    }
    // Left/right movement
    if (keysPressed['ArrowLeft']) {
      camera.position.x -= speed;
    }
    if (keysPressed['ArrowRight']) {
      camera.position.x += speed;
    }
  });

  return null;
}

export default function ExpandedThreeScene() {
  return (
    <div className={styles.sceneContainer}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={75} />
        <CameraControls />

        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />

        <Floor size={30} divisions={30} color="red" />
      </Canvas>

      <div className={styles.instructions}>
        Use arrow keys to move camera position: ↑ (forward), ↓ (backward), ← (left), → (right)
      </div>
    </div>
  );
}
