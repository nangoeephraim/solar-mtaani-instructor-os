import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Sally3DBrainProps {
  morphTarget: 'sphere' | 'torus' | 'helix' | 'wave';
  active: boolean; // Thinking or speaking
  accentColor?: string; // Theme hex color
}

// Generate a soft radial gradient canvas texture to make particles look glowing
const createGlowingParticleTexture = (): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

export const Sally3DBrain: React.FC<Sally3DBrainProps> = ({
  morphTarget,
  active,
  accentColor = '#6366f1',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- Particle Setup ---
    const particleCount = 1200;
    const geometry = new THREE.BufferGeometry();
    
    // Arrays to hold coordinate targets
    const currentPositions = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const themeColor = new THREE.Color(accentColor);
    const altColor = new THREE.Color('#3b82f6'); // secondary highlight blue

    // Compute different shape distributions
    const getShapeCoords = (shape: string, i: number): THREE.Vector3 => {
      const vec = new THREE.Vector3();
      
      if (shape === 'sphere') {
        // Spherical distribution
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 5.0 + Math.sin(i * 0.05) * 0.3; // subtle surface variations
        vec.x = r * Math.sin(phi) * Math.cos(theta);
        vec.y = r * Math.sin(phi) * Math.sin(theta);
        vec.z = r * Math.cos(phi);
      } else if (shape === 'torus') {
        // Torus geometry distribution
        const theta = (i / particleCount) * Math.PI * 2 * 12;
        const phi = (i / particleCount) * Math.PI * 2;
        const R = 4.8; // major radius
        const r = 1.6; // minor radius
        vec.x = (R + r * Math.cos(theta)) * Math.cos(phi);
        vec.y = (R + r * Math.cos(theta)) * Math.sin(phi);
        vec.z = r * Math.sin(theta);
      } else if (shape === 'helix') {
        // Double helix along Y-axis
        const isSecondStrand = i % 2 === 0;
        const angle = (i / particleCount) * Math.PI * 2 * 6 + (isSecondStrand ? Math.PI : 0);
        const radius = 3.8;
        vec.x = radius * Math.cos(angle);
        vec.y = (i / particleCount - 0.5) * 11;
        vec.z = radius * Math.sin(angle);
      } else {
        // Wave Grid (morphTarget === 'wave')
        const cols = Math.floor(Math.sqrt(particleCount));
        const col = i % cols;
        const row = Math.floor(i / cols);
        const spacing = 0.55;
        vec.x = (col - cols / 2) * spacing;
        vec.z = (row - cols / 2) * spacing;
        vec.y = Math.sin(col * 0.4) * Math.cos(row * 0.4) * 1.5;
      }
      
      return vec;
    };

    // Initialize positions randomly in a cloud
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      
      // Starting coordinates
      currentPositions[idx] = (Math.random() - 0.5) * 20;
      currentPositions[idx + 1] = (Math.random() - 0.5) * 20;
      currentPositions[idx + 2] = (Math.random() - 0.5) * 20;

      // Color gradients (based on particle index)
      const ratio = i / particleCount;
      const mixedColor = themeColor.clone().lerp(altColor, ratio);
      colors[idx] = mixedColor.r;
      colors[idx + 1] = mixedColor.g;
      colors[idx + 2] = mixedColor.b;
      
      // Target coordinates
      const targetVec = getShapeCoords(morphTarget, i);
      targetPositions[idx] = targetVec.x;
      targetPositions[idx + 1] = targetVec.y;
      targetPositions[idx + 2] = targetVec.z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle material
    const material = new THREE.PointsMaterial({
      size: 0.32,
      map: createGlowingParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // --- Mouse Listeners ---
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current = { x, y };
    };
    container.addEventListener('mousemove', handleMouseMove);

    // --- Animation Loop ---
    let time = 0;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += active ? 0.04 : 0.015;

      const positions = geometry.attributes.position.array as Float32Array;

      // Recompute targets if morphTarget changes in prop
      // For performance, we precompute inside animate or interpolate towards it
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        
        // Calculate the target vec dynamically for morph target changes
        const targetVec = getShapeCoords(morphTarget, i);
        
        // Lerp factor
        const lerpFactor = 0.06;
        
        // Target x, y, z
        let tx = targetVec.x;
        let ty = targetVec.y;
        let tz = targetVec.z;

        // Apply active breathing/ripple noise animations
        if (active) {
          if (morphTarget === 'sphere') {
            const ripple = Math.sin(time * 3 + targetVec.y * 1.5) * 0.45;
            tx += (tx / 5) * ripple;
            ty += (ty / 5) * ripple;
            tz += (tz / 5) * ripple;
          } else if (morphTarget === 'helix') {
            tx += Math.sin(time * 4 + ty) * 0.35;
            tz += Math.cos(time * 4 + ty) * 0.35;
          } else if (morphTarget === 'torus') {
            const angle = time * 3 + i * 0.02;
            ty += Math.sin(angle) * 0.25;
            tx += Math.cos(angle) * 0.15;
          } else {
            // wave
            ty += Math.sin(time * 5 + tx * 0.8) * 0.45;
          }
        } else {
          // Subtle hover breathe when idle
          const breathe = Math.sin(time + i * 0.01) * 0.08;
          tx += tx * breathe;
          ty += ty * breathe;
          tz += tz * breathe;
        }

        // Interpolate current positions to animated target positions
        positions[idx] += (tx - positions[idx]) * lerpFactor;
        positions[idx + 1] += (ty - positions[idx + 1]) * lerpFactor;
        positions[idx + 2] += (tz - positions[idx + 2]) * lerpFactor;
      }
      
      geometry.attributes.position.needsUpdate = true;

      // Rotate particle system slowly
      particleSystem.rotation.y = time * 0.12;
      
      // Parallax camera tilt based on mouse positions
      camera.position.x += (mouseRef.current.x * 3.5 - camera.position.x) * 0.05;
      camera.position.y += (mouseRef.current.y * 3.5 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      material.dispose();
      geometry.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [morphTarget, active, accentColor]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative cursor-pointer overflow-hidden z-10 animate-fade-in"
      style={{ minHeight: '220px' }}
    />
  );
};
