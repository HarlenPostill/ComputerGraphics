'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import styles from './ThreeScene.module.css';
import Tube, { MovementType } from './Tube';
import Floor from './Floor';

interface TubeData {
  id: number;
  startPosition: [number, number, number];
  color: number;
}

interface Settings {
  wireframe: boolean;
  movementType: MovementType;
  spawnRate: number;
  moveSpeed: number;
  maxTubes: number;
}

export default function ThreeScene() {
  const [tubes, setTubes] = useState<TubeData[]>([]);
  const [controlToggle, setControlToggle] = useState<boolean>();
  const [settings, setSettings] = useState<Settings>({
    wireframe: false,
    movementType: 'turns',
    spawnRate: 1,
    moveSpeed: 10,
    maxTubes: 15,
  });

  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tubeIdCounter = useRef<number>(0);

  // Handle spawning based on spawn rate
  useEffect(() => {
    // Define spawnTube inside the effect to avoid dependency issues
    const spawnTubeInEffect = () => {
      if (tubes.length >= settings.maxTubes) return;

      const newTube: TubeData = {
        id: tubeIdCounter.current++,
        startPosition: [Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10],
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5).getHex(),
      };

      setTubes(prev => [...prev, newTube]);
    };

    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
    }

    // Set up the spawn interval
    if (settings.spawnRate > 0) {
      spawnTimerRef.current = setInterval(spawnTubeInEffect, 1000 / settings.spawnRate);
    }

    // Cleanup on unmount
    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
      }
    };
  }, [settings.spawnRate, settings.maxTubes, tubes.length]);

  // Clear all tubes
  const clearTubes = () => {
    setTubes([]);
  };

  const toggleControls = () => {
    setControlToggle(prev => !prev);
  };

  // Update a specific setting
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.sceneContainer}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={75} />
        <ambientLight intensity={0.8} />
        <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        <pointLight position={[0, 15, 0]} intensity={1} color="white" />

        {tubes.map(tube => (
          <Tube
            key={tube.id}
            startPosition={tube.startPosition}
            movementType={settings.movementType}
            moveSpeed={settings.moveSpeed}
            color={tube.color}
            wireframe={settings.wireframe}
          />
        ))}

        <Floor size={30} divisions={30} color="0x888888" />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          minDistance={5}
          maxDistance={100}
        />
      </Canvas>
      <div className={styles.controls}>
        <button className={styles.toggleButton} onClick={toggleControls}>
          Toggle Settings
        </button>
        {controlToggle || (
          <>
            <div className={styles.controlGroup}>
              <br />
              <label>Movement Type</label>
              <select
                value={settings.movementType}
                onChange={e => updateSetting('movementType', e.target.value as MovementType)}
                className={styles.select}>
                <option value="straight">Straight Lines</option>
                <option value="turns">90° Turns</option>
                <option value="spiral">Spiral</option>
                <option value="random">Random</option>
              </select>
            </div>
            <div className={styles.controlGroup}>
              <label>Spawn Rate</label>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={settings.spawnRate}
                onChange={e => updateSetting('spawnRate', parseFloat(e.target.value))}
                className={styles.slider}
              />
              <span>{settings.spawnRate.toFixed(1)} tubes/sec</span>
            </div>
            <div className={styles.controlGroup}>
              <label>Movement Speed</label>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={settings.moveSpeed}
                onChange={e => updateSetting('moveSpeed', parseFloat(e.target.value))}
                className={styles.slider}
              />
              <span>{settings.moveSpeed.toFixed(1)}</span>
            </div>
            <div className={styles.controlGroup}>
              <label>Max Tubes</label>
              <input
                type="range"
                min="10"
                max="50"
                step="1"
                value={settings.maxTubes}
                onChange={e => updateSetting('maxTubes', parseInt(e.target.value))}
                className={styles.slider}
              />
              <span>{settings.maxTubes}</span>
            </div>
            <div className={styles.controlGroup}>
              <label>Wireframe</label>
              <input
                type="checkbox"
                checked={settings.wireframe}
                onChange={e => updateSetting('wireframe', e.target.checked)}
                className={styles.checkbox}
              />
            </div>
            <button className={styles.clearButton} onClick={clearTubes}>
              Clear All Tubes
            </button>
          </>
        )}
      </div>
    </div>
  );
}
