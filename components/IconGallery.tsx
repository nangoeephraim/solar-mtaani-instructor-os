import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Users, UserCheck, BarChart3, LineChart,
  ClipboardCheck, Box, Wallet, UsersRound, MessageSquare, Settings,
  Compass, ArrowRight, Sparkles, Search, Send, Volume2, VolumeX,
  RefreshCw, Radio, Grid, X, Check, Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { getAuthHeaders } from '../services/authHeaders';
import { addChatMessage } from '../services/storageService';
import { supabase } from '../services/supabase';
import { Sally3DBrain } from './Sally3DBrain';
import { useToast } from './Toast';
import { AppData } from '../types';
import clsx from 'clsx';

interface IconGalleryProps {
  onNavigate: (view: string) => void;
  data?: AppData | null;
  setData?: React.Dispatch<React.SetStateAction<AppData | null>>;
}

interface Conversation {
  id: string;
  title: string;
  messages: Array<any>;
  createdAt: string;
  updatedAt: string;
}

const ROLE_LEVEL: Record<string, number> = { admin: 3, instructor: 2, viewer: 1 };

const IconGallery: React.FC<IconGalleryProps> = ({ onNavigate, data = null, setData }) => {
  const { user } = useAuth();
  const { preferences } = useTheme();
  const { showToast } = useToast();
  const userLevel = ROLE_LEVEL[user?.role || 'viewer'] || 1;
  const instType = preferences?.institutionType || 'tvet';

  // --- Search and Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Core' | 'Analytics' | 'Utilities'>('All');

  // --- Hover State for 3D Morphing ---
  const [brainMorphTarget, setBrainMorphTarget] = useState<'sphere' | 'torus' | 'helix' | 'wave'>('sphere');
  const [brainColor, setBrainColor] = useState('#6366f1'); // Indigo

  // --- Quick Actions States ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLatency, setSyncLatency] = useState<number | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'general' | 'announcements'>('announcements');
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // --- Sally AI State & Speech ---
  const [chatInput, setChatInput] = useState('');
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  // Fetch helper for Sally AI
  const sallyFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await fetch(input, init);
    if (response.ok) return response;
    let payload: any = null;
    try {
      payload = await response.clone().json();
    } catch {}
    const stage = payload?.stage ? ` at ${payload.stage}` : '';
    const requestId = payload?.requestId ? ` Request ${payload.requestId}.` : '';
    const detail = payload?.error || response.statusText || 'Sally could not complete the request.';
    throw new Error(`Sally failed${stage}: ${detail}.${requestId}`.trim());
  };

  // Text message clean extraction for TTS
  const getMessageText = (msg: any): string => {
    if (!msg) return '';
    if (typeof msg.content === 'string') return msg.content;
    if (Array.isArray(msg.parts)) {
      return msg.parts
        .filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
        .map((part: any) => part.text)
        .join(' ');
    }
    return '';
  };

  // Speech utility
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    activeUtterancesRef.current = [];
    setIsSpeaking(false);

    const cleanText = text
      .replace(/[#*_`~\[\]()>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    const filteredSentences = sentences.map(s => s.trim()).filter(s => s.length > 0);
    if (filteredSentences.length === 0) return;

    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Emma') ||
      v.name.includes('Google UK English Female') ||
      (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
    );

    const queue = filteredSentences.map((sentence) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 1.1;
      utterance.pitch = 1.05;
      if (friendlyVoice) utterance.voice = friendlyVoice;
      return utterance;
    });

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
      utterance.onerror = () => {
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

  // Configure AI Copilot chat hook
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      headers: () => getAuthHeaders(),
      body: {
        institutionType: instType,
      },
      fetch: async (input, init) => {
        const response = await sallyFetch(input, init);
        return response;
      },
    }),
    onFinish: (response: any) => {
      const msg = response?.message || response?.responseMessage || response;
      if (speechEnabled && msg && msg.role === 'assistant') {
        speak(getMessageText(msg));
      }
      window.dispatchEvent(new CustomEvent('sally-history-sync', { detail: { sender: 'command-center' } }));
    },
  });

  const isSallyLoading = status === 'streaming' || status === 'submitted';

  // --- Real-time LocalStorage Synchronization ---
  useEffect(() => {
    try {
      const storedActiveId = localStorage.getItem('sally_active_conversation_id_v1');
      const storedList = localStorage.getItem('sally_conversations_list_v1');
      if (storedActiveId && storedList) {
        const list = JSON.parse(storedList);
        const active = list.find((c: any) => c.id === storedActiveId);
        setActiveConvId(storedActiveId);
        if (active && active.messages.length > 0) {
          const historical = active.messages.map((m: any) => ({ ...m, isHistorical: true }));
          setMessages(historical);
        }
      }
    } catch (e) {
      console.warn('[CommandCenter] Failed to sync messages from localStorage', e);
    }
  }, [setMessages]);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.sender === 'companion') {
        try {
          const storedActiveId = localStorage.getItem('sally_active_conversation_id_v1');
          const storedList = localStorage.getItem('sally_conversations_list_v1');
          if (storedActiveId && storedList) {
            const list = JSON.parse(storedList);
            const active = list.find((c: any) => c.id === storedActiveId);
            setActiveConvId(storedActiveId);
            if (active) {
              setMessages(active.messages.map((m: any) => ({ ...m, isHistorical: true })));
            }
          }
        } catch (err) {
          console.warn('[CommandCenter] Failed to handle companion sync event:', err);
        }
      }
    };
    window.addEventListener('sally-history-sync', handleSync);
    return () => window.removeEventListener('sally-history-sync', handleSync);
  }, [setMessages]);

  const persistConversationLocally = useCallback((updatedMsgs: any[]) => {
    try {
      const storedActiveId = localStorage.getItem('sally_active_conversation_id_v1');
      const storedList = localStorage.getItem('sally_conversations_list_v1');
      if (!storedActiveId || !storedList) return;
      
      const list = JSON.parse(storedList) as Conversation[];
      const idx = list.findIndex(c => c.id === storedActiveId);
      if (idx === -1) return;

      const current = list[idx];
      let title = current.title;
      if (title === 'New Conversation' || title.trim() === '') {
        const firstUser = updatedMsgs.find(m => m.role === 'user');
        if (firstUser) {
          const text = getMessageText(firstUser);
          title = text.length > 28 ? text.substring(0, 28) + '...' : text;
        }
      }

      list[idx] = {
        ...current,
        title,
        messages: updatedMsgs,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('sally_conversations_list_v1', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('sally-history-sync', { detail: { sender: 'command-center' } }));
    } catch (e) {
      console.warn('[CommandCenter] Failed to write conversation:', e);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      persistConversationLocally(messages);
    }
  }, [messages, persistConversationLocally]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const features = [
    {
      id: 'dashboard',
      label: 'Home & Dashboard',
      description: 'Overview of student tallies, attendance charts, and quick-action alerts.',
      icon: LayoutDashboard,
      gradient: 'from-blue-500/20 to-indigo-500/20',
      borderGlow: 'rgba(59, 130, 246, 0.45)',
      hexColor: '#3b82f6',
      minRole: 'viewer',
      category: 'Core',
      shape: 'wave' as const,
    },
    {
      id: 'schedule',
      label: 'Schedule & Timetable',
      description: 'Coordinate class sessions, manage calendars, and track lesson status.',
      icon: Calendar,
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderGlow: 'rgba(168, 85, 247, 0.45)',
      hexColor: '#a855f7',
      minRole: 'viewer',
      category: 'Core',
      shape: 'helix' as const,
    },
    {
      id: 'students-manage',
      label: 'Student Directory',
      description: `Rosters of active student profiles, contacts, and custom details.`,
      icon: Users,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      borderGlow: 'rgba(16, 185, 129, 0.45)',
      hexColor: '#10b981',
      minRole: 'viewer',
      category: 'Core',
      shape: 'torus' as const,
    },
    {
      id: 'attendance',
      label: 'Attendance Register',
      description: 'Log daily class status, verify sessions, and view history registers.',
      icon: UserCheck,
      gradient: 'from-amber-500/20 to-orange-500/20',
      borderGlow: 'rgba(245, 158, 11, 0.45)',
      hexColor: '#f59e0b',
      minRole: 'viewer',
      category: 'Core',
      shape: 'wave' as const,
    },
    {
      id: 'student-analytics',
      label: 'Student Insights',
      description: 'Explore individual academic trajectories, trends, and progress charts.',
      icon: LineChart,
      gradient: 'from-cyan-500/20 to-blue-500/20',
      borderGlow: 'rgba(6, 182, 212, 0.45)',
      hexColor: '#06b6d4',
      minRole: 'instructor',
      category: 'Analytics',
      shape: 'torus' as const,
    },
    {
      id: 'assessment',
      label: 'Grades & Assessments',
      description: 'Log marks, calculate averages, and generate student report cards.',
      icon: ClipboardCheck,
      gradient: 'from-violet-500/20 to-fuchsia-500/20',
      borderGlow: 'rgba(139, 92, 246, 0.45)',
      hexColor: '#8b5cf6',
      minRole: 'instructor',
      category: 'Analytics',
      shape: 'helix' as const,
    },
    {
      id: 'analytics',
      label: 'System Analytics',
      description: 'Comprehensive data on payments, attendance distributions, and metrics.',
      icon: BarChart3,
      gradient: 'from-rose-500/20 to-red-500/20',
      borderGlow: 'rgba(244, 63, 94, 0.45)',
      hexColor: '#f43f5e',
      minRole: 'admin',
      category: 'Analytics',
      shape: 'torus' as const,
    },
    {
      id: 'resources',
      label: 'Document Repository',
      description: 'Class reference guides, library files, and syllabus worksheets.',
      icon: Box,
      gradient: 'from-sky-500/20 to-indigo-500/20',
      borderGlow: 'rgba(14, 165, 233, 0.45)',
      hexColor: '#0ea5e9',
      minRole: 'viewer',
      category: 'Utilities',
      shape: 'wave' as const,
    },
    {
      id: 'fees',
      label: 'Financials & Fees',
      description: 'Track outstanding balances, audit records, and initiate M-Pesa STK push.',
      icon: Wallet,
      gradient: 'from-green-500/20 to-emerald-500/20',
      borderGlow: 'rgba(34, 197, 94, 0.45)',
      hexColor: '#22c55e',
      minRole: 'admin',
      category: 'Utilities',
      shape: 'torus' as const,
    },
    {
      id: 'instructors',
      label: 'Instructor Directory',
      description: 'Manage staff credentials, assigned classes, and administrative access.',
      icon: UsersRound,
      gradient: 'from-teal-500/20 to-sky-500/20',
      borderGlow: 'rgba(20, 184, 166, 0.45)',
      hexColor: '#14b8a6',
      minRole: 'admin',
      category: 'Utilities',
      shape: 'helix' as const,
    },
    {
      id: 'communications',
      label: 'Communications',
      description: 'Real-time instructor messaging, chat rooms, and automated notifications.',
      icon: MessageSquare,
      gradient: 'from-indigo-500/20 to-purple-500/20',
      borderGlow: 'rgba(99, 102, 241, 0.45)',
      hexColor: '#6366f1',
      minRole: 'viewer',
      category: 'Utilities',
      shape: 'wave' as const,
    },
    {
      id: 'settings',
      label: 'System Settings',
      description: 'Configure PWA Push Notifications, toggle Dark Mode, and monitor Supabase sync.',
      icon: Settings,
      gradient: 'from-slate-500/20 to-zinc-500/20',
      borderGlow: 'rgba(100, 116, 139, 0.45)',
      hexColor: '#64748b',
      minRole: 'viewer',
      category: 'Utilities',
      shape: 'helix' as const,
    }
  ];

  const authorizedFeatures = useMemo(() => {
    return features.filter(f => userLevel >= (ROLE_LEVEL[f.minRole] || 1));
  }, [userLevel]);

  const filteredFeatures = useMemo(() => {
    return authorizedFeatures.filter(f => {
      const matchSearch = f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = activeCategory === 'All' || f.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [authorizedFeatures, searchQuery, activeCategory]);

  const suggestedPrompts = useMemo(() => {
    switch (instType) {
      case 'primary':
      case 'jss':
        return [
          { label: "CBC Competencies", prompt: "Explain the 7 core KICD competencies." },
          { label: "Attendance Summary", prompt: "Give me the attendance report summary." },
          { label: "Identify At-Risk Students", prompt: "Identify students at risk of falling behind in grade level." }
        ];
      case 'highschool':
        return [
          { label: "KCSE Grading Structure", prompt: "How does the KCSE exam grading scale work?" },
          { label: "Syllabus Sync Status", prompt: "Are our courses fully synchronized with KICD syllabuses?" },
          { label: "CAT Average Scores", prompt: "What are the average scores for the recent Continuous Assessment Tests?" }
        ];
      case 'tvet':
      default:
        return [
          { label: "Solar Inventory Stock", prompt: "What is the current inventory stock level for solar components?" },
          { label: "Optimize Schedule Conflicts", prompt: "Inspect schedule conflicts and advise optimizer solutions." },
          { label: "Sync Status", prompt: "Verify if our offline mutations have successfully pushed to Supabase." }
        ];
    }
  }, [instType]);

  const handleDatabaseSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncLatency(null);
    const start = Date.now();
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
      if (error) throw error;
      const latency = Date.now() - start;
      setSyncLatency(latency);
      showToast(`Database synced! Latency: ${latency}ms`, 'success');
    } catch (e) {
      showToast('Database offline or sync failed.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTriggerOptimizer = () => {
    localStorage.setItem('prism_pending_optimize', 'true');
    showToast('Launching Auto-Optimizer. Opening schedule...', 'info');
    setTimeout(() => {
      onNavigate('schedule');
    }, 800);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setIsBroadcasting(true);
    try {
      const channels = data?.communications?.channels || [];
      let targetChannel = channels.find(c => c.name.toLowerCase() === broadcastTarget);
      if (!targetChannel && channels.length > 0) {
        targetChannel = channels[0];
      }
      
      if (!targetChannel) {
        throw new Error("No messaging channel found to broadcast.");
      }

      if (setData && data) {
        const payload = {
          id: 'broadcast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          channelId: targetChannel.id,
          senderId: user?.id || 'sys-broadcast',
          senderName: user?.name || 'System Administrator',
          senderRole: user?.role || 'admin',
          content: `📢 [BROADCAST] ${broadcastText}`,
        };

        const updatedData = await addChatMessage(data, payload);
        setData(updatedData);
        showToast(`Broadcast sent to #${targetChannel.name}!`, 'success');
        setBroadcastText('');
        setShowBroadcastModal(false);
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to dispatch broadcast.', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full max-w-[1600px] mx-auto p-2 sm:p-4 text-[var(--md-sys-color-on-surface)] flex-1 overflow-y-auto custom-scrollbar pb-28 md:pb-8">
      
      {/* LEFT COLUMN: Modules Directory & Actions (65%) */}
      <div className="flex-1 flex flex-col gap-6 xl:w-2/3">
        
        {/* Banner Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphic-card-premium p-6 rounded-[28px] overflow-hidden bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-white/10 shadow-lg relative"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 text-[9px] uppercase tracking-widest font-black rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <Sparkles size={10} className="text-indigo-400" /> Control Hub
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                Command Center
              </h1>
              <p className="text-xs sm:text-sm text-[var(--md-sys-color-secondary)] mt-1 max-w-xl font-medium">
                Futuristic module control room mapping all systems. Filter features, trigger optimization, or interact with your AI copilot.
              </p>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white/5 dark:bg-black/20 rounded-2xl border border-white/5 self-start sm:self-auto shadow-inner">
              <Compass className="text-indigo-500 animate-spin" style={{ animationDuration: '30s' }} size={22} />
              <div className="text-left">
                <p className="text-[9px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Active Role</p>
                <p className="text-xs font-black text-[var(--md-sys-color-on-surface)] uppercase">{user?.role || 'Viewer'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Directory Controls: Search & Category Pills */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--glass-bg)] backdrop-blur-md p-4 rounded-3xl border border-white/5 shadow-sm">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search directory..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/10 dark:bg-slate-950/20 border border-white/5 rounded-2xl text-xs font-google text-[var(--md-sys-color-on-surface)] placeholder-slate-400 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex bg-slate-900/10 dark:bg-slate-950/25 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
            {(['All', 'Core', 'Analytics', 'Utilities'] as const).map(cat => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={clsx(
                    "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all relative font-google",
                    isSelected 
                      ? "bg-slate-900/30 dark:bg-white/5 text-indigo-500 dark:text-indigo-400 shadow-sm border border-white/5 font-extrabold"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modules Grid */}
        <AnimatePresence mode="wait">
          {filteredFeatures.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center bg-[var(--glass-bg)] border border-white/5 rounded-[28px]"
            >
              <Grid size={40} className="mx-auto text-slate-500 opacity-20 mb-3" />
              <p className="text-sm font-google font-bold text-slate-400">No modules match your selection</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting search filters or keywords</p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredFeatures.map(item => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    onMouseEnter={() => {
                      setBrainMorphTarget(item.shape);
                      setBrainColor(item.hexColor);
                    }}
                    onMouseLeave={() => {
                      setBrainMorphTarget('sphere');
                      setBrainColor('#6366f1');
                    }}
                    className="group relative cursor-pointer overflow-hidden rounded-[24px] p-5 border border-white/5 bg-slate-900/10 dark:bg-slate-950/20 backdrop-blur-md shadow-sm hover:shadow-xl transition-all duration-305 hover:border-white/10 flex flex-col justify-between"
                    style={{ minHeight: '150px' }}
                    whileHover={{ y: -4 }}
                  >
                    <div className={clsx(
                      "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10",
                      item.gradient
                    )} />

                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <div
                          className="p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 flex items-center justify-center bg-white/5 dark:bg-black/30 border border-white/5"
                          style={{ boxShadow: `0 0 15px -3px ${item.borderGlow}` }}
                        >
                          <IconComponent className="text-indigo-400 group-hover:text-white transition-colors" size={20} />
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-indigo-400 transform translate-x-2 group-hover:translate-x-0">
                          <ArrowRight size={16} />
                        </span>
                      </div>

                      <h3 className="font-google font-extrabold text-xs text-[var(--md-sys-color-on-surface)] group-hover:text-indigo-400 transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-400 uppercase tracking-widest">
                        {item.id.replace('-manage', '')}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* SYSTEM QUICK ACTIONS DECK */}
        <div className="flex flex-col gap-4 bg-[var(--glass-bg)] backdrop-blur-md p-6 rounded-[28px] border border-white/5 shadow-sm">
          <h2 className="text-xs font-google font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Control Deck Actions
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-1">
            {/* Sync Database */}
            <div 
              onClick={handleDatabaseSync}
              className="p-4 rounded-2xl bg-white/5 dark:bg-black/10 border border-white/5 hover:border-indigo-500/20 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-black group-hover:text-indigo-400 transition-colors">Sync Database</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {syncLatency !== null ? `Healthy (${syncLatency}ms)` : 'Verify Supabase connection'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timetable Optimizer */}
            <div 
              onClick={handleTriggerOptimizer}
              className="p-4 rounded-2xl bg-white/5 dark:bg-black/10 border border-white/5 hover:border-purple-500/20 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                  <Sparkles size={16} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-black group-hover:text-purple-400 transition-colors">Run Optimizer</p>
                  <p className="text-[10px] text-slate-400 truncate">Auto-optimize timetable</p>
                </div>
              </div>
            </div>

            {/* Instant Broadcast */}
            <div 
              onClick={() => setShowBroadcastModal(true)}
              className="p-4 rounded-2xl bg-white/5 dark:bg-black/10 border border-white/5 hover:border-emerald-500/20 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Radio size={16} className="animate-pulse" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-black group-hover:text-emerald-400 transition-colors">Send Broadcast</p>
                  <p className="text-[10px] text-slate-400 truncate">Dispatch instant message</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Sally AI Copilot Panel (35% width, embedded on desktop) */}
      <div className="w-full xl:w-[380px] flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="sally-glass-card border border-white/10 rounded-[28px] overflow-hidden flex flex-col h-[650px] shadow-2xl relative"
        >
          {/* Spotlight background glow effect */}
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-20 -z-10"
               style={{ background: `radial-gradient(280px circle at 50% 30%, ${brainColor}33, transparent)` }} />

          {/* Header */}
          <div className="p-4 bg-slate-950/40 border-b border-white/5 flex items-center justify-between relative z-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-md opacity-60 animate-pulse" 
                     style={{ backgroundColor: brainColor }} />
                <div className="relative w-8 h-8 rounded-full bg-slate-900 border border-white/15 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0.5 rounded-full opacity-60 blur-[1px] animate-pulse" 
                       style={{ background: `linear-gradient(to tr, ${brainColor}, #3b82f6)` }} />
                  <Sparkles className="w-3.5 h-3.5 text-white relative z-10" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              </div>
              <div className="text-left">
                <h3 className="font-google font-extrabold text-sm text-white tracking-wide">Sally AI</h3>
                <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">Embedded Copilot</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSpeaking && (
                <div className="flex items-center justify-center h-4 mr-1">
                  <svg className="w-12 h-4 overflow-visible" viewBox="0 0 100 20" fill="none">
                    <path d="M0,10 Q25,0 50,10 T100,10" stroke="#8b5cf6" strokeWidth="1.5" className="voice-wave-path" />
                    <path d="M0,10 Q25,20 50,10 T100,10" stroke="#3b82f6" strokeWidth="1.2" className="voice-wave-path" style={{ animationDelay: '-0.7s' }} />
                  </svg>
                </div>
              )}

              <button 
                onClick={toggleSpeech}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition flex items-center justify-center"
                title={speechEnabled ? "Mute Speech" : "Unmute Speech"}
              >
                {speechEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 3D Neural Canvas Container */}
          <div className="w-full h-[220px] bg-slate-950/20 border-b border-white/5 relative z-10 flex items-center justify-center">
            <Sally3DBrain 
              morphTarget={brainMorphTarget}
              active={isSallyLoading || isSpeaking}
              accentColor={brainColor}
            />
            <div className="absolute bottom-3 left-4 flex gap-1.5 z-20">
              <span className="text-[8px] font-black uppercase bg-slate-950/70 border border-white/5 px-2 py-0.5 rounded-md text-indigo-400 tracking-wider">
                Shape: {brainMorphTarget}
              </span>
              {isSallyLoading && (
                <span className="text-[8px] font-black uppercase bg-slate-950/70 border border-white/5 px-2 py-0.5 rounded-md text-amber-400 tracking-wider flex items-center gap-1">
                  <Loader2 size={8} className="animate-spin" /> Thinking
                </span>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-left relative z-10 bg-slate-950/15">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center px-4 py-8">
                <Sparkles className="w-8 h-8 text-indigo-400/40 mb-3 animate-pulse" />
                <p className="text-xs font-google font-bold text-slate-300">Welcome to your AI workspace</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
                  Ask questions, check schedules, or run analytics audits about yourVocational center.
                </p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isAssistant = m.role === 'assistant';
                return (
                  <div 
                    key={m.id || idx} 
                    className={clsx(
                      "flex w-full",
                      isAssistant ? "justify-start" : "justify-end"
                    )}
                  >
                    <div 
                      className={clsx(
                        "max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm",
                        isAssistant
                          ? "bg-white/5 text-slate-200 rounded-tl-none border-l-2 border-l-indigo-500 border border-white/5"
                          : "bg-indigo-600 text-white rounded-tr-none"
                      )}
                    >
                      <p>{getMessageText(m)}</p>
                    </div>
                  </div>
                );
              })
            )}

            {isSallyLoading && (
              <div className="flex justify-start">
                <div className="sally-glass-bubble rounded-2xl rounded-tl-none p-3 text-slate-300 text-xs w-[70%] border-l-2 border-l-indigo-500 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    <span className="font-bold text-[9px] tracking-wide text-indigo-300 uppercase">Consulting core...</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900/60 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 gemini-thinking-bar" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Context Prompt Pills */}
          {messages.length === 0 && (
            <div className="px-4 py-2 flex flex-wrap gap-2 justify-start border-t border-white/5 bg-slate-950/20 relative z-10">
              {suggestedPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage({ text: p.prompt })}
                  className="px-2.5 py-1 bg-white/5 border border-white/5 hover:border-indigo-500/20 text-[10px] text-slate-300 hover:text-white rounded-full font-google font-bold transition-all text-left truncate max-w-full"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-slate-950/40 border-t border-white/5 relative z-10 flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim()) {
                  sendMessage({ text: chatInput });
                  setChatInput('');
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask Sally..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500/50 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={isSallyLoading || !chatInput.trim()}
                className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-indigo-600"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* --- BROADCAST ANNOUNCEMENT MODAL --- */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBroadcastModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900/90 border border-white/10 p-6 rounded-3xl w-full max-w-md backdrop-blur-md shadow-2xl relative z-10 text-white text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio size={20} className="text-emerald-400 animate-pulse" />
                  <h3 className="font-google font-extrabold text-sm uppercase tracking-wider">New Instant Broadcast</h3>
                </div>
                <button 
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Broadcast Destination</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('announcements')}
                    className={clsx(
                      "py-2.5 rounded-xl text-xs font-bold transition-all border",
                      broadcastTarget === 'announcements'
                        ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/50"
                        : "bg-white/5 text-slate-300 border-transparent hover:border-white/5"
                    )}
                  >
                    📣 Announcements
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('general')}
                    className={clsx(
                      "py-2.5 rounded-xl text-xs font-bold transition-all border",
                      broadcastTarget === 'general'
                        ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/50"
                        : "bg-white/5 text-slate-300 border-transparent hover:border-white/5"
                    )}
                  >
                    💬 General Chat
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Message Content</label>
                <textarea
                  value={broadcastText}
                  onChange={e => setBroadcastText(e.target.value)}
                  placeholder="Type announcement broadcast..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-950/40 border border-white/5 rounded-2xl text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500/50 resize-none font-medium"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendBroadcast}
                  disabled={isBroadcasting || !broadcastText.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-40"
                >
                  {isBroadcasting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send size={12} /> Send Broadcast
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default React.memo(IconGallery);
