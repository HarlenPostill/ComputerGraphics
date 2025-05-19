"use client";
import React, { useState, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  PerformanceMonitor,
} from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import styles from "./ThreeScene.module.css";
import MultiLevelDesertTerrain from "./MultiLevelDesertTerrain";
import DesertSky from "./DesertSky";

function Scene() {
  const { scene } = useThree();
  const sunPosition = useRef<[number, number, number]>([50, 80, 50]);

  useEffect(() => {
    scene.background = new THREE.Color("#87CEEB");
    scene.fog = new THREE.FogExp2("#e1c4a4", 0.0008);
  }, [scene]);

  return (
    <>
      <DesertSky />

      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.4}
        />
      </EffectComposer>

      <ambientLight intensity={0.3} />
      <directionalLight
        position={sunPosition.current}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-far={500}
      />

      {/* will adjust lighting to match later */}
      <pointLight position={[-50, 30, -50]} intensity={0.2} color="#FFB74D" />
      <pointLight position={[50, 30, 50]} intensity={0.2} color="#FFE0B2" />

      <MultiLevelDesertTerrain
        layers={1}
        baseSize={500}
        baseHeight={3}
        segments={200}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={10}
        maxDistance={500}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </>
  );
}

export default function ThreeScene() {
  const [dpr, setDpr] = useState(1.5);

  return (
    <div className={styles.sceneContainer}>
      <Canvas
        shadows
        dpr={dpr}
        gl={{
          antialias: true,
          logarithmicDepthBuffer: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(1.5)}
        />
        <PerspectiveCamera
          makeDefault
          position={[0, 10, 50]}
          fov={75}
          far={10000}
        />
        <Scene />
      </Canvas>
    </div>
  );
}
