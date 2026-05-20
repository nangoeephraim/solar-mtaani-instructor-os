// ─── PRISM Meetings — Bottom Control Bar + Mobile More Menu ───
// Extracted from Meetings.tsx to reduce monolithic component size
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Video, VideoOff, MonitorUp, Users, MessageSquare,
    MoreHorizontal, PhoneOff, Circle, Hand, Captions, SmilePlus,
    Settings, FileText, Sparkles, Paperclip, BarChart3, Share2,
    Copy, SwitchCamera, MicOff as MicOffIcon, AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import type { SidebarTab } from './types';
import { REACTION_EMOJIS } from './types';
import { Room } from 'livekit-client';

interface MeetingControlsProps {
    // Media state
    audioEnabled: boolean;
    setAudioEnabled: (v: boolean) => void;
    videoEnabled: boolean;
    setVideoEnabled: (v: boolean) => void;
    screenShared: boolean;
    handRaised: boolean;
    isRecording: boolean;
    captionsEnabled: boolean;
    setCaptionsEnabled: (v: boolean) => void;
    noiseSuppression: boolean;

    // UI toggles
    showMobileMore: boolean;
    setShowMobileMore: (v: boolean) => void;
    showSidebar: SidebarTab;
    setShowSidebar: (s: SidebarTab) => void;
    showReactionTray: boolean;
    setShowReactionTray: (v: boolean) => void;
    showDeviceSelector: boolean;
    setShowDeviceSelector: (v: boolean) => void;

    // Data
    remotePeersCount: number;
    hasActivePolls: boolean;
    liveKitRoomRef: React.MutableRefObject<Room | null>;

    // Handlers
    handleLeaveMeeting: () => Promise<void>;
    handleScreenShare: () => Promise<void>;
    handleFlipCamera: () => Promise<void>;
    toggleRecording: () => void;
    toggleHandRaise: () => void;
    toggleNoiseSuppression: () => Promise<void>;
    sendReaction: (emoji: string) => void;
    shareMeetingToChat: () => void;
    copyMeetingLink: () => void;
}

