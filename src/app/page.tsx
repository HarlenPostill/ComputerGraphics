'use client';
import { useState } from 'react';
import ControlPanel from '@/components/ControlPanel';
import ThreeScene from '@/components/ThreeScene';
import TitleScene from '@/components/TitleScreen';

export default function Home() {
  const [brushMode, setBrushMode] = useState<'raise' | 'lower' | 'flatten' | 'smooth'>('raise');
  const [brushSize, setBrushSize] = useState(10);
  const [brushStrength, setBrushStrength] = useState(50);
  const [showTerrain, setShowTerrain] = useState(false); // New state variable

  const handleBrushModeChange = (mode: 'raise' | 'lower' | 'flatten' | 'smooth') => {
    setBrushMode(mode);
  };

  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
  };

  const handleBrushStrengthChange = (strength: number) => {
    setBrushStrength(strength);
  };

  const handleCreateTerrainClick = () => {
    setShowTerrain(true);
  };

  return (
    <div
      style={{
        height: '100vh',
        padding: 30,
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {!showTerrain ? (
        <>
          <TitleScene />
          <div style={{ width: '100%', position: 'absolute', height: '100%', top: 0, left: 0, justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={handleCreateTerrainClick}>Create Terrain</button>
          </div>
        </>
      ) : (
        <div
          style={{
            height: '100vh',
            padding: 30,
            width: '100vw',
            display: 'flex',
            flexDirection: 'row',
            gap: 30,
          }}>
          <ThreeScene brushMode={brushMode} brushSize={brushSize} brushStrength={brushStrength} />
          <ControlPanel
            onBrushModeChange={handleBrushModeChange}
            onBrushSizeChange={handleBrushSizeChange}
            onBrushStrengthChange={handleBrushStrengthChange}
            initialBrushMode={brushMode}
            initialBrushSize={brushSize}
            initialBrushStrength={brushStrength}
          />
        </div>
      )}
    </div>
  );
}
