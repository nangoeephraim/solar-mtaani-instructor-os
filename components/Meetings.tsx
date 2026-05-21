import { useMeetingEngine } from './meetings/useMeetingEngine';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Settings, Maximize, Minimize, Users, MessageSquare, Sparkles, LayoutGrid, AlertCircle, Copy, CheckCircle2, PhoneOff, Share2, Circle, Hand, Captions, Presentation, PictureInPicture2, Wifi, WifiOff, SmilePlus, X, Clock, FileText, Paperclip, Upload, Download, File, MoreHorizontal, ChevronUp, Image, BarChart3, MessageCircleQuestion, Plus, Check, ThumbsUp, Trash2, SwitchCamera } from 'lucide-react';
import clsx from 'clsx';
import UserAvatar from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Room, RoomEvent, VideoPresets, LocalParticipant, RemoteParticipant, RemoteTrackPublication, RemoteTrack, Track } from 'livekit-client';
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';
import { KrispNoiseFilter } from '@livekit/krisp-noise-filter';
import MeetingHeader from './meetings/MeetingHeader';
import MeetingControls from './meetings/MeetingControls';
import MeetingGrid from './meetings/MeetingGrid';
import MeetingSidebar from './meetings/MeetingSidebar';
import type {
    MeetingMessage, MeetingFile, FloatingReaction,
    MeetingPoll, MeetingQuestion, RemotePeer,
    SpeechRecognitionEvent, SpeechRecognitionErrorEvent,
    SidebarTab, BlurLevel, MeetingTheme, MeetingWallpaper,
} from './meetings/types';
import { ICE_SERVERS, REACTION_EMOJIS, getTimeGreeting } from './meetings/types';
import MeetingTimer from './meetings/MeetingTimer';

// ICE_SERVERS, REACTION_EMOJIS, getTimeGreeting are imported from './meetings/types'

