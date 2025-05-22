'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import styles from './ThreeScene.module.css';
import MultiLevelDesertTerrain from './MultiLevelDesertTerrain';
import DesertSky from './DesertSky';
import { GUI } from 'dat.gui';

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
  const guiRef = useRef<GUI | null>(null);

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

  const [sceneParams, setSceneParams] = useState(params.current);
  const [shouldRegenerateScene, setShouldRegenerateScene] = useState(0);

  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const pointLight1Ref = useRef<THREE.PointLight>(null);
  const pointLight2Ref = useRef<THREE.PointLight>(null);

  useEffect(() => {
    scene.background = new THREE.Color(sceneParams.backgroundColor);
    scene.fog = new THREE.FogExp2(sceneParams.fogColor, sceneParams.fogDensity);

    if (guiRef.current) {
      guiRef.current.destroy();
    }
    const gui = new GUI({ name: 'Desert Scene Controls', width: 300 });
    guiRef.current = gui;

    const skyFolder = gui.addFolder('Sky & Atmosphere');
    skyFolder
      .add(params.current, 'sunPositionX', -2, 2, 0.01)
      .name('Sun Position X')
      .onChange(() => setSceneParams({ ...params.current }));
    skyFolder
      .add(params.current, 'sunPositionY', 0, 1, 0.01)
      .name('Sun Position Y')
      .onChange(() => setSceneParams({ ...params.current }));
    skyFolder
      .add(params.current, 'sunPositionZ', -2, 2, 0.01)
      .name('Sun Position Z')
      .onChange(() => setSceneParams({ ...params.current }));
    skyFolder
      .add(params.current, 'cloudCoverage', 0, 10, 0.1)
      .name('Cloud Coverage')
      .onChange(() => setSceneParams({ ...params.current }));
    skyFolder
      .add(params.current, 'cloudSpeed', 0, 5, 0.1)
      .name('Cloud Speed')
      .onChange(() => setSceneParams({ ...params.current }));
    skyFolder
      .add(params.current, 'cloudDirectionX', -1, 1, 0.1)
      .name('Cloud Dir X')
      .onChange(() => setSceneParams({ ...params.current }));
    skyFolder
      .add(params.current, 'cloudDirectionZ', -1, 1, 0.1)
      .name('Cloud Dir Z')
      .onChange(() => setSceneParams({ ...params.current }));
    skyFolder.open();

    const lightingFolder = gui.addFolder('Lighting');
    lightingFolder
      .add(params.current, 'ambientIntensity', 0, 1, 0.01)
      .name('Ambient Intensity')
      .onChange(() => {
        if (ambientLightRef.current) {
          ambientLightRef.current.intensity = params.current.ambientIntensity;
        }
      });
    lightingFolder
      .add(params.current, 'directionalIntensity', 0, 3, 0.01)
      .name('Sun Intensity')
      .onChange(() => {
        if (directionalLightRef.current) {
          directionalLightRef.current.intensity = params.current.directionalIntensity;
        }
      });
    lightingFolder
      .add(params.current, 'pointLightIntensity', 0, 1, 0.01)
      .name('Point Light Intensity')
      .onChange(() => {
        if (pointLight1Ref.current) {
          pointLight1Ref.current.intensity = params.current.pointLightIntensity;
        }
        if (pointLight2Ref.current) {
          pointLight2Ref.current.intensity = params.current.pointLightIntensity;
        }
      });
    lightingFolder.open();

    // Terrain Controls
    const terrainFolder = gui.addFolder('Terrain');
    terrainFolder
      .add(params.current, 'terrainLayers', 1, 5, 1)
      .name('Terrain Layers')
      .onChange(() => setShouldRegenerateScene(prev => prev + 1));
    terrainFolder
      .add(params.current, 'terrainBaseSize', 100, 1000, 10)
      .name('Base Size')
      .onChange(() => setShouldRegenerateScene(prev => prev + 1));
    terrainFolder
      .add(params.current, 'terrainBaseHeight', 1, 20, 0.5)
      .name('Base Height')
      .onChange(() => setShouldRegenerateScene(prev => prev + 1));
    terrainFolder
      .add(params.current, 'terrainSegments', 50, 300, 10)
      .name('Segments')
      .onChange(() => setShouldRegenerateScene(prev => prev + 1));
    terrainFolder.open();

    // Sand Shader Controls
    const shaderFolder = gui.addFolder('Sand Effects');
    shaderFolder
      .add(params.current, 'particleScale', 10, 200, 5)
      .name('Particle Scale')
      .onChange(() => setSceneParams({ ...params.current }));
    shaderFolder
      .add(params.current, 'particleSpeed', 0, 3, 0.1)
      .name('Particle Speed')
      .onChange(() => setSceneParams({ ...params.current }));
    shaderFolder
      .add(params.current, 'particleIntensity', 0, 2, 0.1)
      .name('Particle Intensity')
      .onChange(() => setSceneParams({ ...params.current }));
    shaderFolder
      .add(params.current, 'windDirectionX', -2, 2, 0.1)
      .name('Wind Direction X')
      .onChange(() => setSceneParams({ ...params.current }));
    shaderFolder
      .add(params.current, 'windDirectionY', -2, 2, 0.1)
      .name('Wind Direction Y')
      .onChange(() => setSceneParams({ ...params.current }));
    shaderFolder
      .add(params.current, 'cloudShaderScale', 5, 50, 1)
      .name('Cloud Shadow Scale')
      .onChange(() => setSceneParams({ ...params.current }));
    shaderFolder
      .add(params.current, 'cloudShaderSpeed', -1, 1, 0.05)
      .name('Cloud Shadow Speed')
      .onChange(() => setSceneParams({ ...params.current }));
    shaderFolder
      .add(params.current, 'cloudDarkness', 0, 1, 0.05)
      .name('Cloud Darkness')
      .onChange(() => setSceneParams({ ...params.current }));
    shaderFolder
      .add(params.current, 'cloudShaderCoverage', 0, 1, 0.05)
      .name('Cloud Shadow Coverage')
      .onChange(() => setSceneParams({ ...params.current }));
    shaderFolder.open();

    // Post-processing Controls
    const postFolder = gui.addFolder('Post-Processing');
    postFolder
      .add(params.current, 'bloomIntensity', 0, 2, 0.05)
      .name('Bloom Intensity')
      .onChange(() => setSceneParams({ ...params.current }));
    postFolder
      .add(params.current, 'bloomThreshold', 0, 1, 0.05)
      .name('Bloom Threshold')
      .onChange(() => setSceneParams({ ...params.current }));

    // Environment Controls
    const envFolder = gui.addFolder('Environment');
    envFolder
      .add(params.current, 'fogDensity', 0, 0.005, 0.0001)
      .name('Fog Density')
      .onChange(() => {
        if (scene.fog && scene.fog instanceof THREE.FogExp2) {
          scene.fog.density = params.current.fogDensity;
        }
      });
    envFolder
      .addColor(params.current, 'fogColor')
      .name('Fog Color')
      .onChange(() => {
        if (scene.fog && scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.setStyle(params.current.fogColor);
        }
      });
    envFolder
      .addColor(params.current, 'backgroundColor')
      .name('Background Color')
      .onChange(() => {
        scene.background = new THREE.Color(params.current.backgroundColor);
      });

    // Cleanup function
    return () => {
      if (guiRef.current) {
        guiRef.current.destroy();
        guiRef.current = null;
      }
    };
  }, [scene]);

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
        }}>
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <PerspectiveCamera makeDefault position={[0, 10, 50]} fov={75} far={10000} />
        <Scene />
      </Canvas>
    </div>
  );
}
