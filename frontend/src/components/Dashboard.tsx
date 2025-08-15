import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import io from 'socket.io-client';
// @ts-ignore
import { speak } from 'expo-speech';

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001');

const Dashboard: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 3D Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(600, 400);
    if (mountRef.current) mountRef.current.appendChild(renderer.domElement);
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    camera.position.z = 5;
    function animate() {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    animate();
    // Socket.io price updates
    socket.on('priceUpdate', (data: any) => {
      speak('Price updated');
    });
    return () => {
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      socket.off('priceUpdate');
    };
  }, []);

  return <div ref={mountRef} style={{ direction: 'rtl', textAlign: 'right' }}>3D Dashboard (Arabic RTL, Voice, Collab, Badges, Prayer Alerts)</div>;
};

export default Dashboard;
