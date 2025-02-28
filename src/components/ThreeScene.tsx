'use client';
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import styles from './ThreeScene.module.css';

import Floor from './Floor';
import CameraControls from './CameraControls';

export default function ThreeScene() {
  return (
    <div className={styles.sceneContainer}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 1, 0]} fov={75} />
        <CameraControls speed={5.0} />
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
