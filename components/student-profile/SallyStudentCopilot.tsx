import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Student } from '../../types';
import { Sparkles, MessageSquare, AlertTriangle, CheckCircle2, Copy, Send, HelpCircle, BookOpen, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useToast } from '../Toast';

interface SallyStudentCopilotProps {
  student: Student;
  onNavigate?: (view: string, studentId?: number) => void;
}

export const SallyStudentCopilot: React.FC<SallyStudentCopilotProps> = ({ student, onNavigate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeBrief, setActiveBrief] = useState<string>('');
  const [showSMSModal, setShowSMSModal] = useState(false);
  const { showToast } = useToast();
  const pulseCanvasRef = useRef<HTMLCanvasElement>(null);

  // Compute metrics
  const getStudentAvg = (s: Student) => {
    const vals = Object.values(s.competencies);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const gpa = getStudentAvg(student);
  const strengths = useMemo(() => {
    return Object.entries(student.competencies)
      .filter(([_, score]) => score >= 3.2)
      .map(([name]) => name);
  }, [student.competencies]);

  const weaknesses = useMemo(() => {
    return Object.entries(student.competencies)
      .filter(([_, score]) => score < 2.5)
      .map(([name]) => name);
  }, [student.competencies]);

  // Dynamic AI Text generation mock (super fast, context-aware)
  const generateBrief = () => {
    setIsGenerating(true);
    setTimeout(() => {
      let brief = `### 🌟 Academic Status Briefing\n`;
      brief += `**${student.name}** is currently enrolled in **${student.subject}** (${student.studentGroup}) with a cumulative average performance rating of **${gpa.toFixed(1)}/4.0**.\n\n`;

      if (strengths.length > 0) {
        brief += `#### Key Assets & Core Strengths:\n`;
        brief += `• Demonstrates high-tier mastery in **${strengths.slice(0, 2).join(', ')}**.\n`;
      }

      if (weaknesses.length > 0) {
        brief += `#### Knowledge Gaps & Remedial Focus:\n`;
        brief += `• Needs immediate review in **${weaknesses.slice(0, 2).join(', ')}** to bridge operational standards.\n`;
      } else {
        brief += `• Exhibiting stable, balanced competency gains across all current learning units.\n`;
      }

      if (student.attendancePct < 80) {
        brief += `\n⚠️ **Operational Warning:** Attendance is critical at **${student.attendancePct}%**. Low session presence is compounding review lag.`;
      } else if (student.attendancePct >= 95) {
        brief += `\n📈 **Engagement Boost:** Attendance is exceptional at **${student.attendancePct}%**, indicating high participation indexes.`;
      }

      setActiveBrief(brief);
      setIsGenerating(false);
    }, 800);
  };

  useEffect(() => {
    generateBrief();
  }, [student]);

  // Pulse canvas animation (Pulsing cyber orb representing Sally AI)
  useEffect(() => {
    const canvas = pulseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const w = canvas.width = 80;
    const h = canvas.height = 80;

    const drawPulse = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.05;

      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = 18 + Math.sin(time * 2.5) * 2.5;

      // Glow outer rings
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';

      // Outer wave ring
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius + Math.sin(time * 5) * 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Middle wave ring
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius + Math.cos(time * 3) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Core glow circle
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#a5b4fc');
      grad.addColorStop(0.8, '#6366f1');
      grad.addColorStop(1, '#4f46e5');
      ctx.fillStyle = grad;
      ctx.fill();

      // Cyber particles orbiting the core
      ctx.shadowBlur = 0;
      for (let i = 0; i < 3; i++) {
        const orbitAngle = time * 1.5 + (i * Math.PI * 2) / 3;
        const orbitRadius = baseRadius + 12 + Math.sin(time * 4 + i) * 3;
        const px = cx + Math.cos(orbitAngle) * orbitRadius;
        const py = cy + Math.sin(orbitAngle) * orbitRadius;

        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#818cf8' : '#34d399';
        ctx.fill();
      }

      animId = requestAnimationFrame(drawPulse);
    };

    drawPulse();
    return () => cancelAnimationFrame(animId);
  }, []);

  // SMS Generation Logic
  const smsText = useMemo(() => {
    const termLabel = student.studentGroup === 'CBC' ? 'Competency-Based Curriculum' : `${student.subject} program`;
    let msg = `PRISM Student Update:\nDear Parent/Guardian, this is a brief update regarding ${student.name}'s progress in our ${termLabel}. `;
    msg += `Current academic index is ${gpa.toFixed(1)}/4.0 with an attendance rating of ${student.attendancePct}%. `;
    if (weaknesses.length > 0) {
      msg += `Focus areas for home revision: ${weaknesses.slice(0, 2).join(', ')}. `;
    } else {
      msg += `Exhibiting excellent competency retention across all modules. `;
    }
    msg += `Thank you, PRISM Administration.`;
    return msg;
  }, [student, gpa, weaknesses]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const handleConsultGlobalSally = () => {
    // Dispatch a custom event to open the global sally chat and insert the prompt
    const prompt = `Can you analyze ${student.name}'s academic record? Subject: ${student.subject}, GPA: ${gpa.toFixed(1)}, Attendance: ${student.attendancePct}%. Weaknesses: ${weaknesses.join(', ')}. Provide a customized lesson plan for them.`;
    const event = new CustomEvent('sally-consult', { detail: { prompt } });
    window.dispatchEvent(event);
  };

  // Practice Quiz Generator
  const quizQuestions = useMemo(() => {
    if (weaknesses.length === 0) {
      return [
        { q: "Calculate total power output for 4x 300W series solar panels.", a: "1200W (Series connection sums wattage: 300W * 4 = 1200W)" },
        { q: "Explain the main difference between series and parallel solar setups.", a: "Series increases voltage; parallel increases current/amperage." }
      ];
    }
    const topic = weaknesses[0].toLowerCase();
    if (topic.includes('ohms') || topic.includes('electricity') || topic.includes('pv sizing') || topic.includes('solar')) {
      return [
        { q: "A solar panel produces 18V at 5.5A. Calculate its load resistance.", a: "R = V / I = 18 / 5.5 ≈ 3.27 Ohms" },
        { q: "How does shading affect a series solar string's voltage and output?", a: "Shading a single panel in a series string drops the current of the entire string to match the shaded panel's performance, significantly reducing power." },
        { q: "State Ohm's Law formula for voltage, current, and resistance.", a: "V = I * R (Voltage = Current * Resistance)" }
      ];
    }
    return [
      { q: `Describe the core operational workflow of ${weaknesses[0]}.`, a: "Refer to the PRISM digital curriculum standard documentation." },
      { q: `What are the primary diagnostics to execute when reviewing a bottleneck in ${weaknesses[0]}?`, a: "Execute step-by-step validation checks on variables, parameters, or physical nodes." }
    ];
  }, [weaknesses]);

  return (
    <div className="glass-panel p-6 bg-gradient-to-br from-slate-900/90 to-indigo-950/80 text-white rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden flex flex-col gap-4 backdrop-blur-xl">
      {/* Background Tech Grids */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Copilot Header */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-16 h-16 relative flex items-center justify-center bg-indigo-500/10 rounded-2xl border border-indigo-500/30 overflow-hidden shadow-inner">
          <canvas ref={pulseCanvasRef} className="w-full h-full" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-space font-bold text-base tracking-wide text-indigo-200">Sally AI</h3>
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[8px] font-black uppercase tracking-wider rounded border border-indigo-500/30">Copilot</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Real-time Student Evaluation & Action HUD</p>
        </div>
        <button
          onClick={generateBrief}
          disabled={isGenerating}
          className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition-all flex items-center justify-center active:scale-90"
          title="Regenerate diagnostic"
        >
          <RefreshCw size={14} className={clsx(isGenerating && "animate-spin")} />
        </button>
      </div>

      {/* AI Assessment Area */}
      <div className="bg-slate-950/50 p-5 rounded-2xl border border-white/5 relative z-10 flex-1 min-h-[160px] flex flex-col justify-center">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-indigo-300 font-mono tracking-widest uppercase animate-pulse">Running Diagnostic AI...</span>
          </div>
        ) : (
          <div className="text-sm space-y-3 leading-relaxed text-slate-200 font-sans">
            {/* Helper to parse markdown-like structures into clean react tags */}
            {activeBrief.split('\n\n').map((para, pi) => {
              if (para.startsWith('### ')) {
                return <h3 key={pi} className="font-space font-bold text-sm text-indigo-300 border-b border-indigo-500/10 pb-1 mt-1">{para.replace('### ', '')}</h3>;
              }
              if (para.startsWith('#### ')) {
                return <h4 key={pi} className="font-space font-bold text-xs text-slate-350 uppercase tracking-wider mt-3">{para.replace('#### ', '')}</h4>;
              }
              return (
                <div key={pi} className="space-y-1">
                  {para.split('\n').map((line, li) => {
                    if (line.startsWith('• ')) {
                      return (
                        <p key={li} className="flex gap-2 text-xs pl-1">
                          <span className="text-indigo-400 font-black">•</span>
                          <span dangerouslySetInnerHTML={{ __html: line.replace('• ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </p>
                      );
                    }
                    if (line.startsWith('⚠️') || line.startsWith('📈')) {
                      const isWarning = line.startsWith('⚠️');
                      return (
                        <div key={li} className={clsx(
                          "p-3 rounded-xl border mt-3 text-xs flex items-start gap-2.5 shadow-sm",
                          isWarning 
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                        )}>
                          {isWarning ? <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-rose-400" /> : <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5 text-emerald-400" />}
                          <span dangerouslySetInnerHTML={{ __html: line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>
                      );
                    }
                    return <p key={li} className="text-xs text-slate-300" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cyber Quick Actions */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <button
          onClick={() => setShowSMSModal(true)}
          className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 active:scale-95 transition-all border border-indigo-400/20"
        >
          <Smartphone size={15} />
          Draft Guardian SMS
        </button>
        <button
          onClick={handleConsultGlobalSally}
          className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-white rounded-xl font-bold text-xs border border-slate-700/60 active:scale-95 transition-all"
        >
          <MessageSquare size={15} />
          Consult Sally AI
        </button>
      </div>

      {/* Custom modular section for revision questions */}
      <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 relative z-10 space-y-2.5">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <BookOpen size={12} className="text-indigo-400" /> Recommended Practice
        </h4>
        <div className="space-y-2">
          {quizQuestions.map((quiz, qi) => (
            <div key={qi} className="text-xs p-2.5 bg-slate-950/60 rounded-xl border border-white/5 space-y-1">
              <p className="font-semibold text-indigo-200">Q: {quiz.q}</p>
              <details className="cursor-pointer group">
                <summary className="text-[10px] text-slate-500 group-hover:text-slate-350 list-none flex items-center gap-1">
                  <span>▶</span> Show Answer
                </summary>
                <p className="text-[10px] text-slate-400 bg-black/35 p-2 rounded-lg mt-1 border border-white/5 leading-normal">
                  {quiz.a}
                </p>
              </details>
            </div>
          ))}
        </div>
      </div>

      {/* SMS Drawer / Modal */}
      <AnimatePresence>
        {showSMSModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass-panel p-6 bg-slate-900 text-white rounded-3xl border border-white/10 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="text-indigo-400" size={18} />
                  <h3 className="font-space font-bold text-base">Guardian Progress Notice</h3>
                </div>
                <button
                  onClick={() => setShowSMSModal(false)}
                  className="p-1 hover:bg-white/5 rounded-full text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-400">This SMS update is automatically compiled from the student's current active curriculum scores and attendance logs.</p>
                
                <textarea
                  value={smsText}
                  readOnly
                  rows={6}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-mono focus:outline-none focus:border-indigo-500 leading-relaxed text-slate-350"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSMSModal(false)}
                    className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-750 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      copyToClipboard(smsText);
                      setShowSMSModal(false);
                    }}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Copy size={13} />
                    Copy Template
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default SallyStudentCopilot;
