// ─── PRISM Meetings — Header Bar Component ───
import React from 'react';
import { Circle, Users, Copy, CheckCircle2, Wifi, WifiOff, AlertCircle, Share2, LayoutGrid, Maximize, Minimize, PictureInPicture2 } from 'lucide-react';
import clsx from 'clsx';
import MeetingTimer from './MeetingTimer';
import type { ConnectionQuality, LayoutMode } from './types';

interface MeetingHeaderProps {
    inMeeting: boolean;
    isRecording: boolean;
    remotePeersCount: number;
    meetingId: string;
    copied: boolean;
    connectionQuality: ConnectionQuality;
    layout: LayoutMode;
    isFullscreen: boolean;
    copyMeetingLink: () => void;
    shareMeetingToChat: () => void;
    togglePiP: () => Promise<void>;
    setLayout: (l: LayoutMode) => void;
    toggleFullscreen: () => Promise<void>;
}

const MeetingHeader = React.memo(({
    inMeeting, isRecording, remotePeersCount, meetingId, copied,
    connectionQuality, layout, isFullscreen,
    copyMeetingLink, shareMeetingToChat, togglePiP, setLayout, toggleFullscreen
}: MeetingHeaderProps) => (
    <div className="absolute top-0 left-0 right-0 z-20 bg-black/40 backdrop-blur-xl border-b border-white/10 meeting-header">
        {/* Single unified row — items constrained & overflow-hidden */}
        <div className="flex items-center justify-between px-2 md:px-4 py-2 md:py-3 gap-1.5 md:gap-2 overflow-hidden">
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
                    <span>{1 + remotePeersCount}</span>
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
                {/* Timer — hidden on very small screens to prevent overflow */}
                <div className="flex-shrink-0 hidden sm:block"><MeetingTimer active={inMeeting} /></div>
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
));

MeetingHeader.displayName = 'MeetingHeader';

export default MeetingHeader;
