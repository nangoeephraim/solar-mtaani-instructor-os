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

// Phase 5: Polls & Q&A
interface MeetingPoll {
    id: string;
    question: string;
    options: string[];
    votes: Map<string, number>; // optionIndex -> count
    myVote: number | null;
    createdBy: string;
    isActive: boolean;
    timestamp: Date;
}

interface MeetingQuestion {
    id: string;
    text: string;
    askedBy: string;
    upvotes: number;
    hasUpvoted: boolean;
    isAnswered: boolean;
    timestamp: Date;
}

// ─── WebRTC Types ───
interface RemotePeer {
    odei: string; // unique peer ID
    userName: string;
    avatarUrl?: string;
    pc: RTCPeerConnection;
    stream: MediaStream | null;
    screenStream: MediaStream | null;
    audioEnabled: boolean;
    videoEnabled: boolean;
    handRaised: boolean;
}

// Build ICE config with STUN + optional TURN (set via env vars for NAT traversal)
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // TURN relay — required for users behind symmetric NATs (mobile/cellular)
        // Set VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL in .env
        ...((import.meta as any).env.VITE_TURN_URL ? [{
            urls: (import.meta as any).env.VITE_TURN_URL,
            username: (import.meta as any).env.VITE_TURN_USERNAME || '',
            credential: (import.meta as any).env.VITE_TURN_CREDENTIAL || '',
        }] : [
            // Free fallback TURN servers (metered.ca open relay — rate-limited)
            {
                urls: 'turn:a.relay.metered.ca:80',
                username: 'e8dd65b92af91ac212345678',
                credential: 'password123',
            },
            {
                urls: 'turn:a.relay.metered.ca:443',
                username: 'e8dd65b92af91ac212345678',
                credential: 'password123',
            },
            {
                urls: 'turn:a.relay.metered.ca:443?transport=tcp',
                username: 'e8dd65b92af91ac212345678',
                credential: 'password123',
            },
        ]),
    ],
    iceCandidatePoolSize: 10,
};

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

