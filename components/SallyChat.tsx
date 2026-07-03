"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Sparkles, Send, Volume2, VolumeX, X, Box, ClipboardCheck, ArrowUpRight, CheckCircle2, AlertTriangle, HelpCircle, Trash2, RotateCcw, Users, CreditCard, Calendar, BarChart3, Bell, TrendingUp, TrendingDown, Clock, Zap, Mic, MicOff, Megaphone, History, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useTheme } from '../contexts/ThemeContext';
import { getAuthHeaders } from '../services/authHeaders';

// ── Constants ────────────────────────────────────────────────────────
interface Conversation {
  id: string;
  title: string;
  messages: Array<any>;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'sally_chat_history_v2';
const MAX_STORED_MESSAGES = 50;

// Write tools that modify data — shown with a visual distinction
const WRITE_TOOLS = new Set([
  'logStudentAssessment', 'postFeedMessage', 'manageSchedule',
  'manageMeetings', 'manageInstructors', 'manageInventory', 'sendNotification',
]);
const isWriteTool = (name: string) => WRITE_TOOLS.has(name);

const WriteActionBadge = () => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 ml-auto flex-shrink-0">
    <Zap className="w-2.5 h-2.5" /> Write
  </span>
);


// ── Helpers ──────────────────────────────────────────────────────────
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInstitutionLabel(instType: string): string {
  switch (instType) {
    case 'primary': return 'CBC Primary';
    case 'jss': return 'CBC Junior Secondary';
    case 'highschool': return 'KCSE Secondary';
    case 'university': return 'University';
    case 'tvet': default: return 'TVET Solar';
  }
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  color: string;
}

