import React, { useState, useEffect } from 'react';

interface ControlPanelProps {
  onBrushModeChange?: (mode: 'raise' | 'lower' | 'flatten' | 'smooth') => void;
  onBrushSizeChange?: (size: number) => void;
  onBrushStrengthChange?: (strength: number) => void;
  initialBrushMode?: 'raise' | 'lower' | 'flatten' | 'smooth';
  initialBrushSize?: number;
  initialBrushStrength?: number;
}

export default function ControlPanel({
  onBrushModeChange,
  onBrushSizeChange,
  onBrushStrengthChange,
  initialBrushMode = 'raise',
  initialBrushSize = 10,
  initialBrushStrength = 50,
}: ControlPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedTool, setSelectedTool] = useState(initialBrushMode);
  const [brushSize, setBrushSize] = useState(initialBrushSize);
  const [brushStrength, setBrushStrength] = useState(initialBrushStrength);

  useEffect(() => {
    onBrushModeChange?.(selectedTool);
  }, [selectedTool, onBrushModeChange]);

  useEffect(() => {
    onBrushSizeChange?.(brushSize);
  }, [brushSize, onBrushSizeChange]);

  useEffect(() => {
    onBrushStrengthChange?.(brushStrength);
  }, [brushStrength, onBrushStrengthChange]);

  const tools = [
    { id: 'raise' as const, icon: 'altitude', label: 'Raise' },
    { id: 'lower' as const, icon: 'elevation', label: 'Lower' },
    { id: 'flatten' as const, icon: 'compress', label: 'Flatten' },
    { id: 'smooth' as const, icon: 'text_select_move_down', label: 'Smooth' },
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleToolSelect = (toolId: 'raise' | 'lower' | 'flatten' | 'smooth') => {
    setSelectedTool(toolId);
  };

  if (isCollapsed) {
    return (
      <div
        style={{
          width: 60,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#DEE4E4',
          overflow: 'hidden',
          borderRadius: 30,
          padding: 15,
          gap: 12,
          alignItems: 'center',
        }}>
        {/* Expand button */}
        <div
          onClick={toggleCollapse}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 5,
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            right_panel_open
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#434D4D' }}>
            format_paint
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            backgroundColor: '#EAF0F0',
            borderRadius: 8,
            border: '2px solid #9CA8A8',
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {tools.find(tool => tool.id === selectedTool)?.icon}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#434D4D' }}>
            format_ink_highlighter
          </span>
        </div>

        <div
          style={{
            width: 4,
            height: 30,
            backgroundColor: '#CED6D6',
            borderRadius: 2,
            position: 'relative',
          }}>
          <div
            style={{
              width: '100%',
              height: `${brushSize}%`,
              backgroundColor: '#9CA8A8',
              borderRadius: 2,
              position: 'absolute',
              bottom: 0,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#434D4D' }}>
            fitness_center
          </span>
        </div>

        <div
          style={{
            width: 4,
            height: 30,
            backgroundColor: '#CED6D6',
            borderRadius: 2,
            position: 'relative',
          }}>
          <div
            style={{
              width: '100%',
              height: `${brushStrength}%`,
              backgroundColor: '#9CA8A8',
              borderRadius: 2,
              position: 'absolute',
              bottom: 0,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 500,
        gap: 16,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#DEE4E4',
        overflow: 'hidden',
        borderRadius: 60,
        padding: 35,
        transition: 'all 0.3s ease-in-out',
      }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}>
        <h3 style={{ color: '#434D4D', fontWeight: 800, margin: 0 }}>Control Panel</h3>
        <span
          className="material-symbols-outlined"
          onClick={toggleCollapse}
          style={{ cursor: 'pointer', color: '#434D4D' }}>
          right_panel_close
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="material-symbols-outlined" style={{ color: '#434D4D' }}>
          format_paint
        </span>
        <h4 style={{ margin: 0, color: '#434D4D' }}>Brush</h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', width: '100%', gap: 16, height: 108 }}>
          {tools.slice(0, 2).map(tool => (
            <div
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                backgroundColor: selectedTool === tool.id ? '#D4E0E0' : '#EAF0F0',
                borderRadius: 20,
                border: selectedTool === tool.id ? '2px solid #9CA8A8' : '2px solid #CED6D6',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
              }}>
              <span
                className="material-symbols-outlined"
                style={{
                  color: selectedTool === tool.id ? '#2A3333' : '#434D4D',
                  fontSize: 24,
                }}>
                {tool.icon}
              </span>
              <h4
                style={{
                  margin: 0,
                  color: selectedTool === tool.id ? '#2A3333' : '#434D4D',
                  fontWeight: selectedTool === tool.id ? 700 : 600,
                }}>
                {tool.label}
              </h4>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', width: '100%', gap: 16, height: 108 }}>
          {tools.slice(2, 4).map(tool => (
            <div
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                backgroundColor: selectedTool === tool.id ? '#D4E0E0' : '#EAF0F0',
                borderRadius: 20,
                border: selectedTool === tool.id ? '2px solid #9CA8A8' : '2px solid #CED6D6',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
              }}>
              <span
                className="material-symbols-outlined"
                style={{
                  color: selectedTool === tool.id ? '#2A3333' : '#434D4D',
                  fontSize: 24,
                }}>
                {tool.icon}
              </span>
              <h4
                style={{
                  margin: 0,
                  color: selectedTool === tool.id ? '#2A3333' : '#434D4D',
                  fontWeight: selectedTool === tool.id ? 700 : 600,
                }}>
                {tool.label}
              </h4>
            </div>
          ))}
        </div>
      </div>

      {/* Brush Size */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="material-symbols-outlined" style={{ color: '#434D4D' }}>
          format_ink_highlighter
        </span>
        <h4 style={{ margin: 0, color: '#434D4D' }}>Brush Size</h4>
        <span style={{ marginLeft: 'auto', color: '#434D4D', fontSize: 14 }}>{brushSize}</span>
      </div>
      <input
        type="range"
        min={1}
        max={50}
        value={brushSize}
        onChange={e => setBrushSize(parseInt(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          background: '#CED6D6',
          appearance: 'none',
          cursor: 'pointer',
        }}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="material-symbols-outlined" style={{ color: '#434D4D' }}>
          fitness_center
        </span>
        <h4 style={{ margin: 0, color: '#434D4D' }}>Brush Strength</h4>
        <span style={{ marginLeft: 'auto', color: '#434D4D', fontSize: 14 }}>{brushStrength}%</span>
      </div>
      <input
        type="range"
        min={1}
        max={100}
        value={brushStrength}
        onChange={e => setBrushStrength(parseInt(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          background: '#CED6D6',
          appearance: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
