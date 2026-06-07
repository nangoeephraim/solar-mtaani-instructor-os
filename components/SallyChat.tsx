"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Sparkles, Send, Volume2, VolumeX, MessageSquare, X, Box, ClipboardCheck, ArrowUpRight, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export function SallyChat({ currentView }: { currentView?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [input, setInput] = useState('');
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  // Listen to Capacitor native back gesture to close AI drawer
  useEffect(() => {
    const handleBackButton = (e: Event) => {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('app-back-button', handleBackButton);
    return () => window.removeEventListener('app-back-button', handleBackButton);
  }, [isOpen]);

  // Listen to open sally custom events from other chat triggers
  useEffect(() => {
    const handleOpenSally = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-sally-chat', handleOpenSally);
    return () => window.removeEventListener('open-sally-chat', handleOpenSally);
  }, []);

  // Helper to extract text content from a modular message
  const getMessageText = (message: any) => {
    let rawText = '';
    if (message.content) {
      rawText = message.content;
    } else if (message.parts && Array.isArray(message.parts)) {
      rawText = message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
    }
    // Clean up asterisks for both non-markdown UI display and vocal narration
    if (message.role === 'assistant') {
      return rawText.replace(/\*/g, '');
    }
    return rawText;
  };

  // Helper to extract tool invocations from a modular message
  const getToolInvocations = (message: any): any[] => {
    if (message.toolInvocations && Array.isArray(message.toolInvocations)) {
      return message.toolInvocations;
    }
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter((part: any) => part.type === 'tool-invocation')
        .map((part: any) => part.toolInvocation)
        .filter(Boolean);
    }
    return [];
  };

  // Vercel AI SDK integration hook using modular transport
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
    }),
    onFinish: (response: any) => {
      // Extract assistant response safely from the event payload
      const msg = response?.responseMessage || response;
      if (speechEnabled && msg && msg.role === 'assistant') {
        speak(getMessageText(msg));
      }
    }
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll logic
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech synthesis implementation (Using Web Speech API with sequential queuing)
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Cancel current speaking and clear references
    window.speechSynthesis.cancel();
    activeUtterancesRef.current = [];
    setIsSpeaking(false);

    // Remove markdown characters that break vocal narration
    const cleanText = text
      .replace(/[#*_`~\[\]()>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // Split text into individual sentences/clauses
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    
    // Filter out empty sentences
    const filteredSentences = sentences
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (filteredSentences.length === 0) return;

    // Get the friendly voice once
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Emma') || 
      v.name.includes('Google UK English Female') ||
      (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
    );

    // Build the queue of SpeechSynthesisUtterance objects
    const queue = filteredSentences.map((sentence) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 1.1; // Snappy conversational pacing
      utterance.pitch = 1.05; // Slightly warmer pitch
      if (friendlyVoice) utterance.voice = friendlyVoice;
      return utterance;
    });

    // Store the queue in the ref to keep strong references (prevents GC)
    activeUtterancesRef.current = queue;
    setIsSpeaking(true);

    let index = 0;

    const playNext = () => {
      if (index >= queue.length) {
        setIsSpeaking(false);
        activeUtterancesRef.current = [];
        return;
      }

      const utterance = queue[index];

      utterance.onend = () => {
        index++;
        playNext();
      };

      utterance.onerror = (e) => {
        console.error("SpeechSynthesis error:", e);
        index++;
        playNext();
      };

      window.speechSynthesis.speak(utterance);
    };

    playNext();
  };

  const toggleSpeech = () => {
    if (speechEnabled) {
      window.speechSynthesis?.cancel();
      activeUtterancesRef.current = [];
      setIsSpeaking(false);
    }
    setSpeechEnabled(!speechEnabled);
  };

  // Pre-load voices for Chrome/Safari compatibility
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        activeUtterancesRef.current = [];
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <>
      {/* 1. Floating Action Orb Trigger Button */}
      {!isOpen && currentView !== 'communications' && (
        <div className="fixed bottom-24 right-6 md:bottom-6 z-40">
          <div className="relative group cursor-pointer">
            {/* Animated Ambient Shadow Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 opacity-60 blur-md group-hover:opacity-100 transition duration-500" />
            
            {/* Animated Gradient Rotating Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-500 to-indigo-500 p-[2px]"
            />
            
            {/* Main button element */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-4 rounded-full bg-slate-950 text-emerald-400 group-hover:text-white transition-colors duration-300 flex items-center justify-center"
              aria-label="Ask Sally"
              style={{ width: '56px', height: '56px' }}
            >
              <Sparkles className="w-6 h-6 animate-pulse" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Side Panel Chat UI */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed top-0 right-0 w-full sm:w-96 h-screen bg-slate-950/80 text-white border-l border-white/10 shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-3xl"
          >
            {/* Header Panel */}
            <div className="p-4 bg-slate-900/60 backdrop-blur-md flex items-center justify-between border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-slate-950 text-lg shadow-lg shadow-emerald-500/20 font-space">
                    S
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-space tracking-wide">Sally</h3>
                  <span className="text-[10px] text-emerald-400 font-medium font-mono uppercase tracking-wider">PRISM Copilot</span>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-3">
                {/* Real-time Vocal Speech Wave Visualizer */}
                <AnimatePresence>
                  {isSpeaking && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-end gap-[3px] h-3.5 mr-1"
                    >
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 14, 4] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.12,
                            ease: "easeInOut"
                          }}
                          className="w-[2px] bg-emerald-400 rounded-full"
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Speech Synthesis Mute Toggle */}
                <button 
                  onClick={toggleSpeech} 
                  className="text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-slate-800 flex items-center justify-center"
                  title={speechEnabled ? "Mute Speech" : "Unmute Speech"}
                >
                  {speechEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                </button>
                
                {/* Close Button */}
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-slate-800 flex items-center justify-center"
                  title="Close Sally"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat History Panel */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
              {/* Initial State / Suggested Prompts Grid */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center h-full">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 animate-float">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm mb-1 font-space">Meet Sally, PRISM Companion</h4>
                  <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed mb-6">
                    Your technical copilot for curriculum specs, solar inventory checks, and student assessments.
                  </p>
                  
                  {/* Suggested Prompts Cards Grid */}
                  <div className="grid grid-cols-1 gap-2.5 w-full max-w-sm">
                    {[
                      {
                        label: "Check Multimeters in Kibera",
                        subtext: "Query real-time stock levels",
                        prompt: "Check the multimeter stock in Kibera",
                        icon: Box,
                        color: "emerald"
                      },
                      {
                        label: "Log student PV Sizing grade",
                        subtext: "Submit a score of 85% for John Doe",
                        prompt: "Log a score of 85 in PV Sizing for student John Doe with comment 'Excellent wiring'",
                        icon: ClipboardCheck,
                        color: "indigo"
                      },
                      {
                        label: "PV Array Ratio Calculator",
                        subtext: "How to size a PV array for a 500W load",
                        prompt: "How do I calculate the solar PV array size for a 500W load in Nairobi?",
                        icon: HelpCircle,
                        color: "amber"
                      }
                    ].map((item, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => sendMessage({ text: item.prompt })}
                        className="flex items-start text-left p-3 rounded-2xl bg-slate-900/35 border border-white/5 hover:border-slate-800 hover:bg-slate-900/60 transition-all group"
                      >
                        <div className={clsx(
                          "p-2 rounded-xl border mr-3 flex-shrink-0",
                          item.color === "emerald" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                          item.color === "indigo" && "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
                          item.color === "amber" && "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        )}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">{item.label}</p>
                            <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{item.subtext}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Message Bubble Rendering */}
              {messages.map((m) => {
                const isUser = m.role === 'user';
                const messageText = getMessageText(m);
                const toolInvocations = getToolInvocations(m);
                const hasTools = toolInvocations.length > 0;
                
                return (
                  <div key={m.id} className="space-y-3">
                    {/* Render Text message content */}
                    {messageText && (
                      <div className={clsx("flex", isUser ? 'justify-end' : 'justify-start')}>
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className={clsx(
                            "max-w-[85%] rounded-2xl p-4 text-sm shadow-md",
                            isUser 
                              ? "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-tr-none shadow-indigo-500/10" 
                              : "bg-slate-900/50 text-slate-100 rounded-tl-none border border-white/5 backdrop-blur-md"
                          )}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{messageText}</p>
                        </motion.div>
                      </div>
                    )}
                    
                    {/* Render Interactive Tool Output Cards */}
                    {hasTools && toolInvocations.map((toolInvocation: any) => {
                      const { toolName, toolCallId, state, args, result } = toolInvocation;
                      
                      if (state === 'result' && result) {
                        return (
                          <motion.div 
                            key={toolCallId}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="flex justify-start w-full"
                          >
                            {/* Inventory Stock Result Card */}
                            {toolName === 'getInventoryStock' && (
                              <div className="w-[85%] bg-slate-900 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl">
                                <div className="flex items-center gap-2 mb-3">
                                  <Box className="w-4 h-4 text-emerald-400" />
                                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-space">
                                    Inventory: {args.locationName}
                                  </h4>
                                </div>
                                {result.error ? (
                                  <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/20 p-2.5 rounded-xl flex items-center gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>{result.error}</span>
                                  </div>
                                ) : !result.inventory || result.inventory.length === 0 ? (
                                  <div className="text-xs text-slate-400 italic py-2">
                                    No equipment logged at this location.
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {result.inventory.map((item: any) => {
                                      const isLowStock = item.quantity <= item.low_stock_threshold;
                                      return (
                                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-xs">
                                          <span className="font-medium text-slate-300">{item.item_name}</span>
                                          <div className="flex items-center gap-2.5">
                                            <span className="font-mono text-slate-400 font-bold">{item.quantity} units</span>
                                            <span className={clsx(
                                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                                              isLowStock
                                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            )}>
                                              {isLowStock ? "Low Stock" : "OK"}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Assessment Grading Result Card */}
                            {toolName === 'logStudentAssessment' && (
                              <div className="w-[85%] bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-900 border border-indigo-500/20 backdrop-blur-md rounded-2xl p-4 shadow-xl">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-2">
                                    <ClipboardCheck className="w-4 h-4 text-indigo-400" />
                                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-space">
                                      Competency Logged
                                    </h4>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    NITA
                                  </span>
                                </div>
                                {result.error ? (
                                  <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/20 p-2.5 rounded-xl flex items-center gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>{result.error}</span>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                      <div>
                                        <p className="text-[10px] text-slate-400 uppercase">Student</p>
                                        <p className="font-bold text-slate-200">{args.studentName}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[10px] text-slate-400 uppercase">Module</p>
                                        <p className="font-bold text-slate-200">{args.moduleName}</p>
                                      </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="text-[9px] text-slate-500 uppercase tracking-wide">Instructor Notes</p>
                                        <p className="text-xs text-slate-300 italic truncate">"{args.comments || 'Graded successfully.'}"</p>
                                      </div>
                                      <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg flex-shrink-0">
                                        <span className="text-lg font-mono font-bold text-indigo-400">{args.score}%</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                                      <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
                                      <span>Database state updated</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      }
                      
                      return null;
                    })}
                  </div>
                );
              })}

              {/* Streaming/Thinking Loader Shimmer Card */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl rounded-tl-none p-3.5 text-slate-300 text-xs w-[80%] space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                      <span className="font-medium text-slate-400">Sally is thinking...</span>
                    </div>
                    {/* Gemini-Style pulsing gradient slider */}
                    <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden relative">
                      <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 w-1/2 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-start">
                  <div className="bg-red-950/30 border border-red-800/40 rounded-2xl rounded-tl-none p-3.5 text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>Error: {error.message || "Failed to retrieve response"}</span>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Floating Pill Input Box */}
            <div className="p-4 bg-transparent flex-shrink-0">
              <form onSubmit={handleSubmit} className="relative flex items-center bg-slate-900/90 border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-2xl p-1.5 transition-all shadow-2xl">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask Sally..."
                  className="flex-1 bg-transparent text-white rounded-xl px-3 py-2 text-sm outline-none placeholder:text-slate-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 disabled:from-slate-800 disabled:to-slate-800 text-white disabled:text-slate-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
