"use client";
import React, { forwardRef, useRef, useEffect } from "react";
import * as THREE from "three";
import { extend, useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

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

    void main() {
      vUv = uv;
      vNormal = normal;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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

    // Function specifically for cloud patterns
    float cloudNoise(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      // Use fewer octaves for smoother clouds
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.6;
      }
      
      // Adjust to get more defined cloud shapes
      return smoothstep(0.3, 0.7, value);
    }

    void main() {
      vec4 baseColor = texture2D(baseTexture, vUv);
      vec3 normal = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
      float roughness = texture2D(roughnessMap, vUv).r;

      vec2 movement = windDirection * time * particleSpeed;
      
      float particles = 0.0;
      
      vec2 st1 = vUv * particleScale + movement;
      particles += fbm(st1) * 0.5;
      
      vec2 st2 = vUv * (particleScale * 0.7) + movement * 1.5;
      particles += fbm(st2) * 0.3;
      
      vec2 st3 = vUv * (particleScale * 0.4) + movement * 0.7;
      particles += fbm(st3) * 0.2;

      float heightFactor = smoothstep(-2.0, 2.0, vPosition.y);
      particles *= mix(0.8, 1.2, heightFactor);

      float normalFactor = dot(normalize(normal), vec3(0.0, 1.0, 0.0));
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

interface SandParticlesProps {
  baseTexture: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  windDirection?: [number, number];
  cloudDirection?: [number, number];
  particleScale?: number;
  particleSpeed?: number;
  particleIntensity?: number;
  cloudScale?: number;
  cloudSpeed?: number;
  cloudDarkness?: number;
  cloudCoverage?: number;
}

declare module "@react-three/fiber" {
  interface ThreeElements {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sandParticlesMaterial: any;
  }
}

// eslint-disable-next-line react/display-name
export const SandParticlesEffect = forwardRef<
  THREE.ShaderMaterial,
  SandParticlesProps
>(
  (
    {
      baseTexture,
      normalMap,
      roughnessMap,
      windDirection = [1, 1],
      cloudDirection = [0.5, 0.8],
      particleScale = 30.0,
      particleSpeed = 0.2,
      particleIntensity = 0.3,
      cloudScale = 10.0,
      cloudSpeed = -0.25,
      cloudDarkness = 0.35,
      cloudCoverage = 0.3,
    },
    ref
  ) => {
    const localRef = useRef<THREE.ShaderMaterial>(null);

    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(localRef.current);
        } else {
          ref.current = localRef.current;
        }
      }
    }, [ref]);

    useFrame((state) => {
      if (localRef.current) {
        localRef.current.uniforms.time.value = state.clock.getElapsedTime();
      }
    });

    return (
      <sandParticlesMaterial
        ref={localRef}
        baseTexture={baseTexture}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        windDirection={new THREE.Vector2(...windDirection)}
        cloudDirection={new THREE.Vector2(...cloudDirection)}
        particleScale={particleScale}
        particleSpeed={particleSpeed}
        particleIntensity={particleIntensity}
        cloudScale={cloudScale}
        cloudSpeed={cloudSpeed}
        cloudDarkness={cloudDarkness}
        cloudCoverage={cloudCoverage}
        transparent
      />
    );
  }
);
