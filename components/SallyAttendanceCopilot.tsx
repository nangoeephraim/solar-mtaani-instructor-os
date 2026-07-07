import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Mic, MicOff, AlertCircle, TrendingUp, TrendingDown, Activity, CheckCircle2, XCircle, Brain, RefreshCw, Zap, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { Student, ScheduleSlot } from '../types';
import { useToast } from './Toast';
import { getAuthHeaders } from '../services/authHeaders';
import { useTheme } from '../contexts/ThemeContext';

interface SallyAttendanceCopilotProps {
    students: Student[];
    selectedClass: ScheduleSlot | null;
    selectedDateStr: string;
    onMarkAttendance: (student: Student, status: 'present' | 'absent') => void;
    onMarkAll: (status: 'present' | 'absent') => void;
    attendanceStats: { present: number; absent: number; unmarked: number };
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isSystemMessage?: boolean;
}

export const SallyAttendanceCopilot: React.FC<SallyAttendanceCopilotProps> = ({
    students,
    selectedClass,
    selectedDateStr,
    onMarkAttendance,
    onMarkAll,
    attendanceStats
}) => {
    const { preferences } = useTheme();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'visualizer' | 'chat' | 'insights'>('visualizer');
    
    // Chat & AI State
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isSallyThinking, setIsSallyThinking] = useState(false);
    const [voiceActive, setVoiceActive] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [sallyMood, setSallyMood] = useState<'sphere' | 'helix' | 'wave' | 'torus'>('sphere');
    
    // References
    const chatEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const speechTimeoutRef = useRef<any>(null);

    // Initialize Sally Welcome briefing
    useEffect(() => {
        if (!selectedClass) {
            setMessages([
                {
                    role: 'assistant',
                    content: "Hello! I'm Sally, your Attendance Copilot. Please select a class from the timetable list, and I'll spin up an interactive 3D visualizer and live insights for today's session.",
                    timestamp: new Date()
                }
            ]);
            return;
        }

        const className = `${selectedClass.subject} (Lot ${selectedClass.grade})`;
        setMessages([
            {
                role: 'assistant',
                content: `Class context loaded for **${className}**! I've loaded the interactive 3D cluster. You can click student nodes in the cluster to mark them present/absent, toggle Voice Control with the microphone, or ask me for predictive insights.`,
                timestamp: new Date()
            }
        ]);
    }, [selectedClass?.id]);

    // Text to Speech
    const speak = (text: string) => {
        if (!ttsEnabled || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        
        // Remove markdown elements for cleaner speech
        const cleanText = text.replace(/[*_#`~\[\]()]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.15;
        
        // Try to find a friendly female/neutral voice
        const voices = window.speechSynthesis.getVoices();
        const idealVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.lang.startsWith('en'));
        if (idealVoice) utterance.voice = idealVoice;
        
        window.speechSynthesis.speak(utterance);
    };

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSallyThinking]);

    // Compute predictions based on weekday history
    const attendancePredictions = useMemo(() => {
        if (!selectedClass || students.length === 0) return [];
        
        const dayOfWeek = selectedClass.dayOfWeek;
        
        return students.map(student => {
            const history = student.attendanceHistory || [];
            // Filter historical slots for the same class or weekday
            const weekdaySlots = history.filter(h => {
                const date = new Date(h.date);
                return date.getDay() === dayOfWeek;
            });
            
            const totalWeekdayClasses = weekdaySlots.length;
            const absences = weekdaySlots.filter(h => h.status === 'absent').length;
            
            let riskFactor = 0;
            let reasoning = 'Stable attendance history';
            
            if (totalWeekdayClasses > 0) {
                const absenceRate = absences / totalWeekdayClasses;
                riskFactor = Math.round(absenceRate * 100);
                if (riskFactor > 60) {
                    reasoning = `Highly likely to miss (absent ${riskFactor}% of classes on this weekday)`;
                } else if (riskFactor > 30) {
                    reasoning = `Moderate absence probability on this weekday (${riskFactor}%)`;
                }
            }
            
            // Add basic overall attendance risk
            if (student.attendancePct < 80) {
                riskFactor = Math.max(riskFactor, 75);
                reasoning = `At Risk: Overall attendance threshold at ${student.attendancePct}%`;
            }
            
            return {
                student,
                riskFactor,
                reasoning
            };
        }).sort((a, b) => b.riskFactor - a.riskFactor);
    }, [students, selectedClass]);

    // Handle Local parsing of voice / text commands
    const parseLocalCommand = (rawText: string): boolean => {
        const text = rawText.trim().toLowerCase();
        
        // Matcher for single marking
        // E.g., "mark John present", "present Jane Smith", "mark Mary Doe absent"
        const presentRegex = /\b(?:mark\s+)?([a-zA-Z\s]+)\b\s+(?:is\s+)?(?:as\s+)?(?:present|here|active)\b/i;
        const absentRegex = /\b(?:mark\s+)?([a-zA-Z\s]+)\b\s+(?:is\s+)?(?:as\s+)?(?:absent|away|missing|skip)\b/i;
        const quickPresent = /\b(?:present|here)\s+([a-zA-Z\s]+)\b/i;
        const quickAbsent = /\b(?:absent|away)\s+([a-zA-Z\s]+)\b/i;

        let targetName = '';
        let targetStatus: 'present' | 'absent' | null = null;

        if (presentRegex.test(text)) {
            const match = text.match(presentRegex);
            if (match) {
                targetName = match[1];
                targetStatus = 'present';
            }
        } else if (absentRegex.test(text)) {
            const match = text.match(absentRegex);
            if (match) {
                targetName = match[1];
                targetStatus = 'absent';
            }
        } else if (quickPresent.test(text)) {
            const match = text.match(quickPresent);
            if (match) {
                targetName = match[1];
                targetStatus = 'present';
            }
        } else if (quickAbsent.test(text)) {
            const match = text.match(quickAbsent);
            if (match) {
                targetName = match[1];
                targetStatus = 'absent';
            }
        }

        // Fuzzy match student name
        if (targetName && targetStatus) {
            const cleanedName = targetName.replace(/\bsally\b/gi, '').trim();
            if (cleanedName.length < 2) return false;

            const matchedStudent = students.find(s => 
                s.name.toLowerCase().includes(cleanedName) || 
                cleanedName.includes(s.name.toLowerCase())
            );

            if (matchedStudent) {
                onMarkAttendance(matchedStudent, targetStatus);
                const reply = `Done! Marked **${matchedStudent.name}** as **${targetStatus}**.`;
                setMessages(prev => [...prev, 
                    { role: 'user', content: rawText, timestamp: new Date() },
                    { role: 'assistant', content: reply, timestamp: new Date() }
                ]);
                speak(`Marked ${matchedStudent.name} as ${targetStatus}.`);
                showToast(`${matchedStudent.name} marked ${targetStatus}`, 'success');
                return true;
            }
        }

        // Batch commands
        // E.g., "mark all present", "all absent"
        if (/\b(?:all|everyone|class)\s+present\b/i.test(text)) {
            onMarkAll('present');
            const reply = "Understood. I have marked all students in this session as present.";
            setMessages(prev => [...prev, 
                { role: 'user', content: rawText, timestamp: new Date() },
                { role: 'assistant', content: reply, timestamp: new Date() }
            ]);
            speak("Marked all students as present.");
            return true;
        }

        if (/\b(?:all|everyone|class)\s+absent\b/i.test(text)) {
            onMarkAll('absent');
            const reply = "Understood. I have marked all students in this session as absent.";
            setMessages(prev => [...prev, 
                { role: 'user', content: rawText, timestamp: new Date() },
                { role: 'assistant', content: reply, timestamp: new Date() }
            ]);
            speak("Marked all students as absent.");
            return true;
        }

        // Local queries
        if (/\b(?:who\s+is\s+)?at\s*-?\s*risk\b/i.test(text) || /\b(?:low\s+attendance|below\s+80)\b/i.test(text)) {
            const riskList = students.filter(s => s.attendancePct < 80);
            let reply = '';
            if (riskList.length > 0) {
                reply = `Scanning roster... I found **${riskList.length}** students at risk in this class (under 80% attendance):\n\n` +
                    riskList.map(s => `• **${s.name}** (${s.attendancePct}% attendance)`).join('\n') +
                    `\n\nI recommend drafting a notification check-in or assigning a peer mentor.`;
            } else {
                reply = "Scanning roster... Wonderful news! All students in this class session maintain an attendance rate of 80% or higher.";
            }
            setMessages(prev => [...prev, 
                { role: 'user', content: rawText, timestamp: new Date() },
                { role: 'assistant', content: reply, timestamp: new Date() }
            ]);
            speak(riskList.length > 0 ? `I found ${riskList.length} students at risk.` : "All students are clear.");
            setActiveTab('insights');
            return true;
        }

        if (/\b(?:stats|summary|overview|rates)\b/i.test(text)) {
            const total = students.length;
            const unmarked = total - (attendanceStats.present + attendanceStats.absent);
            const presentPct = total > 0 ? Math.round((attendanceStats.present / total) * 100) : 0;
            const reply = `Here is today's session attendance breakdown:\n\n` +
                `• **Present**: ${attendanceStats.present} (${presentPct}%)\n` +
                `• **Absent**: ${attendanceStats.absent}\n` +
                `• **Unmarked**: ${unmarked}\n\n` +
                `Session completion is currently at **${Math.round(((total - unmarked) / total) * 100)}%**.`;
            setMessages(prev => [...prev, 
                { role: 'user', content: rawText, timestamp: new Date() },
                { role: 'assistant', content: reply, timestamp: new Date() }
            ]);
            speak(`We have ${attendanceStats.present} students present and ${attendanceStats.absent} absent.`);
            return true;
        }

        return false;
    };

    // Send chat message to AI backend if not parsed locally
    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;
        setChatInput('');
        setSallyMood('helix');
        
        // 1. Try local regex parsing first
        const wasParsed = parseLocalCommand(text);
        if (wasParsed) {
            setSallyMood('sphere');
            return;
        }

        // 2. Fall back to backend LLM
        setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
        setIsSallyThinking(true);
        
        try {
            // Compile cohort state in text for Sally to have real-time data
            const rosterContext = students.map(s => {
                const history = s.attendanceHistory.find(h => h.date === selectedDateStr);
                return `${s.name} (overall attendance: ${s.attendancePct}%, today's status: ${history?.status || 'unmarked'})`;
            }).join(', ');
            
            const authHeaders = await getAuthHeaders();
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: `You are Sally AI assisting the instructor in the Attendance view. Here is the selected class context: Subject: ${selectedClass?.subject}, Grade/Lot: ${selectedClass?.grade}, Date: ${selectedDateStr}. Current class roster and marked attendance: [${rosterContext}]. Focus your advice and analytics precisely on this session.`
                        },
                        {
                            role: 'user',
                            content: text
                        }
                    ],
                    institutionType: preferences?.institutionType || 'tvet'
                })
            });

            if (!response.ok) throw new Error('API request failed');

            // Handle standard response payload
            const data = await response.text();
            let aiText = '';
            
            // Try parsing as JSON or cleanup text protocol chunks if streaming format is returned
            if (data.startsWith('0:')) {
                // Parse standard AI SDK content lines
                aiText = data.split('\n')
                    .filter(line => line.startsWith('0:'))
                    .map(line => JSON.parse(line.substring(2)))
                    .join('');
            } else {
                try {
                    const parsed = JSON.parse(data);
                    aiText = parsed.choices?.[0]?.message?.content || parsed.response || data;
                } catch {
                    aiText = data;
                }
            }

            // Cleanup protocols from string if any
            aiText = aiText.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

            setMessages(prev => [...prev, { role: 'assistant', content: aiText, timestamp: new Date() }]);
            setSallyMood('wave');
            speak(aiText);
            
            // Revert mood to sphere after voice speaking finishes
            setTimeout(() => setSallyMood('sphere'), 4000);
        } catch (error) {
            console.error('Sally fetch error:', error);
            showToast('Unable to connect to Sally AI. Using local offline parser.', 'warning');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having some trouble connecting to the cloud server, but I'm still fully operational offline! You can tell me commands like 'mark John present' or 'mark everyone present'.",
                timestamp: new Date()
            }]);
        } finally {
            setIsSallyThinking(false);
        }
    };

    // Toggle speech recognition
    const toggleVoice = () => {
        if (voiceActive) {
            recognitionRef.current?.stop();
            setVoiceActive(false);
            setSallyMood('sphere');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast('Speech Recognition not supported in this browser.', 'error');
            return;
        }

        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
            setVoiceActive(true);
            setSallyMood('wave');
            showToast('Sally is listening...', 'info');
        };

        rec.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                handleSendMessage(transcript);
            }
        };

        rec.onerror = (err: any) => {
            console.error('Speech error:', err);
            setVoiceActive(false);
            setSallyMood('sphere');
        };

        rec.onend = () => {
            setVoiceActive(false);
            setSallyMood('sphere');
        };

        recognitionRef.current = rec;
        rec.start();
    };

    return (
        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-5 h-[calc(100vh-140px)] md:h-[650px] relative z-10 font-sans">
            
            {/* 3D Visualizer & Control Board */}
            <div className="glassmorphic-card-premium flex-1 flex flex-col overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />
                
                {/* Header Controls */}
                <div className="p-4 flex items-center justify-between border-b border-[var(--md-sys-color-outline)] bg-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <Brain className="text-indigo-500 animate-pulse" size={18} />
                        <span className="font-google font-bold text-sm tracking-wide text-[var(--md-sys-color-on-surface)]">Sally AI Roster Copilot</span>
                    </div>

                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl">
                        {(['visualizer', 'chat', 'insights'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide capitalize transition-all duration-300 ${
                                    activeTab === tab 
                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-700' 
                                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-indigo-500'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">
                        
                        {/* Tab 1: WebGL 3D Student Cluster */}
                        {activeTab === 'visualizer' && (
                            <motion.div
                                key="visualizer"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full flex flex-col relative"
                            >
                                {selectedClass ? (
                                    <>
                                        <div className="absolute top-3 left-3 z-20 pointer-events-none bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/50">
                                            <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">WebGL 3D Cohort Ring</p>
                                            <p className="text-[9px] text-slate-300 font-medium">Click node to toggle attendance</p>
                                        </div>
                                        
                                        {/* Canvas Wrapper */}
                                        <div className="flex-1 w-full h-full relative">
                                            <Sally3DCluster 
                                                students={students} 
                                                selectedDateStr={selectedDateStr} 
                                                onToggleStudent={(student) => {
                                                    const currentHistory = student.attendanceHistory.find(h => h.date === selectedDateStr);
                                                    const nextStatus = currentHistory?.status === 'present' ? 'absent' : 'present';
                                                    onMarkAttendance(student, nextStatus);
                                                    speak(`Toggled ${student.name} to ${nextStatus}.`);
                                                }}
                                                mood={sallyMood}
                                                isSallyThinking={isSallyThinking}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                        <Brain size={40} className="opacity-45 mb-3 text-indigo-500 animate-bounce" />
                                        <p className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">Select a Class Session</p>
                                        <p className="text-xs mt-1 text-[var(--md-sys-color-on-surface-variant)]">No active 3D array mapping available without class context</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Tab 2: Conversation Console */}
                        {activeTab === 'chat' && (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full flex flex-col overflow-hidden"
                            >
                                {/* Chat stream */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/10">
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                                            {msg.role === 'assistant' && (
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-indigo-500/20">
                                                    🤖
                                                </div>
                                            )}
                                            <div className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                                                msg.role === 'user'
                                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-600/10 rounded-tr-none'
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-[var(--md-sys-color-on-surface)] shadow-sm rounded-tl-none'
                                            }`}>
                                                {msg.content.includes('**') ? (
                                                    // Simple markdown bold renderer
                                                    msg.content.split('\n').map((line, idx) => (
                                                        <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>
                                                            {line.split('**').map((chunk, cIdx) => 
                                                                cIdx % 2 === 1 ? <strong key={cIdx} className="font-bold text-indigo-400 dark:text-indigo-300">{chunk}</strong> : chunk
                                                            )}
                                                        </p>
                                                    ))
                                                ) : (
                                                    <p>{msg.content}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isSallyThinking && (
                                        <div className="flex gap-3 max-w-[85%]">
                                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold animate-spin">
                                                ⚙️
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-tl-none shadow-sm flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat input board */}
                                <div className="p-3 border-t border-[var(--md-sys-color-outline)] flex gap-2 items-center bg-white/5 backdrop-blur-md">
                                    <button
                                        onClick={toggleVoice}
                                        className={`p-2.5 rounded-xl border transition-all duration-300 shadow-sm flex-shrink-0 ${
                                            voiceActive
                                                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                        }`}
                                        title={voiceActive ? "Stop listening" : "Start Voice control"}
                                    >
                                        {voiceActive ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>

                                    <input
                                        type="text"
                                        placeholder="Ask Sally or log attendance..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                                        className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-[var(--md-sys-color-on-surface)]"
                                    />

                                    <button
                                        onClick={() => handleSendMessage(chatInput)}
                                        className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
                                        title="Send message"
                                    >
                                        <Send size={14} />
                                    </button>

                                    <button
                                        onClick={() => setTtsEnabled(!ttsEnabled)}
                                        className={`p-2 rounded-lg border transition-all ${
                                            ttsEnabled 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' 
                                                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-500'
                                        }`}
                                        title="Toggle text-to-speech voice replies"
                                    >
                                        {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 3: Local Predictive Insights */}
                        {activeTab === 'insights' && (
                            <motion.div
                                key="insights"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full p-4 overflow-y-auto space-y-4 custom-scrollbar"
                            >
                                <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                    <div className="flex gap-2 items-center text-indigo-600 dark:text-indigo-400 font-google font-bold text-xs mb-2">
                                        <Activity size={14} />
                                        <span>Weekday Predictive Model</span>
                                    </div>
                                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                                        Analyzing class trends based on historical attendance logs for **{selectedClass ? `classes on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedClass.dayOfWeek]}s` : 'active sessions'}**.
                                    </p>
                                </div>

                                {/* Prediction roster list */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Predictive Absence Risks</h4>
                                    
                                    {attendancePredictions.slice(0, 4).map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm hover:translate-x-1 transition-all duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-500">
                                                    {p.student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">{p.student.name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate max-w-[190px]">{p.reasoning}</p>
                                                </div>
                                            </div>

                                            <div className="text-right flex flex-col items-end">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                    p.riskFactor > 60 
                                                        ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                                                        : p.riskFactor > 30 
                                                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' 
                                                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                                }`}>
                                                    {p.riskFactor}% Risk
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {attendancePredictions.length === 0 && (
                                        <div className="text-center py-6 text-slate-400">
                                            <HelpCircle size={24} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-xs">No prediction metrics available for this class</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// ── THREE.JS WebGL Cluster Visualizer ─────────────────────────────────
interface Sally3DClusterProps {
    students: Student[];
    selectedDateStr: string;
    onToggleStudent: (student: Student) => void;
    mood: 'sphere' | 'helix' | 'wave' | 'torus';
    isSallyThinking: boolean;
}

const Sally3DCluster: React.FC<Sally3DClusterProps> = ({
    students,
    selectedDateStr,
    onToggleStudent,
    mood,
    isSallyThinking
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const studentsRef = useRef(students);
    studentsRef.current = students;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const w = container.clientWidth;
        const h = container.clientHeight;

        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Core light
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambient);

        const pointLight = new THREE.PointLight(0x6366f1, 1.2, 50);
        pointLight.position.set(0, 0, 5);
        scene.add(pointLight);

        // Main Cluster Group
        const clusterGroup = new THREE.Group();
        scene.add(clusterGroup);

        // Build central pulsing AI core
        const coreGeo = new THREE.SphereGeometry(0.8, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x4f46e5,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        clusterGroup.add(coreMesh);

        // Student Node Construction
        interface NodeData {
            student: Student;
            mesh: THREE.Mesh;
            basePos: THREE.Vector3;
        }

        const nodes: NodeData[] = [];
        const studentGeo = new THREE.SphereGeometry(0.18, 16, 16);

        // Position helper
        const getLayoutPosition = (index: number, count: number, mode: string): THREE.Vector3 => {
            const vec = new THREE.Vector3();
            if (mode === 'helix') {
                const angle = (index / count) * Math.PI * 2 * 3;
                vec.x = Math.cos(angle) * 2.2;
                vec.z = Math.sin(angle) * 2.2;
                vec.y = (index / count - 0.5) * 4;
            } else if (mode === 'torus') {
                const angle = (index / count) * Math.PI * 2;
                vec.x = Math.cos(angle) * 2.5;
                vec.y = Math.sin(angle) * 2.5;
                vec.z = Math.sin(index * 1.5) * 0.4;
            } else if (mode === 'wave') {
                vec.x = (index - count / 2) * 0.45;
                vec.y = Math.sin(index * 0.8) * 0.6;
                vec.z = Math.cos(index * 0.8) * 0.6;
            } else {
                // Sphere mode
                const phi = Math.acos(-1 + (2 * index) / count);
                const theta = Math.sqrt(count * Math.PI) * phi;
                vec.x = 2.4 * Math.cos(theta) * Math.sin(phi);
                vec.y = 2.4 * Math.sin(theta) * Math.sin(phi);
                vec.z = 2.4 * Math.cos(phi);
            }
            return vec;
        };

        // Create meshes
        students.forEach((student, idx) => {
            // Find current attendance status for color
            const currentHistory = student.attendanceHistory.find(h => h.date === selectedDateStr);
            const status = currentHistory?.status || 'unmarked';
            
            const nodeColor = status === 'present' 
                ? 0x10b981 // Emerald
                : status === 'absent' 
                    ? 0xef4444 // Red
                    : 0x94a3b8; // Slate / Unmarked

            const mat = new THREE.MeshPhongMaterial({
                color: nodeColor,
                shininess: 80,
                emissive: nodeColor,
                emissiveIntensity: status === 'unmarked' ? 0.05 : 0.35
            });

            const mesh = new THREE.Mesh(studentGeo, mat);
            const pos = getLayoutPosition(idx, students.length, mood);
            mesh.position.copy(pos);
            clusterGroup.add(mesh);

            // Stash references
            nodes.push({ student, mesh, basePos: pos });
        });

        // Event listener mouse parallax & raycast clicking
        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            mouseRef.current.x = ((e.clientX - rect.left) / w) * 2 - 1;
            mouseRef.current.y = -((e.clientY - rect.top) / h) * 2 + 1;
        };

        const raycaster = new THREE.Raycaster();
        const handleClick = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / w) * 2 - 1;
            const mouseY = -((e.clientY - rect.top) / h) * 2 + 1;
            
            raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
            const intersects = raycaster.intersectObjects(nodes.map(n => n.mesh));
            
            if (intersects.length > 0) {
                const clickedMesh = intersects[0].object as THREE.Mesh;
                const clickedNode = nodes.find(n => n.mesh === clickedMesh);
                if (clickedNode) {
                    onToggleStudent(clickedNode.student);
                }
            }
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('click', handleClick);

        // Animation Loop
        let time = 0;
        let animId: number;

        const animate = () => {
            animId = requestAnimationFrame(animate);
            time += isSallyThinking ? 0.05 : 0.015;

            // Rotate core
            coreMesh.rotation.y = time * 0.4;
            coreMesh.rotation.z = time * 0.25;
            
            // Pulse core scale based on status
            const coreScale = 1.0 + Math.sin(time * 3) * (isSallyThinking ? 0.12 : 0.05);
            coreMesh.scale.set(coreScale, coreScale, coreScale);

            // Update & animate nodes
            nodes.forEach((n, idx) => {
                const targetPos = getLayoutPosition(idx, studentsRef.current.length, mood);
                
                // Animate to mood layouts smoothly
                n.mesh.position.lerp(targetPos, 0.05);

                // Add subtle floating animation
                n.mesh.position.y += Math.sin(time * 2 + idx) * 0.005;

                // Sync status colors dynamically in WebGL from React updates
                const activeStd = studentsRef.current.find(s => s.id === n.student.id);
                if (activeStd) {
                    const activeHist = activeStd.attendanceHistory.find(h => h.date === selectedDateStr);
                    const status = activeHist?.status || 'unmarked';
                    const activeColor = status === 'present' 
                        ? 0x10b981 
                        : status === 'absent' 
                            ? 0xef4444 
                            : 0x94a3b8;

                    const mat = n.mesh.material as THREE.MeshPhongMaterial;
                    if (mat.color.getHex() !== activeColor) {
                        mat.color.setHex(activeColor);
                        mat.emissive.setHex(activeColor);
                        mat.emissiveIntensity = status === 'unmarked' ? 0.05 : 0.35;
                    }
                }
            });

            // Gentle cluster hover rotation
            clusterGroup.rotation.y = time * 0.05;

            // Mouse parallax movement
            camera.position.x += (mouseRef.current.x * 2.5 - camera.position.x) * 0.05;
            camera.position.y += (mouseRef.current.y * 2.5 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        };

        animate();

        // Resize handler
        const handleResize = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Cleanups
        return () => {
            cancelAnimationFrame(animId);
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('click', handleClick);
            window.removeEventListener('resize', handleResize);
            
            renderer.dispose();
            studentGeo.dispose();
            coreGeo.dispose();
            coreMat.dispose();
            nodes.forEach(n => (n.mesh.material as THREE.Material).dispose());
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [students.length, mood, selectedDateStr, isSallyThinking]);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden cursor-pointer" />
    );
};