export default function Meetings({ pendingMeetCode }: { pendingMeetCode?: string }) {
    const { user } = useAuth();
    const userName = user?.name || 'You';
    const userAvatar = (user as any)?.avatarUrl || null;
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenShared, setScreenShared] = useState(false);
    const [showSidebar, setShowSidebar] = useState<'chat' | 'people' | 'effects' | 'notes' | 'files' | 'polls' | null>(null);
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
    const [captionSpeaker, setCaptionSpeaker] = useState('');
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
    const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const compositeAnimRef = useRef<number | null>(null);

    // Broadcast channel ref for in-meeting chat
    const chatChannelRef = useRef<any>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const screenRef = useRef<HTMLVideoElement>(null);

    // ─── WebRTC State ───
    // Each remote participant gets an RTCPeerConnection + stream
    const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map());
    const remotePeersRef = useRef<Map<string, RemotePeer>>(new Map());
    const localPeerId = useRef<string>(crypto.randomUUID());
    const signalingChannelRef = useRef<any>(null);
    const liveKitRoomRef = useRef<Room | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const localScreenStreamRef = useRef<MediaStream | null>(null);
    const dbMeetingIdRef = useRef<string | null>(null);

    // LiveKit Track Processors
    const krispFilterRef = useRef<KrispNoiseFilter | null>(null);
    const blurFilterRef = useRef<BackgroundBlur | null>(null);
    const virtualBgFilterRef = useRef<VirtualBackground | null>(null);

    // Apply LiveKit video processor when background settings change
    useEffect(() => {
        const applyVideoProcessor = async () => {
            if (!liveKitRoomRef.current) return;
            const videoTracks = liveKitRoomRef.current.localParticipant.videoTrackPublications;
            for (const [, pub] of videoTracks) {
                if (pub.track && pub.source !== 'screen_share') {
                    try {
                        if (backgroundBlur === 'Heavy') {
                            if (!blurFilterRef.current) blurFilterRef.current = BackgroundBlur(20, { delegate: 'GPU' });
                            else blurFilterRef.current.updateBlurRadius(20);
                            await pub.track.setProcessor(blurFilterRef.current);
                        } else if (backgroundBlur === 'Light') {
                            if (!blurFilterRef.current) blurFilterRef.current = BackgroundBlur(10, { delegate: 'GPU' });
                            else blurFilterRef.current.updateBlurRadius(10);
                            await pub.track.setProcessor(blurFilterRef.current);
                        } else if (selectedBg !== null) {
                            if (!virtualBgFilterRef.current) virtualBgFilterRef.current = VirtualBackground(`https://picsum.photos/seed/${selectedBg * 42}/1920/1080`, { delegate: 'GPU' });
                            else virtualBgFilterRef.current.updateImagePath(`https://picsum.photos/seed/${selectedBg * 42}/1920/1080`);
                            await pub.track.setProcessor(virtualBgFilterRef.current);
                        } else {
                            await pub.track.stopProcessor();
                        }
                    } catch (err) { console.warn('[LiveKit] Failed to apply video processor:', err); }
                }
            }
        };
        applyVideoProcessor();
    }, [backgroundBlur, selectedBg]);

    // File sharing state
    const [meetingFiles, setMeetingFiles] = useState<MeetingFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);

    // Phase 2: Device selector state
    const [showDeviceSelector, setShowDeviceSelector] = useState(false);
    const [availableDevices, setAvailableDevices] = useState<{ audioin: MediaDeviceInfo[]; videoin: MediaDeviceInfo[]; audioout: MediaDeviceInfo[] }>({ audioin: [], videoin: [], audioout: [] });
    const [selectedAudioIn, setSelectedAudioIn] = useState<string>('');
    const [selectedVideoIn, setSelectedVideoIn] = useState<string>('');

    // Phase 2: Active speaker detection
    const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

    // Phase 2: Noise suppression
    const [noiseSuppression, setNoiseSuppression] = useState(true);

    // Phase 5: Polls & Q&A
    const [polls, setPolls] = useState<MeetingPoll[]>([]);
    const [questions, setQuestions] = useState<MeetingQuestion[]>([]);
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [newPollQuestion, setNewPollQuestion] = useState('');
    const [newPollOptions, setNewPollOptions] = useState(['', '']);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [pollsTab, setPollsTab] = useState<'polls' | 'qa'>('polls');

    const generateMeetingId = () => {
        return Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6);
    };

    // Toast helper (must be defined before WebRTC functions that use it)
    const addToast = useCallback((text: string, icon: string = '\ud83d\udd14') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, text, icon }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    // ─── WebRTC Core ───

    // Helper: update a peer in both ref and state
    const updatePeer = useCallback((peerId: string, updater: (peer: RemotePeer) => RemotePeer) => {
        const existing = remotePeersRef.current.get(peerId);
        if (!existing) return;
        const updated = updater(existing);
        remotePeersRef.current.set(peerId, updated);
        setRemotePeers(new Map(remotePeersRef.current));
    }, []);

    // Create an RTCPeerConnection for a specific remote peer
    const createPeerConnection = useCallback((peerId: string, peerName: string, peerAvatar?: string): RTCPeerConnection => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add all local tracks (audio + video) to the connection
        const localStream = localStreamRef.current;
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        // Handle incoming remote tracks (their video/audio arrives here)
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            if (!remoteStream) return;

            // Detect screen share via track label heuristics (cross-browser reliable)
            // Screen share tracks typically have labels like "screen:...", "Screen", "window:...", "Entire screen"
            // or come from getDisplayMedia which sets the contentHint to "detail"
            const trackLabel = (event.track.label || '').toLowerCase();
            const isScreen = event.track.kind === 'video' && (
                trackLabel.includes('screen') ||
                trackLabel.includes('window') ||
                trackLabel.includes('monitor') ||
                trackLabel.includes('display') ||
                trackLabel.includes('entire') ||
                trackLabel.includes('tab') ||
                (event.track as any).contentHint === 'detail'
            );

            const existing = remotePeersRef.current.get(peerId);
            if (existing) {
                if (isScreen) {
                    existing.screenStream = remoteStream;
                } else {
                    existing.stream = remoteStream;
                }
                remotePeersRef.current.set(peerId, { ...existing });
                setRemotePeers(new Map(remotePeersRef.current));
            } else {
                const newPeer: RemotePeer = {
                    odei: peerId,
                    userName: peerName,
                    avatarUrl: peerAvatar,
                    pc,
                    stream: isScreen ? null : remoteStream,
                    screenStream: isScreen ? remoteStream : null,
                    audioEnabled: true,
                    videoEnabled: true,
                    handRaised: false,
                };
                remotePeersRef.current.set(peerId, newPeer);
                setRemotePeers(new Map(remotePeersRef.current));
            }
        };

        // Send ICE candidates to the remote peer via signaling
        pc.onicecandidate = (event) => {
            if (event.candidate && signalingChannelRef.current) {
                signalingChannelRef.current.send({
                    type: 'broadcast',
                    event: 'ice-candidate',
                    payload: {
                        from: localPeerId.current,
                        to: peerId,
                        candidate: event.candidate.toJSON(),
                    },
                }).catch(() => {});
            }
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            if (state === 'failed') {
                console.warn(`[WebRTC] Connection to ${peerName} (${peerId}) failed — attempting ICE restart`);
                // Attempt ICE restart to recover the connection
                pc.restartIce();
                // Re-negotiate with a new offer (only if we are the offerer)
                pc.createOffer({ iceRestart: true }).then(offer => {
                    return pc.setLocalDescription(offer);
                }).then(() => {
                    if (signalingChannelRef.current && pc.localDescription) {
                        signalingChannelRef.current.send({
                            type: 'broadcast',
                            event: 'offer',
                            payload: {
                                from: localPeerId.current,
                                fromName: userName,
                                fromAvatar: userAvatar,
                                to: peerId,
                                sdp: pc.localDescription.toJSON(),
                            },
                        }).catch(() => {});
                    }
                }).catch(err => {
                    console.error('[WebRTC] ICE restart failed:', err);
                });
            } else if (state === 'disconnected') {
                console.warn(`[WebRTC] Connection to ${peerName} (${peerId}) disconnected — will auto-recover or timeout`);
            }
        };

        // Store the peer
        const peerData: RemotePeer = {
            odei: peerId,
            userName: peerName,
            avatarUrl: peerAvatar,
            pc,
            stream: null,
            screenStream: null,
            audioEnabled: true,
            videoEnabled: true,
            handRaised: false,
        };
        remotePeersRef.current.set(peerId, peerData);
        setRemotePeers(new Map(remotePeersRef.current));

        return pc;
    }, []);

    // Setup Supabase signaling channel for WebRTC
    const setupSignaling = useCallback(async (mid: string) => {
        const useLiveKit = !!(import.meta as any).env.VITE_LIVEKIT_URL;
        if (useLiveKit) {
            try {
                // Phase 4.1: Use Vercel Edge Function for token generation
                const response = await fetch('/api/livekit-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomName: mid, participantName: userName, participantId: user?.id || crypto.randomUUID() })
                });
                const data = await response.json();
                
                if (data?.token) {
                    const room = new Room({
                        adaptiveStream: true,
                        dynacast: true,
                        videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
                        publishDefaults: { simulcast: true, videoSimulcastLayers: [VideoPresets.h1080, VideoPresets.h720, VideoPresets.h180], videoCodec: 'vp8' }
                    });
                    liveKitRoomRef.current = room;

                    room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
                        const pid = participant.identity;
                        const stream = new MediaStream([track.mediaStreamTrack]);
                        const isScreen = track.source === 'screen_share';
                        updatePeer(pid, p => isScreen ? { ...p, screenStream: stream } : { ...p, stream });
                        if (!remotePeersRef.current.has(pid)) {
                            const peerData: RemotePeer = {
                                odei: pid, userName: participant.name || pid, avatarUrl: undefined, pc: null as any,
                                stream: isScreen ? null : stream, screenStream: isScreen ? stream : null,
                                audioEnabled: participant.isMicrophoneEnabled, videoEnabled: participant.isCameraEnabled, handRaised: false
                            };
                            remotePeersRef.current.set(pid, peerData);
                            setRemotePeers(new Map(remotePeersRef.current));
                        }
                    });
                    room.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
                        const pid = participant.identity;
                        const isScreen = track.source === 'screen_share';
                        updatePeer(pid, p => isScreen ? { ...p, screenStream: null } : { ...p, stream: null });
                    });
                    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
                        remotePeersRef.current.delete(participant.identity);
                        setRemotePeers(new Map(remotePeersRef.current));
                        addToast(`${participant.name || 'Participant'} left`, '👋');
                    });
                    room.on(RoomEvent.TrackMuted, (pub, participant) => {
                        const pid = participant.identity;
                        updatePeer(pid, p => pub.source === 'microphone' ? { ...p, audioEnabled: false } : pub.source === 'camera' ? { ...p, videoEnabled: false } : p);
                    });
                    room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
                        const pid = participant.identity;
                        updatePeer(pid, p => pub.source === 'microphone' ? { ...p, audioEnabled: true } : pub.source === 'camera' ? { ...p, videoEnabled: true } : p);
                    });

                    await room.connect((import.meta as any).env.VITE_LIVEKIT_URL, data.token);
                    
                    if (localStreamRef.current) {
                        for (const track of localStreamRef.current.getTracks()) {
                            await room.localParticipant.publishTrack(track, { simulcast: track.kind === 'video' });
                        }
                    }
                }
            } catch (err) {
                console.error("[LiveKit] Connection failed, falling back to WebRTC", err);
            }
        }

        const channelName = `prism-meet-signal:${mid}`;
        const ch = supabase.channel(channelName, { config: { broadcast: { self: false } } });

        ch.on('broadcast', { event: 'peer-join' }, async (payload: any) => {
            const { peerId, peerName, peerAvatar } = payload.payload;
            if (peerId === localPeerId.current) return;

            // Skip if we already have a healthy connection to this peer
            // (re-announce heartbeat protection — avoid duplicate peer connections)
            const existingPeer = remotePeersRef.current.get(peerId);
            if (existingPeer && existingPeer.pc.connectionState !== 'failed' && existingPeer.pc.connectionState !== 'closed') {
                return;
            }

            // A new peer joined — create a connection and send them an offer
            const pc = createPeerConnection(peerId, peerName, peerAvatar);
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                ch.send({
                    type: 'broadcast',
                    event: 'offer',
                    payload: {
                        from: localPeerId.current,
                        fromName: userName,
                        fromAvatar: userAvatar,
                        to: peerId,
                        sdp: pc.localDescription?.toJSON(),
                    },
                }).catch(() => {});
            } catch (err) {
                console.error('[WebRTC] Failed to create offer:', err);
            }

            addToast(`${peerName} joined the meeting`, '👋');
        });

        ch.on('broadcast', { event: 'offer' }, async (payload: any) => {
            const { from, fromName, fromAvatar, to, sdp } = payload.payload;
            if (to !== localPeerId.current) return;

            // Someone sent us an offer — create peer connection, set remote desc, send answer
            let pc = remotePeersRef.current.get(from)?.pc;
            if (!pc) {
                pc = createPeerConnection(from, fromName, fromAvatar);
            }
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ch.send({
                    type: 'broadcast',
                    event: 'answer',
                    payload: {
                        from: localPeerId.current,
                        to: from,
                        sdp: pc.localDescription?.toJSON(),
                    },
                }).catch(() => {});
            } catch (err) {
                console.error('[WebRTC] Failed to handle offer:', err);
            }
        });

        ch.on('broadcast', { event: 'answer' }, async (payload: any) => {
            const { from, to, sdp } = payload.payload;
            if (to !== localPeerId.current) return;

            const peer = remotePeersRef.current.get(from);
            if (peer?.pc) {
                try {
                    await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
                } catch (err) {
                    console.error('[WebRTC] Failed to set remote description:', err);
                }
            }
        });

        ch.on('broadcast', { event: 'ice-candidate' }, async (payload: any) => {
            const { from, to, candidate } = payload.payload;
            if (to !== localPeerId.current) return;

            const peer = remotePeersRef.current.get(from);
            if (peer?.pc) {
                try {
                    await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('[WebRTC] Failed to add ICE candidate:', err);
                }
            }
        });

        ch.on('broadcast', { event: 'peer-leave' }, (payload: any) => {
            const { peerId, peerName } = payload.payload;
            const peer = remotePeersRef.current.get(peerId);
            if (peer) {
                peer.pc.close();
                remotePeersRef.current.delete(peerId);
                setRemotePeers(new Map(remotePeersRef.current));
                addToast(`${peerName} left the meeting`, '👋');
            }
        });

        // Media state updates (mute/unmute, camera on/off, hand raise)
        ch.on('broadcast', { event: 'media-state' }, (payload: any) => {
            const { peerId, audioEnabled: ae, videoEnabled: ve, handRaised: hr } = payload.payload;
            updatePeer(peerId, (p) => ({ ...p, audioEnabled: ae ?? p.audioEnabled, videoEnabled: ve ?? p.videoEnabled, handRaised: hr ?? p.handRaised }));
        });

        // Reactions from remote peers
        ch.on('broadcast', { event: 'reaction' }, (payload: any) => {
            const { emoji } = payload.payload;
            const reaction: FloatingReaction = { id: Date.now().toString(), emoji, x: 20 + Math.random() * 60 };
            setFloatingReactions(prev => [...prev, reaction]);
            setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== reaction.id)), 3000);
        });

        // Remote Captions (Task 3.3: ASR Diarization broadcast)
        ch.on('broadcast', { event: 'caption' }, (payload: any) => {
            const { text, interim, speaker } = payload.payload;
            if (text) setCaptionText(text);
            if (interim) setCaptionInterim(interim);
            setCaptionSpeaker(speaker);
            if (text) {
                if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
                captionTimeoutRef.current = setTimeout(() => { setCaptionText(''); setCaptionSpeaker(''); }, 6000);
            }
        });

        // Task 1.1: Screen share signaling events
        ch.on('broadcast', { event: 'screen-share-start' }, (payload: any) => {
            const { peerId: pid, peerName: pn } = payload.payload;
            addToast(`${pn} started presenting`, '🖥️');
        });
        ch.on('broadcast', { event: 'screen-share-stop' }, (payload: any) => {
            const { peerId: pid } = payload.payload;
            const peer = remotePeersRef.current.get(pid);
            if (peer) {
                peer.screenStream = null;
                remotePeersRef.current.set(pid, { ...peer });
                setRemotePeers(new Map(remotePeersRef.current));
            }
        });

        // Phase 5: Poll broadcast events
        ch.on('broadcast', { event: 'new-poll' }, (payload: any) => {
            const { poll } = payload.payload;
            const newPoll: MeetingPoll = {
                ...poll,
                votes: new Map(Object.entries(poll.votes || {})),
                myVote: null,
                timestamp: new Date(poll.timestamp),
            };
            setPolls(prev => [newPoll, ...prev]);
            addToast(`${poll.createdBy} started a poll`, '📊');
        });
        ch.on('broadcast', { event: 'poll-vote' }, (payload: any) => {
            const { pollId, optionIndex } = payload.payload;
            setPolls(prev => prev.map(p => {
                if (p.id !== pollId) return p;
                const newVotes = new Map(p.votes);
                const key = String(optionIndex);
                newVotes.set(key, (newVotes.get(key) || 0) + 1);
                return { ...p, votes: newVotes };
            }));
        });
        ch.on('broadcast', { event: 'end-poll' }, (payload: any) => {
            const { pollId } = payload.payload;
            setPolls(prev => prev.map(p => p.id === pollId ? { ...p, isActive: false } : p));
        });

        // Phase 5: Q&A broadcast events
        ch.on('broadcast', { event: 'new-question' }, (payload: any) => {
            const { question } = payload.payload;
            const newQ: MeetingQuestion = {
                ...question,
                hasUpvoted: false,
                timestamp: new Date(question.timestamp),
            };
            setQuestions(prev => [...prev, newQ]);
        });
        ch.on('broadcast', { event: 'upvote-question' }, (payload: any) => {
            const { questionId } = payload.payload;
            setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q));
        });
        ch.on('broadcast', { event: 'answer-question' }, (payload: any) => {
            const { questionId } = payload.payload;
            setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, isAnswered: true } : q));
        });

        ch.subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
                // Announce our presence to existing peers only if not using LiveKit
                if (!liveKitRoomRef.current) {
                    ch.send({
                        type: 'broadcast',
                        event: 'peer-join',
                        payload: {
                            peerId: localPeerId.current,
                            peerName: userName,
                            peerAvatar: userAvatar,
                        },
                    }).catch(() => {});
                }

                // Task 0.5: Exponential backoff re-announce for late-joiner discovery
                // Fast first re-announce (1s) then backs off (3s, 8s, 15s) to avoid flooding
                const reAnnounceDelays = [1000, 3000, 8000, 15000];
                let reAnnounceIndex = 0;
                const sendReAnnounce = () => {
                    ch.send({
                        type: 'broadcast',
                        event: 'peer-join',
                        payload: {
                            peerId: localPeerId.current,
                            peerName: userName,
                            peerAvatar: userAvatar,
                        },
                    }).catch(() => {});
                };
                const scheduleReAnnounce = () => {
                    const delay = reAnnounceDelays[Math.min(reAnnounceIndex, reAnnounceDelays.length - 1)];
                    reAnnounceIndex++;
                    (ch as any).__reAnnounceTimeout = setTimeout(() => {
                        sendReAnnounce();
                        scheduleReAnnounce();
                    }, delay);
                };
                scheduleReAnnounce();

                // Store cleanup ref
                (ch as any).__reAnnounceInterval = null; // legacy compat
            }
        });

        signalingChannelRef.current = ch;
    }, [createPeerConnection, userName, userAvatar, updatePeer]);

    // Broadcast local media state to all peers
    const broadcastMediaState = useCallback((overrides?: { audioEnabled?: boolean; videoEnabled?: boolean; handRaised?: boolean }) => {
        if (signalingChannelRef.current) {
            signalingChannelRef.current.send({
                type: 'broadcast',
                event: 'media-state',
                payload: {
                    peerId: localPeerId.current,
                    audioEnabled: overrides?.audioEnabled ?? audioEnabled,
                    videoEnabled: overrides?.videoEnabled ?? videoEnabled,
                    handRaised: overrides?.handRaised ?? handRaised,
                },
            }).catch(() => {});
        }
    }, [audioEnabled, videoEnabled, handRaised]);

    const handleJoinMeeting = async (reusableStream?: MediaStream | null) => {
        // ─── Phase 0: Performance timing ───
        const t0 = performance.now();
        try {
            const mid = meetingId || generateMeetingId();
            if (!meetingId) setMeetingId(mid);
            setHasError(null);

            // Task 0.4: Reuse preview stream if available (saves 500ms-2s)
            let mediaStream: MediaStream;
            if (reusableStream && reusableStream.active && reusableStream.getVideoTracks().length > 0) {
                // Re-enable audio tracks that were muted in preview
                reusableStream.getAudioTracks().forEach(t => { t.enabled = true; });
                // If preview had no audio track, add one
                if (reusableStream.getAudioTracks().length === 0) {
                    try {
                        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        audioStream.getAudioTracks().forEach(t => reusableStream.addTrack(t));
                    } catch { /* proceed without audio */ }
                }
                mediaStream = reusableStream;
                console.log(`[Perf] Reused preview stream (+${(performance.now() - t0).toFixed(0)}ms)`);
            } else {
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                console.log(`[Perf] Fresh getUserMedia (+${(performance.now() - t0).toFixed(0)}ms)`);
            }

            setStream(mediaStream);
            localStreamRef.current = mediaStream;
            setInMeeting(true);

            // Task 0.2: Run chat channel + signaling + DB persist IN PARALLEL
            const chatSetup = () => {
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
            };

            const dbPersist = async () => {
                if (!user?.id) return;
                try {
                    const { data: existing } = await supabase
                        .from('meetings').select('id').eq('meeting_code', mid).maybeSingle();
                    
                    let currentMeetingId = existing?.id;
                    if (!existing) {
                        const { data: newMeeting } = await supabase.from('meetings').insert({
                            meeting_code: mid, host_id: user.id, host_name: userName,
                            title: `Meeting ${mid}`, status: 'active',
                        }).select('id').single();
                        currentMeetingId = newMeeting?.id;
                    }

                    if (currentMeetingId) {
                        dbMeetingIdRef.current = currentMeetingId;
                        // Task 2.1 & 2.2: Persist participant to satisfy RLS and presence queries
                        await supabase.from('meeting_participants').upsert({
                            meeting_id: currentMeetingId,
                            user_id: user.id,
                            role: existing ? 'participant' : 'host'
                        }, { onConflict: 'meeting_id,user_id' });
                    }
                } catch (err) { console.warn('[Meetings] DB persist failed:', err); }
            };

            // Fire all three in parallel — signaling is the critical path
            chatSetup();
            setupSignaling(mid);
            dbPersist(); // fire-and-forget

            console.log(`[Perf] Meeting fully initialized in ${(performance.now() - t0).toFixed(0)}ms`);
        } catch (err) {
            console.error("Failed to get local stream", err);
            setHasError("Failed to access camera and microphone. Please check your permissions.");
        }
    };

    const handleLeaveMeeting = async () => {
        // ─── WebRTC/LiveKit Cleanup ───
        if (liveKitRoomRef.current) {
            liveKitRoomRef.current.disconnect();
            liveKitRoomRef.current = null;
        }

        // Announce departure to all peers
        if (signalingChannelRef.current) {
            // Clear re-announce heartbeat timeout
            if ((signalingChannelRef.current as any).__reAnnounceTimeout) {
                clearTimeout((signalingChannelRef.current as any).__reAnnounceTimeout);
            }
            signalingChannelRef.current.send({
                type: 'broadcast',
                event: 'peer-leave',
                payload: { peerId: localPeerId.current, peerName: userName },
            }).catch(() => {});
            supabase.removeChannel(signalingChannelRef.current);
            signalingChannelRef.current = null;
        }
        // Close all peer connections
        remotePeersRef.current.forEach((peer) => {
            peer.pc.close();
        });
        remotePeersRef.current.clear();
        setRemotePeers(new Map());
        localStreamRef.current = null;
        localScreenStreamRef.current = null;

        if (stream) stream.getTracks().forEach(track => track.stop());
        if (screenStream) screenStream.getTracks().forEach(track => track.stop());
        // Timer cleanup is handled by MeetingTimer component
        if (chatChannelRef.current) { supabase.removeChannel(chatChannelRef.current); chatChannelRef.current = null; }
        // Stop recording if active
        if (mediaRecorderRef2.current && isRecording) {
            mediaRecorderRef2.current.stop();
            setIsRecording(false);
        }
        // Stop composite canvas rendering
        if (compositeAnimRef.current) {
            cancelAnimationFrame(compositeAnimRef.current);
            compositeAnimRef.current = null;
        }
        // Stop speech recognition
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
            recognitionRef.current = null;
        }

        // Mark meeting as ended in Supabase
        if (meetingId && user?.id) {
            try {
                // If host, end the meeting
                await supabase.from('meetings')
                    .update({ status: 'ended', ended_at: new Date().toISOString() })
                    .eq('meeting_code', meetingId)
                    .eq('host_id', user.id);
                    
                // For all participants, set left_at
                if (dbMeetingIdRef.current) {
                    await supabase.from('meeting_participants')
                        .update({ left_at: new Date().toISOString() })
                        .eq('meeting_id', dbMeetingIdRef.current)
                        .eq('user_id', user.id);
                }
            } catch { /* non-blocking */ }
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
        // Phase 2 cleanup
        setShowDeviceSelector(false);
        setActiveSpeaker(null);
        setRemoteAudioLevels(new Map());
        // Phase 5 cleanup
        setPolls([]);
        setQuestions([]);
        setShowPollCreator(false);
        setNewPollQuestion('');
        setNewPollOptions(['', '']);
        setNewQuestionText('');
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

    // Handle toggles and broadcast state
    useEffect(() => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = audioEnabled;
            });
            stream.getVideoTracks().forEach(track => {
                track.enabled = videoEnabled;
            });
        }
        
        // Broadcast our state to peers so their UI updates
        if (inMeeting) {
            broadcastMediaState();
        }
    }, [audioEnabled, videoEnabled, handRaised, stream, inMeeting, broadcastMediaState]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear re-announce heartbeat timeout
            if (signalingChannelRef.current && (signalingChannelRef.current as any).__reAnnounceTimeout) {
                clearTimeout((signalingChannelRef.current as any).__reAnnounceTimeout);
            }
            if (signalingChannelRef.current) {
                supabase.removeChannel(signalingChannelRef.current);
                signalingChannelRef.current = null;
            }
            if (chatChannelRef.current) supabase.removeChannel(chatChannelRef.current);
            if (mediaRecorderRef2.current && mediaRecorderRef2.current.state !== 'inactive') {
                mediaRecorderRef2.current.stop();
            }
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
                recognitionRef.current = null;
            }
            // Close all peer connections
            remotePeersRef.current.forEach((peer) => peer.pc.close());
            remotePeersRef.current.clear();
            // Stop composite recording canvas
            if (compositeAnimRef.current) cancelAnimationFrame(compositeAnimRef.current);
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
                setCaptionSpeaker(userName);
                setCaptionInterim('');
                if (signalingChannelRef.current) {
                    signalingChannelRef.current.send({
                        type: 'broadcast', event: 'caption',
                        payload: { text: final, interim: '', speaker: userName }
                    }).catch(() => {});
                }
                // Clear caption after 6s of silence
                if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
                captionTimeoutRef.current = setTimeout(() => { setCaptionText(''); setCaptionSpeaker(''); }, 6000);
            }
            if (interim) {
                setCaptionInterim(interim);
                setCaptionSpeaker(userName);
                if (signalingChannelRef.current) {
                    signalingChannelRef.current.send({
                        type: 'broadcast', event: 'caption',
                        payload: { text: '', interim, speaker: userName }
                    }).catch(() => {});
                }
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

    // Task 1.2: Remote audio activity detection — analyze each peer's audio stream
    const remoteAudioRefs = useRef<Map<string, { ctx: AudioContext; analyser: AnalyserNode; animId: number }>>(new Map());
    const [remoteAudioLevels, setRemoteAudioLevels] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        if (!inMeeting) return;
        // Start analyzers for new peers, stop for removed peers
        const currentPeerIds = new Set(remotePeers.keys());
        
        // Cleanup removed peers
        remoteAudioRefs.current.forEach((ref, peerId) => {
            if (!currentPeerIds.has(peerId)) {
                cancelAnimationFrame(ref.animId);
                ref.ctx.close().catch(() => {});
                remoteAudioRefs.current.delete(peerId);
            }
        });

        // Start analyzers for new peers with streams
        remotePeers.forEach((peer, peerId) => {
            if (remoteAudioRefs.current.has(peerId) || !peer.stream) return;
            const audioTracks = peer.stream.getAudioTracks();
            if (audioTracks.length === 0) return;
            try {
                const ctx = new AudioContext();
                const source = ctx.createMediaStreamSource(peer.stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.85;
                source.connect(analyser);
                const dataArr = new Uint8Array(analyser.frequencyBinCount);
                let frameCount = 0;
                let lastLevel = 0;
                const tick = () => {
                    frameCount++;
                    if (frameCount % 6 === 0) {
                        analyser.getByteFrequencyData(dataArr);
                        const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
                        const level = Math.min(avg / 128, 1);
                        if (Math.abs(level - lastLevel) > 0.03) {
                            lastLevel = level;
                            setRemoteAudioLevels(prev => {
                                const next = new Map(prev);
                                next.set(peerId, level);
                                return next;
                            });
                        }
                    }
                    const id = requestAnimationFrame(tick);
                    const ref = remoteAudioRefs.current.get(peerId);
                    if (ref) ref.animId = id;
                };
                const animId = requestAnimationFrame(tick);
                remoteAudioRefs.current.set(peerId, { ctx, analyser, animId });
            } catch {}
        });

        return () => {
            remoteAudioRefs.current.forEach((ref) => {
                cancelAnimationFrame(ref.animId);
                ref.ctx.close().catch(() => {});
            });
            remoteAudioRefs.current.clear();
        };
    }, [inMeeting, remotePeers]);

    // Phase 2: Enumerate available devices
    useEffect(() => {
        if (!inMeeting) return;
        const enumerate = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                setAvailableDevices({
                    audioin: devices.filter(d => d.kind === 'audioinput'),
                    videoin: devices.filter(d => d.kind === 'videoinput'),
                    audioout: devices.filter(d => d.kind === 'audiooutput'),
                });
                // Set current device IDs
                const currentAudio = stream?.getAudioTracks()[0];
                const currentVideo = stream?.getVideoTracks()[0];
                if (currentAudio) setSelectedAudioIn(currentAudio.getSettings().deviceId || '');
                if (currentVideo) setSelectedVideoIn(currentVideo.getSettings().deviceId || '');
            } catch {}
        };
        enumerate();
        navigator.mediaDevices.addEventListener('devicechange', enumerate);
        return () => navigator.mediaDevices.removeEventListener('devicechange', enumerate);
    }, [inMeeting, stream]);

    // Phase 2: Active speaker detection — determines who's talking loudest
    useEffect(() => {
        if (!inMeeting) return;
        const interval = setInterval(() => {
            let maxLevel = 0.08; // threshold
            let speaker: string | null = null;

            // Check local level
            if (audioEnabled && audioLevel > maxLevel) {
                maxLevel = audioLevel;
                speaker = 'local';
            }
            // Check remote levels
            remoteAudioLevels.forEach((level, peerId) => {
                if (level > maxLevel) {
                    maxLevel = level;
                    speaker = peerId;
                }
            });
            setActiveSpeaker(speaker);
        }, 500);
        return () => clearInterval(interval);
    }, [inMeeting, audioLevel, audioEnabled, remoteAudioLevels]);

    // Phase 6: Adaptive bandwidth management
    useEffect(() => {
        if (!inMeeting) return;
        const adaptInterval = setInterval(() => {
            const peerCount = remotePeersRef.current.size;
            if (peerCount === 0) return;

            // Determine target bitrate based on peer count and network conditions
            const nav = navigator as any;
            const effectiveType = nav?.connection?.effectiveType || '4g';
            const isSlowNetwork = effectiveType === '2g' || effectiveType === 'slow-2g' || effectiveType === '3g';

            let targetBitrate: number;
            let targetHeight: number;
            let targetFps: number;

            if (peerCount <= 2 && !isSlowNetwork) {
                targetBitrate = 1500000; targetHeight = 720; targetFps = 30;
            } else if (peerCount <= 4 && !isSlowNetwork) {
                targetBitrate = 800000; targetHeight = 480; targetFps = 24;
            } else if (peerCount <= 4 && isSlowNetwork) {
                targetBitrate = 400000; targetHeight = 360; targetFps = 15;
            } else if (peerCount > 4 && !isSlowNetwork) {
                targetBitrate = 500000; targetHeight = 360; targetFps = 20;
            } else {
                targetBitrate = 300000; targetHeight = 240; targetFps = 15;
            }

            // Apply bitrate limits to all peer connections
            remotePeersRef.current.forEach((peer) => {
                const senders = peer.pc.getSenders();
                senders.forEach(sender => {
                    if (sender.track?.kind === 'video') {
                        const params = sender.getParameters();
                        if (!params.encodings) params.encodings = [{}];
                        params.encodings[0].maxBitrate = targetBitrate;
                        if (params.encodings[0].maxFramerate !== undefined || targetFps < 30) {
                            params.encodings[0].maxFramerate = targetFps;
                        }
                        sender.setParameters(params).catch(() => {});
                    }
                });
            });

            // Apply resolution constraints to local video track
            const videoTrack = localStreamRef.current?.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.applyConstraints({
                    height: { ideal: targetHeight },
                    frameRate: { ideal: targetFps },
                }).catch(() => {});
            }

            // Update connection quality indicator
            if (isSlowNetwork || (peerCount > 4 && effectiveType !== '4g')) {
                setConnectionQuality('poor');
            } else if (peerCount > 2 || effectiveType === '3g') {
                setConnectionQuality('fair');
            } else {
                setConnectionQuality('good');
            }
        }, 10000); // Every 10s to avoid thrashing

        return () => clearInterval(adaptInterval);
    }, [inMeeting]);

    // Phase 2: Switch audio/video device mid-meeting
    const switchDevice = useCallback(async (kind: 'audio' | 'video', deviceId: string) => {
        try {
            // If connected via LiveKit, use the native SDK method
            if (liveKitRoomRef.current) {
                await liveKitRoomRef.current.switchActiveDevice(kind === 'audio' ? 'audioinput' : 'videoinput', deviceId);
                
                // Update local state selectors
                if (kind === 'audio') setSelectedAudioIn(deviceId);
                else setSelectedVideoIn(deviceId);
                
                addToast(`Switched ${kind} device`, kind === 'audio' ? '🎤' : '📷');
                return;
            }

            // WebRTC Mesh fallback logic
            if (!stream) return;
            const constraints = kind === 'audio'
                ? { audio: { deviceId: { exact: deviceId }, noiseSuppression, echoCancellation: true, autoGainControl: true }, video: false }
                : { audio: false, video: { deviceId: { exact: deviceId } } };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newTrack = newStream.getTracks()[0];
            const oldTrack = kind === 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

            if (oldTrack) {
                stream.removeTrack(oldTrack);
                stream.addTrack(newTrack);
                oldTrack.stop();

                remotePeersRef.current.forEach((peer) => {
                    const sender = peer.pc.getSenders().find(s => s.track?.kind === newTrack.kind);
                    if (sender) sender.replaceTrack(newTrack).catch(() => {});
                });
            }

            if (kind === 'audio') {
                setSelectedAudioIn(deviceId);
                setStream(new MediaStream(stream.getTracks()));
            } else {
                setSelectedVideoIn(deviceId);
                setStream(new MediaStream(stream.getTracks()));
            }
            addToast(`Switched ${kind} device`, kind === 'audio' ? '🎤' : '📷');
        } catch (err) {
            console.error(`Failed to switch ${kind} device:`, err);
            addToast(`Failed to switch ${kind}. Check permissions.`, '⚠️');
        }
    }, [stream, noiseSuppression, addToast]);

    const handleFlipCamera = useCallback(() => {
        if (!availableDevices.videoin || availableDevices.videoin.length < 2) {
            addToast('No alternative camera found', '⚠️');
            return;
        }
        const currentIndex = availableDevices.videoin.findIndex(d => d.deviceId === selectedVideoIn);
        const nextIndex = (currentIndex + 1) % availableDevices.videoin.length;
        switchDevice('video', availableDevices.videoin[nextIndex].deviceId);
    }, [availableDevices, selectedVideoIn, switchDevice, addToast]);


    // Phase 2/3: Toggle noise suppression (LiveKit + Krisp or WebRTC Fallback)
    const toggleNoiseSuppression = useCallback(async () => {
        const newState = !noiseSuppression;
        setNoiseSuppression(newState);

        // Phase 3.2: Use Krisp AI Noise Cancellation if connected to LiveKit
        if (liveKitRoomRef.current) {
            try {
                if (!krispFilterRef.current) krispFilterRef.current = KrispNoiseFilter();
                const audioTracks = liveKitRoomRef.current.localParticipant.audioTrackPublications;
                for (const [, pub] of audioTracks) {
                    if (pub.track) {
                        if (newState) {
                            await pub.track.setProcessor(krispFilterRef.current);
                        } else {
                            await pub.track.stopProcessor();
                        }
                    }
                }
                addToast(newState ? 'Krisp AI Noise Cancellation ON' : 'Noise Cancellation OFF', newState ? '🔇' : '🔊');
                return;
            } catch (err) {
                console.warn("[LiveKit] Krisp failed, falling back to basic:", err);
            }
        }

        // WebRTC Mesh fallback
        if (!stream) return;
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            try {
                await audioTrack.applyConstraints({
                    noiseSuppression: newState,
                    echoCancellation: true,
                    autoGainControl: true,
                });
                addToast(newState ? 'Noise suppression ON' : 'Noise suppression OFF', newState ? '🔇' : '🔊');
            } catch {
                addToast('Noise suppression not supported', '⚠️');
            }
        }
    }, [noiseSuppression, stream, addToast]);

    // Floating reaction system
    const sendReaction = useCallback((emoji: string) => {
        const reaction: FloatingReaction = { id: Date.now().toString(), emoji, x: 20 + Math.random() * 60 };
        setFloatingReactions(prev => [...prev, reaction]);
        if (signalingChannelRef.current) {
            signalingChannelRef.current.send({ type: 'broadcast', event: 'reaction', payload: { emoji, userName } }).catch(() => {});
        }
        setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== reaction.id)), 3000);
        setShowReactionTray(false);
    }, [userName]);

    // Phase 5: Create a new poll
    const createPoll = useCallback(() => {
        if (!newPollQuestion.trim() || newPollOptions.filter(o => o.trim()).length < 2) return;
        const validOptions = newPollOptions.filter(o => o.trim());
        const poll: MeetingPoll = {
            id: Date.now().toString(),
            question: newPollQuestion.trim(),
            options: validOptions,
            votes: new Map(),
            myVote: null,
            createdBy: userName,
            isActive: true,
            timestamp: new Date(),
        };
        setPolls(prev => [poll, ...prev]);
        // Broadcast to peers
        if (signalingChannelRef.current) {
            const votesObj: Record<string, number> = {};
            signalingChannelRef.current.send({
                type: 'broadcast', event: 'new-poll',
                payload: { poll: { ...poll, votes: votesObj, timestamp: poll.timestamp.toISOString() } },
            }).catch(() => {});
        }
        // Reset form
        setNewPollQuestion('');
        setNewPollOptions(['', '']);
        setShowPollCreator(false);
        addToast('Poll created!', '📊');
    }, [newPollQuestion, newPollOptions, userName, addToast]);

    // Phase 5: Vote on a poll
    const votePoll = useCallback((pollId: string, optionIndex: number) => {
        setPolls(prev => prev.map(p => {
            if (p.id !== pollId || p.myVote !== null) return p;
            const newVotes = new Map(p.votes);
            const key = String(optionIndex);
            newVotes.set(key, (newVotes.get(key) || 0) + 1);
            return { ...p, votes: newVotes, myVote: optionIndex };
        }));
        if (signalingChannelRef.current) {
            signalingChannelRef.current.send({
                type: 'broadcast', event: 'poll-vote',
                payload: { pollId, optionIndex },
            }).catch(() => {});
        }
    }, []);

    // Phase 5: End a poll
    const endPoll = useCallback((pollId: string) => {
        setPolls(prev => prev.map(p => p.id === pollId ? { ...p, isActive: false } : p));
        if (signalingChannelRef.current) {
            signalingChannelRef.current.send({
                type: 'broadcast', event: 'end-poll',
                payload: { pollId },
            }).catch(() => {});
        }
        addToast('Poll ended', '📊');
    }, [addToast]);

    // Phase 5: Submit a Q&A question
    const submitQuestion = useCallback(() => {
        if (!newQuestionText.trim()) return;
        const question: MeetingQuestion = {
            id: Date.now().toString(),
            text: newQuestionText.trim(),
            askedBy: userName,
            upvotes: 0,
            hasUpvoted: false,
            isAnswered: false,
            timestamp: new Date(),
        };
        setQuestions(prev => [...prev, question]);
        if (signalingChannelRef.current) {
            signalingChannelRef.current.send({
                type: 'broadcast', event: 'new-question',
                payload: { question: { ...question, timestamp: question.timestamp.toISOString() } },
            }).catch(() => {});
        }
        setNewQuestionText('');
        addToast('Question submitted', '❓');
    }, [newQuestionText, userName, addToast]);

    // Phase 5: Upvote a question
    const upvoteQuestion = useCallback((questionId: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id !== questionId || q.hasUpvoted) return q;
            return { ...q, upvotes: q.upvotes + 1, hasUpvoted: true };
        }));
        if (signalingChannelRef.current) {
            signalingChannelRef.current.send({
                type: 'broadcast', event: 'upvote-question',
                payload: { questionId },
            }).catch(() => {});
        }
    }, []);

    // Phase 5: Mark question as answered
    const markQuestionAnswered = useCallback((questionId: string) => {
        setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, isAnswered: true } : q));
        if (signalingChannelRef.current) {
            signalingChannelRef.current.send({
                type: 'broadcast', event: 'answer-question',
                payload: { questionId },
            }).catch(() => {});
        }
        addToast('Question marked as answered', '✅');
    }, [addToast]);

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
            localScreenStreamRef.current = null;

            if (liveKitRoomRef.current) {
                // LiveKit unpublish screen
                liveKitRoomRef.current.localParticipant.videoTrackPublications.forEach(pub => {
                    if (pub.source === 'screen_share' && pub.track) {
                        liveKitRoomRef.current?.localParticipant.unpublishTrack(pub.track);
                    }
                });
            } else {
                // Task 1.1: Remove screen share transceivers from all peers
                remotePeersRef.current.forEach((peer) => {
                    const senders = peer.pc.getSenders();
                    senders.forEach(sender => {
                        if (sender.track && sender.track.kind === 'video' && (sender.track as any).__isScreenShare) {
                            peer.pc.removeTrack(sender);
                        }
                    });
                });

                // Notify peers that screen share stopped
                if (signalingChannelRef.current) {
                    signalingChannelRef.current.send({
                        type: 'broadcast', event: 'screen-share-stop',
                        payload: { peerId: localPeerId.current },
                    }).catch(() => {});
                }
            }
        } else {
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                setScreenStream(displayStream);
                setScreenShared(true);
                localScreenStreamRef.current = displayStream;
                const screenTrack = displayStream.getVideoTracks()[0];

                if (liveKitRoomRef.current) {
                    await liveKitRoomRef.current.localParticipant.publishTrack(screenTrack, { source: 'screen_share' });
                    screenTrack.onended = () => {
                        liveKitRoomRef.current?.localParticipant.unpublishTrack(screenTrack);
                        setScreenShared(false);
                        setScreenStream(null);
                        localScreenStreamRef.current = null;
                    };
                } else {
                    (screenTrack as any).__isScreenShare = true; // tag for cleanup
                    remotePeersRef.current.forEach((peer) => {
                        peer.pc.addTrack(screenTrack, displayStream);
                    });

                    if (signalingChannelRef.current) {
                        signalingChannelRef.current.send({
                            type: 'broadcast', event: 'screen-share-start',
                            payload: { peerId: localPeerId.current, peerName: userName },
                        }).catch(() => {});
                    }

                    screenTrack.onended = () => {
                        setScreenShared(false);
                        setScreenStream(null);
                        localScreenStreamRef.current = null;
                        remotePeersRef.current.forEach((peer) => {
                            const senders = peer.pc.getSenders();
                            senders.forEach(sender => {
                                if (sender.track && (sender.track as any).__isScreenShare) {
                                    peer.pc.removeTrack(sender);
                                }
                            });
                        });
                        if (signalingChannelRef.current) {
                            signalingChannelRef.current.send({
                                type: 'broadcast', event: 'screen-share-stop',
                                payload: { peerId: localPeerId.current },
                            }).catch(() => {});
                        }
                    };
                }
            } catch (err) {
                console.error("Failed to share screen", err);
                addToast("Screen sharing not supported or denied", "🚫");
            }
        }
    };

    const copyMeetingLink = () => {
        // Copy the full shareable URL (not just the code) so it works cross-device
        const shareUrl = `${window.location.origin}/?meet=${meetingId}`;
        navigator.clipboard.writeText(shareUrl).catch(() => {});
        setCopied(true);
        addToast('Meeting link copied!', '📋');
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
            if (compositeAnimRef.current) cancelAnimationFrame(compositeAnimRef.current);
            setIsRecording(false);
        } else if (stream) {
            recordedChunksRef.current = [];
            try {
                // Phase 4: Composite recording — capture ALL participants
                const peersList = Array.from(remotePeersRef.current.values());

                // Create hidden canvas for compositing
                let canvas = compositeCanvasRef.current;
                if (!canvas) {
                    canvas = document.createElement('canvas');
                    compositeCanvasRef.current = canvas;
                }
                canvas.width = 1280;
                canvas.height = 720;
                const ctx2d = canvas.getContext('2d')!;

                // Create hidden video elements for each peer
                const peerVideos: { video: HTMLVideoElement; name: string }[] = [];
                peersList.forEach(peer => {
                    if (peer.stream) {
                        const v = document.createElement('video');
                        v.srcObject = peer.stream;
                        v.autoplay = true;
                        v.muted = true;
                        v.playsInline = true;
                        v.play().catch(() => {});
                        peerVideos.push({ video: v, name: peer.userName });
                    }
                });

                // Draw composite frame
                const drawFrame = () => {
                    const allVideos: { video: HTMLVideoElement | null; name: string }[] = [
                        { video: videoRef.current, name: 'You' },
                        ...peerVideos,
                    ];
                    const total = allVideos.length;
                    const cols = total <= 1 ? 1 : total <= 4 ? 2 : 3;
                    const rows = Math.ceil(total / cols);
                    const cellW = canvas!.width / cols;
                    const cellH = canvas!.height / rows;

                    ctx2d.fillStyle = '#111214';
                    ctx2d.fillRect(0, 0, canvas!.width, canvas!.height);

                    allVideos.forEach(({ video, name }, i) => {
                        const col = i % cols;
                        const row = Math.floor(i / cols);
                        const x = col * cellW;
                        const y = row * cellH;

                        if (video && video.readyState >= 2) {
                            ctx2d.drawImage(video, x + 2, y + 2, cellW - 4, cellH - 4);
                        } else {
                            ctx2d.fillStyle = '#1a1b1e';
                            ctx2d.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
                        }

                        // Draw name label
                        ctx2d.fillStyle = 'rgba(0,0,0,0.6)';
                        ctx2d.fillRect(x + 4, y + cellH - 28, name.length * 9 + 16, 24);
                        ctx2d.fillStyle = '#ffffff';
                        ctx2d.font = 'bold 12px Inter, sans-serif';
                        ctx2d.fillText(name, x + 12, y + cellH - 12);
                    });

                    // Recording indicator
                    ctx2d.fillStyle = '#ef4444';
                    ctx2d.beginPath();
                    ctx2d.arc(canvas!.width - 20, 20, 6, 0, Math.PI * 2);
                    ctx2d.fill();
                    ctx2d.fillStyle = '#ffffff';
                    ctx2d.font = 'bold 10px Inter, sans-serif';
                    ctx2d.fillText('REC', canvas!.width - 52, 24);

                    compositeAnimRef.current = requestAnimationFrame(drawFrame);
                };
                drawFrame();

                // Mix all audio streams
                const audioCtx = new AudioContext();
                const destination = audioCtx.createMediaStreamDestination();

                // Add local audio
                if (stream.getAudioTracks().length > 0) {
                    const localSource = audioCtx.createMediaStreamSource(stream);
                    localSource.connect(destination);
                }

                // Add remote peer audio
                peersList.forEach(peer => {
                    if (peer.stream && peer.stream.getAudioTracks().length > 0) {
                        try {
                            const peerSource = audioCtx.createMediaStreamSource(peer.stream);
                            peerSource.connect(destination);
                        } catch {}
                    }
                });

                // Combine canvas video + mixed audio
                const canvasStream = canvas.captureStream(30);
                const compositeStream = new MediaStream([
                    ...canvasStream.getVideoTracks(),
                    ...destination.stream.getAudioTracks(),
                ]);

                const mr = new MediaRecorder(compositeStream, { 
                    mimeType: 'video/webm;codecs=vp8,opus',
                    videoBitsPerSecond: 2500000, // 2.5 Mbps
                });
                mr.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
                mr.onstop = async () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    
                    addToast('Uploading recording to cloud...', '☁️');
                    try {
                        const formData = new FormData();
                        formData.append('file', blob, `PRISM_Meeting_${meetingId}.webm`);
                        formData.append('meetingId', meetingId);
                        
                        const res = await fetch('/api/upload-recording', {
                            method: 'POST',
                            body: formData
                        });
                        const data = await res.json();
                        if (data.url) {
                            addToast('Recording saved to Vercel Blob!', '✅');
                            // Broadcast the recording link to the chat
                            if (chatChannelRef.current) {
                                chatChannelRef.current.send({
                                    type: 'broadcast', event: 'chat',
                                    payload: {
                                        id: Date.now().toString(),
                                        sender: 'System',
                                        text: `Meeting recording is available: ${data.url}`,
                                        timestamp: new Date().toISOString(),
                                        isSelf: false
                                    }
                                }).catch(() => {});
                            }
                        } else {
                            throw new Error('Upload failed');
                        }
                    } catch (e) {
                        addToast('Cloud upload failed, saving locally', '💾');
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; 
                        a.download = `PRISM_Meeting_${meetingId}_${new Date().toISOString().slice(0,10)}.webm`;
                        a.click(); 
                        URL.revokeObjectURL(url);
                    }
                    // Cleanup
                    audioCtx.close().catch(() => {});
                    peerVideos.forEach(pv => { pv.video.srcObject = null; });
                };
                mr.start(1000);
                mediaRecorderRef2.current = mr;
                setIsRecording(true);
                addToast(`Recording ${peersList.length + 1} participants`, '⏺️');
            } catch (err) { 
                console.error('Recording failed:', err);
                setIsRecording(false); 
                addToast('Recording failed', '⚠️');
            }
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

    // Pre-join camera preview — request BOTH audio+video so we can reuse the stream on join (Task 0.4)
    useEffect(() => {
        if (!inMeeting && !previewStream) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(s => {
                    // Mute audio tracks in preview so user doesn't hear themselves
                    s.getAudioTracks().forEach(t => { t.enabled = false; });
                    setPreviewStream(s);
                })
                .catch(() => {
                    // Fallback: video-only if audio denied
                    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                        .then(s => setPreviewStream(s))
                        .catch(() => {});
                });
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

    // Stop preview when joining meeting — pass preview stream for reuse (Task 0.4)
    const handleJoinWithPreviewCleanup = async () => {
        const reusableStream = previewStream;
        setPreviewStream(null);
        await handleJoinMeeting(reusableStream);
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

    // State for validated meeting (shows green "Join Now" CTA)
    const [validatedMeeting, setValidatedMeeting] = useState<{code: string; hostName: string; title: string} | null>(null);

    // Validate a meeting code against Supabase to confirm it exists & is active
    const validateMeetingCode = useCallback(async (code: string) => {
        try {
            const { data: meeting } = await supabase
                .from('meetings')
                .select('meeting_code, host_name, title, status')
                .eq('meeting_code', code)
                .maybeSingle();

            if (meeting && meeting.status === 'active') {
                setValidatedMeeting({ code: meeting.meeting_code, hostName: meeting.host_name, title: meeting.title });
            }
            // Even if not found in DB (host hasn't persisted yet), still set the ID
            // so the user can join — the meeting row gets created when the host joins
            setMeetingId(code);
        } catch (err) {
            console.warn('[Meetings] Failed to validate meeting code:', err);
            setMeetingId(code);
        }
    }, []);

    // ─── React to pendingMeetCode prop (from URL or internal "Join Now" click) ───
    // This is the SINGLE entry point for meeting codes. No more DOM events.
    // Inspired by Google Meet / Zoom: state flows down via props, never via events.
    const lastConsumedCode = useRef<string | null>(null);
    
    useEffect(() => {
        if (!pendingMeetCode) return;
        // Don't re-process the same code on re-renders
        if (lastConsumedCode.current === pendingMeetCode) return;
        lastConsumedCode.current = pendingMeetCode;
        
        // If already in a meeting, don't override
        if (inMeeting) return;
        
        validateMeetingCode(pendingMeetCode);
    }, [pendingMeetCode, inMeeting, validateMeetingCode]);

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
                <div className="absolute top-0 left-0 right-0 z-20 bg-black/40 backdrop-blur-xl border-b border-white/10">
                    {/* Single unified row — items constrained & overflow-hidden */}
                    <div className="flex items-center justify-between px-2 md:px-4 py-2 md:py-3 gap-2">
                        {/* LEFT: recording badge + meeting ID */}
                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
                            {isRecording && (
                                <div className="bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-lg flex items-center gap-1 text-[9px] md:text-xs font-bold text-red-400 animate-pulse flex-shrink-0">
                                    <Circle size={7} className="fill-red-400" /> REC
                                </div>
                            )}
                            {/* Participant count pill */}
                            <div className="bg-white/8 border border-white/10 px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold text-white/70 flex-shrink-0">
                                <Users size={10} />
                                <span>{1 + remotePeers.size}</span>
                            </div>
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

                {/* Video Grid */}
                <div className="flex-1 flex items-center justify-center p-2 md:p-6 pt-14 md:pt-20 pb-24 md:pb-28 overflow-hidden">
                    {(() => {
                        const peersList = Array.from(remotePeers.values());
                        const totalCount = 1 + peersList.length;
                        
                        // Check if anyone is screen sharing
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
                            <div className={clsx(
                                "w-full h-full grid gap-2 md:gap-4 max-w-7xl mx-auto overflow-hidden",
                                !isSpotlight && totalCount > 6 ? "overflow-y-auto custom-scrollbar auto-rows-[minmax(180px,1fr)] md:auto-rows-fr" : "auto-rows-fr",
                                isSpotlight 
                                    ? "grid-rows-[minmax(0,2fr)_minmax(0,1fr)] md:grid-cols-3 md:grid-rows-3"
                                    : gridCols
                            )}>
                                {/* --- SPOTLIGHT SCREEN SHARE --- */}
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

                                {/* --- LOCAL PARTICIPANT TILE --- */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={clsx(
                                        "relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-[#111214] flex items-center justify-center group min-h-0",
                                        isSpotlight ? "col-span-1 row-span-1 md:col-span-1 md:row-span-1" : "w-full h-full"
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
                                            <div className="w-16 h-16 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-2 md:mb-4 bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                                                <UserAvatar name={userName} avatarUrl={userAvatar} size={88} rounded="full" className="w-12 h-12 md:w-[88px] md:h-[88px]" />
                                            </div>
                                            <p className="text-white/40 text-[10px] md:text-xs font-medium">{userName} (You)</p>
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-full">
                                            {/* Virtual background layer (shown behind video with mix-blend) */}
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
                                                className="w-full h-full object-cover transform -scale-x-100 relative z-10"
                                                style={{
                                                    filter: [
                                                        backgroundBlur === 'Light' ? 'blur(0px)' : backgroundBlur === 'Heavy' ? 'blur(0px)' : '',
                                                        lowLightMode ? 'brightness(1.3) contrast(1.05)' : '',
                                                        studioLighting ? 'contrast(1.15) saturate(1.1)' : '',
                                                    ].filter(Boolean).join(' ') || undefined,
                                                    // Use mix-blend to create a virtual background effect
                                                    mixBlendMode: selectedBg !== null ? 'normal' : undefined,
                                                }}
                                            />
                                            {/* Background blur overlay effect - shown as vignette border */}
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

                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2 md:p-4 flex justify-between items-end">
                                        <div className="flex gap-1.5 items-center">
                                            <div className="bg-black/60 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/10 flex items-center gap-1.5 md:gap-2">
                                                {audioEnabled && audioLevel > 0.05 && (
                                                    <div className="flex gap-0.5 items-end h-2 md:h-3">
                                                        {[0, 1, 2].map(i => (
                                                            <div key={i} className="w-0.5 bg-blue-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(3, audioLevel * 12 * (i === 1 ? 1 : 0.6))}px` }} />
                                                        ))}
                                                    </div>
                                                )}
                                                <span className="text-[10px] md:text-xs font-bold font-google text-white/90">You</span>
                                                {activeSpeaker === 'local' && (
                                                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider">Speaking</span>
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

                                {/* --- REMOTE PEERS TILES --- */}
                                {peersList.map((peer) => {
                                    const isConnecting = peer.pc.connectionState === 'new' || peer.pc.connectionState === 'connecting';
                                    const peerAudioLevel = remoteAudioLevels.get(peer.odei) || 0;
                                    const isSpeaking = peer.audioEnabled && peerAudioLevel > 0.05;
                                    return (
                                    <motion.div 
                                        key={peer.odei}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={clsx(
                                            "relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-[#111214] flex items-center justify-center group min-h-0",
                                            isSpotlight ? "col-span-1 row-span-1 md:col-span-1 md:row-span-1" : "w-full h-full"
                                        )}
                                        style={{
                                            boxShadow: isSpeaking
                                                ? `0 0 ${20 + peerAudioLevel * 40}px rgba(34,197,94,${0.1 + peerAudioLevel * 0.3})`
                                                : undefined,
                                            border: isSpeaking
                                                ? `2px solid rgba(34,197,94,${0.2 + peerAudioLevel * 0.5})`
                                                : '1px solid rgba(255,255,255,0.05)',
                                            transition: 'box-shadow 75ms, border 75ms'
                                        }}
                                    >
                                        {/* Task 0.6: Skeleton shimmer while WebRTC negotiation happens */}
                                        {isConnecting ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111214]">
                                                <div className="w-16 h-16 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-2 md:mb-4 bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-white/10 relative overflow-hidden">
                                                    <UserAvatar name={peer.userName} avatarUrl={peer.avatarUrl} size={88} rounded="full" className="w-12 h-12 md:w-[88px] md:h-[88px]" />
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" style={{ animationName: 'shimmer', transform: 'translateX(-100%)' }} />
                                                </div>
                                                <p className="text-white/40 text-[10px] md:text-xs font-medium">{peer.userName}</p>
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                                    <span className="text-[9px] text-blue-400/70 font-medium">Connecting...</span>
                                                </div>
                                            </div>
                                        ) : !peer.videoEnabled || !peer.stream ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111214]">
                                                <div className="w-16 h-16 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-2 md:mb-4 bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-white/10">
                                                    <UserAvatar name={peer.userName} avatarUrl={peer.avatarUrl} size={88} rounded="full" className="w-12 h-12 md:w-[88px] md:h-[88px]" />
                                                </div>
                                                <p className="text-white/40 text-[10px] md:text-xs font-medium">{peer.userName}</p>
                                            </div>
                                        ) : (
                                            <video 
                                                autoPlay playsInline 
                                                className="w-full h-full object-cover transform -scale-x-100"
                                                ref={el => { if (el && el.srcObject !== peer.stream) el.srcObject = peer.stream; }}
                                            />
                                        )}

                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2 md:p-4 flex justify-between items-end">
                                            <div className="flex gap-1.5 items-center">
                                                <div className="bg-black/60 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/10 flex items-center gap-1.5 md:gap-2">
                                                    {/* Task 1.2: Remote speaking indicator bars */}
                                                    {isSpeaking && (
                                                        <div className="flex gap-0.5 items-end h-2 md:h-3">
                                                            {[0, 1, 2].map(i => (
                                                                <div key={i} className="w-0.5 bg-green-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(3, peerAudioLevel * 12 * (i === 1 ? 1 : 0.6))}px` }} />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <span className="text-[10px] md:text-xs font-bold font-google text-white/90">{peer.userName}</span>
                                                    {activeSpeaker === peer.odei && (
                                                        <span className="text-[8px] font-bold text-green-400 uppercase tracking-wider">Speaking</span>
                                                    )}
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
                                })}
                            </div>
                        );
                    })()}
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
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-5 gap-x-3">
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
                    className="absolute bottom-0 left-0 right-0 z-30 flex justify-center pb-3 md:pb-6 px-3 w-full"
                    style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
                >
                    <div className="flex items-center justify-between md:justify-center w-full max-w-fit gap-1 md:gap-2 bg-black/50 backdrop-blur-3xl border border-white/10 px-3 md:px-5 py-2.5 md:py-3.5 rounded-[2rem] shadow-[0_-4px_24px_rgba(0,0,0,0.4),0_8px_32px_rgba(0,0,0,0.5)] mx-auto transition-all duration-300">
                        
                        <button aria-label={audioEnabled ? "Mute" : "Unmute"} onClick={() => {
                            setAudioEnabled(!audioEnabled);
                            if (liveKitRoomRef.current) liveKitRoomRef.current.localParticipant.setMicrophoneEnabled(!audioEnabled);
                        }} className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", audioEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]")}>
                            {audioEnabled ? <Mic size={16} className="md:hidden" /> : <MicOff size={16} className="md:hidden" />}
                            {audioEnabled ? <Mic size={18} className="hidden md:block" /> : <MicOff size={18} className="hidden md:block" />}
                        </button>
                        
                        <button aria-label={videoEnabled ? "Camera off" : "Camera on"} onClick={() => {
                            setVideoEnabled(!videoEnabled);
                            if (liveKitRoomRef.current) liveKitRoomRef.current.localParticipant.setCameraEnabled(!videoEnabled);
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
                            {polls.some(p => p.isActive) && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse" />}
                        </button>

                        {/* Both mobile+desktop: People & Chat */}
                        <button aria-label="People" onClick={() => setShowSidebar(showSidebar === 'people' ? null : 'people')} className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'people' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <Users size={16} className="md:hidden" />
                            <Users size={18} className="hidden md:block" />
                            {/* Task 1.3: Participant count badge */}
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 border-2 border-[#1a1b1e]">
                                {1 + remotePeers.size}
                            </span>
                        </button>
                        <button aria-label="Chat" onClick={() => setShowSidebar(showSidebar === 'chat' ? null : 'chat')} className={clsx("p-2 md:p-3.5 rounded-2xl transition-all duration-300 relative group flex-shrink-0", showSidebar === 'chat' ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <MessageSquare size={16} className="md:hidden" />
                            <MessageSquare size={18} className="hidden md:block" />
                        </button>

                        {/* Mobile More button */}
                        <button aria-label="More options" onClick={() => setShowMobileMore(!showMobileMore)} className={clsx("md:hidden p-3 rounded-2xl transition-all duration-300 flex-shrink-0 relative group", showMobileMore ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
                            <MoreHorizontal size={18} />
                            {handRaised && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-[#1a1b1e]" />}
                        </button>

                        <div className="w-px h-6 md:h-7 bg-white/20 mx-1 md:mx-2 flex-shrink-0" />

                        <button aria-label="Leave meeting" onClick={handleLeaveMeeting} className="px-3 md:px-5 py-2.5 md:py-3.5 rounded-2xl bg-red-500 text-white font-bold transition-all duration-300 hover:bg-red-600 hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-1.5 md:gap-2 flex-shrink-0 text-sm">
                            <PhoneOff size={16} className="md:hidden" />
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
                            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#1a1b1e] border border-white/10 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7)] w-[90%] max-w-md"
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
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
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
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
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
            <AnimatePresence>
                {showSidebar && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 z-40 bg-black/40 md:hidden" 
                            onClick={() => setShowSidebar(null)} 
                        />
                        <motion.div 
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 35, stiffness: 400 }}
                            className="absolute bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:inset-auto md:right-0 md:top-0 md:h-full z-50 md:z-40 w-full md:w-80 lg:w-96 bg-black/60 md:bg-[#0c0d0f]/98 backdrop-blur-3xl md:backdrop-blur-none border-t md:border-t-0 md:border-l border-white/10 rounded-t-3xl md:rounded-none flex flex-col shadow-[0_-8px_32px_rgba(0,0,0,0.6)] md:shadow-[-10px_0_30px_rgba(0,0,0,0.5)] max-h-[85vh] md:max-h-full"
                        >
                            {/* Drag handle for mobile */}
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2 md:hidden flex-shrink-0" />
                            
                            <div className="px-4 pb-4 pt-2 md:p-5 border-b border-white/10 flex justify-between items-center bg-white/5 md:bg-transparent">
                                <h3 className="font-google font-bold text-base md:text-lg flex items-center gap-2 text-white">
                                    {showSidebar === 'effects' ? <><Sparkles size={18} className="text-purple-400" /> Visual Effects</> : 
                                     showSidebar === 'chat' ? <><MessageSquare size={18} className="text-blue-400" /> Meeting Chat</> : 
                                     showSidebar === 'notes' ? <><FileText size={18} className="text-emerald-400" /> Quick Notes</> : 
                                     showSidebar === 'files' ? <><Paperclip size={18} className="text-amber-400" /> Shared Files</> :
                                     showSidebar === 'polls' ? <><BarChart3 size={18} className="text-blue-400" /> Polls & Q&A</> :
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

                            {showSidebar === 'polls' && (
                                <div className="flex flex-col h-full animate-fade-in">
                                    {/* Polls/Q&A Tabs */}
                                    <div className="flex bg-white/5 rounded-xl p-1 mb-3 flex-shrink-0">
                                        <button
                                            onClick={() => setPollsTab('polls')}
                                            className={clsx(
                                                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                                pollsTab === 'polls' ? "bg-blue-500/20 text-blue-400" : "text-white/50 hover:text-white/70"
                                            )}
                                        >
                                            <BarChart3 size={14} /> Polls {polls.length > 0 && <span className="bg-blue-500/30 px-1.5 rounded-full text-[10px]">{polls.length}</span>}
                                        </button>
                                        <button
                                            onClick={() => setPollsTab('qa')}
                                            className={clsx(
                                                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                                pollsTab === 'qa' ? "bg-purple-500/20 text-purple-400" : "text-white/50 hover:text-white/70"
                                            )}
                                        >
                                            <MessageCircleQuestion size={14} /> Q&A {questions.length > 0 && <span className="bg-purple-500/30 px-1.5 rounded-full text-[10px]">{questions.length}</span>}
                                        </button>
                                    </div>

                                    {pollsTab === 'polls' ? (
                                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                            {/* Create Poll Button / Form */}
                                            {!showPollCreator ? (
                                                <button
                                                    onClick={() => setShowPollCreator(true)}
                                                    className="w-full border-2 border-dashed border-white/15 hover:border-blue-500/50 rounded-2xl p-4 text-center transition-all hover:bg-blue-500/5 group"
                                                >
                                                    <Plus size={20} className="mx-auto mb-1 text-white/40 group-hover:text-blue-400 transition-colors" />
                                                    <p className="text-xs font-bold text-white/50 group-hover:text-blue-400">Create Poll</p>
                                                </button>
                                            ) : (
                                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-bold text-blue-400">New Poll</h4>
                                                        <button onClick={() => setShowPollCreator(false)} className="text-white/40 hover:text-white/70">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    <input
                                                        value={newPollQuestion}
                                                        onChange={e => setNewPollQuestion(e.target.value)}
                                                        placeholder="Ask a question..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                                                    />
                                                    {newPollOptions.map((opt, i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <input
                                                                value={opt}
                                                                onChange={e => {
                                                                    const newOpts = [...newPollOptions];
                                                                    newOpts[i] = e.target.value;
                                                                    setNewPollOptions(newOpts);
                                                                }}
                                                                placeholder={`Option ${i + 1}`}
                                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                                                            />
                                                            {newPollOptions.length > 2 && (
                                                                <button
                                                                    onClick={() => setNewPollOptions(prev => prev.filter((_, j) => j !== i))}
                                                                    className="text-white/30 hover:text-red-400 p-1"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {newPollOptions.length < 6 && (
                                                        <button
                                                            onClick={() => setNewPollOptions(prev => [...prev, ''])}
                                                            className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                                                        >
                                                            <Plus size={12} /> Add option
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={createPoll}
                                                        disabled={!newPollQuestion.trim() || newPollOptions.filter(o => o.trim()).length < 2}
                                                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/30 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                                                    >
                                                        Launch Poll
                                                    </button>
                                                </div>
                                            )}

                                            {/* Poll List */}
                                            {polls.length === 0 && !showPollCreator && (
                                                <div className="h-48 flex flex-col items-center justify-center text-center opacity-50">
                                                    <BarChart3 size={28} className="text-white mb-3" />
                                                    <p className="text-sm font-bold mb-1">No polls yet</p>
                                                    <p className="text-xs text-white/50 max-w-[200px]">Create a poll to gather feedback from participants.</p>
                                                </div>
                                            )}

                                            {polls.map(poll => {
                                                const totalVotes = Array.from(poll.votes.values()).reduce((a, b) => a + b, 0);
                                                return (
                                                    <div key={poll.id} className={clsx(
                                                        "border rounded-2xl p-4 space-y-3",
                                                        poll.isActive ? "bg-blue-500/5 border-blue-500/20" : "bg-white/5 border-white/10 opacity-70"
                                                    )}>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-white">{poll.question}</h4>
                                                                <p className="text-[10px] text-white/40 mt-0.5">{poll.createdBy} · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
                                                            </div>
                                                            {poll.isActive && poll.createdBy === userName && (
                                                                <button onClick={() => endPoll(poll.id)} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded-lg font-bold hover:bg-red-500/20 flex-shrink-0">
                                                                    End
                                                                </button>
                                                            )}
                                                            {!poll.isActive && (
                                                                <span className="text-[10px] bg-white/10 text-white/50 px-2 py-1 rounded-lg font-bold flex-shrink-0">Ended</span>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {poll.options.map((option, i) => {
                                                                const count = poll.votes.get(String(i)) || 0;
                                                                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                                                const isMyVote = poll.myVote === i;
                                                                return (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => poll.isActive && poll.myVote === null && votePoll(poll.id, i)}
                                                                        disabled={!poll.isActive || poll.myVote !== null}
                                                                        className={clsx(
                                                                            "w-full text-left rounded-xl p-2.5 border transition-all relative overflow-hidden",
                                                                            isMyVote ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/5",
                                                                            poll.isActive && poll.myVote === null ? "hover:bg-blue-500/10 hover:border-blue-500/30 cursor-pointer" : "cursor-default"
                                                                        )}
                                                                    >
                                                                        {/* Progress bar */}
                                                                        {(poll.myVote !== null || !poll.isActive) && (
                                                                            <div
                                                                                className="absolute inset-y-0 left-0 bg-blue-500/10 transition-all duration-500"
                                                                                style={{ width: `${pct}%` }}
                                                                            />
                                                                        )}
                                                                        <div className="relative flex items-center justify-between">
                                                                            <span className="text-xs font-medium text-white flex items-center gap-1.5">
                                                                                {isMyVote && <Check size={12} className="text-blue-400" />}
                                                                                {option}
                                                                            </span>
                                                                            {(poll.myVote !== null || !poll.isActive) && (
                                                                                <span className="text-[10px] font-bold text-white/60">{pct}%</span>
                                                                            )}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        /* Q&A Tab */
                                        <div className="flex flex-col h-full">
                                            {/* Question input */}
                                            <div className="flex gap-2 mb-3 flex-shrink-0">
                                                <input
                                                    value={newQuestionText}
                                                    onChange={e => setNewQuestionText(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && submitQuestion()}
                                                    placeholder="Ask a question..."
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                                                />
                                                <button
                                                    onClick={submitQuestion}
                                                    disabled={!newQuestionText.trim()}
                                                    className="bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:text-white/30 text-white px-3 rounded-xl transition-colors flex-shrink-0"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>

                                            {/* Questions list */}
                                            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                                {questions.length === 0 && (
                                                    <div className="h-48 flex flex-col items-center justify-center text-center opacity-50">
                                                        <MessageCircleQuestion size={28} className="text-white mb-3" />
                                                        <p className="text-sm font-bold mb-1">No questions yet</p>
                                                        <p className="text-xs text-white/50 max-w-[200px]">Ask a question and participants can upvote it.</p>
                                                    </div>
                                                )}
                                                {[...questions]
                                                    .sort((a, b) => b.upvotes - a.upvotes)
                                                    .map(q => (
                                                        <div key={q.id} className={clsx(
                                                            "border rounded-2xl p-3 transition-all",
                                                            q.isAnswered ? "bg-green-500/5 border-green-500/20 opacity-70" : "bg-white/5 border-white/10"
                                                        )}>
                                                            <div className="flex gap-3">
                                                                {/* Upvote button */}
                                                                <button
                                                                    onClick={() => !q.hasUpvoted && !q.isAnswered && upvoteQuestion(q.id)}
                                                                    disabled={q.hasUpvoted || q.isAnswered}
                                                                    className={clsx(
                                                                        "flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg transition-all flex-shrink-0",
                                                                        q.hasUpvoted ? "text-purple-400 bg-purple-500/10" : "text-white/40 hover:text-purple-400 hover:bg-purple-500/10"
                                                                    )}
                                                                >
                                                                    <ThumbsUp size={14} />
                                                                    <span className="text-[10px] font-bold">{q.upvotes}</span>
                                                                </button>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm text-white font-medium">{q.text}</p>
                                                                    <p className="text-[10px] text-white/40 mt-1">{q.askedBy}</p>
                                                                </div>
                                                                {/* Mark as answered (host action) */}
                                                                {!q.isAnswered ? (
                                                                    <button
                                                                        onClick={() => markQuestionAnswered(q.id)}
                                                                        className="text-white/30 hover:text-green-400 p-1 flex-shrink-0 self-start"
                                                                        title="Mark as answered"
                                                                    >
                                                                        <Check size={14} />
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-green-400 flex-shrink-0 self-start mt-1">Answered ✓</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
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
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
