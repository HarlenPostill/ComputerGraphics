'use client';
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Canvas, useThree, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import DesertSky from './DesertSky';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// ============= SAND SHADER MATERIAL 2  =============

//TODO refactor to use original shader from demo
const sandParticlesMaterial = shaderMaterial(
  {
    time: 0,
    baseTexture: new THREE.Texture(),
    normalMap: new THREE.Texture(),
    roughnessMap: new THREE.Texture(),
    windDirection: new THREE.Vector2(1, 1),
    cloudDirection: new THREE.Vector2(0.5, 0.8),
    particleScale: 30.0,
    particleSpeed: 0.2,
    particleIntensity: 0.3,
    cloudScale: 20.0,
    cloudSpeed: 0.05,
    cloudDarkness: 0.3,
    cloudCoverage: 0.6,
  },
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normal;
      vPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  `
    uniform float time;
    uniform sampler2D baseTexture;
    uniform sampler2D normalMap;
    uniform sampler2D roughnessMap;
    uniform vec2 windDirection;
    uniform vec2 cloudDirection;
    uniform float particleScale;
    uniform float particleSpeed;
    uniform float particleIntensity;
    uniform float cloudScale;
    uniform float cloudSpeed;
    uniform float cloudDarkness;
    uniform float cloudCoverage;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;

    float hash(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      return mix(
        mix(a, b, f.x),
        mix(c, d, f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for (int i = 0; i < 6; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    float cloudNoise(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.6;
      }
      
      return smoothstep(0.3, 0.7, value);
    }

    void main() {
      vec4 baseColor = texture2D(baseTexture, vUv * 40.0);
      vec3 normal = texture2D(normalMap, vUv * 40.0).rgb * 2.0 - 1.0;
      float roughness = texture2D(roughnessMap, vUv * 40.0).r;

      vec2 movement = windDirection * time * particleSpeed;
      
      float particles = 0.0;
      
      vec2 st1 = vUv * particleScale + movement;
      particles += fbm(st1) * 0.5;
      
      vec2 st2 = vUv * (particleScale * 0.7) + movement * 1.5;
      particles += fbm(st2) * 0.3;
      
      vec2 st3 = vUv * (particleScale * 0.4) + movement * 0.7;
      particles += fbm(st3) * 0.2;

      float heightFactor = smoothstep(-10.0, 10.0, vWorldPosition.y);
      particles *= mix(0.8, 1.2, heightFactor);

      float normalFactor = dot(normalize(vNormal), vec3(0.0, 1.0, 0.0));
      particles *= mix(0.7, 1.0, normalFactor);

      vec2 cloudMovement = cloudDirection * time * cloudSpeed;
      
      float clouds = 0.0;
      vec2 cloudSt1 = vUv * cloudScale + cloudMovement;
      clouds += cloudNoise(cloudSt1) * 0.6;
      
      vec2 cloudSt2 = vUv * (cloudScale * 0.5) + cloudMovement * 0.7;
      clouds += cloudNoise(cloudSt2) * 0.4;
      
      clouds = smoothstep(1.0 - cloudCoverage, 1.0, clouds);
      
      float shadowIntensity = clouds * cloudDarkness;
      
      vec3 particleColor = mix(baseColor.rgb, baseColor.rgb * 1.2, particles * particleIntensity);
      
      float sparkle = pow(particles, 4.0) * 0.3;
      particleColor += vec3(sparkle);
      
      vec3 finalColor = mix(particleColor, particleColor * (1.0 - shadowIntensity), shadowIntensity);

      gl_FragColor = vec4(finalColor, baseColor.a);
    }
  `
);

extend({ SandParticlesMaterial: sandParticlesMaterial });

// ============= TYPES =============
interface BrushSettings {
  size: number;
  strength: number;
  falloff: number;
  mode: 'raise' | 'lower' | 'smooth' | 'flatten';
  targetHeight: number;
}

interface TerrainSettings {
  size: number;
  resolution: number;
  maxHeight: number;
  wireframe: boolean;
}

interface SandShaderSettings {
  windDirection: [number, number];
  particleScale: number;
  particleSpeed: number;
  particleIntensity: number;
  cloudScale: number;
  cloudSpeed: number;
  cloudDarkness: number;
  cloudCoverage: number;
}

