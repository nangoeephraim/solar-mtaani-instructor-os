import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Settings, Maximize, Minimize, Users, MessageSquare, Sparkles, LayoutGrid, AlertCircle, Copy, CheckCircle2, PhoneOff, Share2, Circle, Hand, Captions, Presentation, PictureInPicture2, Wifi, WifiOff, SmilePlus, X, Clock, FileText, Paperclip, Upload, Download, File, MoreHorizontal, ChevronUp, Image } from 'lucide-react';
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
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
}

interface MeetingFile {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    sender: string;
    timestamp: Date;
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

// Isolated timer to prevent full component re-renders every second
const MeetingTimer = React.memo(({ active }: { active: boolean }) => {
    const [seconds, setSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        if (active) {
            setSeconds(0);
            timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setSeconds(0);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [active]);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    const display = h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
    return (
        <div className="bg-[#1a1b1e] px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold font-google text-white/70 tabular-nums">
            {display}
        </div>
    );
});

export default function Meetings() {
    const { user } = useAuth();
    const userName = user?.name || 'You';
    const userAvatar = (user as any)?.avatarUrl || null;
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenShared, setScreenShared] = useState(false);
    const [showSidebar, setShowSidebar] = useState<'chat' | 'people' | 'effects' | 'notes' | 'files' | null>(null);
    const [showMobileMore, setShowMobileMore] = useState(false);
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

    // Visual Effects state
    const [backgroundBlur, setBackgroundBlur] = useState<'None' | 'Light' | 'Heavy'>('None');
    const [selectedBg, setSelectedBg] = useState<number | null>(null);
    const [lowLightMode, setLowLightMode] = useState(true);
    const [studioLighting, setStudioLighting] = useState(false);

    // Notes state
    const [notesContent, setNotesContent] = useState(`# Meeting Notes\n*${new Date().toLocaleDateString()}*\n\n## Action Items\n- [ ] \n- [ ] \n\n## Discussion`);
    
    // Chat state
    const [chatMessages, setChatMessages] = useState<MeetingMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Recording state (timer is now isolated in MeetingTimer sub-component)

    // Recording state
    const mediaRecorderRef2 = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    // Broadcast channel ref for in-meeting chat
    const chatChannelRef = useRef<any>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const screenRef = useRef<HTMLVideoElement>(null);

    // File sharing state
    const [meetingFiles, setMeetingFiles] = useState<MeetingFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);

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
            // Timer is handled by isolated MeetingTimer component

            // Setup broadcast channel for in-meeting chat
            const broadcastName = `prism-meet-chat:${mid}`;
            const ch = supabase.channel(broadcastName, { config: { broadcast: { self: false } } });
            ch.on('broadcast', { event: 'chat' }, (payload: any) => {
                const msg = payload.payload as MeetingMessage;
                setChatMessages(prev => [...prev, { ...msg, timestamp: new Date(msg.timestamp), isSelf: false }]);
            }).on('broadcast', { event: 'file-share' }, (payload: any) => {
                const f = payload.payload;
                setMeetingFiles(prev => [...prev, { ...f, timestamp: new Date(f.timestamp) }]);
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
        // Timer cleanup is handled by MeetingTimer component
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
        setMeetingFiles([]);
        setShowMobileMore(false);
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

    // Audio level analyzer for voice activity ring — THROTTLED to ~10fps
    useEffect(() => {
        if (!inMeeting || !stream) return;
        try {
            const ctx = new AudioContext();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.85;
            source.connect(analyser);
            audioContextRef.current = ctx;
            analyserRef.current = analyser;
            const dataArr = new Uint8Array(analyser.frequencyBinCount);
            let frameCount = 0;
            let lastLevel = 0;
            const tick = () => {
                frameCount++;
                // Only process every 6th frame (~10fps instead of 60fps)
                if (frameCount % 6 === 0) {
                    analyser.getByteFrequencyData(dataArr);
                    const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
                    const level = Math.min(avg / 128, 1);
                    // Only trigger re-render if level changed meaningfully
                    if (Math.abs(level - lastLevel) > 0.03) {
                        lastLevel = level;
                        setAudioLevel(level);
                    }
                }
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

    // Format file size helper
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    // Get file icon based on type
    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return '🖼️';
        if (type === 'application/pdf') return '📄';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('sheet') || type.includes('excel')) return '📊';
        if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
        if (type.startsWith('video/')) return '🎬';
        if (type.startsWith('audio/')) return '🎵';
        return '📎';
    };

    // Handle file upload to Supabase + broadcast
    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0 || !meetingId) return;
        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                const filePath = `${meetingId}/${Date.now()}_${file.name}`;
                const { error } = await supabase.storage.from('meeting_files').upload(filePath, file);
                if (error) { console.error('Upload error:', error); continue; }
                const { data: urlData } = supabase.storage.from('meeting_files').getPublicUrl(filePath);
                const fileRecord: MeetingFile = {
                    id: Date.now().toString() + Math.random().toString(36).slice(2),
                    name: file.name,
                    url: urlData.publicUrl,
                    type: file.type,
                    size: file.size,
                    sender: userName,
                    timestamp: new Date(),
                };
                setMeetingFiles(prev => [...prev, fileRecord]);
                addToast(`${userName} shared ${file.name}`, getFileIcon(file.type));
                // Broadcast file to other participants
                if (chatChannelRef.current) {
                    chatChannelRef.current.send({
                        type: 'broadcast', event: 'file-share',
                        payload: { ...fileRecord, timestamp: fileRecord.timestamp.toISOString() }
                    }).catch(() => {});
                }
            }
        } catch (err) { console.error('File upload failed:', err); }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    };

