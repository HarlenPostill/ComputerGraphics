'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer();

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: '#fff', wireframe: false });
  const cube = new THREE.Mesh(geometry, material);
  const cube2 = new THREE.Mesh(
    new THREE.BoxGeometry(window.innerWidth, 5, 1),
    new THREE.MeshBasicMaterial({ color: '#0078D4' })
  );
  cube2.position.z = -3;
  scene.add(cube);

  scene.add(cube2);

  const renderScene = () => {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    cube.position.x = 0.5 * Math.tan(Date.now() * 0.001);
    renderer.render(scene, camera);
    requestAnimationFrame(renderScene);
  };

  const handleResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);

      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current?.appendChild(renderer.domElement);

      renderScene();

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return <div ref={containerRef} />;
};
