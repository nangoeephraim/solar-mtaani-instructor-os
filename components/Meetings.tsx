import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Settings, Maximize, Users, MessageSquare, Sparkles, LayoutGrid, AlertCircle, Copy, CheckCircle2, PhoneOff } from 'lucide-react';
import clsx from 'clsx';
import UserAvatar from './UserAvatar';

export default function Meetings() {
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenShared, setScreenShared] = useState(false);
    const [showSidebar, setShowSidebar] = useState<'chat' | 'people' | 'effects' | null>(null);
    const [layout, setLayout] = useState<'grid' | 'spotlight'>('grid');
    const [inMeeting, setInMeeting] = useState(false);
    const [meetingId, setMeetingId] = useState('');
    const [copied, setCopied] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [hasError, setHasError] = useState<string | null>(null);

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
            if (!meetingId) {
                setMeetingId(generateMeetingId());
            }
            setHasError(null);
        } catch (err) {
            console.error("Failed to get local stream", err);
            setHasError("Failed to access camera and microphone. Please check your permissions.");
        }
    };

    const handleLeaveMeeting = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setScreenStream(null);
        setInMeeting(false);
        setScreenShared(false);
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

    if (!inMeeting) {
        return (
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0a0a0b] via-[#131416] to-[#0a0a0b] z-20">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
                </div>
                
                <div className="relative z-10 p-8 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-google font-bold text-white mb-4 tracking-tight">
                                Premium Video <br className="hidden md:block"/>Meetings
                            </h1>
                            <p className="text-[var(--md-sys-color-on-surface-variant)] text-lg leading-relaxed">
                                Connect, collaborate, and celebrate from anywhere with PRISM Video Meetings. Built for high-performance and flawless reliability.
                            </p>
                        </div>

                        {hasError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3">
                                <AlertCircle size={20} />
                                <span className="text-sm font-medium">{hasError}</span>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={handleJoinMeeting}
                                className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Video size={20} />
                                New Meeting
                            </button>
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-[var(--md-sys-color-on-surface-variant)]">
                                        <MonitorUp size={20} />
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter meeting code"
                                    value={meetingId}
                                    onChange={(e) => setMeetingId(e.target.value)}
                                    className="w-full bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] rounded-2xl py-4 pl-12 pr-24 text-[var(--md-sys-color-on-surface)] outline-none focus:border-blue-500 transition-colors"
                                />
                                <button 
                                    onClick={() => meetingId && handleJoinMeeting()}
                                    disabled={!meetingId}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--md-sys-color-primary)] hover:text-white"
                                >
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="hidden md:flex items-center justify-center relative">
                         <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-[3rem] blur-3xl transform rotate-6" />
                         <div className="w-full aspect-[4/3] bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--md-sys-color-outline-variant)] rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col items-center justify-center z-10">
                             <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.3)] animate-pulse">
                                 <Video size={40} className="text-blue-400" />
                             </div>
                             <h3 className="text-xl font-bold text-white mb-2 font-google">Ready to join?</h3>
                             <p className="text-white/50 text-sm">Allow camera and microphone access</p>
                         </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-full relative overflow-hidden bg-[#0a0a0b] text-white z-20">
            {/* Background elements for premium look */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
            </div>
            
            {/* Main Content */}
            <div className={clsx("flex-1 flex flex-col relative z-10 transition-all duration-300", showSidebar ? "lg:pr-80" : "")}>
                
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-20">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2.5 text-sm font-google font-bold shadow-lg cursor-pointer hover:bg-white/20 transition-colors group" onClick={copyMeetingLink}>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            {meetingId}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-white/50">
                                {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                            </span>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold backdrop-blur-sm hidden md:flex">
                            <AlertCircle size={12} /> Encrypted
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setLayout(layout === 'grid' ? 'spotlight' : 'grid')} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-colors" title="Toggle Layout">
                            <LayoutGrid size={18} />
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

                        {/* Local Camera */}
                        <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={clsx(
                                "relative rounded-3xl overflow-hidden shadow-2xl bg-[#131416] transition-all duration-300 border border-white/5 flex items-center justify-center group",
                                screenShared ? "col-span-3 row-span-1 md:col-span-1 md:row-span-3 aspect-video md:aspect-auto" : "w-full h-full"
                            )}
                        >
                            {!videoEnabled ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#131416]">
                                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-white/5 border border-white/10 relative">
                                         <UserAvatar name="You" size={72} />
                                    </div>
                                    <p className="text-white/50 text-sm font-medium">Camera off</p>
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

                            {/* Overlay UI */}
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 backdrop-blur-xl px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2.5 shadow-lg">
                                    <span className="text-sm font-bold font-google">You</span>
                                </div>
                                <div className="flex gap-2">
                                    {!audioEnabled ? (
                                        <div className="bg-red-500/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-red-400/20">
                                            <MicOff size={16} className="text-white" />
                                        </div>
                                    ) : (
                                        <div className="bg-black/50 backdrop-blur-md p-2 rounded-xl shadow-lg border border-white/10">
                                            <Mic size={16} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom Controls Bar */}
                <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur-2xl border border-white/10 px-4 md:px-6 py-3 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-30 w-max max-w-[90vw] overflow-x-auto">
                    
                    <button onClick={() => setAudioEnabled(!audioEnabled)} className={clsx("p-3.5 md:p-4 rounded-2xl transition-all duration-300 relative group flex-shrink-0", audioEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]")}>
                        {audioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">Toggle Mic</span>
                    </button>
                    
                    <button onClick={() => setVideoEnabled(!videoEnabled)} className={clsx("p-3.5 md:p-4 rounded-2xl transition-all duration-300 relative group flex-shrink-0", videoEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]")}>
                        {videoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">Toggle Video</span>
                    </button>
                    
                    <button onClick={handleScreenShare} className={clsx("p-3.5 md:p-4 rounded-2xl transition-all duration-300 relative group flex-shrink-0", screenShared ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <MonitorUp size={22} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">{screenShared ? 'Stop Sharing' : 'Share Screen'}</span>
                    </button>

                    <div className="w-px h-8 bg-white/20 mx-1 md:mx-2 flex-shrink-0" />
                    
                    <button onClick={() => setShowSidebar(showSidebar === 'effects' ? null : 'effects')} className={clsx("p-3.5 md:p-4 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'effects' ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <Sparkles size={22} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">Visual Effects</span>
                    </button>

                    <button onClick={() => setShowSidebar(showSidebar === 'people' ? null : 'people')} className={clsx("p-3.5 md:p-4 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'people' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <Users size={22} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">Participants</span>
                    </button>

                    <button onClick={() => setShowSidebar(showSidebar === 'chat' ? null : 'chat')} className={clsx("p-3.5 md:p-4 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'chat' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <MessageSquare size={22} />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">Meeting Chat</span>
                    </button>

                    <div className="w-px h-8 bg-white/20 mx-1 md:mx-2 flex-shrink-0" />

                    <button onClick={handleLeaveMeeting} className="px-5 md:px-6 py-3.5 md:py-4 rounded-2xl bg-red-500 text-white font-bold transition-all duration-300 hover:bg-red-600 hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2 flex-shrink-0">
                        <PhoneOff size={22} />
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

                            {showSidebar === 'people' && (
                                <div className="space-y-2 animate-fade-in">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <UserAvatar name="You" size={36} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold font-google">You</span>
                                                <span className="text-[10px] text-white/50">Meeting Host</span>
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
                                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                                            <MessageSquare size={28} className="text-white" />
                                        </div>
                                        <h4 className="font-bold mb-1">No messages yet</h4>
                                        <p className="text-xs max-w-[200px] mx-auto">Messages sent here are visible to everyone in the call.</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <div className="relative">
                                            <input type="text" placeholder="Send a message..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-sm font-google outline-none focus:border-white/30 transition-colors" />
                                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                            </button>
                                        </div>
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
