import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { getAuthHeaders } from '../../services/authHeaders';
import { useAuth } from '../../contexts/AuthContext';
import { Room, RoomEvent, VideoPresets, LocalParticipant, RemoteParticipant, RemoteTrackPublication, RemoteTrack, Track } from 'livekit-client';
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';
import { KrispNoiseFilter } from '@livekit/krisp-noise-filter';
import type {
    MeetingMessage, MeetingFile, FloatingReaction,
    MeetingPoll, MeetingQuestion, RemotePeer,
    SidebarTab, BlurLevel, ConnectionQuality, LayoutMode, MeetingEngine
} from './types';
import { ICE_SERVERS, REACTION_EMOJIS, getTimeGreeting } from './types';

// Shared AudioContext Singleton for performance and avoiding hardware echo paths
let globalAudioCtx: AudioContext | null = null;
export function getSharedAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!globalAudioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            globalAudioCtx = new AudioContextClass();
        }
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
}

export function useMeetingEngine(pendingMeetCode?: string) {

    const { user } = useAuth();
    const userName = user?.name || 'You';
    const userAvatar = (user as any)?.avatarUrl || null;
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenShared, setScreenShared] = useState(false);
    const [showSidebar, setShowSidebar] = useState<'chat' | 'people' | 'effects' | 'notes' | 'files' | 'polls' | null>(null);
    const [showMobileMore, setShowMobileMore] = useState(false);
    const [layout, setLayout] = useState<LayoutMode>('bubbles');
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
    const krispFilterRef = useRef<any | null>(null);
    const blurFilterRef = useRef<any | null>(null);
    const virtualBgFilterRef = useRef<any | null>(null);

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
        // Tear down existing signaling channel if any
        if (signalingChannelRef.current) {
            supabase.removeChannel(signalingChannelRef.current).catch(() => {});
            signalingChannelRef.current = null;
        }

        const useLiveKit = !!(import.meta as any).env.VITE_LIVEKIT_URL;
        if (useLiveKit) {
            try {
                // BUG-09 FIX: 5 second timeout on token fetch — prevents indefinite hang on cold starts
                const response = await fetch('/api/livekit-token', {
                    method: 'POST',
                    headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ roomName: mid, participantName: userName }),
                    signal: AbortSignal.timeout(5000),
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

                    // Add participant connected listener so they show up immediately
                    room.on(RoomEvent.ParticipantConnected, (participant) => {
                        const pid = participant.identity;
                        if (!remotePeersRef.current.has(pid)) {
                            const peerData: RemotePeer = {
                                odei: pid, userName: participant.name || pid, avatarUrl: undefined, pc: null as any,
                                stream: null, screenStream: null,
                                audioEnabled: participant.isMicrophoneEnabled, videoEnabled: participant.isCameraEnabled, handRaised: false
                            };
                            remotePeersRef.current.set(pid, peerData);
                            setRemotePeers(new Map(remotePeersRef.current));
                        }
                    });

                    room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
                        const pid = participant.identity;
                        const isScreen = track.source === Track.Source.ScreenShare;
                        
                        // Register peer FIRST if not yet known (prevents race condition
                        // where updatePeer silently drops the first track)
                        if (!remotePeersRef.current.has(pid)) {
                            const peerData: RemotePeer = {
                                odei: pid, userName: participant.name || pid, avatarUrl: undefined, pc: null as any,
                                stream: null, screenStream: null,
                                audioEnabled: participant.isMicrophoneEnabled, videoEnabled: participant.isCameraEnabled, handRaised: false
                            };
                            remotePeersRef.current.set(pid, peerData);
                            setRemotePeers(new Map(remotePeersRef.current));
                        }

                        // Now safely add the track to the registered peer
                        updatePeer(pid, p => {
                            if (isScreen) {
                                let stream = p.screenStream;
                                if (!stream) {
                                    stream = new MediaStream();
                                }
                                stream.getTracks().forEach(t => {
                                    if (t.kind === track.kind) {
                                        stream?.removeTrack(t);
                                    }
                                });
                                stream.addTrack(track.mediaStreamTrack);
                                return { ...p, screenStream: new MediaStream(stream.getTracks()) };
                            } else {
                                let stream = p.stream;
                                if (!stream) {
                                    stream = new MediaStream();
                                }
                                stream.getTracks().forEach(t => {
                                    if (t.kind === track.kind) {
                                        stream?.removeTrack(t);
                                    }
                                });
                                stream.addTrack(track.mediaStreamTrack);
                                return { ...p, stream: new MediaStream(stream.getTracks()) };
                            }
                        });
                    });
                    room.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
                        const pid = participant.identity;
                        const isScreen = track.source === Track.Source.ScreenShare;
                        
                        updatePeer(pid, p => {
                            if (isScreen) {
                                const stream = p.screenStream;
                                if (stream) {
                                    const t = stream.getTracks().find(x => x.kind === track.kind);
                                    if (t) stream.removeTrack(t);
                                    if (stream.getTracks().length === 0) {
                                        return { ...p, screenStream: null };
                                    }
                                    return { ...p, screenStream: new MediaStream(stream.getTracks()) };
                                }
                                return p;
                            } else {
                                const stream = p.stream;
                                if (stream) {
                                    const t = stream.getTracks().find(x => x.kind === track.kind);
                                    if (t) stream.removeTrack(t);
                                    if (stream.getTracks().length === 0) {
                                        return { ...p, stream: null };
                                    }
                                    return { ...p, stream: new MediaStream(stream.getTracks()) };
                                }
                                return p;
                            }
                        });
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
                console.error("[LiveKit] Connection failed, falling back to WebRTC Mesh", err);
                liveKitRoomRef.current = null; // Clean fallback: ensure mesh signaling activates
            }
        }

        const channelName = `prism-meet-signal:${mid}`;
        const ch = supabase.channel(channelName, { config: { broadcast: { self: false } } });

        ch.on('broadcast', { event: 'peer-join' }, async (payload: any) => {
            // ECHO FIX: Skip WebRTC mesh peer creation when LiveKit SFU is handling connections
            if (liveKitRoomRef.current) return;
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
            if (liveKitRoomRef.current) return; // ECHO FIX: mesh bypass
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
            if (liveKitRoomRef.current) return; // ECHO FIX: mesh bypass
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
            if (liveKitRoomRef.current) return; // ECHO FIX: mesh bypass
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
            if (liveKitRoomRef.current) return; // ECHO FIX: mesh bypass
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

        let reconnectTimeout: any = null;
        ch.subscribe((status: string, err?: any) => {
            if (status === 'SUBSCRIBED') {
                console.log(`[Signaling] Subscribed to signaling channel ${channelName}`);
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

                // BUG-08 FIX: Async backoff re-announce — no recursive closures / memory leak
                let stopReAnnounce = false;
                const reAnnounceDelays = [1000, 3000, 8000, 15000];
                const runBackoffAnnounce = async () => {
                    for (const delay of reAnnounceDelays) {
                        await new Promise<void>(r => setTimeout(r, delay));
                        if (stopReAnnounce) return;
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
                };
                runBackoffAnnounce();
                // Expose stop signal on channel for cleanup in handleLeaveMeeting
                (ch as any).__stopReAnnounce = () => { stopReAnnounce = true; };
                (ch as any).__reAnnounceTimeout = null; // legacy compat
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.warn(`[Signaling] Channel status: ${status}. Reconnecting in 3s...`, err);
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(() => {
                    if (localStreamRef.current && signalingChannelRef.current === ch) {
                        setupSignaling(mid);
                    }
                }, 3000);
            }
        });

        signalingChannelRef.current = ch;
    }, [createPeerConnection, userName, userAvatar, updatePeer]);

    // Broadcast local media state to all peers
    const broadcastMediaState = useCallback((overrides?: { audioEnabled?: boolean; videoEnabled?: boolean; handRaised?: boolean }) => {
        if (signalingChannelRef.current) {
            const senderId = liveKitRoomRef.current ? (user?.id || localPeerId.current) : localPeerId.current;
            signalingChannelRef.current.send({
                type: 'broadcast',
                event: 'media-state',
                payload: {
                    peerId: senderId,
                    audioEnabled: overrides?.audioEnabled ?? audioEnabled,
                    videoEnabled: overrides?.videoEnabled ?? videoEnabled,
                    handRaised: overrides?.handRaised ?? handRaised,
                },
            }).catch(() => {});
        }
    }, [audioEnabled, videoEnabled, handRaised, user?.id]);

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
                        const audioStream = await navigator.mediaDevices.getUserMedia({
                            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                        });
                        audioStream.getAudioTracks().forEach(t => reusableStream.addTrack(t));
                    } catch { /* proceed without audio */ }
                }
                mediaStream = reusableStream;
                console.log(`[Perf] Reused preview stream (+${(performance.now() - t0).toFixed(0)}ms)`);
            } else {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                });
                console.log(`[Perf] Fresh getUserMedia (+${(performance.now() - t0).toFixed(0)}ms)`);
            }

            setStream(mediaStream);
            localStreamRef.current = mediaStream;
            setInMeeting(true);

            // Task 0.2: Run chat channel + signaling + DB persist IN PARALLEL
            const chatSetup = () => {
                const broadcastName = `prism-meet-chat:${mid}`;
                // Clean up previous chat channel
                if (chatChannelRef.current) {
                    supabase.removeChannel(chatChannelRef.current).catch(() => {});
                }
                const ch = supabase.channel(broadcastName, { config: { broadcast: { self: false } } });
                let reconnectTimeout: any = null;
                
                ch.on('broadcast', { event: 'chat' }, (payload: any) => {
                    const msg = payload.payload as MeetingMessage;
                    setChatMessages(prev => [...prev, { ...msg, timestamp: new Date(msg.timestamp), isSelf: false }]);
                }).on('broadcast', { event: 'file-share' }, (payload: any) => {
                    const f = payload.payload;
                    setMeetingFiles(prev => [...prev, { ...f, timestamp: new Date(f.timestamp) }]);
                }).subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`[Chat] Subscribed to chat channel ${broadcastName}`);
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        console.warn(`[Chat] Chat channel status: ${status}. Reconnecting in 3s...`, err);
                        if (reconnectTimeout) clearTimeout(reconnectTimeout);
                        reconnectTimeout = setTimeout(() => {
                            if (localStreamRef.current && chatChannelRef.current === ch) {
                                chatSetup();
                            }
                        }, 3000);
                    }
                });
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
            // Stop backoff re-announce loop (BUG-08 fix)
            if ((signalingChannelRef.current as any).__stopReAnnounce) {
                (signalingChannelRef.current as any).__stopReAnnounce();
            }
            // Legacy compat: clear old-style timeout if present
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

    // Centralized audio level and active speaker tracking loop
    useEffect(() => {
        if (!inMeeting) return;

        let intervalId = setInterval(async () => {
            const newLevels = new Map<string, number>();
            let loudestPeerId: string | null = null;
            let maxLevel = 0.05; // threshold to trigger speaking

            // 1. LiveKit Room Polling
            if (liveKitRoomRef.current) {
                // Handle active speaker and remote audio levels for LiveKit
                liveKitRoomRef.current.remoteParticipants.forEach(participant => {
                    const level = participant.audioLevel; // 0 to 1
                    const pid = participant.identity;
                    if (level > 0.05) {
                        newLevels.set(pid, level);
                        if (level > maxLevel) {
                            maxLevel = level;
                            loudestPeerId = pid;
                        }
                    }
                });
            } 
            // 2. WebRTC Mesh fallback polling
            else {
                // Poll each remote peer's RTCPeerConnection stats
                for (const [peerId, peer] of Array.from(remotePeersRef.current.entries())) {
                    if (!peer.pc || peer.pc.connectionState === 'closed') continue;
                    try {
                        const stats = await peer.pc.getStats();
                        stats.forEach(report => {
                            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                                const level = report.audioLevel || 0; // 0.0 to 1.0
                                if (level > 0.05) {
                                    newLevels.set(peerId, level);
                                    if (level > maxLevel) {
                                        maxLevel = level;
                                        loudestPeerId = peerId;
                                    }
                                }
                            }
                        });
                    } catch (e) {
                        // ignore failed stats
                    }
                }
            }

            setRemoteAudioLevels(newLevels);
            
            // Only update activeSpeaker for remote peers if a remote peer is loudest.
            // Local speaker detection is still handled responsively in LocalTile via ref
            if (loudestPeerId) {
                setActiveSpeaker(loudestPeerId);
            } else {
                // If no remote peer is speaking, check if the activeSpeaker was a remote peer, and clear it.
                // Leave 'local' active speaker state alone (it is managed by LocalTile's debounce)
                setActiveSpeaker(prev => (prev && prev !== 'local' ? null : prev));
            }
        }, 150);

        return () => clearInterval(intervalId);
    }, [inMeeting, setActiveSpeaker]);

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

        recognition.onresult = (event: any) => {
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

        recognition.onerror = (event: any) => {
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

    // Audio level states kept to satisfy the returned object type contract
    const [remoteAudioLevels, setRemoteAudioLevels] = useState<Map<string, number>>(new Map());
    const remoteAudioRefs = useRef<Map<string, any>>(new Map());
    const remotePeerIdKey = Array.from(remotePeers.keys()).sort().join(',');

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

                // Update our local stream preview state with the newly switched track from LiveKit
                const pub = Array.from(liveKitRoomRef.current.localParticipant.videoTrackPublications.values())
                    .find(p => kind === 'audio' ? p.source === Track.Source.Microphone : p.source === Track.Source.Camera);
                if (pub && pub.track && pub.track.mediaStreamTrack) {
                    const newTrack = pub.track.mediaStreamTrack;
                    if (stream) {
                        const oldTrack = kind === 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
                        if (oldTrack) {
                            stream.removeTrack(oldTrack);
                        }
                        stream.addTrack(newTrack);
                        setStream(new MediaStream(stream.getTracks()));
                    }
                }
                
                addToast(`Switched ${kind} device`, kind === 'audio' ? '🎤' : '📷');
                return;
            }

            // WebRTC Mesh fallback logic
            if (!stream) return;

            // Stop the old track FIRST on mobile/Safari to prevent device hardware lock conflicts
            const oldTrack = kind === 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
            if (oldTrack) {
                oldTrack.stop();
                stream.removeTrack(oldTrack);
            }

            const constraints = kind === 'audio'
                ? { audio: { deviceId: { exact: deviceId }, noiseSuppression, echoCancellation: true, autoGainControl: true }, video: false }
                : { audio: false, video: { deviceId: { exact: deviceId } } };
            
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newTrack = newStream.getTracks()[0];

            if (newTrack) {
                stream.addTrack(newTrack);
                
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

    const handleFlipCamera = useCallback(async () => {
        if (availableDevices.videoin.length < 2) {
            addToast('No alternative camera found to flip', '⚠️');
            return;
        }

        // Try to find current active video device ID
        let currentDeviceId = selectedVideoIn;
        if (stream) {
            const currentTrack = stream.getVideoTracks()[0];
            if (currentTrack) {
                const settings = currentTrack.getSettings();
                if (settings.deviceId) {
                    currentDeviceId = settings.deviceId;
                }
            }
        }

        // Cycle to next video input device
        let idx = availableDevices.videoin.findIndex(d => d.deviceId === currentDeviceId);
        
        // Robust fallback: if index not found via deviceId, check if facingMode matches labels
        if (idx === -1 && stream) {
            const currentTrack = stream.getVideoTracks()[0];
            const currentFacing = currentTrack?.getSettings()?.facingMode;
            if (currentFacing) {
                idx = availableDevices.videoin.findIndex(d => {
                    const label = d.label.toLowerCase();
                    if (currentFacing === 'user') {
                        return label.includes('front') || label.includes('user') || label.includes('facing front');
                    } else {
                        return label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('facing back');
                    }
                });
            }
        }

        const nextIdx = idx === -1 ? 1 : (idx + 1) % availableDevices.videoin.length;
        const nextDevice = availableDevices.videoin[nextIdx];

        if (nextDevice) {
            await switchDevice('video', nextDevice.deviceId);
        } else {
            addToast('No alternative camera found', '⚠️');
        }
    }, [stream, availableDevices, selectedVideoIn, switchDevice, addToast]);



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
                    await liveKitRoomRef.current.localParticipant.publishTrack(screenTrack, { source: 'screen_share' as any });
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
                            headers: await getAuthHeaders(),
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
            navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            })
                .then(s => {
                    // Keep audio tracks ENABLED — the `muted` attribute on the video element
                    // prevents local echo without disabling the hardware track.
                    // Disabling the track at hardware level can prevent it from being
                    // re-activated on iOS Safari when reused on join (BUG-04).
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


    // ─── Visual Effects Toggles ───
    const toggleBackgroundBlur = useCallback(async (level: BlurLevel = 'Light') => {
        const newState: BlurLevel = backgroundBlur === level ? 'None' : level;
        setBackgroundBlur(newState);
        
        if (liveKitRoomRef.current) {
            try {
                const videoTracks = liveKitRoomRef.current.localParticipant.videoTrackPublications;
                for (const [, pub] of videoTracks) {
                    if (pub.track) {
                        if (newState !== 'None') {
                            const processor = BackgroundBlur(newState === 'Light' ? 10 : 20);
                            await pub.track.setProcessor(processor);
                        } else {
                            await pub.track.stopProcessor();
                        }
                    }
                }
                addToast(newState !== 'None' ? `Background Blur ${newState}` : 'Background Blur OFF', '🎯');
                return;
            } catch (err) {
                console.warn('[LiveKit] Blur failed:', err);
            }
        }
    }, [backgroundBlur, addToast]);

    const toggleStudioLighting = useCallback(() => {
        setStudioLighting(prev => !prev);
        addToast(!studioLighting ? 'Studio Lighting ON' : 'Studio Lighting OFF', '💡');
    }, [studioLighting, addToast]);

    const x_duplicate_block_removed = true; // duplicate functions removed — see canonical definitions above


    // NOTE: createPoll, endPoll, votePoll, submitQuestion, upvoteQuestion, markQuestionAnswered,
    // toggleNoiseSuppression, and sendReaction are all defined at their canonical locations above.
    // The duplicate declarations were removed to fix TS2451 errors.

    const x_end_duplicate_removal = true;



    return {
        activeSpeaker,
        addToast,
        analyserRef,
        audioAnimRef,
        audioContextRef,
        audioEnabled,
        audioLevel,
        availableDevices,
        backgroundBlur,
        blurFilterRef,
        broadcastMediaState,
        captionInterim,
        captionSpeaker,
        captionText,
        captionTimeoutRef,
        captionsEnabled,
        chatChannelRef,
        chatEndRef,
        chatFileInputRef,
        chatInput,
        chatMessages,
        compositeAnimRef,
        compositeCanvasRef,
        connectionQuality,
        containerRef,
        copied,
        copyMeetingLink,
        createPeerConnection,
        dbMeetingIdRef,
        fileInputRef,
        floatingReactions,
        generateMeetingId,
        handRaised,
        handleChatFileAttach,
        handleJoinMeeting,
        handleJoinWithPreviewCleanup,
        handleLeaveMeeting,
        handleScreenShare,
        handleSendChat,
        hasError,
        inMeeting,
        isFullscreen,
        isRecording,
        isUploading,
        krispFilterRef,
        lastConsumedCode,
        layout,
        liveKitRoomRef,
        localPeerId,
        localScreenStreamRef,
        localStreamRef,
        lowLightMode,
        mediaRecorderRef2,
        meetingFiles,
        meetingId,
        newPollOptions,
        newPollQuestion,
        newQuestionText,
        noiseSuppression,
        notesContent,
        polls,
        pollsTab,
        previewStream,
        previewVideoRef,
        questions,
        recognitionRef,
        recordedChunksRef,
        remoteAudioLevels,
        remotePeers,
        remotePeersRef,
        screenRef,
        screenShared,
        screenStream,
        selectedAudioIn,
        selectedBg,
        selectedVideoIn,
        setActiveSpeaker,
        setAudioEnabled,
        setAudioLevel,
        setAvailableDevices,
        setBackgroundBlur,
        setCaptionInterim,
        setCaptionSpeaker,
        setCaptionText,
        setCaptionsEnabled,
        setChatInput,
        setChatMessages,
        setConnectionQuality,
        setCopied,
        setFloatingReactions,
        setHandRaised,
        setHasError,
        setInMeeting,
        setIsFullscreen,
        setIsRecording,
        setIsUploading,
        setLayout,
        setLowLightMode,
        setMeetingFiles,
        setMeetingId,
        setNewPollOptions,
        setNewPollQuestion,
        setNewQuestionText,
        setNoiseSuppression,
        setNotesContent,
        setPolls,
        setPollsTab,
        setPreviewStream,
        setQuestions,
        setRemoteAudioLevels,
        setRemotePeers,
        setScreenShared,
        setScreenStream,
        setSelectedAudioIn,
        setSelectedBg,
        setSelectedVideoIn,
        setShowDeviceSelector,
        setShowMobileMore,
        setShowPollCreator,
        setShowReactionTray,
        setShowSidebar,
        setSpeechSupported,
        setStream,
        setStudioLighting,
        setToasts,
        setValidatedMeeting,
        setVideoEnabled,
        setupSignaling,
        shareMeetingToChat,
        showDeviceSelector,
        showMobileMore,
        showPollCreator,
        showReactionTray,
        showSidebar,
        signalingChannelRef,
        speechSupported,
        stream,
        studioLighting,
        toasts,
        toggleFullscreen,
        toggleHandRaise,
        togglePiP,
        toggleRecording,
        updatePeer,
        userAvatar,
        userName,
        validateMeetingCode,
        validatedMeeting,
        videoEnabled,
        videoRef,
        virtualBgFilterRef,
        user,
        getFileIcon,
        formatFileSize,
        handleFileUpload,
        createPoll,
        endPoll,
        votePoll,
        submitQuestion,
        upvoteQuestion,
        markQuestionAnswered,
        toggleNoiseSuppression,
        toggleBackgroundBlur,
        toggleStudioLighting,
        sendReaction,
        switchDevice,
        handleFlipCamera
    };
}
