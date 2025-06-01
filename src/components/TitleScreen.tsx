'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import styles from './ThreeScene.module.css';
import MultiLevelDesertTerrain from './MultiLevelDesertTerrain';
import DesertSky from './DesertSky';

interface SceneParams {
  sunPositionX: number;
  sunPositionY: number;
  sunPositionZ: number;
  cloudCoverage: number;
  cloudSpeed: number;
  cloudDirectionX: number;
  cloudDirectionZ: number;

  ambientIntensity: number;
  directionalIntensity: number;
  pointLightIntensity: number;

  terrainLayers: number;
  terrainBaseSize: number;
  terrainBaseHeight: number;
  terrainSegments: number;

  particleScale: number;
  particleSpeed: number;
  particleIntensity: number;
  windDirectionX: number;
  windDirectionY: number;
  cloudShaderScale: number;
  cloudShaderSpeed: number;
  cloudDarkness: number;
  cloudShaderCoverage: number;

  bloomIntensity: number;
  bloomThreshold: number;

  fogDensity: number;
  fogColor: string;

  backgroundColor: string;
}

function Scene() {
  const { scene } = useThree();

  const params = useRef<SceneParams>({
    sunPositionX: 1,
    sunPositionY: 0.25,
    sunPositionZ: 0.25,
    cloudCoverage: 4,
    cloudSpeed: 1,
    cloudDirectionX: 0.5,
    cloudDirectionZ: -0.8,

    ambientIntensity: 0.3,
    directionalIntensity: 1.2,
    pointLightIntensity: 0.2,

    terrainLayers: 3,
    terrainBaseSize: 500,
    terrainBaseHeight: 5,
    terrainSegments: 200,

    particleScale: 100.0,
    particleSpeed: 1,
    particleIntensity: 1,
    windDirectionX: 1,
    windDirectionY: 0.5,
    cloudShaderScale: 20.0,
    cloudShaderSpeed: -0.25,
    cloudDarkness: 0.35,
    cloudShaderCoverage: 0.3,

    bloomIntensity: 0.5,
    bloomThreshold: 0.85,

    fogDensity: 0.0008,
    fogColor: '#e1c4a4',

    backgroundColor: '#87CEEB',
  });

  const [sceneParams] = useState(params.current);
  const [shouldRegenerateScene] = useState(0);

  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const pointLight1Ref = useRef<THREE.PointLight>(null);
  const pointLight2Ref = useRef<THREE.PointLight>(null);

  useEffect(() => {
    scene.background = new THREE.Color(sceneParams.backgroundColor);
    scene.fog = new THREE.FogExp2(sceneParams.fogColor, sceneParams.fogDensity);
  }, [scene, sceneParams.backgroundColor, sceneParams.fogColor, sceneParams.fogDensity]);

  return (
    <>
      <DesertSky
        sunPosition={[sceneParams.sunPositionX, sceneParams.sunPositionY, sceneParams.sunPositionZ]}
        cloudCoverage={sceneParams.cloudCoverage}
        cloudSpeed={sceneParams.cloudSpeed}
        cloudDirection={[sceneParams.cloudDirectionX, sceneParams.cloudDirectionZ]}
      />

      <EffectComposer>
        <Bloom
          intensity={sceneParams.bloomIntensity}
          luminanceThreshold={sceneParams.bloomThreshold}
          luminanceSmoothing={0.4}
        />
      </EffectComposer>

      <ambientLight ref={ambientLightRef} intensity={sceneParams.ambientIntensity} />

      <directionalLight
        ref={directionalLightRef}
        position={[
          sceneParams.sunPositionX * 50,
          sceneParams.sunPositionY * 80 + 20,
          sceneParams.sunPositionZ * 50,
        ]}
        intensity={sceneParams.directionalIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-far={500}
      />

      <pointLight
        ref={pointLight1Ref}
        position={[-50, 30, -50]}
        intensity={sceneParams.pointLightIntensity}
        color="#FFB74D"
      />
      <pointLight
        ref={pointLight2Ref}
        position={[50, 30, 50]}
        intensity={sceneParams.pointLightIntensity}
        color="#FFE0B2"
      />

      <MultiLevelDesertTerrain
        key={shouldRegenerateScene} // Force re-render
        layers={sceneParams.terrainLayers}
        baseSize={sceneParams.terrainBaseSize}
        baseHeight={sceneParams.terrainBaseHeight}
        segments={sceneParams.terrainSegments}
        shaderParams={{
          windDirection: [sceneParams.windDirectionX, sceneParams.windDirectionY],
          particleScale: sceneParams.particleScale,
          particleSpeed: sceneParams.particleSpeed,
          particleIntensity: sceneParams.particleIntensity,
          cloudScale: sceneParams.cloudShaderScale,
          cloudSpeed: sceneParams.cloudShaderSpeed,
          cloudDarkness: sceneParams.cloudDarkness,
          cloudCoverage: sceneParams.cloudShaderCoverage,
        }}
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

export default function TitleScene() {
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
        }}>
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <PerspectiveCamera makeDefault position={[0, 10, 50]} fov={75} far={10000} />
        <Scene />
      </Canvas>
    </div>
  );
}
