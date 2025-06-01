'use client';
import { useState } from 'react';
import ControlPanel from '@/components/ControlPanel';
import ThreeScene from '@/components/ThreeScene';
import TitleScene from '@/components/TitleScreen';

export default function Home() {
  const [brushMode, setBrushMode] = useState<'raise' | 'lower' | 'flatten' | 'smooth'>('raise');
  const [brushSize, setBrushSize] = useState(10);
  const [brushStrength, setBrushStrength] = useState(50);
  const [showTerrain, setShowTerrain] = useState(false);

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
      <div
        style={{
          width: '100%',
          textAlign: 'center',
          justifyContent: 'space-between',
          display: 'flex',
        }}>
        <h1>Desert Painter</h1>
        {showTerrain ? (
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 30,
              }}>
              file_download
            </span>
            <h3>Export Terrain Map</h3>
          </button>
        ) : (
          <></>
        )}
      </div>
      {!showTerrain ? (
        <>
          <TitleScene />
          <div
            style={{
              width: '100%',
              position: 'absolute',
              height: '100%',
              top: 0,
              left: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <button
              style={{
                fontSize: 60,
                backgroundColor: '#EAF0F0',
                color: '#434D4D',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                padding: 20,
                borderRadius: 10,
                border: '8px solid #9CA8A8',
                cursor: 'pointer',
              }}
              onClick={handleCreateTerrainClick}>
              Create New Desert
            </button>
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
