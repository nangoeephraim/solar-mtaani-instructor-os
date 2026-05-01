import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Settings, Maximize, Minimize, Users, MessageSquare, Sparkles, LayoutGrid, AlertCircle, Copy, CheckCircle2, PhoneOff, Share2, Circle, Hand, Captions, Presentation, PictureInPicture2, Wifi, WifiOff, SmilePlus, X, Clock, FileText } from 'lucide-react';
import clsx from 'clsx';
import UserAvatar from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface MeetingMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: Date;
    isSelf: boolean;
}

interface FloatingReaction {
    id: string;
    emoji: string;
    x: number;
}

const REACTION_EMOJIS = ['👏', '🎉', '❤️', '👍', '😂', '🔥'];

const getTimeGreeting = (name: string) => {
    const h = new Date().getHours();
    const icon = h < 12 ? '☀️' : h < 17 ? '🌤️' : h < 20 ? '🌅' : '🌙';
    const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 20 ? 'Good evening' : 'Good night';
    return { greeting: `${greeting}, ${name}`, icon };
};

export default function Meetings() {
    const { user } = useAuth();
    const userName = user?.name || 'You';
    const userAvatar = (user as any)?.avatarUrl || null;
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenShared, setScreenShared] = useState(false);
    const [showSidebar, setShowSidebar] = useState<'chat' | 'people' | 'effects' | 'notes' | null>(null);
    const [layout, setLayout] = useState<'grid' | 'spotlight'>('grid');
    const [isRecording, setIsRecording] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [captionsEnabled, setCaptionsEnabled] = useState(false);
    const [inMeeting, setInMeeting] = useState(false);
    const [meetingId, setMeetingId] = useState('');
    const [copied, setCopied] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [hasError, setHasError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);

    // Captions (Web Speech API)
    const [captionText, setCaptionText] = useState('');
    const [captionInterim, setCaptionInterim] = useState('');
    const [speechSupported, setSpeechSupported] = useState(false);
    const recognitionRef = useRef<any>(null);
    const captionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Connection quality
    const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');

    // Floating reactions
    const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
    const [showReactionTray, setShowReactionTray] = useState(false);

    // Audio level for voice activity ring
    const [audioLevel, setAudioLevel] = useState(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioAnimRef = useRef<number | null>(null);

    // Toast notifications
    const [toasts, setToasts] = useState<{id: string; text: string; icon: string}[]>([]);
    
    // Chat state
    const [chatMessages, setChatMessages] = useState<MeetingMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Meeting timer
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Recording state
    const mediaRecorderRef2 = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    // Broadcast channel ref for in-meeting chat
    const chatChannelRef = useRef<any>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const screenRef = useRef<HTMLVideoElement>(null);

    const generateMeetingId = () => {
        return Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6);
    };

    const handleJoinMeeting = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            setInMeeting(true);
            const mid = meetingId || generateMeetingId();
            if (!meetingId) setMeetingId(mid);
            setHasError(null);
            setElapsedSeconds(0);
            timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);

            // Setup broadcast channel for in-meeting chat
            const broadcastName = `prism-meet-chat:${mid}`;
            const ch = supabase.channel(broadcastName, { config: { broadcast: { self: false } } });
            ch.on('broadcast', { event: 'chat' }, (payload: any) => {
                const msg = payload.payload as MeetingMessage;
                setChatMessages(prev => [...prev, { ...msg, timestamp: new Date(msg.timestamp), isSelf: false }]);
            }).subscribe();
            chatChannelRef.current = ch;
        } catch (err) {
            console.error("Failed to get local stream", err);
            setHasError("Failed to access camera and microphone. Please check your permissions.");
        }
    };

    const handleLeaveMeeting = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (screenStream) screenStream.getTracks().forEach(track => track.stop());
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (chatChannelRef.current) { supabase.removeChannel(chatChannelRef.current); chatChannelRef.current = null; }
        // Stop recording if active
        if (mediaRecorderRef2.current && isRecording) {
            mediaRecorderRef2.current.stop();
            setIsRecording(false);
        }
        // Stop speech recognition
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
            recognitionRef.current = null;
        }
        setStream(null);
        setScreenStream(null);
        setInMeeting(false);
        setScreenShared(false);
        setElapsedSeconds(0);
        setChatMessages([]);
        setCaptionsEnabled(false);
        setCaptionText('');
        setCaptionInterim('');
        setHandRaised(false);
        setConnectionQuality('good');
        setAudioLevel(0);
        setFloatingReactions([]);
        setShowReactionTray(false);
        setToasts([]);
    };

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, inMeeting, videoEnabled]);

    useEffect(() => {
        if (screenRef.current && screenStream) {
            screenRef.current.srcObject = screenStream;
        }
    }, [screenStream]);

    // Handle toggles
    useEffect(() => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = audioEnabled;
            });
            stream.getVideoTracks().forEach(track => {
                track.enabled = videoEnabled;
            });
        }
    }, [audioEnabled, videoEnabled, stream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (chatChannelRef.current) supabase.removeChannel(chatChannelRef.current);
            if (mediaRecorderRef2.current && mediaRecorderRef2.current.state !== 'inactive') {
                mediaRecorderRef2.current.stop();
            }
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
                recognitionRef.current = null;
            }
        };
    }, []);

    // Check for Web Speech API support
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        setSpeechSupported(!!SR);
    }, []);

    // Web Speech API — start/stop based on captionsEnabled
    const startSpeechRecognition = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }
            if (final) {
                setCaptionText(final);
                setCaptionInterim('');
                // Clear caption after 6s of silence
                if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
                captionTimeoutRef.current = setTimeout(() => setCaptionText(''), 6000);
            }
            if (interim) {
                setCaptionInterim(interim);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error === 'no-speech') return; // Normal — no action needed
            console.warn('[Captions] Speech recognition error:', event.error);
        };

        recognition.onend = () => {
            // Auto-restart if captions are still enabled
            if (captionsEnabled && recognitionRef.current) {
                try { recognition.start(); } catch {}
            }
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
        } catch {}
    }, [captionsEnabled]);

    useEffect(() => {
        if (captionsEnabled && inMeeting) {
            startSpeechRecognition();
        } else {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
                recognitionRef.current = null;
            }
            setCaptionText('');
            setCaptionInterim('');
        }
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
                recognitionRef.current = null;
            }
        };
    }, [captionsEnabled, inMeeting, startSpeechRecognition]);

    // Connection quality monitor
    useEffect(() => {
        if (!inMeeting) return;
        const checkConnection = () => {
            const conn = (navigator as any).connection;
            if (!conn) { setConnectionQuality('good'); return; }
            const downlink = conn.downlink || 10;
            const rtt = conn.rtt || 0;
            if (downlink < 0.5 || rtt > 400) setConnectionQuality('poor');
            else if (downlink < 2 || rtt > 200) setConnectionQuality('fair');
            else setConnectionQuality('good');
        };
        checkConnection();
        const conn = (navigator as any).connection;
        if (conn) conn.addEventListener?.('change', checkConnection);
        const interval = setInterval(checkConnection, 5000);
        return () => {
            clearInterval(interval);
            if (conn) conn.removeEventListener?.('change', checkConnection);
        };
    }, [inMeeting]);

    // Audio level analyzer for voice activity ring
    useEffect(() => {
        if (!inMeeting || !stream) return;
        try {
            const ctx = new AudioContext();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            audioContextRef.current = ctx;
            analyserRef.current = analyser;
            const dataArr = new Uint8Array(analyser.frequencyBinCount);
            const tick = () => {
                analyser.getByteFrequencyData(dataArr);
                const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
                setAudioLevel(Math.min(avg / 128, 1));
                audioAnimRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch {}
        return () => {
            if (audioAnimRef.current) cancelAnimationFrame(audioAnimRef.current);
            if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
        };
    }, [inMeeting, stream]);

    // Floating reaction system
    const sendReaction = useCallback((emoji: string) => {
        const reaction: FloatingReaction = { id: Date.now().toString(), emoji, x: 20 + Math.random() * 60 };
        setFloatingReactions(prev => [...prev, reaction]);
        if (chatChannelRef.current) {
            chatChannelRef.current.send({ type: 'broadcast', event: 'reaction', payload: { emoji, userName } }).catch(() => {});
        }
        setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== reaction.id)), 3000);
        setShowReactionTray(false);
    }, [userName]);

    // Toast helper
    const addToast = useCallback((text: string, icon: string = '\ud83d\udd14') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, text, icon }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const handleScreenShare = async () => {
        if (screenShared) {
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
            setScreenStream(null);
            setScreenShared(false);
        } else {
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                setScreenStream(displayStream);
                setScreenShared(true);
                
                // Handle user stopping share via browser UI
                displayStream.getVideoTracks()[0].onended = () => {
                    setScreenShared(false);
                    setScreenStream(null);
                };
            } catch (err) {
                console.error("Failed to share screen", err);
            }
        }
    };

    const copyMeetingLink = () => {
        navigator.clipboard.writeText(`https://prism.os/meet/${meetingId}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendChat = () => {
        if (!chatInput.trim()) return;
        const newMsg: MeetingMessage = {
            id: Date.now().toString(),
            sender: userName,
            text: chatInput.trim(),
            timestamp: new Date(),
            isSelf: true
        };
        setChatMessages(prev => [...prev, newMsg]);
        setChatInput('');
        // Broadcast to other participants via Supabase Broadcast
        if (chatChannelRef.current) {
            chatChannelRef.current.send({
                type: 'broadcast', event: 'chat',
                payload: { ...newMsg, timestamp: newMsg.timestamp.toISOString() }
            }).catch(() => {});
        }
    };

    // Toggle real recording
    const toggleRecording = () => {
        if (isRecording) {
            mediaRecorderRef2.current?.stop();
            setIsRecording(false);
        } else if (stream) {
            recordedChunksRef.current = [];
            try {
                const combinedStream = new MediaStream([
                    ...stream.getVideoTracks(),
                    ...stream.getAudioTracks(),
                    ...(screenStream?.getVideoTracks() || [])
                ]);
                const mr = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
                mr.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
                mr.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `PRISM_Meeting_${meetingId}_${new Date().toISOString().slice(0,10)}.webm`;
                    a.click(); URL.revokeObjectURL(url);
                };
                mr.start(1000);
                mediaRecorderRef2.current = mr;
                setIsRecording(true);
            } catch { setIsRecording(false); }
        }
    };

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
    };

    // Fullscreen toggle
    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch {}
    };

    // Listen for fullscreen changes (e.g. user presses Esc)
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Picture-in-Picture
    const togglePiP = async () => {
        if (!videoRef.current) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await videoRef.current.requestPictureInPicture();
            }
        } catch {}
    };

    // Pre-join camera preview
    useEffect(() => {
        if (!inMeeting && !previewStream) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then(s => { setPreviewStream(s); })
                .catch(() => {});
        }
        return () => {
            if (previewStream && !inMeeting) {
                previewStream.getTracks().forEach(t => t.stop());
            }
        };
    }, [inMeeting]);

    useEffect(() => {
        if (previewVideoRef.current && previewStream) {
            previewVideoRef.current.srcObject = previewStream;
        }
    }, [previewStream]);

    // Stop preview when joining meeting
    const handleJoinWithPreviewCleanup = async () => {
        if (previewStream) {
            previewStream.getTracks().forEach(t => t.stop());
            setPreviewStream(null);
        }
        await handleJoinMeeting();
    };

    // Broadcast hand raise to meeting participants
    const toggleHandRaise = () => {
        const newState = !handRaised;
        setHandRaised(newState);
        if (chatChannelRef.current) {
            chatChannelRef.current.send({
                type: 'broadcast', event: 'hand-raise',
                payload: { userId: user?.id, userName, raised: newState }
            }).catch(() => {});
        }
    };

    useEffect(() => {
        if (showSidebar === 'chat' && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, showSidebar]);

    useEffect(() => {
        const handleJoin = (e: any) => {
            const mId = e.detail;
            if (mId) {
                setMeetingId(mId);
            }
        };
        window.addEventListener('join-meeting', handleJoin);
        return () => window.removeEventListener('join-meeting', handleJoin);
    }, []);

    if (!inMeeting) {
        const { greeting, icon } = getTimeGreeting(userName);
        return (
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[#08090a] z-20">
                {/* Animated aurora background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-blue-600/8 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
                    <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-purple-600/8 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
                    <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
                </div>
                
                <div className="relative z-10 p-6 md:p-8 max-w-5xl w-full flex flex-col items-center gap-8">
                    {/* Time-aware greeting */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-center"
                    >
                        <span className="text-3xl mb-2 block">{icon}</span>
                        <h1 className="text-3xl md:text-4xl font-google font-bold text-white tracking-tight">{greeting}</h1>
                        <p className="text-white/40 text-sm mt-2 font-medium">Ready to start or join a meeting?</p>
                    </motion.div>

                    {/* Camera preview card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                        className="w-full max-w-2xl"
                    >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-[#111214]">
                            {/* Video preview */}
                            <div className="aspect-video relative flex items-center justify-center">
                                {previewStream ? (
                                    <>
                                        <video ref={previewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100 absolute inset-0" />
                                        {/* Self label */}
                                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 z-10 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-400" />
                                            <span className="text-white/90 text-xs font-bold font-google">{userName}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="w-28 h-28 rounded-full flex items-center justify-center mb-5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 shadow-[0_0_60px_rgba(59,130,246,0.15)]">
                                            <UserAvatar name={userName} avatarUrl={userAvatar} size={88} rounded="full" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1 font-google">Camera is off</h3>
                                        <p className="text-white/40 text-xs">Click the camera button below to preview</p>
                                    </div>
                                )}
                            </div>

                            {/* Device controls row */}
                            <div className="flex items-center justify-center gap-3 p-4 bg-white/5 border-t border-white/5">
                                <button 
                                    onClick={() => { setAudioEnabled(!audioEnabled); }}
                                    className={clsx("p-3 rounded-2xl transition-all duration-200", audioEnabled ? "bg-white/10 hover:bg-white/15 text-white" : "bg-red-500/90 text-white")}
                                >
                                    {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                                </button>
                                <button 
                                    onClick={() => { setVideoEnabled(!videoEnabled); }}
                                    className={clsx("p-3 rounded-2xl transition-all duration-200", videoEnabled ? "bg-white/10 hover:bg-white/15 text-white" : "bg-red-500/90 text-white")}
                                >
                                    {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Action buttons */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
                    >
                        <button 
                            onClick={handleJoinWithPreviewCleanup}
                            className="flex-1 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-[0_4px_24px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_32px_rgba(37,99,235,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                        >
                            <Video size={18} />
                            New Meeting
                        </button>
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Enter code to join"
                                value={meetingId}
                                onChange={(e) => setMeetingId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && meetingId && handleJoinWithPreviewCleanup()}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-4 pr-16 text-sm font-google outline-none focus:border-blue-500/50 transition-colors text-white placeholder:text-white/30"
                            />
                            <button 
                                onClick={() => meetingId && handleJoinWithPreviewCleanup()}
                                disabled={!meetingId}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-white/10 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-600"
                            >
                                Join
                            </button>
                        </div>
                    </motion.div>

                    {hasError && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-2xl flex items-center gap-2 text-sm max-w-md w-full">
                            <AlertCircle size={16} />
                            <span className="font-medium text-xs">{hasError}</span>
                        </motion.div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex w-full h-full relative overflow-hidden bg-[#08090a] text-white z-20">
            {/* Meeting Pulse Bar */}
            <div className={clsx(
                "absolute top-0 left-0 right-0 h-1 z-50 transition-colors duration-1000",
                isRecording ? "bg-gradient-to-r from-red-500 via-red-400 to-red-500 animate-pulse" :
                connectionQuality === 'poor' ? "bg-gradient-to-r from-red-500/60 to-orange-500/60" :
                connectionQuality === 'fair' ? "bg-gradient-to-r from-yellow-500/40 to-amber-500/40" :
                "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20"
            )} />

            {/* Background aurora */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/6 blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/6 blur-[150px]" />
            </div>

            {/* Floating Reactions Layer */}
            <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
                <AnimatePresence>
                    {floatingReactions.map(r => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 1, y: '80vh', x: `${r.x}%`, scale: 1 }}
                            animate={{ opacity: 0, y: '10vh', scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2.5, ease: 'easeOut' }}
                            className="absolute text-4xl"
                        >
                            {r.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Toast Notifications */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 100, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.8 }}
                            className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg"
                        >
                            <span className="text-lg">{t.icon}</span>
                            <span className="text-xs font-bold text-white/80">{t.text}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {/* Main Content */}
            <div className={clsx("flex-1 flex flex-col relative z-10 transition-all duration-300", showSidebar ? "lg:pr-80" : "")}>
                
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-20">
                    <div className="flex items-center gap-3">
                        {isRecording && (
                            <div className="bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">
                                <Circle size={10} className="fill-red-400" /> REC
                            </div>
                        )}
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2.5 text-sm font-google font-bold shadow-lg cursor-pointer hover:bg-white/20 transition-colors group" onClick={copyMeetingLink}>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            {meetingId}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-white/50">
                                {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                            </span>
                        </div>
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('broadcast-meeting', { detail: meetingId }))}
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold backdrop-blur-sm transition-colors shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                        >
                            <Share2 size={12} /> Share to Chat
                        </button>
                        <div className={clsx(
                            "px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold backdrop-blur-sm hidden md:flex border",
                            connectionQuality === 'good' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                            connectionQuality === 'fair' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                            "bg-red-500/10 border-red-500/20 text-red-400"
                        )}>
                            {connectionQuality === 'poor' ? <WifiOff size={12} /> : <Wifi size={12} />}
                            {connectionQuality === 'good' ? 'Good' : connectionQuality === 'fair' ? 'Fair' : 'Poor'}
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold backdrop-blur-sm hidden md:flex">
                            <AlertCircle size={12} /> Encrypted
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold font-google text-white/70 tabular-nums hidden sm:block">
                            {formatTime(elapsedSeconds)}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={togglePiP} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-colors hidden md:block" title="Picture-in-Picture">
                            <PictureInPicture2 size={18} />
                        </button>
                        <button onClick={() => setLayout(layout === 'grid' ? 'spotlight' : 'grid')} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-colors" title="Toggle Layout">
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={toggleFullscreen} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-colors hidden sm:block" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    </div>
                </div>

                {/* Video Grid */}
                <div className="flex-1 p-4 md:p-6 flex items-center justify-center pt-24 pb-28">
                    <div className={clsx(
                        "w-full h-full grid gap-4 md:gap-6 transition-all duration-500 max-w-7xl mx-auto",
                        screenShared ? "grid-cols-3 grid-rows-3" : "grid-cols-1 grid-rows-1"
                    )}>
                        {/* Screen Share Spot */}
                        {screenShared && (
                             <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="col-span-3 row-span-2 md:col-span-2 md:row-span-3 relative rounded-3xl overflow-hidden shadow-2xl bg-[#131416] border border-white/5 flex items-center justify-center"
                            >
                                <video 
                                    ref={screenRef} 
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-4 left-4 bg-blue-500/90 backdrop-blur-xl px-3.5 py-2 rounded-xl border border-blue-400/20 flex items-center gap-2.5 shadow-lg">
                                    <MonitorUp size={16} />
                                    <span className="text-sm font-bold font-google">Screen Sharing</span>
                                </div>
                             </motion.div>
                        )}

                        {/* Local Camera — with voice activity ring */}
                        <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={clsx(
                                "relative rounded-3xl overflow-hidden shadow-2xl bg-[#111214] transition-all duration-300 flex items-center justify-center group",
                                screenShared ? "col-span-3 row-span-1 md:col-span-1 md:row-span-3 aspect-video md:aspect-auto" : "w-full h-full"
                            )}
                            style={{
                                boxShadow: audioEnabled && audioLevel > 0.05 
                                    ? `0 0 ${20 + audioLevel * 40}px rgba(59,130,246,${0.1 + audioLevel * 0.3}), inset 0 0 ${audioLevel * 20}px rgba(59,130,246,${audioLevel * 0.1})`
                                    : undefined,
                                border: audioEnabled && audioLevel > 0.05 
                                    ? `2px solid rgba(59,130,246,${0.2 + audioLevel * 0.5})`
                                    : '1px solid rgba(255,255,255,0.05)'
                            }}
                        >
                            {!videoEnabled ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111214]">
                                    <div className="w-28 h-28 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                                         <UserAvatar name={userName} avatarUrl={userAvatar} size={88} rounded="full" />
                                    </div>
                                    <p className="text-white/40 text-xs font-medium">{userName} · Camera off</p>
                                </div>
                            ) : (
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className="w-full h-full object-cover transform -scale-x-100"
                                />
                            )}

                            {/* Always-visible bottom overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 flex justify-between items-end">
                                <div className="flex gap-2 items-center">
                                    <div className="bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-lg">
                                        {audioEnabled && audioLevel > 0.05 && (
                                            <div className="flex gap-0.5 items-end h-3">
                                                {[0, 1, 2].map(i => (
                                                    <div key={i} className="w-0.5 bg-blue-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(3, audioLevel * 12 * (i === 1 ? 1 : 0.6))}px` }} />
                                                ))}
                                            </div>
                                        )}
                                        <span className="text-xs font-bold font-google text-white/90">{userName}</span>
                                    </div>
                                    {handRaised && (
                                        <div className="bg-yellow-500/90 backdrop-blur-xl p-1.5 rounded-xl border border-yellow-400/20 shadow-lg animate-bounce">
                                            <Hand size={14} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-1.5">
                                    {!audioEnabled && (
                                        <div className="bg-red-500/80 backdrop-blur-md p-1.5 rounded-lg shadow-lg">
                                            <MicOff size={12} className="text-white" />
                                        </div>
                                    )}
                                    {!videoEnabled && (
                                        <div className="bg-red-500/80 backdrop-blur-md p-1.5 rounded-lg shadow-lg">
                                            <VideoOff size={12} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Closed Captions Overlay — Live Speech Recognition */}
                <AnimatePresence>
                    {captionsEnabled && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-28 md:bottom-32 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4 pointer-events-none"
                        >
                            <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center shadow-lg">
                                {!speechSupported ? (
                                    <p className="text-yellow-400/80 font-medium text-sm flex items-center justify-center gap-2">
                                        <Captions size={16} />
                                        <span>Captions unavailable — your browser doesn't support Speech Recognition</span>
                                    </p>
                                ) : (captionText || captionInterim) ? (
                                    <p className="text-white font-medium text-base leading-relaxed">
                                        {captionText && <span>{captionText} </span>}
                                        {captionInterim && <span className="text-white/50 italic">{captionInterim}</span>}
                                    </p>
                                ) : (
                                    <p className="text-white/50 font-medium text-sm flex items-center justify-center gap-2">
                                        <Captions size={16} className="text-blue-400" />
                                        <span>Listening for speech...</span>
                                        <span className="flex gap-0.5">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />)}</span>
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Controls Bar */}
                <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 md:gap-2 bg-white/10 backdrop-blur-2xl border border-white/10 px-4 md:px-6 py-3 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-30 w-max max-w-[95vw] overflow-x-auto custom-scrollbar">
                    
                    <button aria-label={audioEnabled ? "Mute microphone" : "Unmute microphone"} onClick={() => setAudioEnabled(!audioEnabled)} className={clsx("p-3 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", audioEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]")}>
                        {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">{audioEnabled ? 'Mute' : 'Unmute'}</span>
                    </button>
                    
                    <button aria-label={videoEnabled ? "Turn off camera" : "Turn on camera"} onClick={() => setVideoEnabled(!videoEnabled)} className={clsx("p-3 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", videoEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]")}>
                        {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">{videoEnabled ? 'Stop Video' : 'Start Video'}</span>
                    </button>

                    <div className="w-px h-8 bg-white/20 mx-1 md:mx-2 flex-shrink-0" />
                    
                    <button aria-label={screenShared ? "Stop screen sharing" : "Share screen"} onClick={handleScreenShare} className={clsx("p-3 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", screenShared ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <MonitorUp size={20} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">{screenShared ? 'Stop Sharing' : 'Share Screen'}</span>
                    </button>

                    {/* Productivity Features */}
                    <button aria-label={handRaised ? "Lower hand" : "Raise hand"} onClick={toggleHandRaise} className={clsx("p-3 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", handRaised ? "bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <Hand size={20} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                    </button>

                    <button aria-label={captionsEnabled ? "Disable captions" : "Enable captions"} onClick={() => setCaptionsEnabled(!captionsEnabled)} className={clsx("p-3 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", captionsEnabled ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <Captions size={20} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">{captionsEnabled ? 'Turn Off CC' : 'Turn On CC'}</span>
                    </button>
                    
                    <button aria-label={isRecording ? "Stop recording" : "Start recording"} onClick={toggleRecording} className={clsx("p-3 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", isRecording ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <Circle size={20} className={clsx(isRecording ? "fill-white" : "")} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">{isRecording ? 'Stop Recording' : 'Record'}</span>
                    </button>

                    {/* Emoji Reaction Tray */}
                    <div className="relative flex-shrink-0">
                        <button aria-label="React" onClick={() => setShowReactionTray(!showReactionTray)} className={clsx("p-3 md:p-3.5 rounded-2xl transition-all duration-300 group", showReactionTray ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <SmilePlus size={20} />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">React</span>
                        </button>
                        <AnimatePresence>
                            {showReactionTray && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                                >
                                    {REACTION_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => sendReaction(emoji)}
                                            className="text-2xl p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-125 active:scale-95"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-px h-8 bg-white/20 mx-1 md:mx-2 flex-shrink-0" />
                    
                    <button aria-label="Quick Notes" onClick={() => setShowSidebar(showSidebar === 'notes' ? null : 'notes')} className={clsx("p-3 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0 hidden sm:block", showSidebar === 'notes' ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <FileText size={20} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">Quick Notes</span>
                    </button>

                    <button aria-label="Visual effects" onClick={() => setShowSidebar(showSidebar === 'effects' ? null : 'effects')} className={clsx("p-3 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0 hidden sm:block", showSidebar === 'effects' ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <Sparkles size={20} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">Effects</span>
                    </button>

                    <button aria-label="Participants list" onClick={() => setShowSidebar(showSidebar === 'people' ? null : 'people')} className={clsx("p-3 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'people' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <Users size={20} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">People</span>
                    </button>

                    <button aria-label="Meeting chat" onClick={() => setShowSidebar(showSidebar === 'chat' ? null : 'chat')} className={clsx("p-3 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'chat' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <MessageSquare size={20} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">Chat</span>
                    </button>

                    <div className="w-px h-8 bg-white/20 mx-1 md:mx-2 flex-shrink-0" />

                    <button aria-label="Leave meeting" onClick={handleLeaveMeeting} className="px-4 md:px-5 py-3 md:py-3.5 rounded-2xl bg-red-500 text-white font-bold transition-all duration-300 hover:bg-red-600 hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2 flex-shrink-0">
                        <PhoneOff size={20} />
                        <span className="hidden sm:inline">Leave</span>
                    </button>
                </div>

            </div>

            {/* Sidebar (Settings/Chat/People) */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div 
                        initial={{ x: 360, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 360, opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="absolute right-0 top-0 bottom-0 w-80 lg:w-80 bg-black/70 backdrop-blur-3xl border-l border-white/10 z-40 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
                    >
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="font-google font-bold text-lg flex items-center gap-2">
                                {showSidebar === 'effects' ? <><Sparkles size={18} className="text-purple-400" /> Visual Effects</> : 
                                 showSidebar === 'chat' ? <><MessageSquare size={18} className="text-blue-400" /> Meeting Chat</> : 
                                 showSidebar === 'notes' ? <><FileText size={18} className="text-emerald-400" /> Quick Notes</> : 
                                 <><Users size={18} className="text-teal-400" /> Participants</>}
                            </h3>
                            <button onClick={() => setShowSidebar(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white">
                                <Maximize size={16} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            {showSidebar === 'effects' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                                            <div className="h-px bg-white/10 flex-1" /> Background Blur <div className="h-px bg-white/10 flex-1" />
                                        </h4>
                                        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                                            {['None', 'Light', 'Heavy'].map(level => (
                                                <button key={level} className={clsx("flex-1 py-2.5 rounded-lg text-xs font-bold transition-all", level === 'Light' ? "bg-white/20 shadow-md" : "hover:bg-white/10 text-white/70 hover:text-white")}>
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                                            <div className="h-px bg-white/10 flex-1" /> Virtual Backgrounds <div className="h-px bg-white/10 flex-1" />
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="aspect-video bg-white/5 border border-white/20 rounded-xl flex items-center justify-center text-xs font-bold text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                                                None
                                            </div>
                                            {[1,2,3,4,5].map(i => (
                                                <div key={i} className="aspect-video bg-black/50 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500 cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] relative group">
                                                    <img src={`https://picsum.photos/seed/${i * 42}/300/170`} alt="bg" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                                            <div className="h-px bg-white/10 flex-1" /> Video Enhancements <div className="h-px bg-white/10 flex-1" />
                                        </h4>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-3 p-3.5 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                                                <div className="relative w-10 h-5 bg-purple-500 rounded-full transition-colors">
                                                    <div className="absolute right-1 top-1 bg-white w-3 h-3 rounded-full transition-all" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm font-bold block">Low Light Mode</span>
                                                    <span className="text-[10px] text-white/50 font-medium">Auto-adjusts brightness</span>
                                                </div>
                                            </label>
                                            <label className="flex items-center gap-3 p-3.5 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                                                <div className="relative w-10 h-5 bg-white/20 rounded-full transition-colors">
                                                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-all" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm font-bold block">Studio Lighting</span>
                                                    <span className="text-[10px] text-white/50 font-medium">Professional portrait lighting</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showSidebar === 'notes' && (
                                <div className="flex flex-col h-full animate-fade-in space-y-4">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-2 flex items-start gap-3">
                                        <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 mt-1">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm mb-1">Meeting Notes</h4>
                                            <p className="text-xs text-emerald-100/60 leading-relaxed">
                                                Jot down key takeaways. Notes are saved automatically to your workspace.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col relative group">
                                        <textarea 
                                            className="w-full h-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all custom-scrollbar placeholder:text-white/30"
                                            placeholder="Type your notes here... (Markdown supported)"
                                            defaultValue={`# Meeting Notes\n*${new Date().toLocaleDateString()}*\n\n## Action Items\n- [ ] \n- [ ] \n\n## Discussion`}
                                        />
                                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="bg-black/50 backdrop-blur-md p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Copy Notes">
                                                <Copy size={14} />
                                            </button>
                                            <button className="bg-emerald-500/80 backdrop-blur-md p-1.5 rounded-lg border border-emerald-400/20 text-white hover:bg-emerald-500 transition-colors" title="Save to PRISM Docs">
                                                <CheckCircle2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showSidebar === 'people' && (
                                <div className="space-y-2 animate-fade-in">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className={clsx(
                                                    "rounded-full transition-all duration-75",
                                                    audioEnabled && audioLevel > 0.05 ? "p-0.5 bg-gradient-to-r from-blue-500 to-blue-400" : "p-0"
                                                )}>
                                                    <UserAvatar name={userName} avatarUrl={userAvatar} size={36} />
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1c1d1f]" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold font-google">{userName}</span>
                                                <span className="text-[10px] text-white/50">{user?.role === 'admin' ? 'Meeting Host' : 'Participant'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                                {audioEnabled ? <Mic size={14} className="text-white/70" /> : <MicOff size={14} className="text-red-400" />}
                                            </button>
                                            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                                {videoEnabled ? <Video size={14} className="text-white/70" /> : <VideoOff size={14} className="text-red-400" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={copyMeetingLink} className="w-full mt-4 py-3 bg-white/5 border border-white/10 border-dashed rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2">
                                        {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />} 
                                        {copied ? 'Link Copied!' : 'Copy Meeting Link'}
                                    </button>
                                </div>
                            )}

                            {showSidebar === 'chat' && (
                                <div className="flex flex-col h-full animate-fade-in">
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                        {chatMessages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                                                    <MessageSquare size={28} className="text-white" />
                                                </div>
                                                <h4 className="font-bold mb-1">No messages yet</h4>
                                                <p className="text-xs max-w-[200px] mx-auto">Messages sent here are visible to everyone in the call.</p>
                                            </div>
                                        ) : (
                                            chatMessages.map(msg => (
                                                <div key={msg.id} className={clsx("flex flex-col", msg.isSelf ? "items-end" : "items-start")}>
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="text-[10px] font-bold text-white/50">{msg.sender}</span>
                                                        <span className="text-[9px] text-white/30">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className={clsx("px-3 py-2 rounded-2xl text-sm max-w-[85%] break-words shadow-sm", msg.isSelf ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm")}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/10 shrink-0">
                                        <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="relative">
                                            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Send a message..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-sm font-google outline-none focus:border-white/30 transition-colors text-white" />
                                            <button type="submit" disabled={!chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-blue-400 hover:bg-blue-400/10 disabled:opacity-50 transition-colors cursor-pointer">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