interface SkySettings {
  sunPositionX: number;
  sunPositionY: number;
  sunPositionZ: number;
}

interface ThreeSceneProps {
  brushMode?: 'raise' | 'lower' | 'flatten' | 'smooth';
  brushSize?: number;
  brushStrength?: number;
}

// Add export interface
export interface ThreeSceneRef {
  exportHeightmap: () => void;
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    sandParticlesMaterial: unknown;
  }
}

// ============= SAND TEXTURE GENERATOR =============
const generateSandTexture = (resolution = 1024) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;

  const createDesertGradient = () => {
    const gradient = ctx.createLinearGradient(0, 0, resolution, resolution);
    gradient.addColorStop(0, '#e1c391');
    gradient.addColorStop(0.3, '#d3b583');
    gradient.addColorStop(0.6, '#e9cba0');
    gradient.addColorStop(0.8, '#dfc190');
    gradient.addColorStop(1, '#e5c696');
    return gradient;
  };

  ctx.fillStyle = createDesertGradient();
  ctx.fillRect(0, 0, resolution, resolution);

  const grainLayers = [
    { count: 30000, size: [0.5, 1.5], opacity: [0.1, 0.3] },
    { count: 20000, size: [1.0, 2.0], opacity: [0.05, 0.15] },
    { count: 10000, size: [1.5, 2.5], opacity: [0.03, 0.08] },
  ];

  grainLayers.forEach(layer => {
    for (let i = 0; i < layer.count; i++) {
      const x = Math.random() * resolution;
      const y = Math.random() * resolution;
      const radius = Math.random() * (layer.size[1] - layer.size[0]) + layer.size[0];
      const opacity = Math.random() * (layer.opacity[1] - layer.opacity[0]) + layer.opacity[0];

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '211,181,131' : '233,203,160'},${opacity})`;
      ctx.fill();
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

// ============= TERRAIN MESH COMPONENT =============
function TerrainMesh({
  settings,
  brushSettings,
  sandSettings,
  isPainting,
  mousePosition,
  onHeightDataChange,
}: {
  settings: TerrainSettings;
  brushSettings: BrushSettings;
  sandSettings: SandShaderSettings;
  isPainting: boolean;
  mousePosition: THREE.Vector3 | null;
  onHeightDataChange: (heightData: Float32Array, resolution: number) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.PlaneGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  useThree();

  const heightData = useRef<Float32Array>(null);
  const originalHeights = useRef<Float32Array>(null);

  const sandTexture = useMemo(() => generateSandTexture(), []);
  const [normalMap, roughnessMap] = useTexture(['/sand_normal.jpg', '/sand_roughness2.jpg']);

  useEffect(() => {
    if (!geometryRef.current) return;

    const geometry = geometryRef.current;
    const positions = geometry.attributes.position;
    heightData.current = new Float32Array(positions.count);
    originalHeights.current = new Float32Array(positions.count);

    for (let i = 0; i < positions.count; i++) {
      heightData.current[i] = 0;
      originalHeights.current[i] = 0;
    }

    // Pass initial height data to parent
    onHeightDataChange(heightData.current, settings.resolution);
  }, [settings.resolution, onHeightDataChange]);

  useFrame(state => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  const smoothTerrain = useCallback(
    (centerIndex: number, radius: number, strength: number) => {
      if (!geometryRef.current || !heightData.current) return;

      const geometry = geometryRef.current;
      const positions = geometry.attributes.position;

      let totalHeight = 0;
      let count = 0;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const centerX = positions.getX(centerIndex);
        const centerY = positions.getY(centerIndex);

        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

        if (distance <= radius) {
          totalHeight += heightData.current[i];
          count++;
        }
      }

      const averageHeight = count > 0 ? totalHeight / count : 0;

      // smoothing control
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const centerX = positions.getX(centerIndex);
        const centerY = positions.getY(centerIndex);

        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

        if (distance <= radius) {
          const falloff = 1 - Math.pow(distance / radius, brushSettings.falloff);
          const influence = falloff * strength * 0.1;
          heightData.current[i] =
            heightData.current[i] * (1 - influence) + averageHeight * influence;
        }
      }
    },
    [brushSettings.falloff]
  );

  // Paint terrain function
  const paintTerrain = useCallback(
    (point: THREE.Vector3) => {
      if (!geometryRef.current || !heightData.current || !meshRef.current) return;

      const geometry = geometryRef.current;
      const positions = geometry.attributes.position;
      const localPoint = meshRef.current.worldToLocal(point.clone());

      // closest vertex
      let closestIndex = 0;
      let closestDistance = Infinity;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const distance = Math.sqrt((x - localPoint.x) ** 2 + (y - localPoint.y) ** 2);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }

      // brush control
      const brushRadius = brushSettings.size;

      if (brushSettings.mode === 'smooth') {
        smoothTerrain(closestIndex, brushRadius, brushSettings.strength);
      } else {
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const y = positions.getY(i);
          const centerX = positions.getX(closestIndex);
          const centerY = positions.getY(closestIndex);

          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

          if (distance <= brushRadius) {
            const falloff = 1 - Math.pow(distance / brushRadius, brushSettings.falloff);
            const influence = falloff * brushSettings.strength;

            switch (brushSettings.mode) {
              case 'raise':
                heightData.current[i] += influence;
                break;
              case 'lower':
                heightData.current[i] -= influence;
                break;
              case 'flatten':
                heightData.current[i] =
                  heightData.current[i] * (1 - influence * 0.1) +
                  brushSettings.targetHeight * influence * 0.1;
                break;
            }

            // clamp for ref
            heightData.current[i] = Math.max(
              -settings.maxHeight,
              Math.min(settings.maxHeight, heightData.current[i])
            );
          }
        }
      }

      for (let i = 0; i < positions.count; i++) {
        positions.setZ(i, heightData.current[i]);
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      // Notify parent of height data changes
      onHeightDataChange(heightData.current, settings.resolution);
    },
    [brushSettings, settings.maxHeight, smoothTerrain, onHeightDataChange, settings.resolution]
  );

  // Handle painting
  useFrame(() => {
    if (isPainting && mousePosition) {
      paintTerrain(mousePosition);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <planeGeometry
        ref={geometryRef}
        args={[settings.size, settings.size, settings.resolution, settings.resolution]}
      />
      {settings.wireframe ? (
        <meshBasicMaterial wireframe color="#000000" />
      ) : (
        <sandParticlesMaterial
          ref={materialRef}
          baseTexture={sandTexture}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          windDirection={new THREE.Vector2(...sandSettings.windDirection)}
          cloudDirection={new THREE.Vector2(0.5, 0.8)}
          particleScale={sandSettings.particleScale}
          particleSpeed={sandSettings.particleSpeed}
          particleIntensity={sandSettings.particleIntensity}
          cloudScale={sandSettings.cloudScale}
          cloudSpeed={sandSettings.cloudSpeed}
          cloudDarkness={sandSettings.cloudDarkness}
          cloudCoverage={sandSettings.cloudCoverage}
          transparent
        />
      )}
    </mesh>
  );
}

// ============= BRUSH CURSOR COMPONENT =============
function BrushCursor({
  brushSettings,
  mousePosition,
}: {
  brushSettings: BrushSettings;
  mousePosition: THREE.Vector3 | null;
}) {
  if (!mousePosition) return null;

  return (
    <mesh position={[mousePosition.x, mousePosition.y + 0.1, mousePosition.z]}>
      <ringGeometry args={[brushSettings.size * 0.9, brushSettings.size, 32]} />
      <meshBasicMaterial
        color={brushSettings.mode === 'lower' ? '#ff0000' : '#00ff00'}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============= MAIN SCENE COMPONENT =============
function Scene({
  brushMode,
  brushSize,
  brushStrength,
  onHeightDataChange,
}: ThreeSceneProps & {
  onHeightDataChange: (heightData: Float32Array, resolution: number) => void;
}) {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const [mousePosition, setMousePosition] = useState<THREE.Vector3 | null>(null);
  const [isPainting, setIsPainting] = useState(false);

  // Settings
  const [terrainSettings] = useState<TerrainSettings>({
    size: 200,
    resolution: 128,
    maxHeight: 30,
    wireframe: false,
  });

  const brushSettings = useMemo<BrushSettings>(
    () => ({
      size: brushSize || 10,
      strength: (brushStrength || 50) / 100,
      falloff: 2,
      mode: brushMode || 'raise',
      targetHeight: 5,
    }),
    [brushMode, brushSize, brushStrength]
  );

  const [sandSettings] = useState<SandShaderSettings>({
    windDirection: [1, 0.5],
    particleScale: 100.0,
    particleSpeed: 1,
    particleIntensity: 1,
    cloudScale: 20.0,
    cloudSpeed: -0.25,
    cloudDarkness: 0.35,
    cloudCoverage: 0.3,
  });

  const [skySettings] = useState<SkySettings>({
    sunPositionX: 1,
    sunPositionY: 0.25,
    sunPositionZ: 0.25,
  });

  // Mouse position tracking
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();

      raycaster.current.ray.intersectPlane(plane, intersectPoint);
      setMousePosition(intersectPoint);
    },
    [camera, gl]
  );

  // Event listeners
  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = () => setIsPainting(true);
    const handleMouseUp = () => setIsPainting(false);

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gl, handleMouseMove]);

  // Comp scene
  useEffect(() => {
    scene.fog = new THREE.FogExp2('#e1c4a4', 0.0008);
    scene.background = new THREE.Color('#87CEEB');
  }, [scene]);

  return (
    <>
      <DesertSky />
      <ambientLight intensity={0.3} />
      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.85} luminanceSmoothing={0.4} />
      </EffectComposer>
      <directionalLight
        position={[
          skySettings.sunPositionX * 50,
          skySettings.sunPositionY * 80 + 20,
          skySettings.sunPositionZ * 50,
        ]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-far={500}
      />

      <TerrainMesh
        settings={terrainSettings}
        brushSettings={brushSettings}
        sandSettings={sandSettings}
        isPainting={isPainting}
        mousePosition={mousePosition}
        onHeightDataChange={onHeightDataChange}
      />

      <BrushCursor brushSettings={brushSettings} mousePosition={mousePosition} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={10}
        maxDistance={300}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.1}
        mouseButtons={{
          LEFT: isPainting ? THREE.MOUSE.ROTATE : THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />
    </>
  );
}

const ThreeScene = forwardRef<ThreeSceneRef, ThreeSceneProps>(function ThreeScene(
  { brushMode, brushSize, brushStrength },
  ref
) {
  const [dpr] = useState(1.5);
  const heightDataRef = useRef<Float32Array | null>(null);
  const resolutionRef = useRef<number>(128);

  const handleHeightDataChange = useCallback((heightData: Float32Array, resolution: number) => {
    heightDataRef.current = heightData;
    resolutionRef.current = resolution;
  }, []);

  const exportHeightmap = useCallback(() => {
    if (!heightDataRef.current) {
      console.warn('No height data available for export');
      return;
    }

    const resolution = resolutionRef.current + 1; // +1 because PlaneGeometry creates resolution+1 vertices per side
    const heightData = heightDataRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d')!;

    // Create image data
    const imageData = ctx.createImageData(resolution, resolution);
    const data = imageData.data;

    const minHeight = Math.min(...heightData);
    let maxHeight = Math.max(...heightData);

    if (maxHeight === minHeight) {
      maxHeight = minHeight + 1;
    }

    // Convert height data to grayscale image
    for (let i = 0; i < heightData.length; i++) {
      const normalizedHeight = (heightData[i] - minHeight) / (maxHeight - minHeight);
      const grayscaleValue = Math.floor(normalizedHeight * 255);

      const pixelIndex = i * 4;
      data[pixelIndex] = grayscaleValue; // Red
      data[pixelIndex + 1] = grayscaleValue; // Green
      data[pixelIndex + 2] = grayscaleValue; // Blue
      data[pixelIndex + 3] = 255; // Alpha
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert to blob and download
    canvas.toBlob(blob => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `desert-heightmap-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      exportHeightmap,
    }),
    [exportHeightmap]
  );

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 60, overflow: 'hidden' }}>
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
        <PerspectiveCamera makeDefault position={[50, 50, 50]} fov={60} />
        <Scene
          brushMode={brushMode}
          brushSize={brushSize}
          brushStrength={brushStrength}
          onHeightDataChange={handleHeightDataChange}
        />
      </Canvas>
    </div>
  );
});

export default ThreeScene;