export function Sally3DCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Create 3D helical particles
    const particleCount = 40;
    const particles: Particle3D[] = [];
    const colors = ['rgba(99, 102, 241, ', 'rgba(139, 92, 246, ', 'rgba(6, 182, 212, ', 'rgba(16, 185, 129, '];
    for (let i = 0; i < particleCount; i++) {
      const theta = (i / particleCount) * Math.PI * 2 * 3.5; // spiral twist
      const y = (i / particleCount - 0.5) * height * 0.75;
      const radius = 55 + Math.sin(theta * 1.5) * 12;
      particles.push({
        x: Math.cos(theta) * radius,
        y: y,
        z: Math.sin(theta) * radius,
        color: colors[i % colors.length]
      });
    }

    let angleY = 0.004;
    let angleX = 0.0025;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Rotate points relative to active load status
      const currentAngleY = active ? angleY * 2.8 : angleY;
      const currentAngleX = active ? angleX * 2.2 : angleX;

      const projected = particles
        .map(p => {
          // Y rotation
          const cosY = Math.cos(currentAngleY);
          const sinY = Math.sin(currentAngleY);
          const nx = p.x * cosY - p.z * sinY;
          const nz = p.x * sinY + p.z * cosY;

          // X rotation
          const cosX = Math.cos(currentAngleX);
          const sinX = Math.sin(currentAngleX);
          const ny = p.y * cosX - nz * sinX;
          const rz = p.y * sinX + nz * cosX;

          p.x = nx;
          p.y = ny;
          p.z = rz;

          // Projection formula
          const fov = 280;
          const scale = fov / (fov + rz);
          const px = nx * scale + width / 2;
          const py = ny * scale + height / 2;

          return { px, py, scale, color: p.color, z: rz };
        })
        .sort((a, b) => b.z - a.z); // painter's sorting algorithm

      projected.forEach(p => {
        if (p.px < 0 || p.px > width || p.py < 0 || p.py > height) return;
        const size = Math.max(0.8, p.scale * 3);
        const alpha = Math.max(0.08, Math.min(0.65, p.scale * 0.45));
        
        ctx.beginPath();
        ctx.arc(p.px, p.py, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + alpha + ')';
        ctx.fill();

        if (p.scale > 1.05) {
          ctx.beginPath();
          ctx.arc(p.px, p.py, size * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = p.color + (alpha * 0.2) + ')';
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none opacity-30 mix-blend-screen z-0"
    />
  );
}

async function sallyFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (response.ok) return response;

  let payload: any = null;
  try {
    payload = await response.clone().json();
  } catch {
    // Keep the original status-driven fallback below.
  }

  const stage = payload?.stage ? ` at ${payload.stage}` : '';
  const requestId = payload?.requestId ? ` Request ${payload.requestId}.` : '';
  const detail = payload?.error || response.statusText || 'Sally could not complete the request.';
  throw new Error(`Sally failed${stage}: ${detail}.${requestId}`.trim());
}

export function SallyChat({ currentView }: { currentView?: string }) {
  const { preferences } = useTheme();
  const instType = preferences?.institutionType || 'tvet';

  const [commsContext, setCommsContext] = useState<{
    channelId: string;
    channelName: string;
    channelType: string;
    messages: { senderName: string; senderRole: string; content: string; timestamp: string }[];
  } | null>(null);

  const copilotDescription = React.useMemo(() => {
    switch (instType) {
      case 'primary':
      case 'jss':
        return 'Your academic copilot for CBC curriculum guidelines, student portfolios, and competency assessments.';
      case 'highschool':
        return 'Your academic copilot for secondary curriculum, syllabus specs, exam preparation, and grading reports.';
      case 'university':
        return 'Your academic copilot for courses, semesters, GPA tracking, and student evaluations.';
      case 'tvet':
      default:
        return 'Your technical copilot for curriculum specs, solar inventory checks, and student assessments.';
    }
  }, [instType]);

  const suggestedPrompts = React.useMemo(() => {
    if (currentView === 'communications' || commsContext) {
      return [
        {
          label: "Summarize Recent Messages",
          subtext: "Catch up on what you missed",
          prompt: commsContext?.messages && commsContext.messages.length > 0
            ? `Summarize the last 20 messages in #${commsContext.channelName} and highlight any decisions, main topics, and clear action items:\n\n${commsContext.messages.map(m => `[${m.senderName} (${m.senderRole})]: ${m.content}`).join('\n')}`
            : "Summarize the last 20 messages in this channel and extract any key decisions or action items.",
          icon: ClipboardCheck,
          color: "emerald"
        },
        {
          label: "Extract Unresolved Tasks",
          subtext: "Find action items & follow-ups",
          prompt: commsContext?.messages && commsContext.messages.length > 0
            ? `Identify and extract all unresolved questions, tasks, follow-ups, or action items in the following chat conversation, and list them clearly as a checklist:\n\n${commsContext.messages.map(m => `[${m.senderName} (${m.senderRole})]: ${m.content}`).join('\n')}`
            : "Find all unresolved questions, tasks, assignments or action items in this channel, and list them as a checklist.",
          icon: Sparkles,
          color: "indigo"
        },
        {
          label: "Draft Announcement",
          subtext: "Create professional post",
          prompt: "Draft a professional announcement template. Ask me what the topic should be.",
          icon: Megaphone,
          color: "violet"
        },
        {
          label: "Optimize Draft Tone",
          subtext: "Polite, Encouraging, Urgent",
          prompt: "Improve the tone of a chat message response. Ask me what message I want to optimize, or give me some response templates.",
          icon: Box,
          color: "amber"
        }
      ];
    }
    if (currentView === 'timetable') {
      return [
        {
          label: "Today's Timetable",
          subtext: "Show current classes",
          prompt: "Show me the schedule details for today",
          icon: Calendar,
          color: "cyan"
        },
        {
          label: "Check Conflicts",
          subtext: "Find timetable issues",
          prompt: "Are there any scheduling conflicts this week?",
          icon: AlertTriangle,
          color: "amber"
        },
        {
          label: "Find Open Slots",
          subtext: "Locate unassigned hours",
          prompt: "What are the empty timetable slots for tomorrow?",
          icon: Clock,
          color: "indigo"
        }
      ];
    }
    if (currentView === 'attendance') {
      return [
        {
          label: "Class Attendance Summary",
          subtext: "Review overall rates",
          prompt: "Show me the class attendance summary",
          icon: Users,
          color: "emerald"
        },
        {
          label: "At-Risk Students",
          subtext: "Attendance below 80%",
          prompt: "Which students have attendance below 80%?",
          icon: AlertTriangle,
          color: "amber"
        },
        {
          label: "Attendance Streak",
          subtext: "Highest active attendance",
          prompt: "Show me students with the highest attendance streak",
          icon: Zap,
          color: "indigo"
        }
      ];
    }
    if (currentView === 'overview-analytics') {
      return [
        {
          label: "Run Analytics Insights",
          subtext: "Deep analytical overview",
          prompt: "Run the analytics engine and show me insights about our class",
          icon: BarChart3,
          color: "violet"
        },
        {
          label: "Assessment Performance",
          subtext: "Class scores summary",
          prompt: "Show me the average assessment scores",
          icon: ClipboardCheck,
          color: "indigo"
        },
        {
          label: "Compare Cohorts",
          subtext: "Performance comparison",
          prompt: "Compare our class performance to other cohorts",
          icon: TrendingUp,
          color: "emerald"
        }
      ];
    }

    switch (instType) {
      case 'primary':
      case 'jss':
        return [
          {
            label: "Explain CBC Competencies",
            subtext: "View 7 core KICD competencies",
            prompt: "What are the 7 core competencies under Kenya CBC?",
            icon: HelpCircle,
            color: "amber"
          },
          {
            label: "Log Kiswahili competency",
            subtext: "Log level for a grade 4 student",
            prompt: "Log level 3 in Communication for student John Doe with comment 'Well spoken'",
            icon: ClipboardCheck,
            color: "indigo"
          },
          {
            label: "Class Attendance Report",
            subtext: "View overall attendance",
            prompt: "Show me the class attendance summary",
            icon: Users,
            color: "emerald"
          },
          {
            label: "Competency Analytics",
            subtext: "Check CBC performance trends",
            prompt: "Run the PRISM analytics engine and show me CBC insights",
            icon: BarChart3,
            color: "violet"
          }
        ];
      case 'highschool':
        return [
          {
            label: "Log Chemistry Grade",
            subtext: "Submit CAT marks for John Doe",
            prompt: "Log a score of 78 in Chemistry for student John Doe with comment 'Improved lab work'",
            icon: ClipboardCheck,
            color: "indigo"
          },
          {
            label: "KCSE Grading Scale",
            subtext: "View KNEC highschool brackets",
            prompt: "What is the standard KCSE highschool grading scale in PRISM?",
            icon: HelpCircle,
            color: "amber"
          },
          {
            label: "Average Class Performance",
            subtext: "Analytics and trends",
            prompt: "Give me an analytics briefing on the class performance",
            icon: BarChart3,
            color: "violet"
          },
          {
            label: "Lab Equipment Stock Check",
            subtext: "Check science lab inventories",
            prompt: "Check the physics lab equipment inventory stock",
            icon: Box,
            color: "emerald"
          }
        ];
      case 'university':
        return [
          {
            label: "Log Exam Grade",
            subtext: "Submit grade for Computer Science",
            prompt: "Log a score of 82 in Computer Science for student John Doe with comment 'Excellent code submission'",
            icon: ClipboardCheck,
            color: "indigo"
          },
          {
            label: "Check Semester GPA",
            subtext: "How to calculate student GPAs",
            prompt: "What is the formula for calculating GPA in tertiary systems?",
            icon: HelpCircle,
            color: "amber"
          },
          {
            label: "Department Stock",
            subtext: "Check department laptops",
            prompt: "Check laptop stock in the computer science department",
            icon: Box,
            color: "emerald"
          },
          {
            label: "Class Health Check",
            subtext: "Analytics and insights",
            prompt: "Give me a full analytics report on the class",
            icon: BarChart3,
            color: "violet"
          }
        ];
      case 'tvet':
      default:
        return [
          {
            label: "Check Multimeter Inventory",
            subtext: "Query real-time stock levels",
            prompt: "Check the multimeter stock at Main Campus",
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
          },
          {
            label: "Run Analytics Engine",
            subtext: "Attendance, performance, workload",
            prompt: "Run the PRISM analytics engine and show me all insights",
            icon: BarChart3,
            color: "violet"
          }
        ];
    }
  }, [instType, currentView]);

  const [isOpen, setIsOpen] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [input, setInput] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [shouldAnimateScroll, setShouldAnimateScroll] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<any[]>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

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
    const handleOpenSally = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.context === 'comms') {
        setCommsContext(customEvent.detail);
      } else {
        setCommsContext(null);
      }
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
    const normalizeToolInvocation = (toolInvocation: any) => ({
      ...toolInvocation,
      args: toolInvocation.args ?? toolInvocation.input,
      result: toolInvocation.result ?? toolInvocation.output,
    });

    if (message.toolInvocations && Array.isArray(message.toolInvocations)) {
      return message.toolInvocations.map(normalizeToolInvocation);
    }
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .map((part: any) => {
          if (part.type === 'tool-invocation' && part.toolInvocation) {
            return normalizeToolInvocation(part.toolInvocation);
          }

          if (part.type === 'dynamic-tool' || (typeof part.type === 'string' && part.type.startsWith('tool-'))) {
            return normalizeToolInvocation({
              toolName: part.toolName || part.type.replace(/^tool-/, ''),
              toolCallId: part.toolCallId,
              state: part.state,
              input: part.input,
              output: part.output,
              errorText: part.errorText,
            });
          }

          return null;
        })
        .filter(Boolean);
    }
    return [];
  };

  const lastProviderRef = useRef<string | null>(null);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      headers: () => getAuthHeaders(),
      body: {
        institutionType: instType,
      },
      fetch: async (input, init) => {
        const response = await sallyFetch(input, init);
        const activeProvider = response.headers.get('X-Provider-Used');
        if (activeProvider) {
          lastProviderRef.current = activeProvider;
        }
        return response;
      },
    }),
    onFinish: (response: any) => {
      // Extract assistant response safely from the event payload
      const msg = response?.message || response?.responseMessage || response;
      if (speechEnabled && msg && msg.role === 'assistant') {
        speak(getMessageText(msg));
      }
    },
    onError: (err: Error) => {
      console.warn('[SallyChat] Chat request failed:', err.message);
      if (lastProviderRef.current) {
        getAuthHeaders().then(authHeaders => {
          fetch('/api/ai/health', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ provider: lastProviderRef.current, error: err.message }),
          }).catch(() => {});
        });
      }
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // ── Conversation Memory: Load conversations and restore active on mount ──
  useEffect(() => {
    try {
      const storedList = localStorage.getItem('sally_conversations_list_v1');
      const storedActiveId = localStorage.getItem('sally_active_conversation_id_v1');
      
      let list: Conversation[] = [];
      if (storedList) {
        list = JSON.parse(storedList);
      }
      
      // Upgrade path for legacy single-chat history if present
      if (list.length === 0) {
        const legacyStored = localStorage.getItem(STORAGE_KEY);
        if (legacyStored) {
          try {
            const parsedLegacy = JSON.parse(legacyStored);
            if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
              const firstUser = parsedLegacy.find(m => m.role === 'user');
              const firstUserText = firstUser ? (firstUser.content || '') : 'Legacy Conversation';
              const legacyId = 'legacy_' + Date.now();
              list = [{
                id: legacyId,
                title: firstUserText.length > 28 ? firstUserText.substring(0, 28) + '...' : firstUserText || 'Legacy Conversation',
                messages: parsedLegacy,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }];
              localStorage.setItem('sally_active_conversation_id_v1', legacyId);
              localStorage.setItem('sally_conversations_list_v1', JSON.stringify(list));
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch {}
        }
      }

      if (list.length === 0) {
        // Create initial default new conversation
        const newId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const newConv: Conversation = {
          id: newId,
          title: 'New Conversation',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list = [newConv];
        setActiveConversationId(newId);
        localStorage.setItem('sally_active_conversation_id_v1', newId);
      } else {
        const activeId = storedActiveId && list.some(c => c.id === storedActiveId)
          ? storedActiveId
          : list[0].id;
        setActiveConversationId(activeId);
        
        // Restore active conversation messages
        const activeConv = list.find(c => c.id === activeId);
        if (activeConv && activeConv.messages.length > 0) {
          const historical = activeConv.messages.map((m: any) => ({ ...m, isHistorical: true }));
          setMessages(historical);
        }
      }
      setConversations(list);
      localStorage.setItem('sally_conversations_list_v1', JSON.stringify(list));
    } catch (err) {
      console.error('Failed to restore chat conversations:', err);
    }
    setHasAttemptedRestore(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Conversation Memory: Persist messages to active conversation ──
  useEffect(() => {
    if (!hasAttemptedRestore || !activeConversationId) return;
    
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === activeConversationId);
      if (idx === -1) return prev;
      
      const current = prev[idx];
      // Generate a title from the first user message if it is still a generic default
      let title = current.title;
      if (title === 'New Conversation' || title.trim() === '') {
        const firstUser = messages.find(m => m.role === 'user' && !getMessageText(m).includes('[SYSTEM_INIT_'));
        if (firstUser) {
          const text = getMessageText(firstUser);
          title = text.length > 28 ? text.substring(0, 28) + '...' : text || 'New Conversation';
        }
      }
      
      const updated = {
        ...current,
        title,
        messages,
        updatedAt: new Date().toISOString()
      };
      
      const next = [...prev];
      next[idx] = updated;
      
      localStorage.setItem('sally_conversations_list_v1', JSON.stringify(next));
      return next;
    });
  }, [messages, activeConversationId, hasAttemptedRestore]);

  const startNewConversation = useCallback(() => {
    const newId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setConversations(prev => {
      const next = [newConv, ...prev];
      localStorage.setItem('sally_conversations_list_v1', JSON.stringify(next));
      return next;
    });
    
    setActiveConversationId(newId);
    localStorage.setItem('sally_active_conversation_id_v1', newId);
    setMessages([]);
    setShowHistoryList(false);
  }, [setMessages]);

  const loadConversation = useCallback((id: string) => {
    const target = conversations.find(c => c.id === id);
    if (!target) return;
    
    setActiveConversationId(id);
    localStorage.setItem('sally_active_conversation_id_v1', id);
    
    const historical = target.messages.map((m: any) => ({ ...m, isHistorical: true }));
    setMessages(historical);
    setShowHistoryList(false);
  }, [conversations, setMessages]);

  const deleteConversation = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      
      if (id === activeConversationId) {
        if (next.length > 0) {
          const fallbackId = next[0].id;
          setActiveConversationId(fallbackId);
          localStorage.setItem('sally_active_conversation_id_v1', fallbackId);
          const target = next[0];
          const historical = target.messages.map((m: any) => ({ ...m, isHistorical: true }));
          setMessages(historical);
        } else {
          const newId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          const newConv: Conversation = {
            id: newId,
            title: 'New Conversation',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          next.push(newConv);
          setActiveConversationId(newId);
          localStorage.setItem('sally_active_conversation_id_v1', newId);
          setMessages([]);
        }
      }
      
      localStorage.setItem('sally_conversations_list_v1', JSON.stringify(next));
      return next;
    });
  }, [activeConversationId, setMessages]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const triggerParticleBurst = useCallback(() => {
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Math.random(),
      x: (Math.random() - 0.5) * 80,
      y: -Math.random() * 60 - 20,
      scale: Math.random() * 0.4 + 0.6,
      rotation: Math.random() * 360,
      color: ['#818cf8', '#6ee7b7', '#fcd34d', '#fca5a5', '#c084fc'][Math.floor(Math.random() * 5)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 900);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === activeConversationId);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        messages: [],
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('sally_conversations_list_v1', JSON.stringify(next));
      return next;
    });
  }, [activeConversationId, setMessages]);

  const handleChipClick = useCallback((promptText: string) => {
    setLastUserMessage(promptText);
    sendMessage({ text: promptText });
    triggerParticleBurst();
  }, [sendMessage, triggerParticleBurst]);

  const getProactiveChips = useCallback(() => {
    switch (currentView) {
      case 'timetable':
        return [
          { label: "Today's Timetable", prompt: "Show me the schedule details for today" },
          { label: "Check Conflicts", prompt: "Are there any scheduling conflicts this week?" },
          { label: "Find Open Slots", prompt: "What are the empty timetable slots for tomorrow?" }
        ];
      case 'attendance':
        return [
          { label: "Class Attendance Summary", prompt: "Show me the class attendance summary" },
          { label: "At-Risk Students", prompt: "Which students have attendance below 80%?" },
          { label: "Attendance Streak", prompt: "Show me students with the highest attendance streak" }
        ];
      case 'overview-analytics':
      case 'analytics':
        return [
          { label: "Run Analytics Insights", prompt: "Run the analytics engine and show me insights about our class" },
          { label: "Assessment Performance", prompt: "Show me the average assessment scores" },
          { label: "Compare Cohorts", prompt: "Compare our class performance to other cohorts" }
        ];
      case 'fee-management':
      case 'fees':
        return [
          { label: "Fee Payments", prompt: "Show me the recent fee payments" },
          { label: "Pending Balances", prompt: "List students with pending fee balances" },
          { label: "Total Collections", prompt: "What is the total fee collection for this month?" }
        ];
      case 'students':
        return [
          { label: "Class Enrollment", prompt: "How many students are enrolled in my class?" },
          { label: "Find Student Data", prompt: "Show me student records" },
          { label: "Grade Assessments", prompt: "List all assessments in CBC" }
        ];
      case 'resources':
      case 'inventory':
        return [
          { label: "Check Inventory Stock", prompt: "Check inventory stock at Main Campus" },
          { label: "Low Stock Alert", prompt: "Are there any inventory items with low stock?" },
          { label: "Multimeters Stock", prompt: "Check the multimeter stock at Main Campus" }
        ];
      default:
        return [
          { label: "Class Attendance", prompt: "Show me the class attendance summary" },
          { label: "Run Analytics Insights", prompt: "Run the analytics engine and show me insights about our class" },
          { label: "Check Inventory Stock", prompt: "Check inventory stock at Main Campus" },
          { label: "Today's Timetable", prompt: "Show me the schedule details for today" }
        ];
    }
  }, [currentView]);

  // Trigger proactive welcome briefing if chat is opened with empty history
  useEffect(() => {
    if (isOpen && hasAttemptedRestore && messages.length === 0 && !isLoading) {
      if (commsContext) {
        sendMessage({
          text: `[SYSTEM_INIT_WELCOME_BRIEFING] You are serving as a dedicated Communication Copilot for #${commsContext.channelName}. Please greet me warmly, introduce yourself as the PRISM Comms Assistant, and explain that you can help summarize channel history, find action items, draft messages, or rewrite announcements. Keep it under 2 short, professional sentences.`,
        });
      } else {
        sendMessage({
          text: '[SYSTEM_INIT_WELCOME_BRIEFING] Please greet me warmly by name, check the database context (attendance averages, low stock items, recent CAT grades), and summarize our training center status in 2 natural sentences.',
        });
      }
    }
  }, [isOpen, hasAttemptedRestore, messages.length, isLoading, sendMessage, commsContext]);

  // Dynamic scroll-to-bottom logic
  useEffect(() => {
    if (isOpen) {
      if (shouldAnimateScroll) {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Instant snap to bottom on initial open to avoid scrolling animation fatigue
        messageEndRef.current?.scrollIntoView({ behavior: 'auto' });
        // Enable smooth scrolling for subsequent live messages
        const timer = setTimeout(() => setShouldAnimateScroll(true), 100);
        return () => clearTimeout(timer);
      }
    } else {
      setShouldAnimateScroll(false);
    }
  }, [messages, isLoading, isOpen, shouldAnimateScroll]);

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

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Stop speaking when user wants to talk
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-KE';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setLastUserMessage(transcript);
        sendMessage({ text: transcript });
        triggerParticleBurst();
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, sendMessage, triggerParticleBurst]);

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
    setLastUserMessage(input);
    sendMessage({ text: input });
    triggerParticleBurst();
    setInput('');
  };

  const handleRetry = () => {
    if (lastUserMessage) {
      sendMessage({ text: lastUserMessage });
    }
  };

  const getSallyErrorMessage = (err: Error) => {
    const message = err.message || 'Failed to retrieve response';
    if (message.includes('Sally failed')) return message;
    return `Sally hit a temporary connection issue: ${message}`;
  };

  // ── Tool Result Card Renderers ──────────────────────────────────

  const renderStudentDataCard = (result: any, args: any) => {
    if (result.error) return renderErrorCard(result.error);
    const students = result.students || [];
    if (students.length === 0) return <div className="text-xs text-slate-400 italic py-2">No students found.</div>;
    return (
      <div className="w-[88%] sally-glass-bubble border-l-2 border-l-violet-500 rounded-2xl p-3.5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Users className="w-3.5 h-3.5 text-violet-400" />
          <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider font-space">
            Student Records {args.studentName ? `· "${args.studentName}"` : ''}
          </h4>
        </div>
        <div className="space-y-2">
          {students.slice(0, 5).map((s: any, i: number) => (
            <div key={s.id || i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-200 truncate">{s.name || s.full_name}</p>
                <p className="text-[9px] text-slate-500">{s.subject || s.cohort || 'No cohort'}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {s.average_score !== undefined && (
                  <div className="text-right">
                    <p className="text-[8px] text-slate-500 uppercase">Score</p>
                    <p className="font-mono font-bold text-indigo-400">{Math.round(Number(s.average_score))}%</p>
                  </div>
                )}
                {s.attendance_rate !== undefined && (
                  <div className="text-right">
                    <p className="text-[8px] text-slate-500 uppercase">Attend</p>
                    <p className={clsx("font-mono font-bold", Number(s.attendance_rate) >= 80 ? "text-emerald-400" : "text-amber-400")}>
                      {Math.round(Number(s.attendance_rate))}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {students.length > 5 && (
            <p className="text-[9px] text-slate-500 pt-0.5">+ {students.length - 5} more students</p>
          )}
        </div>
      </div>
    );
  };

  const renderFeePaymentsCard = (result: any, args: any) => {
    if (result.error) return renderErrorCard(result.error);
    const payments = result.payments || [];
    if (payments.length === 0) return <div className="text-xs text-slate-400 italic py-2">No payments found.</div>;
    return (
      <div className="w-[88%] sally-glass-bubble border-l-2 border-l-emerald-500 rounded-2xl p-3.5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider font-space">Fee Payments</h4>
        </div>
        <div className="space-y-2">
          {payments.slice(0, 5).map((p: any, i: number) => (
            <div key={p.id || i} className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 text-xs space-y-1.5">
              <div className="flex justify-between items-start">
                <p className="font-semibold text-slate-200">{p.student_name || 'Unknown'}</p>
                <span className={clsx(
                  "px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase border",
                  p.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  p.status === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-red-500/10 text-red-400 border-red-500/20"
                )}>{p.status}</span>
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-400">
                <span className="font-bold text-slate-300">KES {Number(p.amount || 0).toLocaleString()}</span>
                {p.mpesa_receipt_number && <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">M-Pesa: {p.mpesa_receipt_number}</span>}
              </div>
            </div>
          ))}
          {payments.length > 5 && (
            <p className="text-[9px] text-slate-500 pt-0.5">+ {payments.length - 5} more payments</p>
          )}
        </div>
      </div>
    );
  };

  const renderScheduleCard = (result: any) => {
    if (result.error) return renderErrorCard(result.error);
    const slots = result.schedule || [];
    if (slots.length === 0) return <div className="text-xs text-slate-400 italic py-2">No schedule slots found.</div>;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="w-[88%] sally-glass-bubble border-l-2 border-l-cyan-500 rounded-2xl p-3.5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider font-space">Timetable</h4>
        </div>
        <div className="space-y-1.5">
          {slots.slice(0, 8).map((s: any, i: number) => (
            <div key={s.id || i} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0 text-xs">
              <span className="w-8 text-[9px] font-bold text-cyan-400 font-mono">{dayNames[s.day_of_week] || '?'}</span>
              <span className="text-[9px] text-slate-500 font-mono w-20">{s.start_time}–{s.end_time}</span>
              <span className="font-medium text-slate-200 truncate flex-1">{s.title}</span>
              {s.type && <span className="px-1.5 py-0.5 rounded text-[8px] bg-white/5 text-slate-400 border border-white/5">{s.type}</span>}
            </div>
          ))}
          {slots.length > 8 && <p className="text-[10px] text-slate-500 pt-1">+ {slots.length - 8} more slots</p>}
        </div>
      </div>
    );
  };

  const renderAttendanceCard = (result: any) => {
    if (result.error) return renderErrorCard(result.error);
    
    // Class summary variant
    if (result.classSummary) {
      const cs = result.classSummary;
      const rateColor = cs.averageAttendanceRate >= 90 ? 'emerald' : cs.averageAttendanceRate >= 75 ? 'amber' : 'red';
      return (
        <div className="w-[88%] sally-glass-bubble border-l-2 border-l-teal-500 rounded-2xl p-3.5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider font-space">Class Attendance</h4>
          </div>
          <div className="flex items-center gap-4 mb-1">
            {/* Attendance percentage ring */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-800/40" />
                <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4"
                  strokeDasharray={`${(cs.averageAttendanceRate / 100) * 175.93} 175.93`}
                  strokeLinecap="round"
                  className={clsx(rateColor === 'emerald' ? 'text-emerald-400' : rateColor === 'amber' ? 'text-amber-400' : 'text-red-400')}
                  stroke="currentColor"
                />
              </svg>
              <span className={clsx("absolute inset-0 flex items-center justify-center text-sm font-bold font-mono", rateColor === 'emerald' ? 'text-emerald-400' : rateColor === 'amber' ? 'text-amber-400' : 'text-red-400')}>
                {cs.averageAttendanceRate}%
              </span>
            </div>
            <div className="text-xs space-y-1">
              <p className="text-slate-300"><span className="font-bold text-white">{cs.totalStudents}</span> students enrolled</p>
              {cs.studentsBelow80Count > 0 && (
                <p className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {cs.studentsBelow80Count} below 80%
                </p>
              )}
            </div>
          </div>
          {cs.studentsBelow80Pct?.length > 0 && (
            <div className="space-y-1 border-t border-white/5 pt-2">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">At-Risk Students</p>
              {cs.studentsBelow80Pct.slice(0, 4).map((s: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-1">
                  <span className="text-slate-300">{s.name}</span>
                  <span className="font-mono text-amber-400">{s.rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Individual student variant
    if (result.attendance) {
      const a = result.attendance;
      const rateColor = a.overallRate >= 90 ? 'emerald' : a.overallRate >= 75 ? 'amber' : 'red';
      return (
        <div className="w-[88%] sally-glass-bubble border-l-2 border-l-teal-500 rounded-2xl p-3.5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider font-space">Attendance · {a.studentName}</h4>
          </div>
          <div className="flex items-center gap-4 mb-1">
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-slate-800/40" />
                <circle cx="28" cy="28" r="24" fill="none" strokeWidth="3.5"
                  strokeDasharray={`${(a.overallRate / 100) * 150.8} 150.8`}
                  strokeLinecap="round"
                  className={clsx(rateColor === 'emerald' ? 'text-emerald-400' : rateColor === 'amber' ? 'text-amber-400' : 'text-red-400')}
                  stroke="currentColor"
                />
              </svg>
              <span className={clsx("absolute inset-0 flex items-center justify-center text-xs font-bold font-mono", rateColor === 'emerald' ? 'text-emerald-400' : rateColor === 'amber' ? 'text-amber-400' : 'text-red-400')}>
                {a.overallRate}%
              </span>
            </div>
            <div className="text-xs space-y-1 flex-1">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-slate-300">{a.currentStreak} day streak</span>
              </div>
              <div className="flex gap-3 text-[9px]">
                <span className="text-emerald-400">✓ {a.last14Days?.present || 0} present</span>
                <span className="text-red-400">✗ {a.last14Days?.absent || 0} absent</span>
                <span className="text-amber-400">◷ {a.last14Days?.late || 0} late</span>
              </div>
            </div>
          </div>
          {/* Last 7 days mini timeline */}
          {a.recentHistory?.length > 0 && (
            <div className="flex gap-1.5 items-center border-t border-white/5 pt-2">
              <span className="text-[9px] text-slate-500 mr-1 uppercase">Last 7d:</span>
              {a.recentHistory.map((h: any, i: number) => (
                <div key={i} className={clsx(
                  "w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold border",
                  h.status === 'present' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  h.status === 'late' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  {h.status === 'present' ? '✓' : h.status === 'late' ? '◷' : '✗'}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return renderGenericToolCard('getAttendanceData', result);
  };

  const renderAnalyticsCard = (result: any) => {
    if (result.error) return renderErrorCard(result.error);
    const insights = result.insights || [];
    if (insights.length === 0) return <div className="text-xs text-slate-400 italic py-2">No insights generated.</div>;

    const typeConfig: Record<string, { icon: any; bg: string; border: string; text: string }> = {
      success: { icon: TrendingUp, bg: 'bg-emerald-500/5', border: 'border-emerald-500/10', text: 'text-emerald-400' },
      warning: { icon: AlertTriangle, bg: 'bg-amber-500/5', border: 'border-amber-500/10', text: 'text-amber-400' },
      info: { icon: BarChart3, bg: 'bg-blue-500/5', border: 'border-blue-500/10', text: 'text-blue-400' },
      prediction: { icon: TrendingDown, bg: 'bg-violet-500/5', border: 'border-violet-500/10', text: 'text-violet-400' },
    };

    return (
      <div className="w-[88%] sally-glass-bubble border-l-2 border-l-violet-500 rounded-2xl p-3.5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
            <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider font-space">Analytics Insights</h4>
          </div>
          {result.studentCount && (
            <span className="text-[8px] text-slate-500 font-mono">{result.studentCount} students · {result.classAvgAttendance}% avg</span>
          )}
        </div>
        <div className="space-y-2">
          {insights.map((insight: any, i: number) => {
            const config = typeConfig[insight.type] || typeConfig.info;
            const IconComponent = config.icon;
            return (
              <div key={i} className={clsx("p-2 rounded-xl border", config.bg, config.border)}>
                <div className="flex items-start gap-2">
                  <IconComponent className={clsx("w-3.5 h-3.5 mt-0.5 flex-shrink-0", config.text)} />
                  <div className="min-w-0 flex-1">
                    <p className={clsx("text-xs font-semibold leading-relaxed", config.text)}>{insight.message}</p>
                    {insight.detail && <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">{insight.detail}</p>}
                  </div>
                  {insight.priority === 'high' && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20 flex-shrink-0">URGENT</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNotificationCard = (result: any) => {
    if (result.error) return renderErrorCard(result.error);
    return (
      <div className="w-[85%] bg-gradient-to-br from-violet-950/20 via-slate-900 to-slate-900 border border-violet-500/20 backdrop-blur-md rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-violet-400" />
          <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider font-space">Notification Sent</h4>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Recipient</span>
            <span className="font-medium text-slate-200">{result.recipientName}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/50 border border-white/5">
            <p className="text-[10px] text-slate-500 uppercase mb-1">Message</p>
            <p className="text-slate-300 text-xs leading-relaxed">"{result.messagePreview}"</p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            {result.pushStatus === 'delivered' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Push delivered
              </span>
            )}
            {result.smsStatus === 'queued' && (
              <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                <Clock className="w-3 h-3" /> SMS queued {result.smsPhone && `(${result.smsPhone})`}
              </span>
            )}
            {result.smsStatus === 'skipped' && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400">
                <AlertTriangle className="w-3 h-3" /> No phone found
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderActionCard = (title: string, result: any, icon: React.ElementType = CheckCircle2) => {
    if (result.error) return renderErrorCard(result.error);
    const IconComponent = icon;
    const summary = result.message || (result.success ? 'Action completed successfully.' : 'Request completed.');
    return (
      <div className="w-[85%] bg-slate-900 border border-emerald-500/20 backdrop-blur-md rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <IconComponent className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-space">{title}</h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
      </div>
    );
  };

  const renderLibraryAssetsCard = (result: any) => {
    if (result.error) return renderErrorCard(result.error);
    const assets = result.assets || [];
    if (assets.length === 0) return <div className="text-xs text-slate-400 italic py-2">No library assets found.</div>;
    return (
      <div className="w-[85%] bg-slate-900 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardCheck className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-space">Library Assets</h4>
        </div>
        <div className="space-y-2">
          {assets.slice(0, 5).map((asset: any, i: number) => (
            <div key={asset.id || i} className="py-2 border-b border-white/5 last:border-0 text-xs">
              <p className="font-medium text-slate-200 truncate">{asset.title || asset.file_name || 'Untitled asset'}</p>
              <p className="text-[10px] text-slate-500 truncate">{asset.category || 'uncategorized'}{asset.uploaded_by ? ` - ${asset.uploaded_by}` : ''}</p>
            </div>
          ))}
          {assets.length > 5 && <p className="text-[10px] text-slate-500 pt-1">+ {assets.length - 5} more assets</p>}
        </div>
      </div>
    );
  };

  const renderFeedMessagesCard = (result: any) => {
    if (result.error) return renderErrorCard(result.error);
    const feedMessages = result.messages || [];
    if (feedMessages.length === 0) return <div className="text-xs text-slate-400 italic py-2">No feed messages found.</div>;
    return (
      <div className="w-[85%] bg-slate-900 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-violet-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-space">{result.channelName || 'Feed Messages'}</h4>
        </div>
        <div className="space-y-2">
          {feedMessages.slice(0, 5).map((msg: any, i: number) => (
            <div key={msg.id || i} className="py-2 border-b border-white/5 last:border-0 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-medium text-slate-200 truncate">{msg.senderName || 'Unknown User'}</p>
                {msg.isPinned && <span className="text-[9px] text-amber-400 uppercase font-bold">Pinned</span>}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{msg.content}</p>
            </div>
          ))}
          {feedMessages.length > 5 && <p className="text-[10px] text-slate-500 pt-1">+ {feedMessages.length - 5} more messages</p>}
        </div>
      </div>
    );
  };

  const renderMeetingsCard = (result: any) => {
    if (result.error) return renderErrorCard(result.error);
    const meetings = result.meetings || [];
    if (meetings.length === 0) return <div className="text-xs text-slate-400 italic py-2">No meetings found.</div>;
    return (
      <div className="w-[85%] bg-slate-900 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-space">Video Meetings</h4>
        </div>
        <div className="space-y-2">
          {meetings.slice(0, 5).map((meeting: any, i: number) => (
            <div key={meeting.id || i} className="flex justify-between items-start gap-3 py-2 border-b border-white/5 last:border-0 text-xs">
              <div className="min-w-0">
                <p className="font-medium text-slate-200 truncate">{meeting.title || meeting.meeting_code || 'PRISM Meeting'}</p>
                <p className="text-[10px] text-slate-500 truncate">{meeting.host_name || 'Unknown host'} - {meeting.meeting_code}</p>
              </div>
              <span className={clsx("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border", meeting.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-white/5")}>
                {meeting.status || 'unknown'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInstructorsCard = (result: any) => {
    if (result.error) return renderErrorCard(result.error);
    const instructors = result.instructors || [];
    if (instructors.length === 0) return <div className="text-xs text-slate-400 italic py-2">No instructors found.</div>;
    return (
      <div className="w-[85%] bg-slate-900 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-space">Instructors</h4>
        </div>
        <div className="space-y-2">
          {instructors.slice(0, 5).map((instructor: any, i: number) => (
            <div key={instructor.id || i} className="py-2 border-b border-white/5 last:border-0 text-xs">
              <div className="flex justify-between items-center gap-2">
                <p className="font-medium text-slate-200 truncate">{instructor.full_name || instructor.name || 'Unnamed Instructor'}</p>
                {instructor.is_active === false && <span className="text-[9px] text-red-400 uppercase font-bold">Inactive</span>}
              </div>
              <p className="text-[10px] text-slate-500 truncate">{instructor.subject || 'No subject'}{instructor.email ? ` - ${instructor.email}` : ''}</p>
            </div>
          ))}
          {instructors.length > 5 && <p className="text-[10px] text-slate-500 pt-1">+ {instructors.length - 5} more instructors</p>}
        </div>
      </div>
    );
  };

  const renderFeeStructuresCard = (result: any) => {
    if (result.error) return renderErrorCard(result.error);
    const structures = result.feeStructures || [];
    if (structures.length === 0) return <div className="text-xs text-slate-400 italic py-2">No fee structures found.</div>;
    return (
      <div className="w-[85%] bg-slate-900 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-green-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-space">Fee Structures</h4>
        </div>
        <div className="space-y-2">
          {structures.slice(0, 5).map((item: any, i: number) => (
            <div key={item.id || i} className="flex justify-between items-center gap-3 py-2 border-b border-white/5 last:border-0 text-xs">
              <div className="min-w-0">
                <p className="font-medium text-slate-200 truncate">{item.name || 'Fee structure'}</p>
                <p className="text-[10px] text-slate-500 truncate">{item.student_group || 'All students'}</p>
              </div>
              <span className="font-mono text-green-400 font-bold">KES {Number(item.amount || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStudentBalancesCard = (result: any) => {
    if (result.error) return renderErrorCard(result.error);
    const balances = result.studentBalances || [];
    if (balances.length === 0) return <div className="text-xs text-slate-400 italic py-2">No fee balances found.</div>;
    return (
      <div className="w-[85%] bg-slate-900 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-space">Student Fee Balances</h4>
        </div>
        <div className="space-y-2">
          {balances.slice(0, 5).map((item: any, i: number) => (
            <div key={item.student_id || item.id || i} className="flex justify-between items-center gap-3 py-2 border-b border-white/5 last:border-0 text-xs">
              <div className="min-w-0">
                <p className="font-medium text-slate-200 truncate">{item.student_name || item.name || 'Student'}</p>
                <p className="text-[10px] text-slate-500 truncate">Paid KES {Number(item.total_paid || 0).toLocaleString()}</p>
              </div>
              <span className={clsx("font-mono font-bold", Number(item.balance || 0) > 0 ? "text-amber-400" : "text-emerald-400")}>
                KES {Number(item.balance || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderErrorCard = (errorMsg: string) => (
    <div className="w-[85%] text-xs text-red-400 bg-red-950/20 border border-red-500/20 p-2.5 rounded-xl flex items-center gap-2">
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{errorMsg}</span>
    </div>
  );

  const renderGenericToolCard = (toolName: string, result: any) => {
    if (result.error) return renderErrorCard(result.error);
    // Format tool name for display
    const displayName = toolName.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
    const entries = Object.entries(result).filter(([k]) => k !== 'error');
    return (
      <div className="w-[85%] bg-slate-900/80 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-space">{displayName}</h4>
        </div>
        <div className="space-y-1 text-xs max-h-48 overflow-y-auto custom-scrollbar">
          {entries.map(([key, val], i) => (
            <div key={i} className="flex justify-between items-start py-1 border-b border-white/5 last:border-0">
              <span className="text-slate-500 text-[10px] font-mono">{key}</span>
              <span className="text-slate-300 text-right max-w-[60%] truncate font-mono text-[10px]">
                {typeof val === 'object' ? JSON.stringify(val).substring(0, 80) + '…' : String(val)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Tool Card Router ────────────────────────────────────────────
  const renderToolResult = (toolName: string, result: any, rawArgs: any = {}) => {
    const args = rawArgs || {};
    switch (toolName) {
      case 'getInventoryStock':
        return (
          <div className="w-[85%] bg-slate-900 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Box className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-space">
                Inventory: {args.locationName || args.location_name || args.location || ''}
              </h4>
            </div>
            {result.error ? renderErrorCard(result.error) : !result.inventory || result.inventory.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-2">No equipment logged at this location.</div>
            ) : (
              <div className="space-y-2">
                {result.inventory.map((item: any) => {
                  const isLowStock = (item.available_qty ?? item.quantity ?? 0) <= (item.low_stock_threshold ?? 5);
                  return (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-xs">
                      <span className="font-medium text-slate-300">{item.item_name}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-slate-400 font-bold">{item.available_qty ?? item.quantity} units</span>
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                          isLowStock ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>{isLowStock ? "Low Stock" : "OK"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'logStudentAssessment':
        return (
          <div className="w-[85%] bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-900 border border-indigo-500/20 backdrop-blur-md rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-space">Competency Logged</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">NITA</span>
            </div>
            {result.error ? renderErrorCard(result.error) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Student</p>
                    <p className="font-bold text-slate-200">{args.studentName || args.student_name || args.student}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase">Module</p>
                    <p className="font-bold text-slate-200">{args.moduleName || args.module_name || args.module}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wide">Instructor Notes</p>
                    <p className="text-xs text-slate-300 italic truncate">"{args.comments || args.comment || args.notes || args.feedback || 'Graded successfully.'}"</p>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg flex-shrink-0">
                    <span className="text-lg font-mono font-bold text-indigo-400">{args.score || args.grade || args.mark}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
                  <span>Database state updated</span>
                </div>
              </div>
            )}
          </div>
        );
      case 'getStudentData':
        return renderStudentDataCard(result, args);
      case 'getFeePayments':
        return renderFeePaymentsCard(result, args);
      case 'getFeeStructures':
        return renderFeeStructuresCard(result);
      case 'getStudentFeeBalances':
        return renderStudentBalancesCard(result);
      case 'getLibraryAssets':
        return renderLibraryAssetsCard(result);
      case 'getFeedMessages':
        return renderFeedMessagesCard(result);
      case 'getSchedule':
        return renderScheduleCard(result);
      case 'manageSchedule':
        return renderActionCard('Schedule Updated', result, Calendar);
      case 'getMeetings':
        return renderMeetingsCard(result);
      case 'manageMeetings':
        return renderActionCard('Meeting Updated', result, Calendar);
      case 'getInstructors':
        return renderInstructorsCard(result);
      case 'manageInstructors':
        return renderActionCard('Instructor Updated', result, Users);
      case 'manageInventory':
        return renderActionCard('Inventory Updated', result, Box);
      case 'postFeedMessage':
        return renderActionCard('Feed Message Posted', result, Bell);
      case 'getAttendanceData':
        return renderAttendanceCard(result);
      case 'getAnalyticsInsights':
        return renderAnalyticsCard(result);
      case 'sendNotification':
        return renderNotificationCard(result);
      default:
        return renderGenericToolCard(toolName, result);
    }
  };

  const handleInsertDraft = (text: string) => {
    window.dispatchEvent(new CustomEvent('insert-sally-draft', { detail: { draft: text } }));
    setIsOpen(false);
  };

  return (
    <>
      {/* 1. Floating Action Orb Trigger Button */}
      {!isOpen && currentView !== 'communications' && (
        <div className="fixed bottom-24 right-6 md:bottom-6 z-40 group">
          <motion.div 
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="relative cursor-pointer"
          >
            {/* Ambient Morphing Glow Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-violet-600 to-emerald-500 blur-xl opacity-60 group-hover:opacity-95 transition-opacity duration-500 ai-morph-orb" style={{ width: '56px', height: '56px' }} />
            
            {/* Morphing Border Outline Ring */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 via-indigo-500 to-emerald-400 p-[1px] ai-morph-orb shadow-lg shadow-indigo-500/20" style={{ width: '56px', height: '56px' }}>
              <div className="w-full h-full bg-slate-950 rounded-inherit ai-morph-orb" />
            </div>

            {/* Main Interactive Morphing Orb */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative w-14 h-14 bg-slate-950/80 backdrop-blur-md text-slate-200 group-hover:text-white transition-colors duration-500 flex items-center justify-center ai-morph-orb border border-white/5"
              aria-label="Ask Sally"
            >
              <div className="relative flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-emerald-400 animate-pulse transition-colors" />
                <Sparkles className="w-3 h-3 text-pink-400 absolute -top-1.5 -right-1.5 opacity-80 animate-bounce" style={{ animationDuration: '2.5s' }} />
              </div>
            </button>
          </motion.div>
        </div>
      )}

      {/* 2. Side Panel Chat UI */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Blur Scrim to liquefy background text and preserve transparent vibe */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 backdrop-blur-[6px] bg-slate-950/15 z-40 pointer-events-none"
            />
            <motion.div
              ref={panelRef}
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[380px] h-full sm:h-[640px] max-h-[calc(100vh-48px)] text-white flex flex-col z-50 overflow-hidden sm:rounded-3xl sally-glass-card shadow-2xl border border-white/10"
          >
            {/* Interactive Cursor Spotlight Glow */}
            <div 
              className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-80 z-0"
              style={{
                background: `radial-gradient(360px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.08), transparent 75%)`
              }}
            />

            {/* Ambient 3D Helix Background Canvas */}
            <Sally3DCanvas active={isLoading} />

            {/* Header Panel */}
            <div className="p-4 bg-slate-950/40 backdrop-blur-md flex items-center justify-between border-b border-white/5 flex-shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {/* Glowing Pulsing Ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 blur-md opacity-75 animate-pulse" />
                  
                  {/* Modernized organic sphere with inner sparkle */}
                  <div className="relative w-9 h-9 rounded-full bg-slate-950 border border-white/15 flex items-center justify-center shadow-lg shadow-indigo-500/10 overflow-hidden">
                    {/* Inner morphing gradient core */}
                    <div className="absolute inset-0.5 bg-gradient-to-tr from-indigo-600 to-pink-600 rounded-full opacity-60 blur-[1px] animate-pulse" style={{ animationDuration: '4s' }} />
                    <Sparkles className="w-4 h-4 text-white relative z-10 animate-pulse" />
                  </div>
                  {/* Active status indicator dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full shadow-[0_0_8px_#34d399]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-space tracking-wide bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Sally</h3>
                  {commsContext ? (
                    <span className="text-[10px] text-indigo-400 font-bold font-mono uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                      #{commsContext.channelName} Copilot
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-medium font-mono uppercase tracking-wider">PRISM · {getInstitutionLabel(instType)}</span>
                  )}
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-2">
                {/* Real-time Vocal Speech Wave Visualizer */}
                <AnimatePresence>
                  {isSpeaking && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center h-6 mr-1.5"
                    >
                      <svg className="w-14 h-5 overflow-visible" viewBox="0 0 100 20" fill="none">
                        {/* Overlapping moving sine-wave paths with gradients */}
                        <path d="M0,10 Q25,0 50,10 T100,10" stroke="url(#siri-blue)" strokeWidth="1.5" strokeLinecap="round" className="voice-wave-path" />
                        <path d="M0,10 Q25,20 50,10 T100,10" stroke="url(#siri-pink)" strokeWidth="1.2" strokeLinecap="round" className="voice-wave-path" style={{ animationDelay: '-0.7s', animationDuration: '1.5s' }} />
                        <path d="M0,10 Q25,5 50,10 T100,10" stroke="url(#siri-green)" strokeWidth="1.0" strokeLinecap="round" className="voice-wave-path" style={{ animationDelay: '-1.3s', animationDuration: '2.5s' }} />
                        <defs>
                          <linearGradient id="siri-blue" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                          <linearGradient id="siri-pink" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                          </linearGradient>
                          <linearGradient id="siri-green" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
                          </linearGradient>
                        </defs>
                      </svg>
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

                {/* Chat History List Toggle Button */}
                <button 
                  onClick={() => setShowHistoryList(!showHistoryList)} 
                  className={clsx(
                    "text-slate-400 hover:text-white transition p-1.5 rounded-xl flex items-center justify-center",
                    showHistoryList ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "hover:bg-slate-800 border border-transparent"
                  )}
                  title="Saved Chats"
                >
                  <History className="w-4 h-4" />
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

            {showHistoryList ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20 backdrop-blur-md z-20 flex flex-col">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 flex-shrink-0">
                  <h4 className="font-bold text-[10px] uppercase tracking-wider font-space text-slate-400">Saved Conversations</h4>
                  <button
                    onClick={startNewConversation}
                    className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold bg-indigo-600 hover:bg-indigo-500 transition-all text-white flex items-center gap-1 shadow-md shadow-indigo-500/20"
                  >
                    <Plus className="w-3 h-3" /> New Chat
                  </button>
                </div>
                
                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
                  {conversations.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-500 italic">No saved chats.</div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => loadConversation(conv.id)}
                        className={clsx(
                          "group flex items-center justify-between p-3 rounded-2xl border text-left cursor-pointer transition-all",
                          conv.id === activeConversationId
                            ? "bg-indigo-500/10 border-indigo-500/35 hover:bg-indigo-500/15"
                            : "bg-slate-900/35 border-white/5 hover:border-slate-800 hover:bg-slate-900/60"
                        )}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                            {conv.title || 'New Conversation'}
                          </p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                            {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center flex-shrink-0"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Chat History Panel */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                  {/* Initial State / Suggested Prompts Grid */}
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center h-full">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 animate-float">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-200 text-sm mb-0.5 font-space">{getTimeGreeting()}!</h4>
                      {commsContext ? (
                        <>
                          <p className="text-[10px] text-indigo-400 font-bold font-mono uppercase tracking-wider mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                            #{commsContext.channelName} Communication Copilot
                          </p>
                          <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed mb-6">
                            I am acting as your communication copilot for this channel. I can help summarize messages, extract action items, draft broadcasts, or optimize your message tone.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] text-emerald-400/80 font-mono uppercase tracking-wider mb-1">Sally · {getInstitutionLabel(instType)}</p>
                          <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed mb-6">
                            {copilotDescription}
                          </p>
                        </>
                      )}
                      
                      {/* Suggested Prompts Cards Grid */}
                      <div className="grid grid-cols-1 gap-2.5 w-full max-w-sm">
                        {suggestedPrompts.map((item, idx) => (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.02, x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setLastUserMessage(item.prompt); sendMessage({ text: item.prompt }); }}
                            className="flex items-start text-left p-3 rounded-2xl bg-slate-900/35 border border-white/5 hover:border-slate-800 hover:bg-slate-900/60 transition-all group"
                          >
                            <div className={clsx(
                              "p-2 rounded-xl border mr-3 flex-shrink-0",
                              item.color === "emerald" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                              item.color === "indigo" && "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
                              item.color === "amber" && "bg-amber-500/10 border-amber-500/20 text-amber-400",
                              item.color === "violet" && "bg-violet-500/10 border-violet-500/20 text-violet-400"
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
                    
                    // Skip rendering trigger messages used for initial welcome briefings
                    if (isUser && messageText.includes('[SYSTEM_INIT_')) {
                      return null;
                    }
                    
                    return (
                      <div key={m.id} className="space-y-3">
                        {/* Render Text message content */}
                        {messageText && (
                          <div className={clsx("flex", isUser ? 'justify-end' : 'justify-start')}>
                            {(m as any).isHistorical ? (
                              <div className={clsx(
                                "max-w-[85%] rounded-2xl p-3.5 text-xs md:text-sm shadow-md transition-all flex flex-col items-start gap-2",
                                isUser 
                                  ? "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-tr-none border border-white/10 shadow-indigo-500/5" 
                                  : "sally-glass-bubble text-slate-100 rounded-tl-none border-l-2 border-l-emerald-400"
                              )}>
                                <p className="leading-relaxed whitespace-pre-wrap">{messageText}</p>
                                {!isUser && commsContext && (
                                  <button 
                                    onClick={() => handleInsertDraft(messageText)}
                                    className="mt-1 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-all active:scale-95 hover:scale-105"
                                    title="Insert this draft into the chat input box"
                                  >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    Insert into Chat
                                  </button>
                                )}
                              </div>
                            ) : (
                              <motion.div 
                                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                                className={clsx(
                                  "max-w-[85%] rounded-2xl p-3.5 text-xs md:text-sm shadow-md transition-all flex flex-col items-start gap-2",
                                  isUser 
                                    ? "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-tr-none border border-white/10 shadow-indigo-500/5" 
                                    : "sally-glass-bubble text-slate-100 rounded-tl-none border-l-2 border-l-emerald-400"
                                )}
                              >
                                <p className="leading-relaxed whitespace-pre-wrap">{messageText}</p>
                                {!isUser && commsContext && (
                                  <button 
                                    onClick={() => handleInsertDraft(messageText)}
                                    className="mt-1 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-all active:scale-95 hover:scale-105"
                                    title="Insert this draft into the chat input box"
                                  >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    Insert into Chat
                                  </button>
                                )}
                              </motion.div>
                            )}
                          </div>
                        )}
                        
                        {/* Render Interactive Tool Output Cards */}
                        {hasTools && toolInvocations.map((toolInvocation: any) => {
                          const { toolName, toolCallId, state, args, result, errorText } = toolInvocation;
                          const isResultState = state === 'result' || state === 'output-available';
                          const isErrorState = state === 'output-error' || state === 'error';
                          const isLoadingState = state === 'call' || state === 'partial-call' || state === 'input-streaming' || state === 'input-available' || state === 'approval-requested';
                          
                          if (isResultState && result !== undefined) {
                            return (m as any).isHistorical ? (
                              <div key={toolCallId} className="flex flex-col items-start w-full gap-1">
                                {isWriteTool(toolName) && (
                                  <div className="flex items-center gap-1.5 ml-1">
                                    <WriteActionBadge />
                                  </div>
                                )}
                                {renderToolResult(toolName, result, args)}
                              </div>
                            ) : (
                              <motion.div
                                key={toolCallId}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="flex flex-col items-start w-full gap-1"
                              >
                                {isWriteTool(toolName) && (
                                  <div className="flex items-center gap-1.5 ml-1">
                                    <WriteActionBadge />
                                  </div>
                                )}
                                {renderToolResult(toolName, result, args)}
                              </motion.div>
                            );
                          }

                          if (isErrorState) {
                            return (m as any).isHistorical ? (
                              <div key={toolCallId} className="flex justify-start w-full">
                                {renderToolResult(toolName, { error: errorText || 'Tool request failed' }, args)}
                              </div>
                            ) : (
                              <motion.div
                                key={toolCallId}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="flex justify-start w-full"
                              >
                                {renderToolResult(toolName, { error: errorText || 'Tool request failed' }, args)}
                              </motion.div>
                            );
                          }
                          
                          // Show loading state for in-progress tool calls
                          if (isLoadingState) {
                            return (
                              <motion.div 
                                key={toolCallId}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start w-full"
                              >
                                <div className="w-[85%] bg-slate-900/40 border border-white/5 rounded-2xl p-3 text-xs">
                                  <div className="flex items-center gap-2 text-slate-400">
                                    <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                    <span>Querying {toolName.replace(/([A-Z])/g, ' $1').toLowerCase()}...</span>
                                  </div>
                                </div>
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
                      <div className="sally-glass-bubble rounded-2xl rounded-tl-none p-4 text-slate-300 text-xs w-[82%] space-y-3.5 border-l-2 border-l-indigo-500 shadow-lg">
                        <div className="flex items-center gap-2">
                          <div className="relative w-4 h-4 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 absolute animate-spin" style={{ animationDuration: '6s' }} />
                            <Sparkles className="w-2.5 h-2.5 text-pink-400 absolute animate-pulse" />
                          </div>
                          <span className="font-semibold text-[10px] tracking-wide text-indigo-300/90 font-space uppercase">Thinking...</span>
                        </div>

                        {/* Gemini-Style pulsing gradient slider */}
                        <div className="h-1 w-full rounded-full overflow-hidden relative bg-slate-900/60 border border-white/5 shadow-inner">
                          <div className="absolute inset-0 gemini-thinking-bar rounded-full" />
                        </div>

                        {/* Three colored bouncing gradient dots with shadow glow */}
                        <div className="flex items-center gap-2 px-1 py-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 animate-bounce shadow-[0_0_8px_rgba(99,102,241,0.6)]" style={{ animationDelay: '0s', animationDuration: '0.8s' }} />
                          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-violet-400 to-pink-500 animate-bounce shadow-[0_0_8px_rgba(139,92,246,0.6)]" style={{ animationDelay: '0.15s', animationDuration: '0.8s' }} />
                          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-pink-400 to-emerald-500 animate-bounce shadow-[0_0_8px_rgba(16,185,129,0.6)]" style={{ animationDelay: '0.3s', animationDuration: '0.8s' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Banner with Retry */}
                  {error && (
                    <div className="flex justify-start">
                      <div className="bg-red-950/30 border border-red-800/40 rounded-2xl rounded-tl-none p-3.5 text-red-300 text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span>{getSallyErrorMessage(error)}</span>
                        </div>
                        {lastUserMessage && (
                          <button
                            onClick={handleRetry}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all text-[11px] font-medium disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Retry last message
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <div ref={messageEndRef} />
                </div>

                {/* Floating Pill Input Box */}
                <div className="p-4 bg-transparent flex-shrink-0 space-y-3 relative z-10">
                  {/* Particle Explosion Layer */}
                  <div className="absolute inset-x-0 bottom-16 flex items-center justify-center pointer-events-none overflow-visible">
                    <AnimatePresence>
                      {particles.map((p) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 1, scale: p.scale, x: 0, y: 0, rotate: 0 }}
                          animate={{ opacity: 0, scale: 0, x: p.x, y: p.y, rotate: p.rotation }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="absolute w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Proactive suggestion chips */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 px-0.5 scrollbar-hide no-scrollbar -mx-2 max-w-[calc(100%+16px)]">
                    {getProactiveChips().map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleChipClick(chip.prompt)}
                        className="flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-semibold border sally-glass-bubble hover:bg-white/10 text-slate-300 hover:text-white border-white/5 hover:border-white/10 transition-all cursor-pointer shadow-sm uppercase tracking-wider font-space"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={handleSubmit} className="relative flex items-center bg-slate-950/60 border border-white/10 focus-within:border-indigo-500/50 rounded-2xl p-1 transition-all shadow-xl backdrop-blur-md">
                    <input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask Sally..."
                      className="flex-1 bg-transparent text-white rounded-xl px-3 py-2 text-xs md:text-sm outline-none placeholder:text-slate-500 font-sans"
                    />
                    
                    {/* Voice Input Button */}
                    <button
                      type="button"
                      onClick={startListening}
                      className={clsx(
                        "p-2 mr-1 rounded-xl transition-all flex items-center justify-center border",
                        isListening 
                          ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse" 
                          : "text-slate-400 hover:text-white border-transparent hover:bg-slate-800"
                      )}
                      title={isListening ? "Listening... Click to stop" : "Voice input (Hands-free)"}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-600 to-purple-600 disabled:from-slate-900/80 disabled:to-slate-900/80 text-white disabled:text-slate-600 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center shadow-lg border border-white/10 disabled:border-transparent"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </>
  );
}
