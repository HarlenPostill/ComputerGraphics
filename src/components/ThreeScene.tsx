'use client';
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import styles from './ThreeScene.module.css';

import Floor from './Floor';
import MöbiusStrip from './MöbiusStrip';
import CameraControls from './CameraControls';

export default function ThreeScene() {
  const [wireframe, setWireframe] = useState(false);

  return (
    <div className={styles.sceneContainer}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 2, 0]} fov={75} />
        <CameraControls speed={5.0} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <MöbiusStrip
          position={[0, 2, 0]}
          radius={0.5}
          tubeRadius={0.2}
          tubularSegments={96}
          tubularRadiusSegments={24}
          wireframe={wireframe}
          rotation={true}
          rotationSpeed={2}
        />
        <Floor size={30} divisions={50} color="black" />
        <OrbitControls />
      </Canvas>
      <div className={styles.controls}>
        <div className={styles.instructions}>
          Use arrow keys to move camera: ↑ (forward), ↓ (backward), ← (left), → (right)
        </div>
        <button className={styles.wireframeButton} onClick={() => setWireframe(!wireframe)}>
          Toggle Wireframe
        </button>
      </div>
    </div>
  );
}
