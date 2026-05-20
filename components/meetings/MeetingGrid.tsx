// ─── PRISM Meetings — Video Grid Layout ───
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicOff, VideoOff, MonitorUp, Hand, Wifi } from 'lucide-react';
import clsx from 'clsx';
import { RemotePeer } from './types';
import UserAvatar from '../UserAvatar';
import { getSharedAudioContext } from './useMeetingEngine';

interface MeetingGridProps {
    // Local user
    userName: string;
    userAvatar: string | null;
    videoEnabled: boolean;
    audioEnabled: boolean;
    audioLevel: number;
    videoRef: React.RefObject<HTMLVideoElement>;
    screenRef: React.RefObject<HTMLVideoElement>;
    localStream: MediaStream | null;
    setActiveSpeaker: React.Dispatch<React.SetStateAction<string | null>>;
    
    // State
    screenShared: boolean;
    handRaised: boolean;
    activeSpeaker: string | null;
    remotePeers: Map<string, RemotePeer>;
    remoteAudioLevels: Map<string, number>;
    
    // Visual Effects
    selectedBg: number | null;
    backgroundBlur: string;
    lowLightMode: boolean;
    studioLighting: boolean;
}

// ─── LOCAL PARTICIPANT TILE (MEMOIZED & SELF-ANALYZING) ───
const LocalTile: React.FC<{
    userName: string;
    userAvatar: string | null;
    videoEnabled: boolean;
    audioEnabled: boolean;
    videoRef: React.RefObject<HTMLVideoElement>;
    localStream: MediaStream | null;
    setActiveSpeaker: React.Dispatch<React.SetStateAction<string | null>>;
    activeSpeaker: string | null;
    handRaised: boolean;
    selectedBg: number | null;
    backgroundBlur: string;
    lowLightMode: boolean;
    studioLighting: boolean;
    isSpotlight: boolean;
}> = React.memo(({
    userName, userAvatar, videoEnabled, audioEnabled, videoRef, localStream,
    setActiveSpeaker, activeSpeaker, handRaised, selectedBg, backgroundBlur,
    lowLightMode, studioLighting, isSpotlight
}) => {
    const voiceRingRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!audioEnabled || !localStream) {
            if (voiceRingRef.current) {
                voiceRingRef.current.style.transform = 'scale(1)';
                voiceRingRef.current.style.opacity = '0';
            }
            if (containerRef.current) {
                containerRef.current.style.borderColor = 'rgba(255,255,255,0.05)';
                containerRef.current.style.boxShadow = 'none';
            }
            return;
        }

        const audioCtx = getSharedAudioContext();
        if (!audioCtx) return;

        let source: MediaStreamAudioSourceNode | null = null;
        let analyser: AnalyserNode | null = null;
        let animId: number = 0;

        try {
            source = audioCtx.createMediaStreamSource(localStream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.6;
            source.connect(analyser);

            const dataArr = new Uint8Array(analyser.frequencyBinCount);
            let speakFrames = 0;
            let silenceFrames = 0;

            const tick = () => {
                if (!analyser) return;
                analyser.getByteFrequencyData(dataArr);
                const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
                const level = Math.min(avg / 80, 1);

                // Throttled UI manipulation directly via Ref for 60fps responsiveness
                if (voiceRingRef.current) {
                    voiceRingRef.current.style.transform = `scale(${1 + level * 0.25})`;
                    voiceRingRef.current.style.opacity = level > 0.05 ? '0.85' : '0';
                }

                if (containerRef.current) {
                    if (level > 0.05) {
                        containerRef.current.style.borderColor = `rgba(59,130,246,${0.2 + level * 0.6})`;
                        containerRef.current.style.boxShadow = `0 0 ${15 + level * 25}px rgba(59,130,246,${0.1 + level * 0.3})`;
                    } else {
                        containerRef.current.style.borderColor = activeSpeaker === 'local' ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.05)';
                        containerRef.current.style.boxShadow = activeSpeaker === 'local' ? '0 0 15px rgba(59,130,246,0.15)' : 'none';
                    }
                }

                // Debounced active speaker switcher logic
                if (level > 0.08) {
                    silenceFrames = 0;
                    speakFrames++;
                    if (speakFrames > 8) { // speak for ~130ms
                        setActiveSpeaker(prev => (prev === 'local' ? prev : 'local'));
                    }
                } else {
                    speakFrames = 0;
                    silenceFrames++;
                    if (silenceFrames > 60) { // silent for ~1s
                        setActiveSpeaker(prev => (prev === 'local' ? null : prev));
                    }
                }

                animId = requestAnimationFrame(tick);
            };

            tick();
        } catch (err) {
            console.warn('[Audio] Local tile analysis error:', err);
        }

        return () => {
            if (animId) cancelAnimationFrame(animId);
            if (source) source.disconnect();
        };
    }, [audioEnabled, localStream, activeSpeaker, setActiveSpeaker]);

    const isSpeaking = activeSpeaker === 'local';

    return (
        <motion.div 
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={clsx(
                "relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#111214] flex items-center justify-center group min-h-0 border transition-all duration-300",
                isSpotlight ? "col-span-1 row-span-1 md:col-span-1 md:row-span-1" : "w-full h-full",
                isSpeaking ? "border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "border-white/5"
            )}
        >
            {/* Visual audio animation ring (pulsing border effect) */}
            <div 
                ref={voiceRingRef}
                className="absolute inset-0 border-2 border-blue-500/40 rounded-2xl md:rounded-3xl pointer-events-none opacity-0 scale-100 transition-opacity duration-150 z-10"
            />

            {/* Avatar Placeholder (displayed when video is disabled) */}
            <AnimatePresence>
                {!videoEnabled && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-[#111214] z-10"
                    >
                        <div className="w-16 h-16 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-2 md:mb-4 bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.1)] relative">
                            <UserAvatar name={userName} avatarUrl={userAvatar} size={88} rounded="full" className="w-12 h-12 md:w-[88px] md:h-[88px]" />
                        </div>
                        <p className="text-white/40 text-[10px] md:text-xs font-medium">{userName} (You)</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video track is ALWAYS mounted if localStream exists for smooth transitions */}
            {localStream && (
                <div className="relative w-full h-full">
                    {selectedBg !== null && (
                        <img 
                            src={`https://picsum.photos/seed/${selectedBg * 42}/1920/1080`}
                            alt="" 
                            className="absolute inset-0 w-full h-full object-cover z-0"
                        />
                    )}
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={clsx(
                            "w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 relative z-0",
                            (!videoEnabled) ? "opacity-0 pointer-events-none" : "opacity-100"
                        )}
                        style={{
                            filter: [
                                backgroundBlur === 'Light' ? 'blur(0px)' : backgroundBlur === 'Heavy' ? 'blur(0px)' : '',
                                lowLightMode ? 'brightness(1.3) contrast(1.05)' : '',
                                studioLighting ? 'contrast(1.15) saturate(1.1)' : '',
                            ].filter(Boolean).join(' ') || undefined,
                            mixBlendMode: selectedBg !== null ? 'normal' : undefined,
                        }}
                    />
                    {backgroundBlur !== 'None' && (
                        <div 
                            className="absolute inset-0 z-20 pointer-events-none rounded-2xl md:rounded-3xl"
                            style={{
                                boxShadow: backgroundBlur === 'Light' 
                                    ? 'inset 0 0 60px 30px rgba(0,0,0,0.3)' 
                                    : 'inset 0 0 100px 50px rgba(0,0,0,0.5)',
                            }}
                        />
                    )}
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2 md:p-4 flex justify-between items-end z-30">
                <div className="flex gap-1.5 items-center">
                    <div className="bg-black/60 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/10 flex items-center gap-1.5 md:gap-2">
                        <span className="text-[10px] md:text-xs font-bold font-google text-white/90">You</span>
                        {isSpeaking && (
                            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                Speaking
                            </span>
                        )}
                    </div>
                    {handRaised && (
                        <div className="bg-yellow-500/90 p-1 md:p-1.5 rounded-lg border border-yellow-400/20 animate-bounce">
                            <Hand size={12} className="text-white md:w-[14px] md:h-[14px]" />
                        </div>
                    )}
                </div>
                <div className="flex gap-1">
                    {!audioEnabled && <div className="bg-red-500/80 p-1 md:p-1.5 rounded-lg"><MicOff size={10} className="text-white md:w-3 md:h-3" /></div>}
                    {!videoEnabled && <div className="bg-red-500/80 p-1 md:p-1.5 rounded-lg"><VideoOff size={10} className="text-white md:w-3 md:h-3" /></div>}
                </div>
            </div>
        </motion.div>
    );
});

LocalTile.displayName = 'LocalTile';


// ─── REMOTE PARTICIPANT TILE (MEMOIZED & SELF-ANALYZING) ───
const RemoteTile: React.FC<{
    peer: RemotePeer;
    setActiveSpeaker: React.Dispatch<React.SetStateAction<string | null>>;
    activeSpeaker: string | null;
    isSpotlight: boolean;
}> = React.memo(({ peer, setActiveSpeaker, activeSpeaker, isSpotlight }) => {
    const voiceRingRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isConnecting = peer.pc.connectionState === 'new' || peer.pc.connectionState === 'connecting';
    const isSpeaking = activeSpeaker === peer.odei;

    useEffect(() => {
        if (!peer.audioEnabled || !peer.stream || isConnecting) {
            if (voiceRingRef.current) {
                voiceRingRef.current.style.transform = 'scale(1)';
                voiceRingRef.current.style.opacity = '0';
            }
            if (containerRef.current) {
                containerRef.current.style.borderColor = 'rgba(255,255,255,0.05)';
                containerRef.current.style.boxShadow = 'none';
            }
            return;
        }

        const audioCtx = getSharedAudioContext();
        if (!audioCtx) return;

        let source: MediaStreamAudioSourceNode | null = null;
        let analyser: AnalyserNode | null = null;
        let animId: number = 0;

        try {
            source = audioCtx.createMediaStreamSource(peer.stream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.6;
            source.connect(analyser);

            const dataArr = new Uint8Array(analyser.frequencyBinCount);
            let speakFrames = 0;
            let silenceFrames = 0;

            const tick = () => {
                if (!analyser) return;
                analyser.getByteFrequencyData(dataArr);
                const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
                const level = Math.min(avg / 80, 1);

                // Direct style mutations for high frame-rate rendering
                if (voiceRingRef.current) {
                    voiceRingRef.current.style.transform = `scale(${1 + level * 0.25})`;
                    voiceRingRef.current.style.opacity = level > 0.05 ? '0.85' : '0';
                }

                if (containerRef.current) {
                    if (level > 0.05) {
                        containerRef.current.style.borderColor = `rgba(34,197,94,${0.2 + level * 0.6})`;
                        containerRef.current.style.boxShadow = `0 0 ${15 + level * 25}px rgba(34,197,94,${0.1 + level * 0.3})`;
                    } else {
                        containerRef.current.style.borderColor = activeSpeaker === peer.odei ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.05)';
                        containerRef.current.style.boxShadow = activeSpeaker === peer.odei ? '0 0 15px rgba(34,197,94,0.15)' : 'none';
                    }
                }

                // Debounced active speaker switcher logic
                if (level > 0.08) {
                    silenceFrames = 0;
                    speakFrames++;
                    if (speakFrames > 8) {
                        setActiveSpeaker(prev => (prev === peer.odei ? prev : peer.odei));
                    }
                } else {
                    speakFrames = 0;
                    silenceFrames++;
                    if (silenceFrames > 60) {
                        setActiveSpeaker(prev => (prev === peer.odei ? null : prev));
                    }
                }

                animId = requestAnimationFrame(tick);
            };

            tick();
        } catch (err) {
            console.warn(`[Audio] Remote tile analysis error for ${peer.userName}:`, err);
        }

        return () => {
            if (animId) cancelAnimationFrame(animId);
            if (source) source.disconnect();
        };
    }, [peer.audioEnabled, peer.stream, peer.odei, activeSpeaker, setActiveSpeaker, isConnecting]);

    return (
        <motion.div 
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx(
                "relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#111214] flex items-center justify-center group min-h-0 border transition-all duration-300",
                isSpotlight ? "col-span-1 row-span-1 md:col-span-1 md:row-span-1" : "w-full h-full",
                isSpeaking ? "border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]" : "border-white/5"
            )}
        >
            {/* Visual audio animation ring (pulsing border effect) */}
            <div 
                ref={voiceRingRef}
                className="absolute inset-0 border-2 border-green-500/40 rounded-2xl md:rounded-3xl pointer-events-none opacity-0 scale-100 transition-opacity duration-150 z-10"
            />

            {/* Connecting Shimmer View */}
            <AnimatePresence>
                {isConnecting && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-[#111214] z-20"
                    >
                        <div className="w-16 h-16 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-2 md:mb-4 bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-white/10 relative overflow-hidden">
                            <UserAvatar name={peer.userName} avatarUrl={peer.avatarUrl} size={88} rounded="full" className="w-12 h-12 md:w-[88px] md:h-[88px]" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" style={{ transform: 'translateX(-100%)' }} />
                        </div>
                        <p className="text-white/40 text-[10px] md:text-xs font-medium">{peer.userName}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                            <span className="text-[9px] text-blue-400/70 font-medium">Connecting...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Avatar Placeholder (displayed when video is disabled, but below the z-index of connecting overlay) */}
            <AnimatePresence>
                {!peer.videoEnabled && !isConnecting && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-[#111214] z-10"
                    >
                        <div className="w-16 h-16 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-2 md:mb-4 bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-white/10 relative">
                            <UserAvatar name={peer.userName} avatarUrl={peer.avatarUrl} size={88} rounded="full" className="w-12 h-12 md:w-[88px] md:h-[88px]" />
                        </div>
                        <p className="text-white/40 text-[10px] md:text-xs font-medium">{peer.userName}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The video element is ALWAYS mounted if peer.stream exists, ensuring audio is played */}
            {peer.stream && (
                <video 
                    autoPlay playsInline 
                    className={clsx(
                        "w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 absolute inset-0 z-0",
                        (!peer.videoEnabled || isConnecting) ? "opacity-0 pointer-events-none" : "opacity-100"
                    )}
                    ref={el => { if (el && el.srcObject !== peer.stream) el.srcObject = peer.stream; }}
                />
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2 md:p-4 flex justify-between items-end z-30">
                <div className="flex gap-1.5 items-center">
                    <div className="bg-black/60 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/10 flex items-center gap-1.5 md:gap-2">
                        <span className="text-[10px] md:text-xs font-bold font-google text-white/90">{peer.userName}</span>
                        {isSpeaking && (
                            <span className="text-[8px] font-bold text-green-400 uppercase tracking-wider animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                                Speaking
                            </span>
                        )}
                        <Wifi size={10} className="text-green-400" />
                    </div>
                    {peer.handRaised && (
                        <div className="bg-yellow-500/90 p-1 md:p-1.5 rounded-lg border border-yellow-400/20 animate-bounce">
                            <Hand size={12} className="text-white md:w-[14px] md:h-[14px]" />
                        </div>
                    )}
                </div>
                <div className="flex gap-1">
                    {!peer.audioEnabled && <div className="bg-red-500/80 p-1 md:p-1.5 rounded-lg"><MicOff size={10} className="text-white md:w-3 md:h-3" /></div>}
                    {!peer.videoEnabled && <div className="bg-red-500/80 p-1 md:p-1.5 rounded-lg"><VideoOff size={10} className="text-white md:w-3 md:h-3" /></div>}
                </div>
            </div>
        </motion.div>
    );
});

RemoteTile.displayName = 'RemoteTile';


// ─── MAIN MEETING GRID ASSEMBLY ───
const MeetingGrid: React.FC<MeetingGridProps> = ({
    userName, userAvatar, videoEnabled, audioEnabled, audioLevel,
    videoRef, screenRef, localStream, setActiveSpeaker, screenShared,
    handRaised, activeSpeaker, remotePeers, selectedBg, backgroundBlur,
    lowLightMode, studioLighting
}) => {
    const peersList = Array.from(remotePeers.values());
    const totalCount = 1 + peersList.length;
    
    const anyRemoteScreen = peersList.find(p => p.screenStream !== null);
    const isSpotlight = screenShared || !!anyRemoteScreen;
    
    let gridCols = "grid-cols-1";
    if (!isSpotlight) {
        if (totalCount === 2) gridCols = "grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
        else if (totalCount <= 4) gridCols = "grid-cols-2 grid-rows-2";
        else if (totalCount <= 6) gridCols = "grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2";
        else if (totalCount <= 9) gridCols = "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 grid-rows-auto md:grid-rows-3";
        else gridCols = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 grid-rows-auto";
    }

    return (
        <div className="flex-1 flex items-center justify-center p-2 md:p-6 pt-14 md:pt-20 overflow-hidden"
             style={{ paddingBottom: 'calc(max(6rem, env(safe-area-inset-bottom, 0px) + 5rem))' }}>
            <div className={clsx(
                "w-full h-full grid gap-2 md:gap-4 max-w-7xl mx-auto overflow-hidden",
                !isSpotlight && totalCount > 6 ? "overflow-y-auto custom-scrollbar auto-rows-[minmax(180px,1fr)] md:auto-rows-fr" : "auto-rows-fr",
                isSpotlight 
                    ? "grid-rows-[minmax(0,2fr)_minmax(0,1fr)] md:grid-cols-3 md:grid-rows-3"
                    : gridCols
            )}>
                {/* Spotlight Screen Share view */}
                {isSpotlight && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="col-span-1 row-span-1 md:col-span-2 md:row-span-3 relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-[#131416] border border-white/5 flex items-center justify-center"
                    >
                        {screenShared ? (
                            <video ref={screenRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                        ) : anyRemoteScreen ? (
                            <video 
                                autoPlay playsInline 
                                className="w-full h-full object-contain"
                                ref={el => { if (el && el.srcObject !== anyRemoteScreen.screenStream) el.srcObject = anyRemoteScreen.screenStream; }} 
                            />
                        ) : null}
                        <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-blue-500/90 px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-blue-400/20 flex items-center gap-1.5 md:gap-2.5 shadow-lg">
                            <MonitorUp size={16} />
                            <span className="text-[10px] md:text-sm font-bold font-google">
                                {screenShared ? 'You are sharing screen' : `${anyRemoteScreen?.userName} is sharing screen`}
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* Local Participant Tile */}
                <LocalTile 
                    userName={userName}
                    userAvatar={userAvatar}
                    videoEnabled={videoEnabled}
                    audioEnabled={audioEnabled}
                    videoRef={videoRef}
                    localStream={localStream}
                    setActiveSpeaker={setActiveSpeaker}
                    activeSpeaker={activeSpeaker}
                    handRaised={handRaised}
                    selectedBg={selectedBg}
                    backgroundBlur={backgroundBlur}
                    lowLightMode={lowLightMode}
                    studioLighting={studioLighting}
                    isSpotlight={isSpotlight}
                />

                {/* Remote Participants Tiles */}
                {peersList.map((peer) => (
                    <RemoteTile 
                        key={peer.odei}
                        peer={peer}
                        setActiveSpeaker={setActiveSpeaker}
                        activeSpeaker={activeSpeaker}
                        isSpotlight={isSpotlight}
                    />
                ))}
            </div>
        </div>
    );
};

export default MeetingGrid;
