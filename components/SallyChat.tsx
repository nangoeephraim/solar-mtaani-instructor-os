"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Sparkles, Send, Volume2, VolumeX, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SallyChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [input, setInput] = useState('');
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Helper to extract text content from a modular message
  const getMessageText = (message: any) => {
    if (message.content) return message.content;
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
    }
    return '';
  };

  // Vercel AI SDK integration hook using modular transport
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
    }),
    onFinish: ({ message }) => {
      // Speak final assistant response if speech is enabled
      if (speechEnabled && message.role === 'assistant') {
        speak(getMessageText(message));
      }
    }
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll logic
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech synthesis implementation (Using Web Speech API)
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Cancel current speaking
    window.speechSynthesis.cancel();

    // Remove markdown characters that break vocal narration
    const cleanText = text
      .replace(/[#*_`~\[\]()>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // Split text into individual sentences to avoid browser buffers clogging
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    
    sentences.forEach((sentence) => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      utterance.rate = 1.1; // Snappy conversational pacing
      utterance.pitch = 1.05; // Slightly warmer pitch
      
      // Attempt to load standard friendly female voices (Samantha/Emma/Google UK English Female)
      const voices = window.speechSynthesis.getVoices();
      const friendlyVoice = voices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Emma') || 
        v.name.includes('Google UK English Female') ||
        (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      );
      if (friendlyVoice) utterance.voice = friendlyVoice;

      window.speechSynthesis.speak(utterance);
    });
  };

  const toggleSpeech = () => {
    if (speechEnabled) {
      window.speechSynthesis?.cancel();
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
      {/* 1. Floating Action Orb Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-6 p-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl hover:scale-110 active:scale-95 transition-all z-40 flex items-center justify-center"
        aria-label="Ask Sally"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </button>

      {/* 2. Side Panel Chat UI */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 350 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 350 }}
            className="fixed top-0 right-0 w-full sm:w-96 h-screen bg-slate-900 text-white border-l border-slate-800 shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-slate-900">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-sm">Sally</h3>
                  <span className="text-xs text-emerald-400 font-mono">PRISM Companion</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleSpeech} 
                  className="text-slate-400 hover:text-white transition p-1"
                  title={speechEnabled ? "Mute Speech" : "Unmute Speech"}
                >
                  {speechEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-slate-400 hover:text-white transition p-1"
                  title="Close Sally"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat History Panel */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                  <span>Ask me about cohort grades, installation equipment stocks, or PV configuration checks.</span>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${m.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'}`}>
                    {getMessageText(m)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-3 text-slate-400 text-xs animate-pulse">
                    Sally is thinking...
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-start">
                  <div className="bg-red-950 border border-red-800 rounded-2xl rounded-tl-none p-3 text-red-300 text-xs">
                    Error: {error.message || "Failed to get response"}
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Text Input Panel */}
            <form onSubmit={handleSubmit} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask Sally..."
                className="flex-1 bg-slate-900 text-white rounded-xl px-4 py-2 text-sm border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
