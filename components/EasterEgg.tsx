import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Code, Heart, Trophy, Terminal, Cpu, Play, Sparkles, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface EasterEggProps {
  isOpen: boolean;
  onClose: () => void;
}

const MASCOT_SPRITES = [
  { src: '/mascot.png', name: 'Original Sally', mood: 'Curious' },
  { src: '/mascot-chill.png', name: 'Chill Sally', mood: 'Relaxed' },
  { src: '/mascot-build.png', name: 'Builder Sally', mood: 'Productive' },
  { src: '/mascot_sleeping.png', name: 'Sleeping Sally', mood: 'Exhausted' },
  { src: '/mascot_success.png', name: 'Winner Sally', mood: 'Exited' },
];

const MASCOT_QUOTES = [
  "Welcome to the PRISM Launch! Let's build something extraordinary! 🚀",
  "Swipe left to exit? No way! Use the hardware back gesture, I got you hooked! 📲",
  "Shhh, I'm resting after fixing 50 layout overlaps on the student's tab! 😴",
  "Did you know? Sally claps when you press Enter in communications! 👏",
  "Haptic vibrations enabled. Can you feel the heartbeat of PRISM? 💓",
  "Bream Brand & Brain logo design is 100% complete. Ready for App Store submission! 🎨",
  "Instructor OS loaded. Checking offline database... sync status: Perfect! 📂",
  "I eat raw TypeScript files for breakfast and output clean Tailwind components! ☕",
  "You found the secret dev deck! Tap the mascot to rotate moods! 🤪",
];

const DEV_STATS = [
  { label: 'Lines of Code', value: '18,421', icon: Code, color: 'text-emerald-400' },
  { label: 'Capacitor Plugins', value: '4 Loaded', icon: Cpu, color: 'text-indigo-400' },
  { label: 'Hot Reloads', value: '384 Times', icon: RefreshCw, color: 'text-teal-400' },
  { label: 'Mascot Moods', value: '5 Sprites', icon: Award, color: 'text-amber-400' },
];

