import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Student } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';
import { TrendingUp, User, Award, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Student3DClusterProps {
  students: Student[];
  selectedStudentId?: number;
  onSelectStudent: (id: number) => void;
  subjectFilter?: string;
}

export const Student3DCluster: React.FC<Student3DClusterProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  subjectFilter = 'All'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredStudent, setHoveredStudent] = useState<Student | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const { preferences } = useTheme();

  // Keep references for animation loop to access up-to-date data
  const studentsRef = useRef<Student[]>(students);
  studentsRef.current = students;

  const getStudentAvg = (student: Student) => {
    const vals = Object.values(student.competencies);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  // Color mapping based on student GPA
  const getNodeColor = (avg: number) => {
    if (avg >= 3.5) return '#10b981'; // green (excellent)
    if (avg >= 2.5) return '#6366f1'; // indigo (competent)
    return '#f43f5e'; // rose (at-risk)
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // --- Scene Setup ---
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 10;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 100);
    pointLight.position.set(5, 5, 10);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.3, 100);
    pointLight2.position.set(-5, -5, -10);
    scene.add(pointLight2);

    // Group for nodes
    const clusterGroup = new THREE.Group();
    scene.add(clusterGroup);

    // Node details mapping
    interface NodeData {
      id: number;
      mesh: THREE.Mesh;
      glowMesh: THREE.Mesh;
      baseColor: THREE.Color;
      targetPos: THREE.Vector3;
    }

    let nodesList: NodeData[] = [];

    // Geometry templates
    const sphereGeometry = new THREE.SphereGeometry(0.24, 16, 16);
    const ringGeometry = new THREE.RingGeometry(0.3, 0.35, 32);
    const ringMaterialBase = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });

    // Helper to calculate target positions
    const getTargetPosition = (index: number, total: number, subject: string) => {
      const vec = new THREE.Vector3();
      if (total === 0) return vec;

      if (subject === 'All') {
        // Fibonacci Sphere (3D constellation)
        const phi = Math.acos(1 - 2 * (index + 0.5) / total);
        const theta = Math.PI * (1 + Math.sqrt(5)) * index;
        const radius = 3.2;
        vec.x = radius * Math.sin(phi) * Math.cos(theta);
        vec.y = radius * Math.sin(phi) * Math.sin(theta);
        vec.z = radius * Math.cos(phi);
      } else if (subject.toLowerCase() === 'solar') {
        // Solar Panel Layout (Flat grid matrix tilted in space)
        const cols = Math.ceil(Math.sqrt(total));
        const col = index % cols;
        const row = Math.floor(index / cols);
        const spacing = 1.1;
        vec.x = (col - (cols - 1) / 2) * spacing;
        vec.y = (row - (Math.ceil(total / cols) - 1) / 2) * spacing;
        vec.z = 0;
      } else {
        // Helix layout for other subjects (ICT, etc.)
        const angle = (index / total) * Math.PI * 2 * 2.5;
        const radius = 2.4;
        vec.x = radius * Math.cos(angle);
        vec.y = (index / total - 0.5) * 4.5;
        vec.z = radius * Math.sin(angle);
      }
      return vec;
    };

    // Populate / Synchronize 3D meshes based on students list
    const syncNodes = () => {
      // Clear existing
      nodesList.forEach(node => {
        clusterGroup.remove(node.mesh);
        clusterGroup.remove(node.glowMesh);
        node.mesh.geometry.dispose();
        (node.mesh.material as THREE.Material).dispose();
        node.glowMesh.geometry.dispose();
        (node.glowMesh.material as THREE.Material).dispose();
      });
      nodesList = [];

      const currentStudents = studentsRef.current;
      currentStudents.forEach((student, idx) => {
        const avg = getStudentAvg(student);
        const colorStr = getNodeColor(avg);
        const baseColor = new THREE.Color(colorStr);

        // Core Student Sphere Mesh
        const sphereMaterial = new THREE.MeshPhongMaterial({
          color: baseColor,
          emissive: baseColor.clone().multiplyScalar(0.2),
          specular: 0xffffff,
          shadowSide: THREE.DoubleSide,
          shininess: 25,
          transparent: true,
          opacity: 0.9
        });

        const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        mesh.userData = { studentId: student.id };

        // Outer Glow Ring
        const ringMaterial = ringMaterialBase.clone();
        ringMaterial.color = baseColor;
        const glowMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        glowMesh.userData = { studentId: student.id };

        // Starting point (explodes from center)
        mesh.position.set(0, 0, 0);
        glowMesh.position.set(0, 0, 0);

        clusterGroup.add(mesh);
        clusterGroup.add(glowMesh);

        nodesList.push({
          id: student.id,
          mesh,
          glowMesh,
          baseColor,
          targetPos: getTargetPosition(idx, currentStudents.length, subjectFilter)
        });
      });
    };

    syncNodes();

    // Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let intersectedNodeId: number | null = null;

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update tooltip position relative to client page
      setTooltipPos({ x: event.clientX + 15, y: event.clientY + 15 });
    };

    const onClick = () => {
      if (intersectedNodeId !== null) {
        onSelectStudent(intersectedNodeId);
      }
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    // Animation variables
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.015;

      // Slow orbital rotate
      // When solar mode is active, lock rotation slightly so grid is readable
      if (subjectFilter.toLowerCase() === 'solar') {
        clusterGroup.rotation.y = Math.sin(time * 0.15) * 0.2;
        clusterGroup.rotation.x = Math.sin(time * 0.1) * 0.1;
      } else {
        clusterGroup.rotation.y = time * 0.05;
        clusterGroup.rotation.x = Math.sin(time * 0.05) * 0.08;
      }

      // Smooth position interpolation & animations
      nodesList.forEach((node, idx) => {
        // Lerp position to targets
        node.mesh.position.lerp(node.targetPos, 0.08);

        // Keep glow ring oriented to camera and aligned with sphere
        node.glowMesh.position.copy(node.mesh.position);
        node.glowMesh.quaternion.copy(camera.quaternion);

        // Subtle breathing/pulse animation
        const pulse = 1 + Math.sin(time * 3 + idx * 0.3) * 0.08;
        
        // Highlight active selection
        const isSelected = selectedStudentId === node.id;
        if (isSelected) {
          node.mesh.scale.set(1.4, 1.4, 1.4);
          node.glowMesh.scale.set(1.5 * pulse, 1.5 * pulse, 1.5 * pulse);
          (node.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.75 + Math.sin(time * 6) * 0.15;
        } else if (intersectedNodeId === node.id) {
          node.mesh.scale.set(1.2, 1.2, 1.2);
          node.glowMesh.scale.set(1.3, 1.3, 1.3);
          (node.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.5;
        } else {
          node.mesh.scale.set(1, 1, 1);
          node.glowMesh.scale.set(pulse, pulse, pulse);
          (node.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.25;
        }

      });

      // Raycaster check
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clusterGroup.children);

      if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        const hitId = hitObject.userData.studentId;
        
        if (intersectedNodeId !== hitId) {
          intersectedNodeId = hitId;
          const matched = studentsRef.current.find(s => s.id === hitId);
          if (matched) {
            setHoveredStudent(matched);
          }
        }
      } else {
        if (intersectedNodeId !== null) {
          intersectedNodeId = null;
          setHoveredStudent(null);
        }
      }

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
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      sphereGeometry.dispose();
      ringGeometry.dispose();
      ringMaterialBase.dispose();
    };
  }, [students, selectedStudentId, subjectFilter]);

  // Rating calculations for hover preview
  const activeStudentAvg = hoveredStudent ? getStudentAvg(hoveredStudent) : 0;

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative cursor-crosshair overflow-hidden rounded-3xl border border-white/10 dark:border-white/5 bg-slate-950/40 backdrop-blur-md"
      style={{ minHeight: '320px' }}
    >
      {/* Absolute Tech Grid Background */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/30 pointer-events-none" />

      {/* Cyber Compass Ring */}
      <div className="absolute bottom-4 right-4 text-[9px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-2 select-none">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        3D Cluster Matrix
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Glassmorphic HUD Tooltip */}
      <AnimatePresence>
        {hoveredStudent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              left: tooltipPos.x,
              top: tooltipPos.y,
              pointerEvents: 'none',
              zIndex: 9999
            }}
            className="w-60 glass-panel p-4 bg-slate-900/90 text-white rounded-2xl border border-white/20 shadow-2xl flex flex-col gap-2.5 backdrop-blur-xl animate-fade-in"
          >
            {/* Header info */}
            <div className="flex items-center gap-3">
              {hoveredStudent.photo ? (
                <img 
                  src={hoveredStudent.photo} 
                  alt={hoveredStudent.name} 
                  className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow" 
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-indigo-600/50 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
                  {hoveredStudent.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs truncate leading-tight">{hoveredStudent.name}</h4>
                <span className="text-[10px] text-slate-400">Lot {hoveredStudent.lot} • {hoveredStudent.subject}</span>
              </div>
            </div>

            {/* Sub-Metrics Row */}
            <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-white/5">
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                <span className="block text-[8px] text-slate-400 uppercase font-semibold">Attendance</span>
                <span className={clsx(
                  "font-bold text-xs",
                  hoveredStudent.attendancePct >= 80 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {hoveredStudent.attendancePct}%
                </span>
              </div>
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                <span className="block text-[8px] text-slate-400 uppercase font-semibold">GPA Rating</span>
                <span className="font-bold text-xs text-indigo-300">
                  {activeStudentAvg.toFixed(1)}/4.0
                </span>
              </div>
            </div>

            <div className="text-[9px] font-mono text-center text-slate-500 animate-pulse">
              Click to view evaluation
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
