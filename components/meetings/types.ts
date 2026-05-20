// ─── PRISM Meetings — Shared Types & Constants ───

import { Room } from 'livekit-client';

// Web Speech API types
export interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}
export interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export interface MeetingMessage {
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

export interface MeetingFile {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    sender: string;
    timestamp: Date;
}

export interface FloatingReaction {
    id: string;
    emoji: string;
    x: number;
}

// Phase 5: Polls & Q&A
export interface MeetingPoll {
    id: string;
    question: string;
    options: string[];
    votes: Map<string, number>; // optionIndex -> count
    myVote: number | null;
    createdBy: string;
    isActive: boolean;
    timestamp: Date;
}

export interface MeetingQuestion {
    id: string;
    text: string;
    askedBy: string;
    upvotes: number;
    hasUpvoted: boolean;
    isAnswered: boolean;
    timestamp: Date;
}

// ─── WebRTC Types ───
export interface RemotePeer {
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
export const ICE_SERVERS: RTCConfiguration = {
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

export const REACTION_EMOJIS = ['👏', '🎉', '❤️', '👍', '😂', '🔥'];

export const getTimeGreeting = (name: string) => {
    const h = new Date().getHours();
    const icon = h < 12 ? '☀️' : h < 17 ? '🌤️' : h < 20 ? '🌅' : '🌙';
    const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 20 ? 'Good evening' : 'Good night';
    return { greeting: `${greeting}, ${name}`, icon };
};

// Format file size helper
export const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
};

// Get file icon based on type
export const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    return '📎';
};

export type SidebarTab = 'chat' | 'people' | 'effects' | 'notes' | 'files' | 'polls' | null;
export type LayoutMode = 'grid' | 'spotlight';
export type ConnectionQuality = 'good' | 'fair' | 'poor';
export type BlurLevel = 'None' | 'Light' | 'Heavy';

/** The full state + handlers exposed by useMeetingEngine */
export interface MeetingEngine {
    // Auth
    userName: string;
    userAvatar: string | null;
    user: any;

    // Core state
    inMeeting: boolean;
    meetingId: string;
    setMeetingId: (id: string) => void;
    stream: MediaStream | null;
    screenStream: MediaStream | null;
    remotePeers: Map<string, RemotePeer>;
    hasError: string | null;

    // Media toggles
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

    // Audio analysis
    audioLevel: number;
    remoteAudioLevels: Map<string, number>;
    activeSpeaker: string | null;
    connectionQuality: ConnectionQuality;

    // UI state
    layout: LayoutMode;
    setLayout: (l: LayoutMode) => void;
    showSidebar: SidebarTab;
    setShowSidebar: (s: SidebarTab) => void;
    showMobileMore: boolean;
    setShowMobileMore: (v: boolean) => void;
    isFullscreen: boolean;
    showReactionTray: boolean;
    setShowReactionTray: (v: boolean) => void;
    showDeviceSelector: boolean;
    setShowDeviceSelector: (v: boolean) => void;
    copied: boolean;

    // Visual effects
    backgroundBlur: BlurLevel;
    setBackgroundBlur: (v: BlurLevel) => void;
    selectedBg: number | null;
    setSelectedBg: (v: number | null) => void;
    lowLightMode: boolean;
    setLowLightMode: (v: boolean) => void;
    studioLighting: boolean;
    setStudioLighting: (v: boolean) => void;

    // Chat
    chatMessages: MeetingMessage[];
    chatInput: string;
    setChatInput: (v: string) => void;

    // Notes
    notesContent: string;
    setNotesContent: (v: string) => void;

    // Files
    meetingFiles: MeetingFile[];
    isUploading: boolean;

    // Captions
    captionText: string;
    captionInterim: string;
    captionSpeaker: string;
    speechSupported: boolean;

    // Reactions
    floatingReactions: FloatingReaction[];

    // Toasts
    toasts: { id: string; text: string; icon: string }[];
    addToast: (text: string, icon?: string) => void;

    // Polls & Q&A
    polls: MeetingPoll[];
    questions: MeetingQuestion[];
    showPollCreator: boolean;
    setShowPollCreator: (v: boolean) => void;
    newPollQuestion: string;
    setNewPollQuestion: (v: string) => void;
    newPollOptions: string[];
    setNewPollOptions: (v: string[] | ((prev: string[]) => string[])) => void;
    newQuestionText: string;
    setNewQuestionText: (v: string) => void;
    pollsTab: 'polls' | 'qa';
    setPollsTab: (v: 'polls' | 'qa') => void;

    // Device selector
    availableDevices: { audioin: MediaDeviceInfo[]; videoin: MediaDeviceInfo[]; audioout: MediaDeviceInfo[] };
    selectedAudioIn: string;
    selectedVideoIn: string;

    // Preview
    previewStream: MediaStream | null;

    // Validated meeting (for join-from-link)
    validatedMeeting: { code: string; hostName: string; title: string } | null;

    // Refs
    videoRef: React.RefObject<HTMLVideoElement | null>;
    screenRef: React.RefObject<HTMLVideoElement | null>;
    previewVideoRef: React.RefObject<HTMLVideoElement | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    chatEndRef: React.RefObject<HTMLDivElement | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    chatFileInputRef: React.RefObject<HTMLInputElement | null>;
    liveKitRoomRef: React.MutableRefObject<Room | null>;

    // Handlers
    handleJoinWithPreviewCleanup: () => Promise<void>;
    handleLeaveMeeting: () => Promise<void>;
    handleScreenShare: () => Promise<void>;
    handleFlipCamera: () => Promise<void>;
    handleSendChat: () => void;
    handleFileUpload: (files: FileList | null) => Promise<void>;
    handleChatFileAttach: (files: FileList | null) => Promise<void>;
    copyMeetingLink: () => void;
    shareMeetingToChat: () => void;
    toggleRecording: () => void;
    toggleFullscreen: () => Promise<void>;
    togglePiP: () => Promise<void>;
    toggleHandRaise: () => void;
    toggleNoiseSuppression: () => Promise<void>;
    sendReaction: (emoji: string) => void;
    switchDevice: (kind: 'audio' | 'video', deviceId: string) => Promise<void>;
    createPoll: () => void;
    votePoll: (pollId: string, optionIndex: number) => void;
    endPoll: (pollId: string) => void;
    submitQuestion: () => void;
    upvoteQuestion: (questionId: string) => void;
    markQuestionAnswered: (questionId: string) => void;
}
