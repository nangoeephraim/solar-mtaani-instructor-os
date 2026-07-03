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
import type { SidebarTab, MeetingTheme } from './types';
import { REACTION_EMOJIS, THEME_COLORS } from './types';
import { Room } from 'livekit-client';

interface MeetingControlsProps {
    meetingTheme?: MeetingTheme;
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
    meetingTheme = 'classic',
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
    const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);
    const themeInfo = THEME_COLORS[meetingTheme];

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
                className="absolute bottom-0 left-0 right-0 z-30 flex justify-center pb-3 md:pb-6 px-2 md:px-3 w-full meeting-controls pointer-events-none"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
            >
                <div 
                    className="flex items-center justify-between md:justify-center w-full max-w-[calc(100vw-1rem)] md:max-w-fit gap-1.5 md:gap-2 bg-[#090a0c]/65 backdrop-blur-3xl border px-2.5 md:px-5 py-2 md:py-3.5 rounded-[2rem] mx-auto transition-all duration-300 overflow-visible pointer-events-auto"
                    style={{
                        borderColor: `rgba(${themeInfo.rgb}, 0.25)`,
                        boxShadow: `0 -4px 24px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(${themeInfo.rgb}, 0.15)`
                    }}
                >
                    {/* Microphone */}
                    <div className="relative flex items-center justify-center">
                        <button id="btn-mute" aria-label={audioEnabled ? "Mute" : "Unmute"} 
                            onMouseEnter={() => setHoveredButton('mute')}
                            onMouseLeave={() => setHoveredButton(null)}
                            onClick={() => {
                                const nextAudio = !audioEnabled;
                                setAudioEnabled(nextAudio);
                                if (liveKitRoomRef.current) liveKitRoomRef.current.localParticipant.setMicrophoneEnabled(nextAudio);
                            }} 
                            className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", audioEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]")}
                        >
                            {audioEnabled ? <Mic size={16} className="md:hidden" /> : <MicOff size={16} className="md:hidden" />}
                            {audioEnabled ? <Mic size={18} className="hidden md:block" /> : <MicOff size={18} className="hidden md:block" />}
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'mute' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    {audioEnabled ? "Mute Microphone (Ctrl+D)" : "Unmute Microphone (Ctrl+D)"}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* Camera */}
                    <div className="relative flex items-center justify-center">
                        <button id="btn-camera" aria-label={videoEnabled ? "Camera off" : "Camera on"} 
                            onMouseEnter={() => setHoveredButton('camera')}
                            onMouseLeave={() => setHoveredButton(null)}
                            onClick={() => {
                                const nextVideo = !videoEnabled;
                                setVideoEnabled(nextVideo);
                                if (liveKitRoomRef.current) liveKitRoomRef.current.localParticipant.setCameraEnabled(nextVideo);
                            }} 
                            className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", videoEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]")}
                        >
                            {videoEnabled ? <Video size={16} className="md:hidden" /> : <VideoOff size={16} className="md:hidden" />}
                            {videoEnabled ? <Video size={18} className="hidden md:block" /> : <VideoOff size={18} className="hidden md:block" />}
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'camera' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    {videoEnabled ? "Turn Off Camera (Ctrl+E)" : "Turn On Camera (Ctrl+E)"}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-px h-7 bg-white/20 mx-0.5 md:mx-2 flex-shrink-0 hidden md:block" />

                    {/* Desktop-only inline buttons: Share screen */}
                    <div className="relative hidden md:flex items-center justify-center">
                        <button aria-label="Share screen" onClick={handleScreenShare}
                            onMouseEnter={() => setHoveredButton('screen')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", screenShared ? "bg-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <MonitorUp size={18} />
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'screen' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    {screenShared ? "Stop Screen Share" : "Share Screen"}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Raise hand */}
                    <div className="relative hidden md:flex items-center justify-center">
                        <button aria-label="Raise hand" onClick={toggleHandRaise}
                            onMouseEnter={() => setHoveredButton('hand')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", handRaised ? "bg-yellow-500 text-white font-bold" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <Hand size={18} />
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'hand' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    {handRaised ? "Lower Hand" : "Raise Hand"}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Captions */}
                    <div className="relative hidden md:flex items-center justify-center">
                        <button aria-label="Captions" onClick={() => setCaptionsEnabled(!captionsEnabled)}
                            onMouseEnter={() => setHoveredButton('captions')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", captionsEnabled ? "bg-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <Captions size={18} />
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'captions' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    {captionsEnabled ? "Turn Off Captions" : "Turn On Captions"}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Record */}
                    <div className="relative hidden md:flex items-center justify-center">
                        <button aria-label="Record" onClick={toggleRecording}
                            onMouseEnter={() => setHoveredButton('record')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <Circle size={18} className={clsx(isRecording && "fill-white")} />
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'record' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    {isRecording ? "Stop Recording" : "Start Recording"}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Noise Suppression */}
                    <div className="relative hidden md:flex items-center justify-center">
                        <button aria-label="Noise Suppression" onClick={toggleNoiseSuppression}
                            onMouseEnter={() => setHoveredButton('noise')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", noiseSuppression ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-[pulse_3s_infinite]" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <AlertCircle size={18} />
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'noise' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    {noiseSuppression ? "Disable Noise Suppression" : "Enable Noise Suppression"}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Device Selector */}
                    <div className="relative hidden md:flex items-center justify-center">
                        <button aria-label="Device Settings" onClick={() => setShowDeviceSelector(!showDeviceSelector)}
                            onMouseEnter={() => setHoveredButton('devices')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showDeviceSelector ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <Settings size={18} />
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'devices' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    Device Settings
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Desktop reactions */}
                    <div className="relative flex-shrink-0 hidden md:block">
                        <div className="relative flex items-center justify-center">
                            <button aria-label="React" onClick={() => setShowReactionTray(!showReactionTray)}
                                onMouseEnter={() => setHoveredButton('react')}
                                onMouseLeave={() => setHoveredButton(null)}
                                className={clsx("p-3.5 rounded-2xl transition-all duration-300 group", showReactionTray ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 hover:bg-white/20 text-white")}
                            >
                                <SmilePlus size={18} />
                            </button>
                            <AnimatePresence>
                                {hoveredButton === 'react' && (
                                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                        className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                        Send Reaction
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <AnimatePresence>
                            {showReactionTray && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#1a1b1e]/95 border border-white/10 rounded-2xl p-2 flex gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50">
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

                    {/* Desktop sidebar buttons: Notes */}
                    <div className="relative hidden md:flex items-center justify-center">
                        <button aria-label="Notes" onClick={() => setShowSidebar(showSidebar === 'notes' ? null : 'notes')}
                            onMouseEnter={() => setHoveredButton('notes')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'notes' ? "bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <FileText size={18} />
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'notes' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    Shared Notes
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Effects */}
                    <div className="relative hidden md:flex items-center justify-center">
                        <button aria-label="Effects" onClick={() => setShowSidebar(showSidebar === 'effects' ? null : 'effects')}
                            onMouseEnter={() => setHoveredButton('effects')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'effects' ? "bg-purple-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <Sparkles size={18} />
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'effects' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    Visual Effects
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Files */}
                    <div className="relative hidden md:flex items-center justify-center">
                        <button aria-label="Files" onClick={() => setShowSidebar(showSidebar === 'files' ? null : 'files')}
                            onMouseEnter={() => setHoveredButton('files')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'files' ? "bg-amber-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <Paperclip size={18} />
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'files' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    Shared Files
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Polls */}
                    <div className="relative hidden md:flex items-center justify-center">
                        <button aria-label="Polls" onClick={() => setShowSidebar(showSidebar === 'polls' ? null : 'polls')}
                            onMouseEnter={() => setHoveredButton('polls')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'polls' ? "bg-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <BarChart3 size={18} />
                            {hasActivePolls && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse" />}
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'polls' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    Polls & Q&A
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Both mobile+desktop: People & Chat */}
                    <div className="relative flex items-center justify-center">
                        <button aria-label="People" onClick={() => setShowSidebar(showSidebar === 'people' ? null : 'people')}
                            onMouseEnter={() => setHoveredButton('people')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'people' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <Users size={16} className="md:hidden" />
                            <Users size={18} className="hidden md:block" />
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 border-2 border-[#1a1b1e]">
                                {1 + remotePeersCount}
                            </span>
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'people' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    Participants
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative flex items-center justify-center">
                        <button aria-label="Chat" onClick={() => setShowSidebar(showSidebar === 'chat' ? null : 'chat')}
                            onMouseEnter={() => setHoveredButton('chat')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'chat' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                            <MessageSquare size={16} className="md:hidden" />
                            <MessageSquare size={18} className="hidden md:block" />
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'chat' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none z-50">
                                    In-Call Chat
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mobile More button */}
                    <button id="btn-more" aria-label="More options" onClick={() => setShowMobileMore(!showMobileMore)} className={clsx("md:hidden p-2.5 rounded-2xl transition-all duration-300 flex-shrink-0 relative group", showMobileMore ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                        <MoreHorizontal size={16} />
                        {handRaised && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-[#1a1b1e]" />}
                    </button>

                    <div className="w-px h-5 md:h-7 bg-white/20 mx-0.5 md:mx-2 flex-shrink-0" />

                    {/* Leave Button */}
                    <div className="relative flex items-center justify-center">
                        <button id="btn-leave" aria-label="Leave meeting" onClick={handleLeaveMeeting}
                            onMouseEnter={() => setHoveredButton('leave')}
                            onMouseLeave={() => setHoveredButton(null)}
                            className="px-2.5 md:px-5 py-2 md:py-3.5 rounded-2xl bg-red-500 text-white font-bold transition-all duration-300 hover:bg-red-600 hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-1 md:gap-2 flex-shrink-0 text-xs md:text-sm"
                        >
                            <PhoneOff size={14} className="md:hidden" />
                            <PhoneOff size={18} className="hidden md:block" />
                            <span className="hidden sm:inline">Leave</span>
                        </button>
                        <AnimatePresence>
                            {hoveredButton === 'leave' && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 bg-[#111214]/90 border border-red-500/20 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-red-400 whitespace-nowrap backdrop-blur-md shadow-[0_4px_12px_rgba(239,68,68,0.2)] pointer-events-none z-50">
                                    Leave Meeting
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
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
