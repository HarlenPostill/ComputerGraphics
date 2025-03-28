'use client';
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import styles from './ThreeScene.module.css';
import Floor from './Floor';

export default function ThreeScene() {
  return (
    <div className={styles.sceneContainer}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={75} />
        <ambientLight intensity={0.8} />
        <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        <pointLight position={[0, 15, 0]} intensity={1} color="white" />

        <Floor size={30} divisions={30} color="0x888888" />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          minDistance={5}
          maxDistance={100}
        />
      </Canvas>
    </div>
  );
}
