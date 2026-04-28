import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mic, MicOff, Video, VideoOff, MonitorUp, Settings, Maximize, 
    Users, MessageSquare, Sparkles, AlertCircle, Copy, CheckCircle2, 
    PhoneOff, Share2, Circle, Hand, Captions, Presentation, 
    MoreVertical, Pin, PinOff, Volume2, Info, ChevronUp, Grip, X, ShieldAlert
} from 'lucide-react';
import clsx from 'clsx';
import UserAvatar from './UserAvatar';
import { supabase } from '../services/supabase';

interface MeetingMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: Date;
    isSelf: boolean;
}

interface Participant {
    id: string;
    name: string;
    isMuted: boolean;
    isVideoOff: boolean;
    isSpeaking: boolean;
    isHandRaised: boolean;
    avatarUrl?: string;
    stream?: MediaStream | null;
}

const MOCK_PARTICIPANTS: Participant[] = [
    { id: 'p1', name: 'Sarah Connor', isMuted: false, isVideoOff: false, isSpeaking: false, isHandRaised: false, avatarUrl: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 'p2', name: 'Dr. John Smith', isMuted: true, isVideoOff: true, isSpeaking: false, isHandRaised: true, avatarUrl: 'https://i.pravatar.cc/150?u=john' },
    { id: 'p3', name: 'Emily Davis', isMuted: true, isVideoOff: false, isSpeaking: false, isHandRaised: false, avatarUrl: 'https://i.pravatar.cc/150?u=emily' },
];

const RemoteVideo = ({ stream }: { stream: MediaStream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);
    return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />;
};