    // Handle file attachment in chat (sends as message with file)
    const handleChatFileAttach = async (files: FileList | null) => {
        if (!files || files.length === 0 || !meetingId) return;
        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                const filePath = `${meetingId}/${Date.now()}_${file.name}`;
                const { error } = await supabase.storage.from('meeting_files').upload(filePath, file);
                if (error) { console.error('Upload error:', error); continue; }
                const { data: urlData } = supabase.storage.from('meeting_files').getPublicUrl(filePath);
                const fileMsg: MeetingMessage = {
                    id: Date.now().toString(),
                    sender: userName,
                    text: '',
                    timestamp: new Date(),
                    isSelf: true,
                    fileUrl: urlData.publicUrl,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                };
                setChatMessages(prev => [...prev, fileMsg]);
                // Also add to files list
                const fileRecord: MeetingFile = {
                    id: fileMsg.id,
                    name: file.name,
                    url: urlData.publicUrl,
                    type: file.type,
                    size: file.size,
                    sender: userName,
                    timestamp: new Date(),
                };
                setMeetingFiles(prev => [...prev, fileRecord]);
                if (chatChannelRef.current) {
                    chatChannelRef.current.send({
                        type: 'broadcast', event: 'chat',
                        payload: { ...fileMsg, timestamp: fileMsg.timestamp.toISOString() }
                    }).catch(() => {});
                    chatChannelRef.current.send({
                        type: 'broadcast', event: 'file-share',
                        payload: { ...fileRecord, timestamp: fileRecord.timestamp.toISOString() }
                    }).catch(() => {});
                }
            }
        } catch (err) { console.error('Chat file attach failed:', err); }
        setIsUploading(false);
        if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    };

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
        navigator.clipboard.writeText(meetingId).catch(() => {});
        setCopied(true);
        addToast('Meeting ID copied!', '📋');
        setTimeout(() => setCopied(false), 2000);
    };

    const shareMeetingToChat = () => {
        window.dispatchEvent(new CustomEvent('broadcast-meeting', { detail: meetingId }));
        addToast('Shared to Communications!', '📤');
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

    // formatTime is now handled inside MeetingTimer sub-component

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
        const handleJoin = async (e: any) => {
            const mId = e.detail;
            if (!mId) return;

            // Pre-fill the meeting ID so it's visible immediately
            setMeetingId(mId);

            // If already in a meeting, don't restart
            if (inMeeting) return;

            // Auto-join: stop the camera preview first, then join with the provided ID
            try {
                // Stop preview if active
                if (previewStream) {
                    previewStream.getTracks().forEach(t => t.stop());
                    setPreviewStream(null);
                }
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                setInMeeting(true);
                setHasError(null);

                // Subscribe to the Supabase broadcast channel for this meeting
                const broadcastName = `prism-meet-chat:${mId}`;
                const ch = supabase.channel(broadcastName, { config: { broadcast: { self: false } } });
                ch.on('broadcast', { event: 'chat' }, (payload: any) => {
                    const msg = payload.payload as MeetingMessage;
                    setChatMessages(prev => [...prev, { ...msg, timestamp: new Date(msg.timestamp), isSelf: false }]);
                }).on('broadcast', { event: 'file-share' }, (payload: any) => {
                    const f = payload.payload;
                    setMeetingFiles(prev => [...prev, { ...f, timestamp: new Date(f.timestamp) }]);
                }).subscribe();
                chatChannelRef.current = ch;
            } catch (err) {
                console.error('[join-meeting] Auto-join failed:', err);
                setHasError('Could not access camera/microphone. Please check permissions and try joining manually.');
            }
        };

        window.addEventListener('join-meeting', handleJoin);

        // Check for pending meeting ID from routing/navigation
        const pendingMId = sessionStorage.getItem('pendingMeetingId');
        if (pendingMId) {
            sessionStorage.removeItem('pendingMeetingId');
            handleJoin({ detail: pendingMId });
        }

        return () => window.removeEventListener('join-meeting', handleJoin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inMeeting, previewStream]);

    if (!inMeeting) {
        const { greeting, icon } = getTimeGreeting(userName);
        return (
            <div className="w-full h-full relative overflow-y-auto overflow-x-hidden bg-[#08090a] z-20">
                {/* Optimized static aurora background — no animate-pulse, reduced blur */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-blue-600/8 rounded-full blur-[80px]" />
                    <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-purple-600/8 rounded-full blur-[80px]" />
                </div>
                
                <div className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto min-h-full w-full flex flex-col items-center justify-center gap-6 md:gap-8">
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
                                        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-black/60 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/10 z-10 flex items-center gap-1.5 md:gap-2">
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

            {/* Optimized static aurora — reduced blur for performance */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/6 blur-[80px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/6 blur-[80px]" />
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
            <div className="absolute top-14 md:top-4 right-2 md:right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-[calc(100%-1rem)]">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 100, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.8 }}
                            className="bg-[#1a1b1e] border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg"
                        >
                            <span className="text-lg">{t.icon}</span>
                            <span className="text-xs font-bold text-white/80">{t.text}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {/* Main Content */}
            <div className={clsx("flex-1 flex flex-col relative z-10 transition-all duration-300", showSidebar ? "lg:mr-96" : "")}>
                
                {/* Header — 2-section on mobile to prevent overflow */}
                <div className="absolute top-0 left-0 right-0 z-20 bg-[#08090a]/95 border-b border-white/5">
                    {/* Single unified row — items constrained & overflow-hidden */}
                    <div className="flex items-center justify-between px-2 md:px-4 py-2 md:py-3 gap-2">
                        {/* LEFT: recording badge + meeting ID */}
                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
                            {isRecording && (
                                <div className="bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-lg flex items-center gap-1 text-[9px] md:text-xs font-bold text-red-400 animate-pulse flex-shrink-0">
                                    <Circle size={7} className="fill-red-400" /> REC
                                </div>
                            )}
                            <button
                                onClick={copyMeetingLink}
                                className="bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg md:rounded-xl px-2.5 md:px-3.5 py-1.5 flex items-center gap-1.5 md:gap-2 cursor-pointer transition-colors group min-w-0 max-w-[130px] md:max-w-xs"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                <span className="text-[10px] md:text-xs font-bold font-google text-white truncate">{meetingId}</span>
                                <span className="text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0">
                                    {copied ? <CheckCircle2 size={11} className="text-green-400" /> : <Copy size={11} />}
                                </span>
                            </button>
                            {/* Timer — always visible */}
                            <div className="flex-shrink-0"><MeetingTimer active={inMeeting} /></div>
                            {/* Connection — desktop only */}
                            <div className={clsx(
                                "px-2 py-1 rounded-lg items-center gap-1 text-[10px] font-bold hidden lg:flex border flex-shrink-0",
                                connectionQuality === 'good' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                                connectionQuality === 'fair' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                "bg-red-500/10 border-red-500/20 text-red-400"
                            )}>
                                {connectionQuality === 'poor' ? <WifiOff size={11} /> : <Wifi size={11} />}
                                {connectionQuality === 'good' ? 'Good' : connectionQuality === 'fair' ? 'Fair' : 'Poor'}
                            </div>
                            {/* Encrypted — desktop only */}
                            <div className="hidden lg:flex bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-1 rounded-lg items-center gap-1 text-[10px] font-bold flex-shrink-0">
                                <AlertCircle size={11} /> Encrypted
                            </div>
                            {/* Share to Chat — tablet+ only (mobile uses More menu) */}
                            <button
                                onClick={shareMeetingToChat}
                                className="hidden sm:flex bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-2.5 py-1.5 rounded-lg items-center gap-1.5 text-[10px] md:text-xs font-bold transition-colors flex-shrink-0"
                            >
                                <Share2 size={11} /> Share to Chat
                            </button>
                        </div>
                        {/* RIGHT: layout + fullscreen + PiP */}
                        <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
                            <button onClick={togglePiP} className="p-1.5 md:p-2 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 transition-colors hidden md:flex items-center justify-center" title="Picture-in-Picture">
                                <PictureInPicture2 size={14} />
                            </button>
                            <button onClick={() => setLayout(layout === 'grid' ? 'spotlight' : 'grid')} className="p-1.5 md:p-2 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 transition-colors flex items-center justify-center" title="Toggle Layout">
                                <LayoutGrid size={14} />
                            </button>
                            <button onClick={toggleFullscreen} className="p-1.5 md:p-2 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 transition-colors hidden sm:flex items-center justify-center" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Video Grid */}
                <div className="flex-1 flex items-center justify-center p-2 md:p-6 pt-14 md:pt-20 pb-24 md:pb-28">
                    <div className={clsx(
                        "w-full h-full grid gap-2 md:gap-4 max-w-7xl mx-auto",
                        screenShared
                            ? "grid-rows-[minmax(0,2fr)_minmax(0,1fr)] md:grid-cols-3 md:grid-rows-3"
                            : "grid-cols-1 grid-rows-1"
                    )}>
                        {/* Screen Share Spot */}
                        {screenShared && (
                             <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="col-span-1 row-span-1 md:col-span-2 md:row-span-3 relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-[#131416] border border-white/5 flex items-center justify-center"
                            >
                                <video 
                                    ref={screenRef} 
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-blue-500/90 px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-blue-400/20 flex items-center gap-1.5 md:gap-2.5 shadow-lg">
                                    <MonitorUp size={16} />
                                    <span className="text-sm font-bold font-google">Screen Sharing</span>
                                </div>
                             </motion.div>
                        )}

                        {/* Local Camera — with voice activity ring */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={clsx(
                                "relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-[#111214] flex items-center justify-center group min-h-0",
                                screenShared ? "col-span-1 row-span-1 md:col-span-1 md:row-span-3" : "w-full h-full"
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
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2.5 md:p-4 flex justify-between items-end">
                                <div className="flex gap-1.5 items-center">
                                    <div className="bg-black/60 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/10 flex items-center gap-1.5 md:gap-2">
                                        {audioEnabled && audioLevel > 0.05 && (
                                            <div className="flex gap-0.5 items-end h-3">
                                                {[0, 1, 2].map(i => (
                                                    <div key={i} className="w-0.5 bg-blue-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(3, audioLevel * 12 * (i === 1 ? 1 : 0.6))}px` }} />
                                                ))}
                                            </div>
                                        )}
                                        <span className="text-[10px] md:text-xs font-bold font-google text-white/90">{userName}</span>
                                    </div>
                                    {handRaised && (
                                        <div className="bg-yellow-500/90 p-1 md:p-1.5 rounded-lg md:rounded-xl border border-yellow-400/20 animate-bounce">
                                            <Hand size={14} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    {!audioEnabled && (
                                        <div className="bg-red-500/80 p-1 md:p-1.5 rounded-lg">
                                            <MicOff size={10} className="text-white" />
                                        </div>
                                    )}
                                    {!videoEnabled && (
                                        <div className="bg-red-500/80 p-1 md:p-1.5 rounded-lg">
                                            <VideoOff size={10} className="text-white" />
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
                            className="absolute bottom-28 md:bottom-32 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-2xl px-2 md:px-4 pointer-events-none"
                        >
                            <div className="bg-[#1a1b1e]/95 border border-white/10 rounded-2xl p-3 md:p-4 text-center shadow-lg">
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

                {/* Mobile More Menu Overlay */}
                <AnimatePresence>
                    {showMobileMore && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                className="absolute inset-0 z-40 bg-black/40 md:hidden" 
                                onClick={() => setShowMobileMore(false)} 
                            />
                            <motion.div
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                className="absolute bottom-0 left-0 right-0 z-50 md:hidden bg-[#1a1b1e] border-t border-white/10 rounded-t-3xl p-5 shadow-[0_-8px_32px_rgba(0,0,0,0.6)] overflow-hidden"
                                style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
                            >
                                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-5 gap-x-3">
                                    {[
                                        { icon: <MonitorUp size={22} />, label: screenShared ? 'Stop Share' : 'Screen', onClick: handleScreenShare, active: screenShared, color: 'blue' },
                                        { icon: <Hand size={22} />, label: handRaised ? 'Lower' : 'Raise', onClick: toggleHandRaise, active: handRaised, color: 'yellow' },
                                        { icon: <Captions size={22} />, label: captionsEnabled ? 'CC Off' : 'CC On', onClick: () => setCaptionsEnabled(!captionsEnabled), active: captionsEnabled, color: 'blue' },
                                        { icon: <Circle size={22} className={clsx(isRecording && "fill-white")} />, label: isRecording ? 'Stop Rec' : 'Record', onClick: toggleRecording, active: isRecording, color: 'red' },
                                        { icon: <SmilePlus size={22} />, label: 'React', onClick: () => { setShowReactionTray(!showReactionTray); setShowMobileMore(false); }, active: showReactionTray, color: 'yellow' },
                                        { icon: <FileText size={22} />, label: 'Notes', onClick: () => { setShowSidebar(showSidebar === 'notes' ? null : 'notes'); setShowMobileMore(false); }, active: showSidebar === 'notes', color: 'emerald' },
                                        { icon: <Sparkles size={22} />, label: 'Effects', onClick: () => { setShowSidebar(showSidebar === 'effects' ? null : 'effects'); setShowMobileMore(false); }, active: showSidebar === 'effects', color: 'purple' },
                                        { icon: <Paperclip size={22} />, label: 'Files', onClick: () => { setShowSidebar(showSidebar === 'files' ? null : 'files'); setShowMobileMore(false); }, active: showSidebar === 'files', color: 'amber' },
                                        { icon: <Share2 size={22} />, label: 'Broadcast', onClick: () => { shareMeetingToChat(); setShowMobileMore(false); }, active: false, color: 'blue' },
                                        { icon: <Copy size={22} />, label: 'Copy ID', onClick: () => { copyMeetingLink(); setShowMobileMore(false); }, active: false, color: 'blue' },
                                    ].map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={item.onClick}
                                            className="flex flex-col items-center gap-2 transition-transform active:scale-95"
                                        >
                                            <div className={clsx(
                                                "w-11 h-11 rounded-2xl flex items-center justify-center shadow-md",
                                                item.active
                                                    ? item.color === 'red' ? "bg-red-500/20 text-red-400"
                                                    : item.color === 'yellow' ? "bg-yellow-500/20 text-yellow-400"
                                                    : item.color === 'emerald' ? "bg-emerald-500/20 text-emerald-400"
                                                    : item.color === 'purple' ? "bg-purple-500/20 text-purple-400"
                                                    : item.color === 'amber' ? "bg-amber-500/20 text-amber-400"
                                                    : "bg-blue-500/20 text-blue-400"
                                                    : "bg-white/5 text-white/70 border border-white/5"
                                            )}>
                                                {item.icon}
                                            </div>
                                            <span className="text-[10px] font-bold text-white/80">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Bottom Controls Bar */}
                <div 
                    className="absolute bottom-0 left-0 right-0 z-30 flex justify-center"
                    style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
                >
                    <div className="flex items-center justify-center gap-0.5 md:gap-2 bg-[#1a1b1e]/95 md:backdrop-blur-md border border-white/10 px-2 md:px-5 py-1.5 md:py-3 rounded-[2rem] shadow-[0_-4px_24px_rgba(0,0,0,0.3),0_8px_32px_rgba(0,0,0,0.4)] mb-2 md:mb-6 mx-2 overflow-x-auto max-w-[calc(100vw-1rem)]">
                        
                        <button aria-label={audioEnabled ? "Mute" : "Unmute"} onClick={() => setAudioEnabled(!audioEnabled)} className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", audioEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]")}>
                            {audioEnabled ? <Mic size={16} className="md:hidden" /> : <MicOff size={16} className="md:hidden" />}
                            {audioEnabled ? <Mic size={18} className="hidden md:block" /> : <MicOff size={18} className="hidden md:block" />}
                        </button>
                        
                        <button aria-label={videoEnabled ? "Camera off" : "Camera on"} onClick={() => setVideoEnabled(!videoEnabled)} className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", videoEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]")}>
                            {videoEnabled ? <Video size={16} className="md:hidden" /> : <VideoOff size={16} className="md:hidden" />}
                            {videoEnabled ? <Video size={18} className="hidden md:block" /> : <VideoOff size={18} className="hidden md:block" />}
                        </button>

                        <div className="w-px h-7 bg-white/20 mx-0.5 md:mx-2 flex-shrink-0 hidden md:block" />

                        {/* Desktop-only inline buttons */}
                        <button aria-label="Share screen" onClick={handleScreenShare} className={clsx("hidden md:flex p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", screenShared ? "bg-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <MonitorUp size={18} />
                        </button>
                        <button aria-label="Raise hand" onClick={toggleHandRaise} className={clsx("hidden md:flex p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", handRaised ? "bg-yellow-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <Hand size={18} />
                        </button>
                        <button aria-label="Captions" onClick={() => setCaptionsEnabled(!captionsEnabled)} className={clsx("hidden md:flex p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", captionsEnabled ? "bg-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <Captions size={18} />
                        </button>
                        <button aria-label="Record" onClick={toggleRecording} className={clsx("hidden md:flex p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <Circle size={18} className={clsx(isRecording && "fill-white")} />
                        </button>

                        {/* Desktop reactions */}
                        <div className="relative flex-shrink-0 hidden md:block">
                            <button aria-label="React" onClick={() => setShowReactionTray(!showReactionTray)} className={clsx("p-3.5 rounded-2xl transition-all duration-300 group", showReactionTray ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 hover:bg-white/20 text-white")}>
                                <SmilePlus size={18} />
                            </button>
                            <AnimatePresence>
                                {showReactionTray && (
                                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#1a1b1e] border border-white/10 rounded-2xl p-2 flex gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                                        {REACTION_EMOJIS.map(emoji => (
                                            <button key={emoji} onClick={() => sendReaction(emoji)} className="text-2xl p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-125 active:scale-95">
                                                {emoji}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="w-px h-7 bg-white/20 mx-0.5 md:mx-2 flex-shrink-0 hidden md:block" />

                        {/* Desktop sidebar buttons */}
                        <button aria-label="Notes" onClick={() => setShowSidebar(showSidebar === 'notes' ? null : 'notes')} className={clsx("hidden md:flex p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'notes' ? "bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <FileText size={18} />
                        </button>
                        <button aria-label="Effects" onClick={() => setShowSidebar(showSidebar === 'effects' ? null : 'effects')} className={clsx("hidden md:flex p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'effects' ? "bg-purple-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <Sparkles size={18} />
                        </button>
                        <button aria-label="Files" onClick={() => setShowSidebar(showSidebar === 'files' ? null : 'files')} className={clsx("hidden md:flex p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'files' ? "bg-amber-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <Paperclip size={18} />
                        </button>

                        {/* Both mobile+desktop: People & Chat */}
                        <button aria-label="People" onClick={() => setShowSidebar(showSidebar === 'people' ? null : 'people')} className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'people' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <Users size={16} className="md:hidden" />
                            <Users size={18} className="hidden md:block" />
                        </button>
                        <button aria-label="Chat" onClick={() => setShowSidebar(showSidebar === 'chat' ? null : 'chat')} className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'chat' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <MessageSquare size={16} className="md:hidden" />
                            <MessageSquare size={18} className="hidden md:block" />
                        </button>

                        {/* Mobile More button */}
                        <button aria-label="More options" onClick={() => setShowMobileMore(!showMobileMore)} className={clsx("md:hidden p-2 rounded-2xl transition-all duration-300 flex-shrink-0", showMobileMore ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <MoreHorizontal size={16} />
                        </button>

                        <div className="w-px h-5 md:h-7 bg-white/20 mx-0 md:mx-2 flex-shrink-0" />

                        <button aria-label="Leave meeting" onClick={handleLeaveMeeting} className="px-2.5 md:px-5 py-2 md:py-3.5 rounded-2xl bg-red-500 text-white font-bold transition-all duration-300 hover:bg-red-600 hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-1.5 md:gap-2 flex-shrink-0 text-sm">
                            <PhoneOff size={14} className="md:hidden" />
                            <PhoneOff size={16} className="hidden md:block" />
                            <span className="hidden sm:inline">Leave</span>
                        </button>
                    </div>

                    {/* Mobile reaction tray */}
                    <AnimatePresence>
                        {showReactionTray && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="md:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#1a1b1e] border border-white/10 rounded-2xl p-2 flex gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                                {REACTION_EMOJIS.map(emoji => (
                                    <button key={emoji} onClick={() => sendReaction(emoji)} className="text-xl p-1.5 hover:bg-white/10 rounded-xl transition-all hover:scale-125 active:scale-95">
                                        {emoji}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* Sidebar (Settings/Chat/People) */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div 
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 35, stiffness: 400 }}
                        className="fixed inset-0 md:absolute md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-80 lg:w-96 bg-[#0c0d0f] md:bg-[#0c0d0f]/98 md:border-l border-white/10 z-40 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
                    >
                        <div className="p-4 md:p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="font-google font-bold text-base md:text-lg flex items-center gap-2">
                                {showSidebar === 'effects' ? <><Sparkles size={18} className="text-purple-400" /> Visual Effects</> : 
                                 showSidebar === 'chat' ? <><MessageSquare size={18} className="text-blue-400" /> Meeting Chat</> : 
                                 showSidebar === 'notes' ? <><FileText size={18} className="text-emerald-400" /> Quick Notes</> : 
                                 showSidebar === 'files' ? <><Paperclip size={18} className="text-amber-400" /> Shared Files</> :
                                 <><Users size={18} className="text-teal-400" /> Participants</>}
                            </h3>
                            <button onClick={() => setShowSidebar(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-8 md:pb-4 custom-scrollbar">
                            {showSidebar === 'effects' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                                            <div className="h-px bg-white/10 flex-1" /> Background Blur <div className="h-px bg-white/10 flex-1" />
                                        </h4>
                                        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                                            {(['None', 'Light', 'Heavy'] as const).map(level => (
                                                <button 
                                                    key={level} 
                                                    onClick={() => { setBackgroundBlur(level); addToast(`Background blur: ${level}`, '🔮'); }}
                                                    className={clsx(
                                                        "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all",
                                                        backgroundBlur === level 
                                                            ? "bg-purple-500/30 text-purple-300 shadow-md border border-purple-500/30" 
                                                            : "hover:bg-white/10 text-white/60 hover:text-white"
                                                    )}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                                            <div className="h-px bg-white/10 flex-1" /> Virtual Backgrounds <div className="h-px bg-white/10 flex-1" />
                                        </h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button 
                                                onClick={() => { setSelectedBg(null); addToast('Background removed', '🚫'); }}
                                                className={clsx(
                                                    "aspect-video rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer border-2",
                                                    selectedBg === null 
                                                        ? "bg-purple-500/15 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]" 
                                                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                                                )}
                                            >
                                                None
                                            </button>
                                            {[1,2,3,4,5].map(i => (
                                                <button 
                                                    key={i}
                                                    onClick={() => { setSelectedBg(i); addToast(`Background ${i} applied`, '🖼️'); }}
                                                    className={clsx(
                                                        "aspect-video rounded-xl overflow-hidden cursor-pointer transition-all relative border-2",
                                                        selectedBg === i 
                                                            ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                                                            : "border-white/10 hover:border-purple-500/50"
                                                    )}
                                                >
                                                    <img src={`https://picsum.photos/seed/${i * 42}/300/170`} alt={`Background ${i}`} className={clsx("w-full h-full object-cover transition-opacity", selectedBg === i ? "opacity-100" : "opacity-60 hover:opacity-90")} />
                                                    {selectedBg === i && (
                                                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                                            <CheckCircle2 size={20} className="text-white drop-shadow-lg" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                                            <div className="h-px bg-white/10 flex-1" /> Video Enhancements <div className="h-px bg-white/10 flex-1" />
                                        </h4>
                                        <div className="space-y-2">
                                            <button 
                                                onClick={() => { setLowLightMode(!lowLightMode); addToast(lowLightMode ? 'Low light mode off' : 'Low light mode on', '💡'); }}
                                                className={clsx(
                                                    "w-full flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                                                    lowLightMode ? "bg-purple-500/10 border-purple-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                <div className={clsx("relative w-10 h-5 rounded-full transition-colors", lowLightMode ? "bg-purple-500" : "bg-white/20")}>
                                                    <div className={clsx("absolute top-1 bg-white w-3 h-3 rounded-full transition-all", lowLightMode ? "right-1" : "left-1")} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <span className="text-sm font-bold block">Low Light Mode</span>
                                                    <span className="text-[10px] text-white/50 font-medium">Auto-adjusts brightness</span>
                                                </div>
                                            </button>
                                            <button 
                                                onClick={() => { setStudioLighting(!studioLighting); addToast(studioLighting ? 'Studio lighting off' : 'Studio lighting on', '✨'); }}
                                                className={clsx(
                                                    "w-full flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                                                    studioLighting ? "bg-purple-500/10 border-purple-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                <div className={clsx("relative w-10 h-5 rounded-full transition-colors", studioLighting ? "bg-purple-500" : "bg-white/20")}>
                                                    <div className={clsx("absolute top-1 bg-white w-3 h-3 rounded-full transition-all", studioLighting ? "right-1" : "left-1")} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <span className="text-sm font-bold block">Studio Lighting</span>
                                                    <span className="text-[10px] text-white/50 font-medium">Professional portrait lighting</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showSidebar === 'notes' && (
                                <div className="flex flex-col h-full animate-fade-in space-y-3">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-start gap-3 shrink-0">
                                        <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 mt-0.5">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm mb-0.5">Meeting Notes</h4>
                                            <p className="text-[10px] text-emerald-100/60 leading-relaxed">
                                                Jot down key takeaways. Notes are saved to your workspace.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col relative">
                                        <textarea 
                                            className="w-full flex-1 min-h-[200px] bg-white/5 border border-white/10 rounded-2xl p-3 md:p-4 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all custom-scrollbar placeholder:text-white/30"
                                            placeholder="Type your notes here... (Markdown supported)"
                                            value={notesContent}
                                            onChange={(e) => setNotesContent(e.target.value)}
                                        />
                                        <div className="flex gap-2 mt-2 shrink-0">
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(notesContent); addToast('Notes copied to clipboard', '📋'); }}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-colors text-xs font-bold"
                                            >
                                                <Copy size={14} /> Copy Notes
                                            </button>
                                            <button 
                                                onClick={() => addToast('Notes saved to PRISM Docs', '✅')}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors text-xs font-bold"
                                            >
                                                <CheckCircle2 size={14} /> Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showSidebar === 'files' && (
                                <div className="flex flex-col h-full animate-fade-in space-y-4">
                                    {/* Upload area */}
                                    <div 
                                        className="border-2 border-dashed border-white/15 hover:border-amber-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-amber-500/5 group"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="w-12 h-12 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-amber-500/20 transition-colors">
                                            {isUploading ? (
                                                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Upload size={20} className="text-amber-400" />
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-white/80 mb-1">
                                            {isUploading ? 'Uploading...' : 'Share files'}
                                        </p>
                                        <p className="text-[10px] text-white/40">
                                            PDFs, Documents, Images, Videos — up to 50MB
                                        </p>
                                    </div>
                                    <input 
                                        ref={fileInputRef} 
                                        type="file" 
                                        className="hidden" 
                                        multiple 
                                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                                        onChange={e => handleFileUpload(e.target.files)} 
                                    />

                                    {/* File list */}
                                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                        {meetingFiles.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-12">
                                                <Paperclip size={28} className="text-white mb-3" />
                                                <p className="text-sm font-bold mb-1">No files shared yet</p>
                                                <p className="text-xs text-white/50 max-w-[200px]">Files shared during the meeting will appear here.</p>
                                            </div>
                                        ) : (
                                            meetingFiles.map(f => (
                                                <div key={f.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 hover:bg-white/10 transition-colors group">
                                                    {f.type.startsWith('image/') && (
                                                        <img src={f.url} alt={f.name} className="w-full h-32 object-cover rounded-xl mb-2" />
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl flex-shrink-0">{getFileIcon(f.type)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-white truncate">{f.name}</p>
                                                            <p className="text-[10px] text-white/40">{f.sender} · {formatFileSize(f.size)}</p>
                                                        </div>
                                                        <a 
                                                            href={f.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            download={f.name}
                                                            className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-white/50 hover:text-amber-400 transition-colors md:opacity-0 md:group-hover:opacity-100 flex-shrink-0"
                                                        >
                                                            <Download size={14} />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))
                                        )}
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
                                                <p className="text-xs max-w-[200px] mx-auto">Messages and files shared here are visible to everyone.</p>
                                            </div>
                                        ) : (
                                            chatMessages.map(msg => (
                                                <div key={msg.id} className={clsx("flex flex-col", msg.isSelf ? "items-end" : "items-start")}>
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="text-[10px] font-bold text-white/50">{msg.sender}</span>
                                                        <span className="text-[9px] text-white/30">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    {msg.fileUrl ? (
                                                        <div className={clsx("rounded-2xl max-w-[85%] overflow-hidden shadow-sm", msg.isSelf ? "bg-blue-600/20 border border-blue-500/20 rounded-tr-sm" : "bg-white/10 border border-white/10 rounded-tl-sm")}>
                                                            {msg.fileType?.startsWith('image/') && (
                                                                <img src={msg.fileUrl} alt={msg.fileName} className="w-full max-h-48 object-cover" />
                                                            )}
                                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-3 hover:bg-white/5 transition-colors">
                                                                <span className="text-lg">{getFileIcon(msg.fileType || '')}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-white truncate">{msg.fileName}</p>
                                                                    {msg.fileSize && <p className="text-[10px] text-white/40">{formatFileSize(msg.fileSize)}</p>}
                                                                </div>
                                                                <Download size={14} className="text-white/40 flex-shrink-0" />
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <div className={clsx("px-3 py-2 rounded-2xl text-sm max-w-[85%] break-words shadow-sm", msg.isSelf ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm")}>
                                                            {msg.text}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="mt-2 pt-2 md:mt-3 md:pt-3 border-t border-white/10 shrink-0 pb-6 md:pb-0">
                                        <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="flex items-center gap-2">
                                            <button type="button" onClick={() => chatFileInputRef.current?.click()} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-amber-400 transition-colors flex-shrink-0" title="Attach file">
                                                <Paperclip size={16} />
                                            </button>
                                            <input ref={chatFileInputRef} type="file" className="hidden" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" onChange={e => handleChatFileAttach(e.target.files)} />
                                            <div className="relative flex-1">
                                                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Send a message..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-sm font-google outline-none focus:border-white/30 transition-colors text-white" />
                                                <button type="submit" disabled={!chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-blue-400 hover:bg-blue-400/10 disabled:opacity-50 transition-colors cursor-pointer">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                                </button>
                                            </div>
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