export default function Meetings({ pendingMeetCode }: { pendingMeetCode?: string }) {
    const engine = useMeetingEngine(pendingMeetCode);
    const {
        activeSpeaker, addToast, analyserRef, audioAnimRef, audioContextRef, audioEnabled, audioLevel,
        availableDevices, backgroundBlur, blurFilterRef, broadcastMediaState, captionInterim, captionSpeaker,
        captionText, captionTimeoutRef, captionsEnabled, chatChannelRef, chatEndRef, chatFileInputRef,
        chatInput, chatMessages, compositeAnimRef, compositeCanvasRef, connectionQuality, containerRef,
        copied, copyMeetingLink, createPeerConnection, dbMeetingIdRef, fileInputRef, floatingReactions,
        generateMeetingId, handRaised, handleChatFileAttach, handleJoinMeeting, handleJoinWithPreviewCleanup,
        handleLeaveMeeting, handleScreenShare, handleSendChat, hasError, inMeeting, isFullscreen,
        isRecording, isUploading, krispFilterRef, lastConsumedCode, layout, liveKitRoomRef, localPeerId,
        localScreenStreamRef, localStreamRef, lowLightMode, mediaRecorderRef2, meetingFiles, meetingId,
        newPollOptions, newPollQuestion, newQuestionText, noiseSuppression, notesContent, polls, pollsTab,
        previewStream, previewVideoRef, questions, recognitionRef, recordedChunksRef, remoteAudioLevels,
        remotePeers, remotePeersRef, screenRef, screenShared, screenStream, selectedAudioIn, selectedBg,
        selectedVideoIn, setActiveSpeaker, setAudioEnabled, setAudioLevel, setAvailableDevices, setBackgroundBlur,
        setCaptionInterim, setCaptionSpeaker, setCaptionText, setCaptionsEnabled, setChatInput, setChatMessages,
        setConnectionQuality, setCopied, setFloatingReactions, setHandRaised, setHasError, setInMeeting,
        setIsFullscreen, setIsRecording, setIsUploading, setLayout, setLowLightMode, setMeetingFiles,
        setMeetingId, setNewPollOptions, setNewPollQuestion, setNewQuestionText, setNoiseSuppression,
        setNotesContent, setPolls, setPollsTab, setPreviewStream, setQuestions, setRemoteAudioLevels,
        setRemotePeers, setScreenShared, setScreenStream, setSelectedAudioIn, setSelectedBg, setSelectedVideoIn,
        setShowDeviceSelector, setShowMobileMore, setShowPollCreator, setShowReactionTray, setShowSidebar,
        setSpeechSupported, setStream, setStudioLighting, setToasts, setValidatedMeeting, setVideoEnabled,
        setupSignaling, shareMeetingToChat, showDeviceSelector, showMobileMore, showPollCreator, showReactionTray,
        showSidebar, signalingChannelRef, speechSupported, stream, studioLighting, toasts, toggleFullscreen,
        toggleHandRaise, togglePiP, toggleRecording, updatePeer, userAvatar, userName, validateMeetingCode,
        validatedMeeting, videoEnabled, videoRef, virtualBgFilterRef,
        // Engine-exposed handlers (split to sub-modules)
        toggleBackgroundBlur, toggleStudioLighting, toggleNoiseSuppression,
        handleFileUpload, getFileIcon, formatFileSize, createPoll, endPoll, votePoll,
        submitQuestion, upvoteQuestion, markQuestionAnswered, sendReaction, switchDevice, handleFlipCamera
    } = engine;

    const { user } = useAuth();

    // ─── Premium Customization State ───
    const [meetingTheme, setMeetingTheme] = useState<MeetingTheme>('classic');
    const [meetingWallpaper, setMeetingWallpaper] = useState<MeetingWallpaper>('classic');


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
                        <div className="relative overflow-hidden glass-card shadow-elevation-3">
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
                        className="flex flex-col gap-3 w-full max-w-md"
                    >
                        {/* Validated meeting banner — shown when coming from a shared link or broadcast */}
                        {validatedMeeting && meetingId === validatedMeeting.code && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-1"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                        <Users size={20} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm font-google">{validatedMeeting.title}</p>
                                        <p className="text-white/50 text-xs">Hosted by {validatedMeeting.hostName} • Active now</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Live</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {meetingId ? (
                            <button 
                                onClick={handleJoinWithPreviewCleanup}
                                className="w-full px-6 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl transition-all shadow-[0_4px_24px_rgba(22,163,74,0.3)] hover:shadow-[0_4px_32px_rgba(22,163,74,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                            >
                                <Video size={20} />
                                {validatedMeeting ? 'Join Now' : `Join Meeting ${meetingId}`}
                            </button>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-3">
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
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-4 pr-16 text-sm font-google outline-none input-glow transition-all text-white placeholder:text-white/30"
                                    />
                                    <button 
                                        onClick={() => meetingId && handleJoinWithPreviewCleanup()}
                                        disabled={!meetingId}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-white/10 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-600"
                                    >
                                        Join
                                    </button>
                                </div>
                            </div>
                        )}
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

            {/* Dynamic Wallpaper Backdrop */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {meetingWallpaper === 'classic' && (
                    <>
                        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/6 blur-[80px]" />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/6 blur-[80px]" />
                    </>
                )}
                {meetingWallpaper === 'glow' && (
                    <>
                        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
                        <div className="absolute bottom-[15%] right-[10%] w-[35%] h-[35%] rounded-full bg-cyan-500/10 blur-[100px]" />
                        <div className="absolute top-[50%] left-[40%] w-[25%] h-[25%] rounded-full bg-pink-500/8 blur-[80px]" />
                    </>
                )}
                {meetingWallpaper === 'mesh' && (
                    <>
                        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-blue-600/8 blur-[100px]" />
                        <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/8 blur-[100px]" />
                    </>
                )}
                {meetingWallpaper === 'starfield' && (
                    <>
                        <div className="absolute inset-0" style={{ background: 'radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.3) 50%, transparent 100%), radial-gradient(1px 1px at 25% 60%, rgba(255,255,255,0.25) 50%, transparent 100%), radial-gradient(1px 1px at 45% 30%, rgba(255,255,255,0.2) 50%, transparent 100%), radial-gradient(1px 1px at 65% 75%, rgba(255,255,255,0.3) 50%, transparent 100%), radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.15) 50%, transparent 100%), radial-gradient(1px 1px at 90% 50%, rgba(255,255,255,0.2) 50%, transparent 100%), radial-gradient(1px 1px at 15% 80%, rgba(255,255,255,0.25) 50%, transparent 100%), radial-gradient(1px 1px at 55% 10%, rgba(255,255,255,0.15) 50%, transparent 100%), radial-gradient(1px 1px at 35% 90%, rgba(255,255,255,0.2) 50%, transparent 100%), radial-gradient(1px 1px at 75% 45%, rgba(255,255,255,0.15) 50%, transparent 100%)' }} />
                        <div className="absolute top-[20%] left-[30%] w-[50%] h-[50%] rounded-full bg-indigo-900/15 blur-[120px]" />
                        <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[30%] rounded-full bg-violet-900/10 blur-[80px]" />
                    </>
                )}
                {meetingWallpaper === 'boardroom' && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/10 via-stone-950/20 to-slate-950/15" />
                        <div className="absolute top-[15%] left-[20%] w-[60%] h-[40%] rounded-full bg-amber-900/8 blur-[120px]" />
                        <div className="absolute bottom-[20%] right-[15%] w-[40%] h-[40%] rounded-full bg-stone-700/6 blur-[100px]" />
                    </>
                )}
                {meetingWallpaper === 'neon' && (
                    <>
                        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] rounded-full bg-fuchsia-500/10 blur-[100px] animate-[pulse_8s_ease-in-out_infinite]" />
                        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
                        <div className="absolute top-[40%] left-[50%] w-[25%] h-[25%] rounded-full bg-yellow-500/5 blur-[80px] animate-[pulse_6s_ease-in-out_infinite]" />
                    </>
                )}
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
                
                {/* Header — extracted to MeetingHeader component */}
                <MeetingHeader
                    inMeeting={inMeeting}
                    isRecording={isRecording}
                    remotePeersCount={remotePeers.size}
                    meetingId={meetingId}
                    copied={copied}
                    connectionQuality={connectionQuality}
                    layout={layout}
                    isFullscreen={isFullscreen}
                    copyMeetingLink={copyMeetingLink}
                    shareMeetingToChat={shareMeetingToChat}
                    togglePiP={togglePiP}
                    setLayout={setLayout}
                    toggleFullscreen={toggleFullscreen}
                />

                {/* Presenting Banner */}
                {screenShared && (
                    <div className="absolute top-[52px] md:top-[60px] left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-blue-600/90 border border-blue-400/30 rounded-b-xl px-4 py-1.5 flex items-center gap-2 shadow-lg">
                            <MonitorUp size={14} className="text-white" />
                            <span className="text-xs font-bold text-white">You are presenting</span>
                            <button onClick={handleScreenShare} className="ml-2 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors">
                                Stop
                            </button>
                        </div>
                    </div>
                )}

                {/* Video Grid — extracted to MeetingGrid component */}
                <MeetingGrid
                    userName={userName}
                    userAvatar={userAvatar}
                    videoEnabled={videoEnabled}
                    audioEnabled={audioEnabled}
                    audioLevel={audioLevel}
                    videoRef={videoRef}
                    screenRef={screenRef}
                    localStream={stream}
                    setActiveSpeaker={setActiveSpeaker}
                    screenShared={screenShared}
                    handRaised={handRaised}
                    activeSpeaker={activeSpeaker}
                    remotePeers={remotePeers}
                    remoteAudioLevels={remoteAudioLevels}
                    selectedBg={selectedBg}
                    backgroundBlur={backgroundBlur}
                    lowLightMode={lowLightMode}
                    studioLighting={studioLighting}
                    meetingTheme={meetingTheme}
                />

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
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{captionSpeaker}</span>
                                        <p className="text-white font-medium text-base leading-relaxed">
                                            {captionText && <span>{captionText} </span>}
                                            {captionInterim && <span className="text-white/50 italic">{captionInterim}</span>}
                                        </p>
                                    </div>
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

                {/* Controls — extracted to MeetingControls component */}
                <MeetingControls
                    audioEnabled={audioEnabled}
                    setAudioEnabled={setAudioEnabled}
                    videoEnabled={videoEnabled}
                    setVideoEnabled={setVideoEnabled}
                    screenShared={screenShared}
                    handRaised={handRaised}
                    isRecording={isRecording}
                    captionsEnabled={captionsEnabled}
                    setCaptionsEnabled={setCaptionsEnabled}
                    noiseSuppression={noiseSuppression}
                    showMobileMore={showMobileMore}
                    setShowMobileMore={setShowMobileMore}
                    showSidebar={showSidebar}
                    setShowSidebar={setShowSidebar}
                    showReactionTray={showReactionTray}
                    setShowReactionTray={setShowReactionTray}
                    showDeviceSelector={showDeviceSelector}
                    setShowDeviceSelector={setShowDeviceSelector}
                    remotePeersCount={remotePeers.size}
                    hasActivePolls={polls.some(p => p.isActive)}
                    liveKitRoomRef={liveKitRoomRef}
                    handleLeaveMeeting={handleLeaveMeeting}
                    handleScreenShare={handleScreenShare}
                    handleFlipCamera={handleFlipCamera}
                    toggleRecording={toggleRecording}
                    toggleHandRaise={toggleHandRaise}
                    toggleNoiseSuppression={toggleNoiseSuppression}
                    sendReaction={sendReaction}
                    shareMeetingToChat={shareMeetingToChat}
                    copyMeetingLink={copyMeetingLink}
                />

            </div>

            {/* Device Selector Modal */}
            <AnimatePresence>
                {showDeviceSelector && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/50"
                            onClick={() => setShowDeviceSelector(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 glass-card p-5 shadow-elevation-3 w-[90%] max-w-md"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Settings size={16} className="text-blue-400" /> Device Settings
                                </h3>
                                <button onClick={() => setShowDeviceSelector(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Microphone */}
                                <div>
                                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Mic size={12} /> Microphone
                                    </label>
                                    <select
                                        value={selectedAudioIn}
                                        onChange={(e) => switchDevice('audio', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none input-glow transition-all appearance-none cursor-pointer"
                                    >
                                        {availableDevices.audioin.map(d => (
                                            <option key={d.deviceId} value={d.deviceId} className="bg-[#1a1b1e]">
                                                {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Camera */}
                                <div>
                                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Video size={12} /> Camera
                                    </label>
                                    <select
                                        value={selectedVideoIn}
                                        onChange={(e) => switchDevice('video', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none input-glow transition-all appearance-none cursor-pointer"
                                    >
                                        {availableDevices.videoin.map(d => (
                                            <option key={d.deviceId} value={d.deviceId} className="bg-[#1a1b1e]">
                                                {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Noise Suppression Toggle */}
                                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                                    <span className="text-xs text-white font-medium flex items-center gap-2">
                                        <AlertCircle size={12} className="text-emerald-400" /> Noise Suppression
                                    </span>
                                    <button
                                        onClick={toggleNoiseSuppression}
                                        className={clsx(
                                            "w-10 h-5 rounded-full transition-colors relative",
                                            noiseSuppression ? "bg-emerald-500" : "bg-white/20"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform",
                                            noiseSuppression ? "translate-x-5" : "translate-x-0.5"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Sidebar (Settings/Chat/People) */}
            <MeetingSidebar
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
                setBackgroundBlur={setBackgroundBlur}
                backgroundBlur={backgroundBlur}
                addToast={addToast}
                setSelectedBg={setSelectedBg}
                selectedBg={selectedBg}
                lowLightMode={lowLightMode}
                setLowLightMode={setLowLightMode}
                studioLighting={studioLighting}
                setStudioLighting={setStudioLighting}
                notesContent={notesContent}
                setNotesContent={setNotesContent}
                fileInputRef={fileInputRef}
                isUploading={isUploading}
                handleFileUpload={handleFileUpload}
                meetingFiles={meetingFiles}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
                pollsTab={pollsTab}
                setPollsTab={setPollsTab}
                polls={polls}
                questions={questions}
                showPollCreator={showPollCreator}
                setShowPollCreator={setShowPollCreator}
                newPollQuestion={newPollQuestion}
                setNewPollQuestion={setNewPollQuestion}
                newPollOptions={newPollOptions}
                setNewPollOptions={setNewPollOptions}
                createPoll={createPoll}
                userName={userName}
                endPoll={endPoll}
                votePoll={votePoll}
                newQuestionText={newQuestionText}
                setNewQuestionText={setNewQuestionText}
                submitQuestion={submitQuestion}
                upvoteQuestion={upvoteQuestion}
                markQuestionAnswered={markQuestionAnswered}
                audioEnabled={audioEnabled}
                audioLevel={audioLevel}
                userAvatar={userAvatar}
                user={user}
                videoEnabled={videoEnabled}
                copyMeetingLink={copyMeetingLink}
                copied={copied}
                chatMessages={chatMessages}
                chatEndRef={chatEndRef}
                handleSendChat={handleSendChat}
                chatFileInputRef={chatFileInputRef}
                handleChatFileAttach={handleChatFileAttach}
                chatInput={chatInput}
                setChatInput={setChatInput}
                meetingTheme={meetingTheme}
                setMeetingTheme={setMeetingTheme}
                meetingWallpaper={meetingWallpaper}
                setMeetingWallpaper={setMeetingWallpaper}
            />
        </div>
    );
}
