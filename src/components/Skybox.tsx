'use client';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { CubeTextureLoader } from 'three';

const SKYBOX_URLS = {
  desert: [
    'public/textures/skybox/nx.jpg', // right
    '/public/textures/skybox/px.jpg', // left
    'public/textures/skybox/py.jpg', // top
    'public/textures/skybox/ny.jpg', // bottom
    'public/textures/skybox/pz.jpg', // front
    'public/textures/skybox/nz.jpg', // back
  ],
};

interface SkyboxProps {
  preset?: 'desert';
  size?: number;
}

export default function Skybox({ preset = 'desert' }: SkyboxProps) {
  const { scene } = useThree();

  useEffect(() => {
    const loader = new CubeTextureLoader();
    const texture = loader.load(SKYBOX_URLS[preset]);
    scene.background = texture;

    return () => {
      scene.background = null;
    };
  }, [scene, preset]);

  return null;
}