export const EasterEgg: React.FC<EasterEggProps> = ({ isOpen, onClose }) => {
  const [spriteIndex, setSpriteIndex] = useState(0);
  const [quote, setQuote] = useState(MASCOT_QUOTES[0]);
  const [hapticPattern, setHapticPattern] = useState<string>('Single');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Confetti particles logic
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = (canvas.width = window.innerWidth);
      height = (canvas.height = window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];
    interface Particle {
      x: number;
      y: number;
      r: number;
      d: number;
      color: string;
      tilt: number;
      tiltAngleIncremental: number;
      tiltAngle: number;
    }

    const particles: Particle[] = Array.from({ length: 70 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      r: Math.random() * 6 + 4,
      d: Math.random() * 20 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        if (p.y > height) {
          p.x = Math.random() * width;
          p.y = -20;
          p.tilt = Math.random() * 10 - 5;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const triggerHaptics = (type: 'light' | 'medium' | 'heavy' | 'pattern') => {
    if (typeof window === 'undefined') return;

    // Direct navigator.vibrate fallback
    if ('vibrate' in navigator) {
      if (type === 'light') {
        navigator.vibrate(25);
        setHapticPattern('Light click (25ms)');
      } else if (type === 'medium') {
        navigator.vibrate(60);
        setHapticPattern('Medium bump (60ms)');
      } else if (type === 'heavy') {
        navigator.vibrate(120);
        setHapticPattern('Heavy strike (120ms)');
      } else if (type === 'pattern') {
        navigator.vibrate([100, 50, 100, 50, 150]);
        setHapticPattern('Launch rhythm 🚀');
      }
    }
  };

  const handleMascotClick = () => {
    const nextIdx = (spriteIndex + 1) % MASCOT_SPRITES.length;
    setSpriteIndex(nextIdx);
    
    // Choose a random quote
    const randomQuote = MASCOT_QUOTES[Math.floor(Math.random() * MASCOT_QUOTES.length)];
    setQuote(randomQuote);

    // Play a dual haptic click
    triggerHaptics('light');
    setTimeout(() => triggerHaptics('light'), 80);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/95 flex items-center justify-center p-4 backdrop-blur-md"
        >
          {/* Confetti Background Canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

          {/* Interactive container */}
          <motion.div
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl bg-slate-900/80 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Glowing background meshes */}
            <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
                <div>
                  <h2 className="text-xl font-black text-white tracking-wide uppercase font-mono flex items-center gap-1.5">
                    PRISM Launch Deck
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Secret</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono">Build v2.4.0-Beta • System Active</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors duration-200"
                title="Close Secret Deck"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mascot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
              {/* Mascot Bubble */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div 
                  onClick={handleMascotClick}
                  className="relative group cursor-pointer w-40 h-40 bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 rounded-full p-4 flex items-center justify-center border border-white/10 hover:border-emerald-500/50 transition-all duration-300 shadow-lg shadow-black/40 hover:scale-105"
                >
                  {/* Rotating Outer Ring */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-emerald-400/40 animate-spin" style={{ animationDuration: '30s' }} />

                  {/* Mascot image */}
                  <img
                    src={MASCOT_SPRITES[spriteIndex].src}
                    alt="Sally Mascot"
                    className="w-28 h-28 object-contain transition-transform duration-300 group-hover:rotate-6 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  />

                  {/* Badges */}
                  <span className="absolute bottom-1 right-1 bg-indigo-600 text-white font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow border border-white/20 uppercase tracking-widest">
                    {MASCOT_SPRITES[spriteIndex].mood}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-mono">Tap Mascot to Toggle Moods</p>
              </div>

              {/* Chat Speech Bubble */}
              <div className="md:col-span-7 space-y-4">
                <div className="relative bg-slate-950/80 border border-slate-800 rounded-2xl p-4 min-h-[100px] flex items-center shadow-inner">
                  {/* Bubble Triangle */}
                  <div className="hidden md:block absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-slate-950 border-l-0" />
                  
                  <div className="space-y-1 w-full">
                    <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold uppercase tracking-widest font-mono">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      Sally AI Mascot
                    </div>
                    <p className="text-sm font-semibold text-slate-100 leading-relaxed font-sans">
                      {quote}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Developer statistics */}
            <div className="mt-8 relative z-10">
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-3">Launch Engine Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DEV_STATS.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 flex flex-col items-start gap-1">
                      <div className={clsx("p-1.5 rounded-lg bg-slate-900/80 border border-slate-800", stat.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1">{stat.label}</span>
                      <span className="text-base font-black text-white font-mono">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sound / Haptic Synthesizer Pad */}
            <div className="mt-8 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Haptic Vibe Controller</h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{hapticPattern}</span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { label: 'Light Tap', type: 'light', desc: 'Tick' },
                  { label: 'Medium Bump', type: 'medium', desc: 'Click' },
                  { label: 'Heavy Strike', type: 'heavy', desc: 'Vibe' },
                  { label: 'Launch Rhythm', type: 'pattern', desc: 'Launch!' },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => triggerHaptics(item.type as any)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all duration-200 group active:scale-95"
                  >
                    <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 font-mono transition-colors">{item.label}</span>
                    <span className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-widest">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Credits & Team Row */}
            <div className="mt-8 border-t border-slate-800/80 pt-5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 flex items-center gap-1 justify-center md:justify-start">
                    Made with <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse fill-rose-500" /> by Antigravity AI
                  </p>
                  <p className="text-[10px] text-slate-400">DeepMind Advanced Coding Division</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">Launch Team:</span>
                <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-300 font-mono font-bold px-2.5 py-1 rounded-lg">PRISM Bream</span>
                <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-300 font-mono font-bold px-2.5 py-1 rounded-lg">Solar Mtaani</span>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
