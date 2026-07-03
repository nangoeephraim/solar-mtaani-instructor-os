import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    radius: number;
}

interface MeshBackgroundProps {
    className?: string;
}

export const MeshBackground: React.FC<MeshBackgroundProps> = ({ className }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const particleCount = Math.min(65, Math.floor((window.innerWidth * window.innerHeight) / 18000));
        const focalLength = 300;
        
        // 3D rotation state
        let rotX = 0;
        let rotY = 0;
        let targetRotX = 0;
        let targetRotY = 0;

        // Size adjustment
        const resize = () => {
            if (!canvas) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = canvas.parentElement?.clientWidth ? canvas.parentElement.clientWidth * dpr : window.innerWidth * dpr;
            canvas.height = canvas.parentElement?.clientHeight ? canvas.parentElement.clientHeight * dpr : window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        };

        resize();
        window.addEventListener('resize', resize);

        // Initialize particles
        const initParticles = () => {
            particles = [];
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: (Math.random() - 0.5) * w * 0.9,
                    y: (Math.random() - 0.5) * h * 0.9,
                    z: (Math.random() - 0.5) * 400,
                    vx: (Math.random() - 0.5) * 0.25,
                    vy: (Math.random() - 0.5) * 0.25,
                    vz: (Math.random() - 0.5) * 0.25,
                    radius: Math.random() * 1.5 + 1
                });
            }
        };

        initParticles();

        // Mouse listeners
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.x = e.clientX - rect.left;
            mouseRef.current.y = e.clientY - rect.top;
            mouseRef.current.active = true;

            // Rotate based on mouse movement
            const normX = (e.clientX / window.innerWidth) - 0.5;
            const normY = (e.clientY / window.innerHeight) - 0.5;
            targetRotX = normY * 0.4;
            targetRotY = normX * 0.4;
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
            targetRotX = 0;
            targetRotY = 0;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                const rect = canvas.getBoundingClientRect();
                mouseRef.current.x = e.touches[0].clientX - rect.left;
                mouseRef.current.y = e.touches[0].clientY - rect.top;
                mouseRef.current.active = true;
                
                const normX = (e.touches[0].clientX / window.innerWidth) - 0.5;
                const normY = (e.touches[0].clientY / window.innerHeight) - 0.5;
                targetRotX = normY * 0.5;
                targetRotY = normX * 0.5;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleMouseLeave);

        // Rendering and logic frame loop
        const loop = () => {
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            const centerX = width / 2;
            const centerY = height / 2;

            // Check if dark mode is active
            const isDark = document.documentElement.classList.contains('dark');
            
            // Clean minimal canvas clearing
            ctx.clearRect(0, 0, width, height);

            // Interpolate rotation
            rotX += (targetRotX - rotX) * 0.05;
            rotY += (targetRotY - rotY) * 0.05;

            // Auto rotation drift
            const autoAngleX = Date.now() * 0.00003;
            const autoAngleY = Date.now() * 0.00004;

            const finalRotX = rotX + autoAngleX;
            const finalRotY = rotY + autoAngleY;

            const cosX = Math.cos(finalRotX);
            const sinX = Math.sin(finalRotX);
            const cosY = Math.cos(finalRotY);
            const sinY = Math.sin(finalRotY);

            // Structure to hold projected 2D coordinates for rendering lines
            const projected: { x: number; y: number; z: number; scale: number; p: Particle }[] = [];

            // Update & Rotate
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Drift particles slightly
                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;

                // Box boundaries
                const limitX = width * 0.55;
                const limitY = height * 0.55;
                const limitZ = 200;

                if (Math.abs(p.x) > limitX) p.vx *= -1;
                if (Math.abs(p.y) > limitY) p.vy *= -1;
                if (Math.abs(p.z) > limitZ) p.vz *= -1;

                // 3D Rotations
                // Rotate Y
                let x1 = p.x * cosY - p.z * sinY;
                let z1 = p.z * cosY + p.x * sinY;

                // Rotate X
                let y2 = p.y * cosX - z1 * sinX;
                let z2 = z1 * cosX + p.y * sinX;

                // Projection
                const scale = focalLength / (focalLength + z2);
                const screenX = centerX + x1 * scale;
                const screenY = centerY + y2 * scale;

                projected.push({
                    x: screenX,
                    y: screenY,
                    z: z2,
                    scale: scale,
                    p: p
                });
            }

            // Draw connecting lines
            const lineDistanceLimit = 120;
            const lineColor = isDark ? '99, 102, 241' : '79, 70, 229'; // Indigo hues
            
            for (let i = 0; i < projected.length; i++) {
                const p1 = projected[i];
                for (let j = i + 1; j < projected.length; j++) {
                    const p2 = projected[j];
                    
                    // Simple Euclidean distance in 3D
                    const dx = p1.p.x - p2.p.x;
                    const dy = p1.p.y - p2.p.y;
                    const dz = p1.p.z - p2.p.z;
                    const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist3D < lineDistanceLimit) {
                        const alpha = (1 - dist3D / lineDistanceLimit) * 0.12 * Math.min(p1.scale, p2.scale);
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${lineColor}, ${alpha})`;
                        ctx.lineWidth = 0.6;
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }

                // Interactive Mouse Lines (2D connection)
                if (mouseRef.current.active) {
                    const mx = mouseRef.current.x;
                    const my = mouseRef.current.y;
                    const dx2d = p1.x - mx;
                    const dy2d = p1.y - my;
                    const dist2D = Math.sqrt(dx2d * dx2d + dy2d * dy2d);
                    const mouseRadius = 140;

                    if (dist2D < mouseRadius) {
                        const alpha = (1 - dist2D / mouseRadius) * 0.2 * p1.scale;
                        ctx.beginPath();
                        ctx.strokeStyle = isDark 
                            ? `rgba(129, 140, 248, ${alpha})` // Light Indigo/Lavender glow
                            : `rgba(79, 70, 229, ${alpha})`;  // Deeper Indigo glow
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(mx, my);
                        ctx.stroke();

                        // Gentle attraction force
                        const force = (1 - dist2D / mouseRadius) * 0.05;
                        p1.p.x -= (dx2d / dist2D) * force;
                        p1.p.y -= (dy2d / dist2D) * force;
                    }
                }
            }

            // Draw particles
            const particleFill = isDark ? 'rgba(255, 255, 255, ' : 'rgba(15, 23, 42, ';
            
            for (let i = 0; i < projected.length; i++) {
                const proj = projected[i];
                const size = proj.p.radius * proj.scale;
                
                // Depth opacity: closer particles are larger and brighter
                const opacity = Math.max(0.1, Math.min(0.6, proj.scale * 0.35));

                ctx.beginPath();
                ctx.fillStyle = `${particleFill}${opacity})`;
                ctx.arc(proj.x, proj.y, Math.max(0.4, size), 0, Math.PI * 2);
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 block pointer-events-none ${className || ''}`}
            style={{ mixBlendMode: 'normal' }}
        />
    );
};