export default function Meetings({ initialMeetingId, currentUser }: { initialMeetingId?: string, currentUser?: any }) {
    const myParticipantId = useRef(currentUser?.id || Math.random().toString(36).substring(2, 9));
    const channelRef = useRef<any>(null);
    const peersRef = useRef<Record<string, RTCPeerConnection>>({});
    const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
    
    // ICE Servers
    const ICE_SERVERS = useMemo(() => ({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    }), []);
    
    // Media States
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenShared, setScreenShared] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const streamRef = useRef(stream);
    useEffect(() => { streamRef.current = stream; }, [stream]);
    
    // Meeting States
    const [inMeeting, setInMeeting] = useState(false);
    const [meetingId, setMeetingId] = useState(initialMeetingId || '');
    const [isJoining, setIsJoining] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);
    const [layout, setLayout] = useState<'grid' | 'spotlight'>('grid');
    const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
    
    // Feature States
    const [isRecording, setIsRecording] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [captionsEnabled, setCaptionsEnabled] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Sidebar States
    const [showSidebar, setShowSidebar] = useState<'chat' | 'people' | 'effects' | 'whiteboard' | 'info' | null>(null);
    const [activeBackground, setActiveBackground] = useState<string>('none');

    // Dynamic Captions State
    const [currentCaption, setCurrentCaption] = useState<{name: string, text: string} | null>(null);
    
    // Chat States
    const [chatMessages, setChatMessages] = useState<MeetingMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Mock Participants State
    const [participants, setParticipants] = useState<Participant[]>([]);
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const screenRef = useRef<HTMLVideoElement>(null);
    const lobbyVideoRef = useRef<HTMLVideoElement>(null);

    // Initial Setup: Get camera for lobby
    useEffect(() => {
        let activeStream: MediaStream | null = null;
        const getLobbyMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                activeStream = mediaStream;
                setHasError(null);
            } catch (err) {
                console.warn("Failed to get local stream for lobby", err);
                setVideoEnabled(false);
                setAudioEnabled(false);
            }
        };
        getLobbyMedia();
        
        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    // Apply media toggles to stream
    useEffect(() => {
        if (stream) {
            stream.getAudioTracks().forEach(track => { track.enabled = audioEnabled; });
            stream.getVideoTracks().forEach(track => { track.enabled = videoEnabled; });
        }
    }, [audioEnabled, videoEnabled, stream]);

    // Attach stream to video elements
    useEffect(() => {
        if (inMeeting && localVideoRef.current && stream) {
            localVideoRef.current.srcObject = stream;
        }
        if (!inMeeting && lobbyVideoRef.current && stream) {
            lobbyVideoRef.current.srcObject = stream;
        }
    }, [stream, inMeeting]);

    // Attach screen stream
    useEffect(() => {
        if (screenRef.current && screenStream) {
            screenRef.current.srcObject = screenStream;
        }
    }, [screenStream]);

    // Supabase Realtime Presence & WebRTC Mesh for Multiplayer Meetings
    useEffect(() => {
        if (!inMeeting || !meetingId) return;

        const myName = currentUser?.name || currentUser?.user_metadata?.full_name || 'Instructor';
        const channel = supabase.channel(`meeting-${meetingId}`, {
            config: {
                presence: {
                    key: myParticipantId.current,
                },
            },
        });
        channelRef.current = channel;

        const createPeerConnection = (targetId: string) => {
            const pc = new RTCPeerConnection(ICE_SERVERS);
            peersRef.current[targetId] = pc;

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    pc.addTrack(track, streamRef.current!);
                });
            }

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    channel.send({
                        type: 'broadcast',
                        event: 'webrtc',
                        payload: {
                            type: 'ice-candidate',
                            senderId: myParticipantId.current,
                            targetId,
                            candidate: event.candidate
                        }
                    });
                }
            };

            pc.ontrack = (event) => {
                setRemoteStreams(prev => ({ ...prev, [targetId]: event.streams[0] }));
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    setRemoteStreams(prev => {
                        const newStreams = { ...prev };
                        delete newStreams[targetId];
                        return newStreams;
                    });
                    delete peersRef.current[targetId];
                }
            };

            return pc;
        };

        channel.on('broadcast', { event: 'webrtc' }, async ({ payload }) => {
            const { type, senderId, targetId, sdp, candidate } = payload;
            if (targetId !== myParticipantId.current) return;

            if (type === 'offer') {
                const pc = createPeerConnection(senderId);
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                channel.send({
                    type: 'broadcast',
                    event: 'webrtc',
                    payload: {
                        type: 'answer',
                        senderId: myParticipantId.current,
                        targetId: senderId,
                        sdp: pc.localDescription
                    }
                });
            } else if (type === 'answer') {
                const pc = peersRef.current[senderId];
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                }
            } else if (type === 'ice-candidate') {
                const pc = peersRef.current[senderId];
                if (pc && candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
                }
            }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const newParticipants: Participant[] = [];
                for (const id in newState) {
                    const presenceArray = newState[id] as any[];
                    if (presenceArray && presenceArray.length > 0) {
                        const pData = presenceArray[0];
                        if (id !== myParticipantId.current) {
                            newParticipants.push(pData as Participant);
                            
                            // WEBRTC INIT: If we don't have a PC and our ID is lexicographically greater, initiate offer
                            if (!peersRef.current[id] && myParticipantId.current > id) {
                                const pc = createPeerConnection(id);
                                pc.createOffer().then(offer => {
                                    pc.setLocalDescription(offer).then(() => {
                                        channel.send({
                                            type: 'broadcast',
                                            event: 'webrtc',
                                            payload: {
                                                type: 'offer',
                                                senderId: myParticipantId.current,
                                                targetId: id,
                                                sdp: pc.localDescription
                                            }
                                        });
                                    });
                                });
                            }
                        }
                    }
                }
                setParticipants(prev => {
                    const realIds = newParticipants.map(p => p.id);
                    const mockIds = MOCK_PARTICIPANTS.map(p => p.id);
                    const merged = [
                        ...prev.filter(p => mockIds.includes(p.id) || realIds.includes(p.id)),
                    ];
                    newParticipants.forEach(np => {
                        if (!merged.find(p => p.id === np.id)) merged.push(np);
                    });
                    MOCK_PARTICIPANTS.forEach(mp => {
                        if (!merged.find(p => p.id === mp.id)) merged.push(mp);
                    });
                    return merged;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        id: myParticipantId.current,
                        name: myName,
                        isMuted: !audioEnabled,
                        isVideoOff: !videoEnabled,
                        isSpeaking: false,
                        isHandRaised: handRaised,
                        avatarUrl: currentUser?.avatarUrl || currentUser?.user_metadata?.avatar_url
                    });
                }
            });

        return () => {
            Object.values(peersRef.current).forEach(pc => pc.close());
            peersRef.current = {};
            setRemoteStreams({});
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [inMeeting, meetingId]);

    // Update presence when local toggles change
    useEffect(() => {
        if (inMeeting && channelRef.current && channelRef.current.state === 'joined') {
            const myName = currentUser?.name || currentUser?.user_metadata?.full_name || 'Instructor';
            channelRef.current.track({
                id: myParticipantId.current,
                name: myName,
                isMuted: !audioEnabled,
                isVideoOff: !videoEnabled,
                isSpeaking: false,
                isHandRaised: handRaised,
                avatarUrl: currentUser?.avatarUrl || currentUser?.user_metadata?.avatar_url
            });
        }
    }, [audioEnabled, videoEnabled, handRaised, inMeeting]);

    // Simulate active speaker randomly and captions
    useEffect(() => {
        if (!inMeeting) return;
        const interval = setInterval(() => {
            const speakingParticipant = participants.find(p => p.isSpeaking);
            const nextSpeaker = MOCK_PARTICIPANTS[Math.floor(Math.random() * MOCK_PARTICIPANTS.length)];
            
            setParticipants(prev => prev.map(p => {
                if (!p.isMuted && Math.random() > 0.7) {
                    return { ...p, isSpeaking: true };
                }
                return { ...p, isSpeaking: false };
            }));

            // If captions are enabled, generate a mock caption when someone speaks
            if (captionsEnabled) {
                const phrases = [
                    "I think we need to align on the core objectives first.",
                    "Can everyone see my screen?",
                    "That's a great point, but let's consider the alternatives.",
                    "We should review the new design specs before the final launch next week.",
                    "Let's take this offline and discuss further."
                ];
                if (Math.random() > 0.5) {
                    setCurrentCaption({
                        name: nextSpeaker.name,
                        text: phrases[Math.floor(Math.random() * phrases.length)]
                    });
                    
                    // Clear caption after 4 seconds
                    setTimeout(() => setCurrentCaption(null), 4000);
                }
            } else {
                setCurrentCaption(null);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [inMeeting, captionsEnabled]);

    const generateMeetingId = () => {
        return Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
    };

    const handleJoinMeeting = () => {
        setIsJoining(true);
        setTimeout(() => {
            if (!meetingId) setMeetingId(generateMeetingId());
            setParticipants(MOCK_PARTICIPANTS);
            setInMeeting(true);
            setIsJoining(false);
            showToastMessage("You joined the meeting", "success");
        }, 800);
    };

    const handleLeaveMeeting = () => {
        setInMeeting(false);
        setScreenShared(false);
        setPinnedParticipant(null);
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
        }
    };

    const handleScreenShare = async () => {
        if (screenShared) {
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
            setScreenStream(null);
            setScreenShared(false);
            setLayout('grid');
        } else {
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                setScreenStream(displayStream);
                setScreenShared(true);
                setLayout('spotlight');
                
                displayStream.getVideoTracks()[0].onended = () => {
                    setScreenShared(false);
                    setScreenStream(null);
                    setLayout('grid');
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
            sender: 'You',
            text: chatInput.trim(),
            timestamp: new Date(),
            isSelf: true
        };
        setChatMessages(prev => [...prev, newMsg]);
        setChatInput('');
    };

    useEffect(() => {
        if (showSidebar === 'chat' && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, showSidebar]);

    // Event listeners for joining via link/broadcast
    useEffect(() => {
        const handleJoin = (e: any) => {
            const mId = e.detail;
            if (mId) setMeetingId(mId);
        };
        window.addEventListener('join-meeting', handleJoin);
        return () => window.removeEventListener('join-meeting', handleJoin);
    }, []);

    const showToastMessage = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        // Implement a local toast or use context
        console.log(`[Toast ${type}]: ${msg}`);
    };

    const togglePin = (id: string | null) => {
        if (pinnedParticipant === id) {
            setPinnedParticipant(null);
            setLayout(screenShared ? 'spotlight' : 'grid');
        } else {
            setPinnedParticipant(id);
            setLayout('spotlight');
        }
    };

    // Responsive Grid Calculator
    const getGridClasses = (count: number) => {
        if (layout === 'spotlight') return "grid-cols-1 md:grid-cols-4 md:grid-rows-4";
        if (count === 1) return "grid-cols-1 md:grid-cols-1";
        if (count === 2) return "grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
        if (count <= 4) return "grid-cols-2 md:grid-cols-2 grid-rows-2";
        if (count <= 6) return "grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2";
        if (count <= 8) return "grid-cols-2 md:grid-cols-3 grid-rows-4 md:grid-rows-3";
        if (count <= 9) return "grid-cols-2 md:grid-cols-3 grid-rows-5 md:grid-rows-3";
        return "grid-cols-2 md:grid-cols-4 grid-rows-6 md:grid-rows-3";
    };

    const allDisplayParticipants = [
        { id: 'local', isLocal: true, ...participants.find(p => p.id === 'local') }, 
        ...participants
    ];
    
    // Sort so pinned is first if in grid layout (or handles spotlight)
    const sortedParticipants = useMemo(() => {
        let sorted = [...allDisplayParticipants];
        if (pinnedParticipant) {
            const pinnedIdx = sorted.findIndex(p => p.id === pinnedParticipant);
            if (pinnedIdx > -1) {
                const pinned = sorted.splice(pinnedIdx, 1)[0];
                sorted.unshift(pinned);
            }
        }
        return sorted;
    }, [allDisplayParticipants, pinnedParticipant]);


    // ==========================================
    // PRE-JOIN LOBBY RENDER
    // ==========================================
    if (!inMeeting) {
        return (
            <div className="w-full h-full flex flex-col relative bg-[#202124] text-white z-20">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                            <Video size={18} className="text-white" />
                        </div>
                        <span className="font-google font-medium text-xl tracking-tight">PRISM Meet</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-300 font-medium">
                        <span className="hidden md:inline">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <UserAvatar name="You" size={32} />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 pb-20">
                    
                    {/* Video Preview Card */}
                    <div className="w-full max-w-3xl flex flex-col items-center">
                        <div className="relative w-full aspect-video bg-[#111315] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                            {videoEnabled && stream ? (
                                <video 
                                    ref={lobbyVideoRef} 
                                    autoPlay playsInline muted 
                                    className="w-full h-full object-cover transform -scale-x-100"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#202124]">
                                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-[#3c4043] border border-white/5">
                                        <UserAvatar name="You" size={80} />
                                    </div>
                                    <p className="text-gray-300 font-medium font-google text-lg">Camera is off</p>
                                </div>
                            )}

                            {/* Audio Visualizer (Mock) */}
                            {audioEnabled && stream && (
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-lg p-2 flex items-center gap-1 border border-white/10">
                                    <div className="w-1.5 h-3 bg-blue-400 rounded-full animate-[bounce_1s_infinite] delay-100" />
                                    <div className="w-1.5 h-4 bg-blue-400 rounded-full animate-[bounce_1s_infinite] delay-200" />
                                    <div className="w-1.5 h-2 bg-blue-400 rounded-full animate-[bounce_1s_infinite] delay-300" />
                                </div>
                            )}

                            {/* Lobby Controls */}
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-10">
                                <button 
                                    onClick={() => setAudioEnabled(!audioEnabled)} 
                                    className={clsx(
                                        "p-4 rounded-full border border-white/10 shadow-lg backdrop-blur-xl transition-all", 
                                        audioEnabled ? "bg-[#3c4043]/80 hover:bg-[#3c4043] text-white" : "bg-red-500 hover:bg-red-600 text-white"
                                    )}
                                    title={audioEnabled ? "Turn off microphone" : "Turn on microphone"}
                                >
                                    {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                                </button>
                                <button 
                                    onClick={() => setVideoEnabled(!videoEnabled)} 
                                    className={clsx(
                                        "p-4 rounded-full border border-white/10 shadow-lg backdrop-blur-xl transition-all", 
                                        videoEnabled ? "bg-[#3c4043]/80 hover:bg-[#3c4043] text-white" : "bg-red-500 hover:bg-red-600 text-white"
                                    )}
                                    title={videoEnabled ? "Turn off camera" : "Turn on camera"}
                                >
                                    {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                                </button>
                                <button 
                                    onClick={() => setShowSidebar('effects')}
                                    className="p-4 rounded-full bg-[#3c4043]/80 hover:bg-[#3c4043] border border-white/10 shadow-lg backdrop-blur-xl text-white transition-all hidden sm:block"
                                    title="Visual Effects"
                                >
                                    <Sparkles size={24} />
                                </button>
                            </div>

                            {/* Gradient overlays */}
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
                        </div>
                    </div>

                    {/* Join Panel */}
                    <div className="w-full max-w-sm flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
                        <h1 className="text-3xl md:text-4xl font-google text-white font-medium">Ready to join?</h1>
                        <p className="text-gray-400 font-medium">Join securely with enterprise-grade encryption and ultra-low latency.</p>
                        
                        <div className="w-full flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={handleJoinMeeting}
                                disabled={isJoining}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium py-3 px-6 rounded-3xl transition-all shadow-md flex items-center justify-center gap-2 h-12"
                            >
                                {isJoining ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>Join now</>
                                )}
                            </button>
                            <button className="flex-1 bg-[#3c4043] hover:bg-[#4a4d51] text-white font-medium py-3 px-6 rounded-3xl transition-all h-12 flex items-center justify-center gap-2">
                                <MonitorUp size={18} /> Present
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Other joining options</p>
                        
                        <div className="w-full relative mt-4">
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-400"><MonitorUp size={18} /></span>
                            </div>
                            <input
                                type="text"
                                placeholder="Enter meeting code"
                                value={meetingId}
                                onChange={(e) => setMeetingId(e.target.value)}
                                className="w-full bg-transparent border border-gray-600 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // ==========================================
    // IN-MEETING RENDER
    // ==========================================
    return (
        <div className="flex w-full h-full relative overflow-hidden bg-[#202124] text-white z-20 font-google">
            
            {/* Top Bar (Info / Status) */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-30 pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto">
                    {isRecording && (
                        <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-red-400 shadow-sm animate-pulse">
                            <Circle size={10} className="fill-red-400" /> REC
                        </div>
                    )}
                    <button 
                        onClick={() => setShowSidebar(showSidebar === 'info' ? null : 'info')}
                        className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2.5 text-sm font-medium hover:bg-white/10 transition-colors group"
                    >
                        <ShieldAlert size={14} className="text-green-400" />
                        {meetingId}
                        <ChevronUp size={14} className="text-gray-400 rotate-180 group-hover:text-white transition-colors" />
                    </button>
                </div>
                <div className="flex items-center gap-3 pointer-events-auto">
                    <button onClick={() => setLayout(layout === 'grid' ? 'spotlight' : 'grid')} className="p-2.5 rounded-xl bg-black/40 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-colors text-gray-300 hover:text-white" title="Change layout">
                        <Grip size={18} />
                    </button>
                    <UserAvatar name="You" size={32} />
                </div>
            </div>

            {/* Main Video Area */}
            <div className={clsx(
                "flex-1 relative transition-all duration-300 p-4 pb-24 pt-20", 
                showSidebar ? "lg:pr-[360px]" : ""
            )}>
                <div className={clsx(
                    "w-full h-full grid gap-4 transition-all duration-500 mx-auto",
                    getGridClasses(sortedParticipants.length + (screenShared ? 1 : 0))
                )}>
                    
                    {/* Screen Share Element (Always largest if spotlight) */}
                    <AnimatePresence>
                        {screenShared && (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={clsx(
                                    "relative rounded-2xl overflow-hidden bg-[#3c4043] border border-white/10 shadow-lg flex items-center justify-center group",
                                    layout === 'spotlight' ? "col-span-1 md:col-span-3 md:row-span-4" : ""
                                )}
                            >
                                <video ref={screenRef} autoPlay playsInline className="w-full h-full object-contain" />
                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                    <MonitorUp size={14} className="text-blue-400" />
                                    <span className="text-xs font-medium">Your Screen</span>
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleScreenShare()} className="p-2 bg-black/60 backdrop-blur-md hover:bg-red-500 text-white rounded-lg transition-colors border border-white/10">
                                        <X size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Participant Videos */}
                    <AnimatePresence>
                        {sortedParticipants.map((p, idx) => {
                            const isLocal = p.id === 'local';
                            // In spotlight, if screen is shared, everyone else is small on the right
                            const isSpotlighted = layout === 'spotlight' && !screenShared && idx === 0;
                            
                            return (
                                <motion.div 
                                    layout
                                    key={p.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={clsx(
                                        "relative rounded-2xl overflow-hidden bg-[#3c4043] border flex items-center justify-center group shadow-md",
                                        p.isSpeaking ? "border-blue-500 border-2" : "border-transparent",
                                        isSpotlighted ? "col-span-1 md:col-span-3 md:row-span-4" : "",
                                        // Specific adjustments for side-panel in spotlight
                                        layout === 'spotlight' && (!isSpotlighted && !screenShared) ? "col-span-1 md:col-span-1 hidden md:flex" : "" 
                                    )}
                                >
                                    {isLocal ? (
                                        !videoEnabled ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#3c4043]">
                                                <UserAvatar name="You" size={64} />
                                            </div>
                                        ) : (
                                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                                        )
                                    ) : (
                                        p.isVideoOff ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#3c4043]">
                                                <UserAvatar name={p.name} avatarUrl={p.avatarUrl} size={64} />
                                            </div>
                                        ) : remoteStreams[p.id] ? (
                                            <RemoteVideo stream={remoteStreams[p.id]} />
                                        ) : (
                                            <img src={p.avatarUrl} className="w-full h-full object-cover" alt={p.name} />
                                        )
                                    )}

                                    {/* Participant Overlay Info */}
                                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end pointer-events-none">
                                        <div className="flex gap-2">
                                            <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-2">
                                                {(isLocal ? !audioEnabled : p.isMuted) ? (
                                                    <MicOff size={12} className="text-red-400" />
                                                ) : p.isSpeaking ? (
                                                    <div className="flex gap-0.5">
                                                        <div className="w-1 h-2 bg-blue-400 rounded-full animate-[bounce_0.8s_infinite]" />
                                                        <div className="w-1 h-3 bg-blue-400 rounded-full animate-[bounce_0.8s_infinite_0.1s]" />
                                                        <div className="w-1 h-1.5 bg-blue-400 rounded-full animate-[bounce_0.8s_infinite_0.2s]" />
                                                    </div>
                                                ) : null}
                                                <span className="text-xs font-medium text-white truncate max-w-[100px]">
                                                    {isLocal ? 'You' : p.name}
                                                </span>
                                            </div>
                                            {(isLocal ? handRaised : p.isHandRaised) && (
                                                <div className="bg-[#3c4043]/90 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
                                                    <Hand size={14} className="text-yellow-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Hover Actions */}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!isLocal && (
                                            <button 
                                                onClick={() => togglePin(p.id)}
                                                className={clsx(
                                                    "p-2 backdrop-blur-md rounded-full transition-colors",
                                                    pinnedParticipant === p.id ? "bg-blue-500/80 text-white" : "bg-black/40 hover:bg-white/10 text-white"
                                                )}
                                            >
                                                {pinnedParticipant === p.id ? <PinOff size={14} /> : <Pin size={14} />}
                                            </button>
                                        )}
                                        <button className="p-2 bg-black/40 backdrop-blur-md hover:bg-white/10 text-white rounded-full transition-colors">
                                            <MoreVertical size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Closed Captions Overlay */}
            <AnimatePresence>
                {captionsEnabled && currentCaption && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-4 pointer-events-none"
                    >
                        <div className="bg-black/70 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-2xl">
                            <div className="flex gap-3 items-start">
                                <UserAvatar name={currentCaption.name} size={32} />
                                <div>
                                    <span className="text-blue-400 text-xs font-bold block mb-1">{currentCaption.name}</span>
                                    <p className="text-white font-medium text-lg lg:text-xl drop-shadow-md leading-relaxed">
                                        {currentCaption.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col md:flex-row items-center justify-between px-2 md:px-6 py-2 md:py-4 bg-[#202124] border-t border-white/5 z-40 transition-all gap-2 md:gap-0">
                
                {/* Left: Info */}
                <div className="hidden lg:flex items-center gap-2 w-1/4">
                    <span className="text-sm font-medium">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="text-gray-500 mx-2">|</span>
                    <span className="text-sm font-medium truncate">{meetingId}</span>
                </div>

                {/* Center: Core Controls */}
                <div className="flex items-center gap-1.5 md:gap-3 justify-center w-full md:w-auto overflow-x-auto no-scrollbar px-1 py-1">
                    
                    {/* Mic Toggle */}
                    <button 
                        onClick={() => setAudioEnabled(!audioEnabled)} 
                        className={clsx(
                            "w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0 border", 
                            audioEnabled ? "bg-[#3c4043] hover:bg-[#4a4d51] text-white border-transparent" : "bg-red-500 hover:bg-red-600 text-white border-transparent"
                        )}
                        title={audioEnabled ? "Turn off microphone" : "Turn on microphone"}
                    >
                        {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>
                    
                    {/* Video Toggle */}
                    <button 
                        onClick={() => setVideoEnabled(!videoEnabled)} 
                        className={clsx(
                            "w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0 border", 
                            videoEnabled ? "bg-[#3c4043] hover:bg-[#4a4d51] text-white border-transparent" : "bg-red-500 hover:bg-red-600 text-white border-transparent"
                        )}
                        title={videoEnabled ? "Turn off camera" : "Turn on camera"}
                    >
                        {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>

                    {/* CC Toggle */}
                    <button 
                        onClick={() => setCaptionsEnabled(!captionsEnabled)} 
                        className={clsx(
                            "w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0 hidden sm:flex", 
                            captionsEnabled ? "bg-blue-500/20 text-blue-400 border border-blue-500/50" : "bg-[#3c4043] hover:bg-[#4a4d51] text-white border border-transparent"
                        )}
                        title="Turn on captions"
                    >
                        <Captions size={20} />
                    </button>

                    {/* Screen Share Toggle */}
                    <button 
                        onClick={handleScreenShare} 
                        className={clsx(
                            "w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0 hidden sm:flex", 
                            screenShared ? "bg-blue-500/20 text-blue-400 border border-blue-500/50" : "bg-[#3c4043] hover:bg-[#4a4d51] text-white border border-transparent"
                        )}
                        title="Present now"
                    >
                        <MonitorUp size={20} />
                    </button>

                    {/* Raise Hand Toggle */}
                    <button 
                        onClick={() => setHandRaised(!handRaised)} 
                        className={clsx(
                            "w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0", 
                            handRaised ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" : "bg-[#3c4043] hover:bg-[#4a4d51] text-white border border-transparent"
                        )}
                        title="Raise hand"
                    >
                        <Hand size={20} />
                    </button>

                    {/* Mobile Only: Sidebar Toggles inside scrollable area to save space */}
                    <div className="flex md:hidden items-center gap-1.5 border-l border-white/10 pl-1.5 ml-1.5">
                        <button 
                            onClick={() => setShowSidebar(showSidebar === 'people' ? null : 'people')} 
                            className={clsx("w-11 h-11 rounded-full flex items-center justify-center transition-colors relative flex-shrink-0", showSidebar === 'people' ? "text-blue-400 bg-blue-500/10" : "text-gray-400 bg-[#3c4043] hover:text-white")}
                        >
                            <Users size={20} />
                        </button>
                        <button 
                            onClick={() => setShowSidebar(showSidebar === 'chat' ? null : 'chat')} 
                            className={clsx("w-11 h-11 rounded-full flex items-center justify-center transition-colors relative flex-shrink-0", showSidebar === 'chat' ? "text-blue-400 bg-blue-500/10" : "text-gray-400 bg-[#3c4043] hover:text-white")}
                        >
                            <MessageSquare size={20} />
                        </button>
                        <button 
                            onClick={() => setShowSidebar(showSidebar === 'info' ? null : 'info')} 
                            className={clsx("w-11 h-11 rounded-full flex items-center justify-center transition-colors relative flex-shrink-0", showSidebar === 'info' ? "text-blue-400 bg-blue-500/10" : "text-gray-400 bg-[#3c4043] hover:text-white")}
                        >
                            <MoreVertical size={20} />
                        </button>
                    </div>

                    <button 
                        onClick={handleLeaveMeeting} 
                        className="w-16 h-11 md:w-20 md:h-14 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium transition-all shadow-md flex items-center justify-center ml-2 flex-shrink-0"
                        title="Leave call"
                    >
                        <PhoneOff size={22} />
                    </button>
                </div>

                {/* Right: Sidebar Toggles (Desktop) */}
                <div className="hidden md:flex items-center justify-end gap-2 lg:w-1/4">
                    <button 
                        onClick={() => setShowSidebar(showSidebar === 'info' ? null : 'info')} 
                        className={clsx("p-3 rounded-full transition-colors", showSidebar === 'info' ? "text-blue-400 bg-blue-500/10" : "text-gray-400 hover:text-white hover:bg-[#3c4043]")}
                        title="Meeting details"
                    >
                        <Info size={22} />
                    </button>
                    <button 
                        onClick={() => setShowSidebar(showSidebar === 'people' ? null : 'people')} 
                        className={clsx("p-3 rounded-full transition-colors relative", showSidebar === 'people' ? "text-blue-400 bg-blue-500/10" : "text-gray-400 hover:text-white hover:bg-[#3c4043]")}
                        title="People"
                    >
                        <Users size={22} />
                        <span className="absolute top-1 right-1 bg-gray-600 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold text-white border border-[#202124]">
                            {participants.length + 1}
                        </span>
                    </button>
                    <button 
                        onClick={() => setShowSidebar(showSidebar === 'chat' ? null : 'chat')} 
                        className={clsx("p-3 rounded-full transition-colors relative", showSidebar === 'chat' ? "text-blue-400 bg-blue-500/10" : "text-gray-400 hover:text-white hover:bg-[#3c4043]")}
                        title="Chat"
                    >
                        <MessageSquare size={22} />
                        {chatMessages.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#202124]" />}
                    </button>
                    <button 
                        onClick={() => setShowSidebar(showSidebar === 'whiteboard' ? null : 'whiteboard')} 
                        className={clsx("p-3 rounded-full transition-colors", showSidebar === 'whiteboard' ? "text-blue-400 bg-blue-500/10" : "text-gray-400 hover:text-white hover:bg-[#3c4043]")}
                        title="Activities"
                    >
                        <Presentation size={22} />
                    </button>
                </div>
            </div>

            {/* Sidebar Overlay/Slide-in */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div 
                        initial={{ x: 360, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 360, opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="absolute right-0 top-0 bottom-20 w-full sm:w-[360px] bg-white z-50 flex flex-col shadow-2xl sm:rounded-l-2xl sm:m-4 sm:mb-0 sm:border border-gray-200"
                    >
                        {/* Sidebar Header */}
                        <div className="p-4 flex justify-between items-center bg-white rounded-t-2xl border-b border-gray-100">
                            <h3 className="font-google text-gray-800 text-lg font-medium">
                                {showSidebar === 'chat' ? 'In-call messages' : 
                                 showSidebar === 'people' ? 'People' : 
                                 showSidebar === 'info' ? 'Meeting details' : 'Activities'}
                            </h3>
                            <button onClick={() => setShowSidebar(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Sidebar Content */}
                        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar text-gray-800">
                            
                            {/* INFO */}
                            {showSidebar === 'info' && (
                                <div className="p-6 space-y-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Joining info</h4>
                                        <p className="text-sm font-medium mb-4">https://prism.os/meet/{meetingId}</p>
                                        <button onClick={copyMeetingLink} className="flex items-center gap-2 text-blue-600 font-medium hover:bg-blue-50 px-4 py-2 rounded-full transition-colors">
                                            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                            {copied ? 'Copied' : 'Copy joining info'}
                                        </button>
                                    </div>
                                    <div className="h-px bg-gray-200 w-full" />
                                    <div>
                                        <button onClick={() => window.dispatchEvent(new CustomEvent('broadcast-meeting', { detail: meetingId }))} className="flex items-center gap-3 text-gray-700 hover:bg-gray-50 p-3 rounded-xl w-full transition-colors text-left">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                <Share2 size={18} />
                                            </div>
                                            <div>
                                                <div className="font-medium">Share to Chat</div>
                                                <div className="text-xs text-gray-500">Broadcast to your active channel</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* PEOPLE */}
                            {showSidebar === 'people' && (
                                <div className="p-4 space-y-4">
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 bg-blue-50 text-blue-600 font-medium rounded-full text-sm hover:bg-blue-100 transition-colors">Add people</button>
                                        <button className="flex-1 py-2 border border-gray-300 font-medium rounded-full text-sm hover:bg-gray-50 transition-colors">Host controls</button>
                                    </div>
                                    <div className="text-sm font-medium text-gray-500 pt-2">IN CALL</div>
                                    <div className="space-y-1">
                                        {/* You */}
                                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name="You" size={32} />
                                                <span className="font-medium text-sm">You</span>
                                            </div>
                                            <div className="flex gap-2 text-gray-400">
                                                {!audioEnabled && <MicOff size={16} className="text-red-500" />}
                                            </div>
                                        </div>
                                        {/* Others */}
                                        {participants.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <UserAvatar name={p.name} avatarUrl={p.avatarUrl} size={32} />
                                                        {p.isSpeaking && (
                                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                                                <Volume2 size={12} className="text-blue-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-sm">{p.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => togglePin(p.id)} className={clsx("p-1.5 rounded-md hover:bg-gray-200", pinnedParticipant === p.id && "text-blue-500")}>
                                                        {pinnedParticipant === p.id ? <PinOff size={16} /> : <Pin size={16} />}
                                                    </button>
                                                    {p.isMuted ? <MicOff size={16} className="text-red-500 p-1.5" /> : <Mic size={16} className="p-1.5" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CHAT */}
                            {showSidebar === 'chat' && (
                                <div className="flex flex-col h-full bg-gray-50 pb-4">
                                    <div className="p-4 text-xs text-gray-500 bg-gray-100 text-center font-medium">
                                        Messages can only be seen by people in the call and are deleted when the call ends.
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {chatMessages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400 pt-10">
                                                <MessageSquare size={40} className="mb-4 opacity-50" />
                                                <p className="font-medium">No messages yet</p>
                                            </div>
                                        ) : (
                                            chatMessages.map(msg => (
                                                <div key={msg.id} className={clsx("flex flex-col max-w-[85%]", msg.isSelf ? "items-end self-end ml-auto" : "items-start")}>
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="text-xs font-medium text-gray-800">{msg.sender}</span>
                                                        <span className="text-[10px] text-gray-400">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className={clsx(
                                                        "px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words",
                                                        msg.isSelf ? "bg-blue-100 text-blue-900 rounded-tr-sm" : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                                                    )}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="px-4">
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={chatInput} 
                                                onChange={e => setChatInput(e.target.value)} 
                                                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                                                placeholder="Send a message" 
                                                className="w-full bg-white border border-gray-300 rounded-full py-3 pl-5 pr-12 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm" 
                                            />
                                            <button 
                                                onClick={handleSendChat}
                                                disabled={!chatInput.trim()} 
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* EFFECTS */}
                            {showSidebar === 'effects' && (
                                <div className="p-4 space-y-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Background</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button 
                                                onClick={() => setActiveBackground('none')}
                                                className={clsx("h-20 rounded-xl flex items-center justify-center border-2 transition-all", activeBackground === 'none' ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100")}
                                            >
                                                <VideoOff size={24} className={activeBackground === 'none' ? "text-blue-500" : "text-gray-400"} />
                                            </button>
                                            <button 
                                                onClick={() => setActiveBackground('blur')}
                                                className={clsx("h-20 rounded-xl flex items-center justify-center border-2 transition-all relative overflow-hidden", activeBackground === 'blur' ? "border-blue-500" : "border-gray-200")}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 opacity-20 blur-sm" />
                                                <span className="relative font-medium text-gray-700">Blur</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Recording</h4>
                                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-start gap-3">
                                            <div className={clsx("p-2 rounded-full", isRecording ? "bg-red-100 text-red-500" : "bg-gray-200 text-gray-500")}>
                                                <Circle size={20} className={clsx(isRecording && "fill-red-500")} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-800">{isRecording ? "Recording in progress" : "Record this meeting"}</div>
                                                <div className="text-xs text-gray-500 mt-1 mb-3">Recordings are saved to your PRISM Cloud drive automatically.</div>
                                                <button 
                                                    onClick={() => setIsRecording(!isRecording)}
                                                    className={clsx("px-4 py-1.5 rounded-full text-sm font-medium transition-colors", isRecording ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-blue-600 text-white hover:bg-blue-700")}
                                                >
                                                    {isRecording ? "Stop Recording" : "Start Recording"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* WHITEBOARD */}
                            {showSidebar === 'whiteboard' && (
                                <div className="p-6 text-center space-y-4 pt-10">
                                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                                        <Presentation size={32} className="relative z-10" />
                                        <div className="absolute inset-0 bg-blue-400/20 animate-pulse" />
                                    </div>
                                    <h4 className="font-medium text-lg text-gray-800">Whiteboarding</h4>
                                    <p className="text-sm text-gray-500 mb-6">Brainstorm ideas together in real-time. Everyone in the meeting will get a link to the jam.</p>
                                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors shadow-md flex items-center justify-center gap-2">
                                        <Sparkles size={18} /> Start a new whiteboard
                                    </button>
                                    <button className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-full transition-colors">
                                        Choose from Drive
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
