import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Settings, PhoneOff, Maximize, Users, MessageSquare, Sparkles, LayoutGrid, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import UserAvatar from '../UserAvatar';

// dummy participants for demo
const DUMMY_PARTICIPANTS = [
    { id: '1', name: 'You', isMe: true, isSpeaking: true, avatarUrl: null, videoEnabled: true, audioEnabled: true },
    { id: '2', name: 'Alice M.', isMe: false, isSpeaking: false, avatarUrl: null, videoEnabled: true, audioEnabled: false },
    { id: '3', name: 'Dr. Smith', isMe: false, isSpeaking: false, avatarUrl: null, videoEnabled: false, audioEnabled: true },
    { id: '4', name: 'Engineering Team', isMe: false, isSpeaking: false, avatarUrl: null, videoEnabled: true, audioEnabled: true },
];

export default function VideoMeet({ channelName, onLeave }: { channelName: string, onLeave: () => void }) {
    // states
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenShared, setScreenShared] = useState(false);
    const [showSidebar, setShowSidebar] = useState<'chat' | 'people' | 'effects' | null>(null);
    const [layout, setLayout] = useState<'grid' | 'spotlight'>('grid');

    const participants = DUMMY_PARTICIPANTS; // in a real app, this is dynamic

    return (
        <div className="flex w-full h-full relative overflow-hidden bg-[#0A0A0B] text-white">
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
                        <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2.5 text-sm font-google font-bold shadow-lg">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            {channelName}
                        </div>
                        <span className="text-white/70 text-xs font-black tracking-widest uppercase bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5 backdrop-blur-sm shadow-sm hidden sm:block">
                            03:45
                        </span>
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
                        layout === 'spotlight' ? "grid-cols-1 grid-rows-1" :
                        participants.length === 1 ? "grid-cols-1 grid-rows-1" :
                        participants.length === 2 ? "grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1" :
                        participants.length <= 4 ? "grid-cols-2 grid-rows-2" :
                        "grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2"
                    )}>
                        {participants.map((p, i) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={p.id} 
                                className={clsx(
                                    "relative rounded-3xl overflow-hidden shadow-2xl bg-[#131416] transition-all duration-300",
                                    p.isSpeaking ? "ring-2 ring-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]" : "border border-white/5",
                                    layout === 'spotlight' && i !== 0 ? "hidden" : "flex items-center justify-center"
                                )}
                            >
                                {/* Video Mockup / Background */}
                                {p.videoEnabled && (!p.isMe || videoEnabled) ? (
                                    <div className="absolute inset-0 bg-[#1A1C20]">
                                        {/* Abstract placeholder for camera feed to look premium */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-40 mix-blend-screen">
                                            <div className={clsx("w-[150%] h-[150%] rounded-full blur-[80px] animate-[spin_12s_linear_infinite]", p.isMe ? "bg-blue-500/20" : "bg-indigo-500/20")} />
                                            <div className={clsx("w-[120%] h-[120%] rounded-full blur-[100px] animate-[spin_15s_linear_infinite_reverse] absolute", p.isMe ? "bg-purple-500/20" : "bg-teal-500/20")} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#131416]">
                                        <motion.div 
                                            animate={p.isSpeaking ? { scale: [1, 1.1, 1] } : { scale: 1 }} 
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className={clsx("w-24 h-24 rounded-full flex items-center justify-center mb-4 relative", p.isSpeaking ? "bg-blue-500/20" : "bg-white/5")}
                                        >
                                            <UserAvatar name={p.name} size={72} />
                                            {p.isSpeaking && (
                                                <div className="absolute inset-0 rounded-full border-2 border-blue-500/50 animate-ping" />
                                            )}
                                        </motion.div>
                                    </div>
                                )}

                                {/* Overlay UI */}
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <div className="bg-black/50 backdrop-blur-xl px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2.5 shadow-lg">
                                        <span className="text-sm font-bold font-google">{p.name} {p.isMe && <span className="opacity-60 font-medium">(You)</span>}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {!p.audioEnabled || (p.isMe && !audioEnabled) ? (
                                            <div className="bg-red-500/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-red-400/20">
                                                <MicOff size={16} className="text-white" />
                                            </div>
                                        ) : p.isSpeaking && (
                                            <div className="bg-blue-500/90 backdrop-blur-md p-2 rounded-xl flex gap-1 items-end h-[34px] shadow-lg border border-blue-400/20">
                                                <motion.div animate={{ height: ['40%', '100%', '40%'] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 bg-white rounded-full" />
                                                <motion.div animate={{ height: ['70%', '40%', '70%'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 bg-white rounded-full" />
                                                <motion.div animate={{ height: ['50%', '90%', '50%'] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1.5 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
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
                    
                    <button onClick={() => setScreenShared(!screenShared)} className={clsx("p-3.5 md:p-4 rounded-2xl transition-all duration-300 relative group flex-shrink-0", screenShared ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "bg-white/10 hover:bg-white/20 text-white")}>
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
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-[#1c1c1e]" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-md border border-white/10">Meeting Chat</span>
                    </button>

                    <div className="w-px h-8 bg-white/20 mx-1 md:mx-2 flex-shrink-0" />

                    <button onClick={onLeave} className="px-5 md:px-6 py-3.5 md:py-4 rounded-2xl bg-red-500 text-white font-bold transition-all duration-300 hover:bg-red-600 hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2 flex-shrink-0">
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
                                            {/* None option */}
                                            <div className="aspect-video bg-white/5 border border-white/20 rounded-xl flex items-center justify-center text-xs font-bold text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                                                None
                                            </div>
                                            {/* Generated options */}
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
                                    {participants.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <UserAvatar name={p.name} size={36} />
                                                    {p.isSpeaking && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-[#1c1c1e]" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold font-google">{p.name}</span>
                                                    <span className="text-[10px] text-white/50">{p.isMe ? 'Meeting Host' : 'Participant'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                                    {p.audioEnabled ? <Mic size={14} className={p.isSpeaking ? "text-blue-400" : "text-white/70"} /> : <MicOff size={14} className="text-red-400" />}
                                                </button>
                                                <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                                    {p.videoEnabled ? <Video size={14} className="text-white/70" /> : <VideoOff size={14} className="text-red-400" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="w-full mt-4 py-3 bg-white/5 border border-white/10 border-dashed rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2">
                                        <Users size={16} /> Invite People
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