const MeetingControls: React.FC<MeetingControlsProps> = ({
    audioEnabled, setAudioEnabled, videoEnabled, setVideoEnabled,
    screenShared, handRaised, isRecording, captionsEnabled, setCaptionsEnabled,
    noiseSuppression, showMobileMore, setShowMobileMore,
    showSidebar, setShowSidebar, showReactionTray, setShowReactionTray,
    showDeviceSelector, setShowDeviceSelector,
    remotePeersCount, hasActivePolls, liveKitRoomRef,
    handleLeaveMeeting, handleScreenShare, handleFlipCamera,
    toggleRecording, toggleHandRaise, toggleNoiseSuppression,
    sendReaction, shareMeetingToChat, copyMeetingLink
}) => {
    return (
        <>
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
                            className="absolute bottom-0 left-0 right-0 z-50 md:hidden bg-black/60 backdrop-blur-3xl border-t border-white/10 rounded-t-3xl p-5 shadow-[0_-8px_32px_rgba(0,0,0,0.6)] overflow-y-auto max-h-[85vh] custom-scrollbar"
                            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
                        >
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-5 gap-x-3 meeting-more-grid">
                                {[
                                    { icon: <MonitorUp size={22} />, label: screenShared ? 'Stop Share' : 'Screen', onClick: handleScreenShare, active: screenShared, color: 'blue' },
                                    { icon: <SwitchCamera size={22} />, label: 'Flip Cam', onClick: () => { handleFlipCamera(); setShowMobileMore(false); }, active: false, color: 'blue' },
                                    { icon: <Hand size={22} />, label: handRaised ? 'Lower' : 'Raise', onClick: toggleHandRaise, active: handRaised, color: 'yellow' },
                                    { icon: <Captions size={22} />, label: captionsEnabled ? 'CC Off' : 'CC On', onClick: () => setCaptionsEnabled(!captionsEnabled), active: captionsEnabled, color: 'blue' },
                                    { icon: <Circle size={22} className={clsx(isRecording && "fill-white")} />, label: isRecording ? 'Stop Rec' : 'Record', onClick: toggleRecording, active: isRecording, color: 'red' },
                                    { icon: <SmilePlus size={22} />, label: 'React', onClick: () => { setShowReactionTray(!showReactionTray); setShowMobileMore(false); }, active: showReactionTray, color: 'yellow' },
                                    { icon: <MicOff size={22} />, label: noiseSuppression ? 'NS On' : 'NS Off', onClick: () => { toggleNoiseSuppression(); setShowMobileMore(false); }, active: noiseSuppression, color: 'emerald' },
                                    { icon: <Settings size={22} />, label: 'Devices', onClick: () => { setShowDeviceSelector(true); setShowMobileMore(false); }, active: showDeviceSelector, color: 'blue' },
                                    { icon: <FileText size={22} />, label: 'Notes', onClick: () => { setShowSidebar(showSidebar === 'notes' ? null : 'notes'); setShowMobileMore(false); }, active: showSidebar === 'notes', color: 'emerald' },
                                    { icon: <Sparkles size={22} />, label: 'Effects', onClick: () => { setShowSidebar(showSidebar === 'effects' ? null : 'effects'); setShowMobileMore(false); }, active: showSidebar === 'effects', color: 'purple' },
                                    { icon: <Paperclip size={22} />, label: 'Files', onClick: () => { setShowSidebar(showSidebar === 'files' ? null : 'files'); setShowMobileMore(false); }, active: showSidebar === 'files', color: 'amber' },
                                    { icon: <BarChart3 size={22} />, label: 'Polls', onClick: () => { setShowSidebar(showSidebar === 'polls' ? null : 'polls'); setShowMobileMore(false); }, active: showSidebar === 'polls', color: 'blue' },
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
                className="absolute bottom-0 left-0 right-0 z-30 flex justify-center pb-3 md:pb-6 px-2 md:px-3 w-full meeting-controls"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
            >
                <div className="flex items-center justify-between md:justify-center w-full max-w-[calc(100vw-1rem)] md:max-w-fit gap-1.5 md:gap-2 bg-black/50 backdrop-blur-3xl border border-white/10 px-2.5 md:px-5 py-2 md:py-3.5 rounded-[2rem] shadow-[0_-4px_24px_rgba(0,0,0,0.4),0_8px_32px_rgba(0,0,0,0.5)] mx-auto transition-all duration-300 overflow-hidden">
                    
                    <button id="btn-mute" aria-label={audioEnabled ? "Mute" : "Unmute"} onClick={() => {
                        // BUG-05 FIX: Compute target state before calling LiveKit
                        const nextAudio = !audioEnabled;
                        setAudioEnabled(nextAudio);
                        if (liveKitRoomRef.current) liveKitRoomRef.current.localParticipant.setMicrophoneEnabled(nextAudio);
                    }} className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", audioEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]")}>
                        {audioEnabled ? <Mic size={16} className="md:hidden" /> : <MicOff size={16} className="md:hidden" />}
                        {audioEnabled ? <Mic size={18} className="hidden md:block" /> : <MicOff size={18} className="hidden md:block" />}
                    </button>
                    
                    <button id="btn-camera" aria-label={videoEnabled ? "Camera off" : "Camera on"} onClick={() => {
                        const nextVideo = !videoEnabled;
                        setVideoEnabled(nextVideo);
                        if (liveKitRoomRef.current) liveKitRoomRef.current.localParticipant.setCameraEnabled(nextVideo);
                    }} className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", videoEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]")}>
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
                    <button aria-label="Noise Suppression" onClick={toggleNoiseSuppression} className={clsx("hidden md:flex p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", noiseSuppression ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/10 hover:bg-white/20 text-white")} title={noiseSuppression ? 'Noise suppression ON' : 'Noise suppression OFF'}>
                        <AlertCircle size={18} />
                    </button>
                    <button aria-label="Device Settings" onClick={() => setShowDeviceSelector(!showDeviceSelector)} className={clsx("hidden md:flex p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showDeviceSelector ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")} title="Device settings">
                        <Settings size={18} />
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
                    <button aria-label="Polls" onClick={() => setShowSidebar(showSidebar === 'polls' ? null : 'polls')} className={clsx("hidden md:flex p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'polls' ? "bg-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <BarChart3 size={18} />
                        {hasActivePolls && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse" />}
                    </button>

                    {/* Both mobile+desktop: People & Chat */}
                    <button aria-label="People" onClick={() => setShowSidebar(showSidebar === 'people' ? null : 'people')} className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'people' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <Users size={16} className="md:hidden" />
                        <Users size={18} className="hidden md:block" />
                        {/* Task 1.3: Participant count badge */}
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 border-2 border-[#1a1b1e]">
                            {1 + remotePeersCount}
                        </span>
                    </button>
                    <button aria-label="Chat" onClick={() => setShowSidebar(showSidebar === 'chat' ? null : 'chat')} className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'chat' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <MessageSquare size={16} className="md:hidden" />
                        <MessageSquare size={18} className="hidden md:block" />
                    </button>

                    {/* Mobile More button */}
                    <button id="btn-more" aria-label="More options" onClick={() => setShowMobileMore(!showMobileMore)} className={clsx("md:hidden p-2.5 rounded-2xl transition-all duration-300 flex-shrink-0 relative group", showMobileMore ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <MoreHorizontal size={16} />
                        {handRaised && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-[#1a1b1e]" />}
                    </button>

                    <div className="w-px h-5 md:h-7 bg-white/20 mx-0.5 md:mx-2 flex-shrink-0" />

                    <button id="btn-leave" aria-label="Leave meeting" onClick={handleLeaveMeeting} className="px-2.5 md:px-5 py-2 md:py-3.5 rounded-2xl bg-red-500 text-white font-bold transition-all duration-300 hover:bg-red-600 hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-1 md:gap-2 flex-shrink-0 text-xs md:text-sm">
                        <PhoneOff size={14} className="md:hidden" />
                        <PhoneOff size={18} className="hidden md:block" />
                        <span className="hidden sm:inline">Leave</span>
                    </button>
                </div>

                {/* Mobile reaction tray */}
                <AnimatePresence>
                    {showReactionTray && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            className="md:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 flex gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                            {REACTION_EMOJIS.map(emoji => (
                                <button key={emoji} onClick={() => sendReaction(emoji)} className="text-2xl md:text-3xl p-2.5 hover:bg-white/10 rounded-xl transition-all hover:scale-125 active:scale-95">
                                    {emoji}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default MeetingControls;
