import React, { lazy, Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { AppData, ChatChannel, ChatMessage, ChatAttachment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    MessageSquare, Hash, Megaphone, Search, MoreVertical, Paperclip, Send,
    Image as ImageIcon, FileText, Smile, X, Edit2, Pencil, Trash2, Pin, CornerUpLeft,
    Reply, ShieldAlert, Check, CheckCheck, Clock, Download, Bold, Italic, Code, Menu, Users, AtSign, UserPlus, User, Mic, Square, Video, Plus, ChevronLeft, Calendar,
    Sparkles, Settings, Copy
} from 'lucide-react';
import { useToast } from './Toast';
import clsx from 'clsx';
import {
    addChatMessage, softDeleteChatMessage, editChatMessage, toggleReaction,
    togglePinMessage, addChatChannel, deleteChatChannel, markChannelRead, getUnreadCount, createDirectMessage
} from '../services/storageService';
import { uploadFile } from '../services/cloudStorageService';
import { ChannelSidebar } from './comms/ChannelSidebar';
import { getAvatarStyle, formatDateSeparator, isSameDay } from './comms/helpers';
import UserAvatar from './UserAvatar';
import { fetchAvatarMap, fetchActiveUsers, ProfileData } from '../services/profileService';
import { createTypingChannel, broadcastTyping, TypingEvent } from '../services/realtimeService';
import { playSendSound, playReceiveSound } from '../utils/audioUtils';
import { supabase } from '../services/supabase';
import { getAuthHeaders } from '../services/authHeaders';
import { MeshBackground } from './comms/MeshBackground';

const Meetings = lazy(() => import('./Meetings'));

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🎉', '✅', '👀', '🔥'];
const ANNOUNCEMENT_TEMPLATES = [
    { id: 'schedule_change', title: '📅 Schedule Change', body: '📅 **Schedule Update**\n\nPlease be advised that the following schedule changes are in effect:\n\n- \n\nKindly plan accordingly.' },
    { id: 'exam_reminder', title: '📝 Exam Reminder', body: '📝 **Upcoming Examination**\n\nSubject: \nDate: \nTime: \nVenue: \n\nAll students are expected to arrive 15 minutes early.' },
    { id: 'staff_meeting', title: '🤝 Staff Meeting', body: '🤝 **Staff Meeting Notice**\n\nDate: \nTime: \nVenue: \nAgenda:\n\n1. \n2. \n3. \n\nAttendance is mandatory.' },
    { id: 'emergency', title: '🚨 Emergency Alert', body: '🚨 **URGENT NOTICE**\n\n' },
    { id: 'holiday', title: '🎉 Holiday Notice', body: '🎉 **Holiday Announcement**\n\nPlease note that the following dates have been declared as holidays:\n\n- \n\nClasses will resume on: ' },
];

/* ─── Simple Markdown Renderer ─── */
const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
        let processed: React.ReactNode = line;
        const boldParts = line.split(/\*\*(.*?)\*\*/g);
        if (boldParts.length > 1) processed = boldParts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
        if (typeof processed === 'string') {
            const italicParts = processed.split(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g);
            if (italicParts.length > 1) processed = italicParts.map((p, j) => j % 2 === 1 ? <em key={j}>{p}</em> : p);
        }
        if (typeof processed === 'string') {
            const codeParts = processed.split(/\x60(.*?)\x60/g);
            if (codeParts.length > 1) processed = codeParts.map((p, j) => j % 2 === 1 ? <code key={j} className="px-1.5 py-0.5 rounded-md text-sm font-mono font-semibold" style={{ background: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-primary)' }}>{p}</code> : p);
        }
        if (typeof processed === 'string') {
            const strikeParts = processed.split(/~~(.*?)~~/g);
            if (strikeParts.length > 1) processed = strikeParts.map((p, j) => j % 2 === 1 ? <s key={j} className="opacity-60">{p}</s> : p);
        }
        // @mention highlighting
        if (typeof processed === 'string') {
            const mentionParts = processed.split(/(@\w+)/g);
            if (mentionParts.length > 1) processed = mentionParts.map((p, j) => p.startsWith('@') ? <span key={j} className="font-bold px-0.5 rounded" style={{ color: 'var(--md-sys-color-primary)', background: 'var(--md-sys-color-primary-container)' }}>{p}</span> : p);
        }
        
        // Meeting link detection — supports any URL containing ?meet= (the universal sharing format)
        // Also still supports legacy prism.os/meet/ links for backward compatibility
        if (typeof processed === 'string') {
            const meetLinkParts = processed.split(/(https?:\/\/[^\s]+[?&]meet=[a-zA-Z0-9-]+|https:\/\/prism\.os\/meet\/[a-zA-Z0-9-]+)/g);
            if (meetLinkParts.length > 1) {
                processed = meetLinkParts.map((p, j) => {
                    let mId: string | undefined;
                    if (p.startsWith('https://prism.os/meet/')) {
                        mId = p.split('/').pop();
                    } else if (p.includes('?meet=')) {
                        try { mId = new URL(p).searchParams.get('meet') || undefined; } catch { }
                    }
                    if (mId) {
                        return (
                            <div key={j} className="my-2 bg-[var(--md-sys-color-primary-container)] border border-[var(--md-sys-color-primary)] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                                        <Video size={20} className="text-[var(--md-sys-color-primary)]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm font-google" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>Live Video Meeting</p>
                                        <p className="text-xs opacity-80" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>ID: {mId}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        // Ensure we're on Communications view (for cross-tab navigation)
                                        window.dispatchEvent(new CustomEvent('navigate-to-communications'));
                                        // Use state-driven join — sets meeting code + switches to video tab
                                        // This is called from within the renderMarkdown closure, so we
                                        // dispatch the event which Communications' listener handles via joinMeetingById
                                        window.dispatchEvent(new CustomEvent('prepare-meeting', { detail: mId }));
                                    }}
                                    className="bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all whitespace-nowrap flex items-center gap-2"
                                >
                                    <Video size={14} />
                                    Join Now
                                </button>
                            </div>
                        );
                    }
                    return p;
                });
            }
        }
        
        return <React.Fragment key={i}>{Array.isArray(processed) ? processed : processed}{i < lines.length - 1 && <br />}</React.Fragment>;
    });
};

/* ─── Typing Indicator (shows remote users typing) ─── */
const TypingIndicator = ({ typers }: { typers: string[] }) => (
    <AnimatePresence>
        {typers.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                layout
                className="absolute bottom-full left-4 mb-2 z-10"
            >
                <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-2xl shadow-md border" style={{ background: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <div className="flex gap-1 items-center">
                        {[0, 1, 2].map(i => <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--md-sys-color-primary)' }} animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />)}
                    </div>
                    <span>
                        <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>{typers.length <= 2 ? typers.join(' and ') : `${typers[0]} and ${typers.length - 1} others`}</strong>
                        {typers.length === 1 ? ' is typing...' : ' are typing...'}
                    </span>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);


/* ─── Date Separator ─── */
const DateSeparator = ({ date }: { date: string }) => (
    <div className="flex items-center justify-center my-6">
        <div className="backdrop-blur-md bg-slate-900/5 dark:bg-white/5 border border-slate-950/5 dark:border-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full z-10 shadow-sm">
            {formatDateSeparator(date)}
        </div>
    </div>
);

const UnreadSeparator = () => (
    <div className="flex items-center justify-center my-4 relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--md-sys-color-error)]" /></div>
        <div className="bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full z-10 relative">
            New Messages
        </div>
    </div>
);

/* ─── SwipeableMessage ───
   Wraps each message bubble with horizontal swipe gestures.
   → Swipe RIGHT on any message         → Reply (WhatsApp standard)
   → Swipe LEFT  on own messages        → Quick Edit (unique)
   Both snap back with a satisfying spring after release. */
const SwipeableMessage = ({
    msg,
    isMyMsg,
    onSwipeReply,
    onSwipeEdit,
    children,
}: {
    msg: any;
    isMyMsg: boolean;
    onSwipeReply: (msg: any) => void;
    onSwipeEdit?: (msg: any) => void;
    children: React.ReactNode;
}) => {
    const x = useMotionValue(0);
    const THRESHOLD = 76;

    // Reply indicator transforms (left side, swipe-right)
    const replyOpacity = useTransform(x, [0, THRESHOLD * 0.3, THRESHOLD], [0, 0.5, 1]);
    const replyScale   = useTransform(x, [0, THRESHOLD * 0.5, THRESHOLD], [0.5, 0.75, 1]);
    const replyXShift  = useTransform(x, [0, THRESHOLD], [-16, 0]);

    // Edit indicator transforms (right side, swipe-left — own messages only)
    const editOpacity = useTransform(x, [0, -THRESHOLD * 0.3, -THRESHOLD], [0, 0.5, 1]);
    const editScale   = useTransform(x, [0, -THRESHOLD * 0.5, -THRESHOLD], [0.5, 0.75, 1]);
    const editXShift  = useTransform(x, [0, -THRESHOLD], [16, 0]);

    return (
        // touchAction: pan-y — lets the scroll container still scroll vertically
        // while Framer Motion captures horizontal drags only
        <div className="relative" style={{ touchAction: 'pan-y' }}>

            {/* ← Reply indicator */}
            <motion.div
                className="absolute left-1 top-1/2 -translate-y-1/2 z-0 pointer-events-none"
                style={{ opacity: replyOpacity, scale: replyScale, x: replyXShift }}
            >
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: 'var(--md-sys-color-primary)' }}
                >
                    <Reply size={15} style={{ color: 'white' }} />
                </div>
            </motion.div>

            {/* → Edit indicator (own messages only) */}
            {isMyMsg && !msg.isDeleted && (
                <motion.div
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-0 pointer-events-none"
                    style={{ opacity: editOpacity, scale: editScale, x: editXShift }}
                >
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: 'var(--md-sys-color-secondary-container)' }}
                    >
                        <Pencil size={13} style={{ color: 'var(--md-sys-color-on-secondary-container)' }} />
                    </div>
                </motion.div>
            )}

            {/* Draggable wrapper */}
            <motion.div
                style={{ x }}
                drag="x"
                dragConstraints={{
                    left:  isMyMsg && !msg.isDeleted ? -THRESHOLD : 0,
                    right: !msg.isDeleted ? THRESHOLD : 0,
                }}
                dragElastic={{ left: 0.15, right: 0.3 }}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                    if (!msg.isDeleted && info.offset.x >= THRESHOLD) {
                        onSwipeReply(msg);
                    } else if (isMyMsg && !msg.isDeleted && info.offset.x <= -THRESHOLD) {
                        onSwipeEdit?.(msg);
                    }
                    // Spring back to rest
                    animate(x, 0, { type: 'spring', stiffness: 500, damping: 35 });
                }}
            >
                {children}
            </motion.div>
        </div>
    );
};

/* ─── Memoized Message Group Renderer ─── */
const MessageGroupRenderer = React.memo(({
    group,
    userId,
    mIdxOffset,
    avatarMap,
    hoveredMsgId,
    setHoveredMsgId,
    showEmojiPicker,
    setShowEmojiPicker,
    editingMsgId,
    setEditContent,
    editContent,
    setEditingMsgId,
    handleEditSave,
    renderMsgActions,
    renderEmojiPicker,
    renderReplyPreview,
    renderReactions,
    activeChannelId,
    onLongPress,
    onSwipeReply,
    onSwipeEdit,
    channelData,
    chatFontSize,
    triggerHaptics,
    chatBubbleTheme,
    messageAiAssists,
    onDismissAiAssist,
    chatWallpaper,
}: any) => {
    const first = group[0];

    const getFontSizeClass = () => {
        switch (chatFontSize) {
            case 'small': return 'text-[11px] leading-relaxed';
            case 'large': return 'text-[15px] leading-relaxed';
            case 'xlarge': return 'text-[17px] leading-relaxed';
            case 'medium':
            default:
                return 'text-sm leading-relaxed';
        }
    };

    return (
        <div className={clsx("group/cluster flex gap-3 py-1", first.senderId === userId && "flex-row-reverse")}>
            <div className="flex-shrink-0 w-8 pt-0.5 flex flex-col items-center">
                {first.senderId !== userId && <UserAvatar name={first.senderName} avatarUrl={avatarMap[first.senderId]} size={32} />}
            </div>
            <div className={clsx("flex-1 min-w-0 flex flex-col", first.senderId === userId ? "items-end" : "items-start")}>
                <div className={clsx("flex items-baseline gap-2 mb-1", first.senderId === userId && "flex-row-reverse")}>
                    <span className="font-bold text-xs font-google text-slate-800 dark:text-slate-100">{first.senderName}</span>
                    {first.senderRole === 'admin' && <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300"><ShieldAlert size={9} /> Admin</span>}
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {new Date(first.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className={clsx("space-y-0.5 flex flex-col max-w-[85%]", first.senderId === userId ? "items-end" : "items-start")}>
                    {group.map((msg: any, mIdx: number) => {
                        const isMyMsg = msg.senderId === userId;
                        const isFirst = mIdx === 0;
                        const isLast = mIdx === group.length - 1;

                        const getBubbleStyleAndClass = () => {
                            let baseClass = "";
                            let inlineStyle: React.CSSProperties = {};

                            const cornerClasses = isMyMsg
                                ? `${isFirst ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${isLast ? 'rounded-br-2xl' : 'rounded-br-md'} rounded-l-2xl`
                                : `rounded-r-2xl ${isFirst ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${isLast ? 'rounded-bl-2xl' : 'rounded-bl-md'}`;

                            if (chatWallpaper === 'mesh') {
                                if (!isMyMsg) {
                                    // Ultra frosted glass for incoming messages
                                    baseClass = `bg-slate-900/5 dark:bg-white/[0.03] border border-slate-950/10 dark:border-white/10 text-slate-800 dark:text-slate-100 backdrop-blur-xl shadow-sm ${cornerClasses}`;
                                } else {
                                    // Custom glass tints for outgoing messages
                                    switch (chatBubbleTheme) {
                                        case 'lavender':
                                            baseClass = `bg-indigo-600/10 dark:bg-indigo-500/15 border-indigo-600/20 dark:border-indigo-400/25 text-indigo-950 dark:text-indigo-200 backdrop-blur-xl ${cornerClasses}`;
                                            break;
                                        case 'rose':
                                            baseClass = `bg-rose-600/10 dark:bg-rose-500/15 border-rose-600/20 dark:border-rose-400/25 text-rose-950 dark:text-rose-200 backdrop-blur-xl ${cornerClasses}`;
                                            break;
                                        case 'ocean':
                                            baseClass = `bg-sky-600/10 dark:bg-sky-500/15 border-sky-600/20 dark:border-sky-400/25 text-sky-950 dark:text-sky-200 backdrop-blur-xl ${cornerClasses}`;
                                            break;
                                        case 'emerald':
                                            baseClass = `bg-emerald-600/10 dark:bg-emerald-500/15 border-emerald-600/20 dark:border-emerald-400/25 text-emerald-950 dark:text-emerald-200 backdrop-blur-xl ${cornerClasses}`;
                                            break;
                                        case 'amethyst':
                                            baseClass = `bg-purple-600/10 dark:bg-purple-500/15 border-purple-600/20 dark:border-purple-400/25 text-purple-950 dark:text-purple-200 backdrop-blur-xl ${cornerClasses}`;
                                            break;
                                        case 'default':
                                        default:
                                            baseClass = `bg-indigo-600/10 dark:bg-indigo-500/15 border-indigo-600/20 dark:border-indigo-400/25 text-indigo-950 dark:text-indigo-200 backdrop-blur-xl ${cornerClasses}`;
                                            break;
                                    }
                                }
                            } else {
                                // Default wallpapers fallback to original styles
                                if (!isMyMsg) {
                                    baseClass = `text-slate-800 dark:text-slate-100 bg-white/95 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${cornerClasses}`;
                                } else {
                                    switch (chatBubbleTheme) {
                                        case 'lavender':
                                            baseClass = `bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-[0_3px_12px_rgba(99,102,241,0.25)] border border-indigo-500/10 ${cornerClasses}`;
                                            break;
                                        case 'rose':
                                            baseClass = `bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 text-white shadow-[0_3px_12px_rgba(244,63,94,0.25)] border border-rose-500/10 ${cornerClasses}`;
                                            break;
                                        case 'ocean':
                                            baseClass = `bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-500 text-white shadow-[0_3px_12px_rgba(14,165,233,0.25)] border border-sky-500/10 ${cornerClasses}`;
                                            break;
                                        case 'emerald':
                                            baseClass = `bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-[0_3px_12px_rgba(16,185,129,0.25)] border border-emerald-500/10 ${cornerClasses}`;
                                            break;
                                        case 'amethyst':
                                            baseClass = `bg-gradient-to-tr from-purple-600 via-purple-500 to-fuchsia-500 text-white shadow-[0_3px_12px_rgba(168,85,247,0.25)] border border-purple-500/10 ${cornerClasses}`;
                                            break;
                                        case 'default':
                                        default:
                                            baseClass = `bg-gradient-to-tr from-[var(--md-sys-color-primary)] to-indigo-600/90 text-white shadow-[0_3px_12px_rgba(99,102,241,0.2)] border border-indigo-500/10 ${cornerClasses}`;
                                            break;
                                    }
                                }
                            }
                            return { className: baseClass, style: inlineStyle };
                        };

                        const bubbleData = getBubbleStyleAndClass();

                            return (
                            <SwipeableMessage
                                key={msg.id}
                                msg={msg}
                                isMyMsg={isMyMsg}
                                onSwipeReply={onSwipeReply}
                                onSwipeEdit={onSwipeEdit}
                            >
                            <motion.div 
                                id={`msg-${msg.id}`}
                                layout 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className={clsx("relative px-3 py-2 group/msg break-words shadow-sm transition-shadow hover:shadow-md", getFontSizeClass(), bubbleData.className)} 
                                style={bubbleData.style}
                                onMouseEnter={() => setHoveredMsgId(msg.id)}
                                onMouseLeave={() => { setHoveredMsgId(null); setShowEmojiPicker(null); }}
                                onPointerDown={(e: any) => {
                                    if (e.pointerType === 'touch') {
                                        const t = setTimeout(() => { triggerHaptics('medium'); onLongPress?.(msg); }, 400);
                                        (e.currentTarget as any)._lpTimer = t;
                                    }
                                }}
                                onPointerUp={(e: any) => {
                                    clearTimeout((e.currentTarget as any)._lpTimer);
                                }}
                                onPointerCancel={(e: any) => {
                                    clearTimeout((e.currentTarget as any)._lpTimer);
                                }}>
                                {renderMsgActions(msg)}
                                {renderEmojiPicker(msg.id)}
                                {renderReplyPreview(msg)}
                                {/* Hover-only timestamp for non-first messages */}
                                {mIdx > 0 && <span className={clsx("absolute top-1/2 -translate-y-1/2 text-[9px] font-medium opacity-0 group-hover/msg:opacity-100 transition-opacity whitespace-nowrap", isMyMsg ? "-left-12 text-right" : "-right-12 text-left")} style={{ color: 'var(--md-sys-color-secondary)' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                {msg.isDeleted ? (
                                    <p className="text-xs italic font-medium opacity-70">This message was deleted</p>
                                ) : editingMsgId === msg.id ? (
                                    <div className="space-y-1.5 min-w-[200px]">
                                        <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full rounded-xl p-2 text-sm outline-none resize-none" style={{ background: 'var(--md-sys-color-surface)', color: 'var(--md-sys-color-on-surface)' }} rows={2} />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setEditingMsgId(null)} className="glass-button px-2.5 py-1 text-[10px] font-bold">Cancel</button>
                                            <button onClick={() => handleEditSave(activeChannelId, msg.id)} className="bg-white text-black px-2.5 py-1 rounded-lg text-[10px] font-bold">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                    <div className="leading-relaxed">
                                        {renderMarkdown(msg.content)}
                                        {msg.editedAt && <span className="text-[10px] ml-1 italic opacity-70">(edited)</span>}
                                        {msg.isPinned && <Pin size={10} className="inline ml-1" style={{ color: 'var(--google-yellow)' }} />}
                                    </div>
                                    {messageAiAssists?.[msg.id] && (
                                        <div className="mt-2.5 p-2.5 rounded-xl border flex flex-col gap-1 text-[11px] backdrop-blur-md bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/25 text-slate-800 dark:text-indigo-200 shadow-sm animate-fade-in max-w-full">
                                            <div className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                                                <Sparkles className="w-3 h-3 animate-pulse" />
                                                {messageAiAssists[msg.id].loading ? "Thinking..." : "AI Assist Result:"}
                                                {!messageAiAssists[msg.id].loading && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onDismissAiAssist?.(msg.id); }} 
                                                        className="ml-auto p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                                                        title="Dismiss"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            {messageAiAssists[msg.id].loading ? (
                                                <div className="flex items-center gap-1.5 py-1 text-slate-400 dark:text-slate-500 italic">
                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap leading-relaxed select-text">{messageAiAssists[msg.id].text}</p>
                                            )}
                                        </div>
                                    )}
                                    {/* Render Attachments — only for non-deleted messages */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="mt-2 flex flex-col gap-2">
                                            {msg.attachments.map((att: any) => (
                                                <div key={att.id} className="rounded-xl overflow-hidden shadow-sm" style={{ background: isMyMsg ? 'rgba(255,255,255,0.1)' : 'var(--md-sys-color-surface)' }}>
                                                    {att.type === 'image' ? (
                                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="block relative group/link">
                                                            <img src={att.url} alt="Attachment" className="max-w-xs max-h-60 object-contain rounded-xl" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/link:opacity-100 transition-opacity flex items-center justify-center">
                                                                <ImageIcon className="text-white" size={24} />
                                                            </div>
                                                        </a>
                                                    ) : att.type === 'audio' ? (
                                                        <div className="p-2 min-w-[200px] flex flex-col">
                                                            <span className="text-xs font-bold mb-1 ml-1 opacity-80">{att.name || "Voice Message"}</span>
                                                            <audio controls src={att.url} className="w-full h-10" />
                                                        </div>
                                                    ) : att.type === 'video' ? (
                                                        <div className="relative">
                                                            <video controls src={att.url} className="max-w-xs max-h-60 rounded-xl bg-black" />
                                                        </div>
                                                    ) : (
                                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className={clsx("flex items-center justify-between p-3 transition-colors group/link hover:brightness-95", isMyMsg ? "text-white" : "text-[var(--md-sys-color-on-surface)]")}>
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="p-2 rounded-lg" style={{ background: isMyMsg ? 'rgba(255,255,255,0.2)' : 'var(--md-sys-color-surface-variant)' }}>
                                                                    <FileText size={16} />
                                                                </div>
                                                                <div className="flex flex-col overflow-hidden">
                                                                    <span className="text-sm font-bold truncate">{att.name}</span>
                                                                    <span className="text-[10px] opacity-70">{(att.size / 1024).toFixed(1)} KB</span>
                                                                </div>
                                                            </div>
                                                            <Download size={16} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    </>
                                )}
                                {!msg.isDeleted && renderReactions(msg)}
                                {/* Inline timestamp + WhatsApp-style read ticks — every own message */}
                                {isMyMsg && !msg.isDeleted && (() => {
                                    // Determine read status from channel's lastReadBy
                                    const readBy = channelData?.lastReadBy || {};
                                    const msgTime = new Date(msg.timestamp).getTime();
                                    // Check if ANY other participant has read past this message
                                    const isRead = Object.entries(readBy).some(
                                        ([uid, ts]) => uid !== userId && new Date(ts as string).getTime() >= msgTime
                                    );
                                    return (
                                        <div className="flex items-center justify-end gap-0.5 mt-0.5 -mb-0.5">
                                            <span className="text-[9px] font-medium opacity-60">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isRead ? (
                                                <CheckCheck size={12} style={{ color: '#38bdf8' }} />
                                            ) : (
                                                <CheckCheck size={12} className="text-white/50" />
                                            )}
                                        </div>
                                    );
                                })()}
                            </motion.div>
                            </SwipeableMessage>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}, (prevProps, nextProps) => {
    // Custom equality check: only re-render if the group's content actually changes (array length or deep ref change)
    // or if the hovered/edit state applies directly to a message in THIS group.
    if (prevProps.group.length !== nextProps.group.length) return false;

    // Check if hoveredMsgId or editingMsgId moved into or out of this group
    const hasHoveredNow = nextProps.hoveredMsgId && nextProps.group.some((m: any) => m.id === nextProps.hoveredMsgId);
    const hadHovered = prevProps.hoveredMsgId && prevProps.group.some((m: any) => m.id === prevProps.hoveredMsgId);
    if (hasHoveredNow !== hadHovered) return false;

    const hasEditingNow = nextProps.editingMsgId && nextProps.group.some((m: any) => m.id === nextProps.editingMsgId);
    const hadEditing = prevProps.editingMsgId && prevProps.group.some((m: any) => m.id === prevProps.editingMsgId);
    if (hasEditingNow !== hadEditing) return false;

    // If it is editing one of our messages, check if editContent changed
    if (hasEditingNow && prevProps.editContent !== nextProps.editContent) return false;

    // Check if showEmojiPicker moved into or out of this group
    const hasPickerNow = nextProps.showEmojiPicker && nextProps.group.some((m: any) => m.id === nextProps.showEmojiPicker);
    const hadPicker = prevProps.showEmojiPicker && prevProps.group.some((m: any) => m.id === prevProps.showEmojiPicker);
    if (hasPickerNow !== hadPicker) return false;

    // Check message deep references (React state update gives new references on change)
    if (prevProps.group.length !== nextProps.group.length) return false;
    for (let i = 0; i < prevProps.group.length; i++) {
        if (prevProps.group[i] !== nextProps.group[i]) return false;
    }

    // Re-render if any sender's avatar URL changed (so new photos appear without page refresh)
    const hasAvatarChange = nextProps.group.some((m: any) =>
        prevProps.avatarMap?.[m.senderId] !== nextProps.avatarMap?.[m.senderId]
    );
    if (hasAvatarChange) return false;

    // Re-render if channelData.lastReadBy changed (so read receipts update in real time)
    if (prevProps.channelData?.lastReadBy !== nextProps.channelData?.lastReadBy) {
        // Only matters if this group contains messages from the current user
        const hasOwnMsg = nextProps.group.some((m: any) => m.senderId === nextProps.userId);
        if (hasOwnMsg) return false;
    }

    if (prevProps.chatFontSize !== nextProps.chatFontSize) return false;

    return true;
});

/* ─── Props ─── */
interface CommunicationsProps {
    data: AppData;
    onUpdateAppData: (newData: AppData) => void;
    onNavigate?: (view: string) => void;
    /** Meeting code from URL query param (?meet=xyz) — passed from App when user clicks a shared link */
    pendingMeetCode?: string;
}

export default function Communications({ data, onUpdateAppData, onNavigate, pendingMeetCode }: CommunicationsProps) {
    const { user } = useAuth();
    const { preferences } = useTheme();
    // Derive userId immediately so all effects below can reference it safely
    const userId = user?.id || '';
    const { showToast } = useToast();
    const channels = data.communications?.channels || [];
    const messages = data.communications?.messages || {};

    const [activeChannelId, setActiveChannelId] = useState<string>(
        pendingMeetCode ? 'video_meetings' : (channels[0]?.id || '')
    );
    // ─── Meeting code state (Google Meet / Zoom pattern) ───
    // Instead of relying on fire-and-forget DOM events, we store the meeting
    // code in state and pass it to Meetings via props. This guarantees the
    // code arrives even when Meetings hasn't mounted yet.
    const [internalMeetCode, setInternalMeetCode] = useState<string | null>(pendingMeetCode || null);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const [messageAiAssists, setMessageAiAssists] = useState<Record<string, { text: string; loading: boolean }>>({});
    const [aiAssistLoading, setAiAssistLoading] = useState(false);
    const [showAiInputMenu, setShowAiInputMenu] = useState(false);
    const [inlineChatSummary, setInlineChatSummary] = useState<string | null>(null);
    const [inlineChatSummaryLoading, setInlineChatSummaryLoading] = useState(false);

    const runAICompletion = async (prompt: string, onChunk: (text: string) => void) => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders
            },
            body: JSON.stringify({
                messages: [{ id: '1', role: 'user', content: prompt }],
                institutionType: 'tvet'
            })
        });
        if (!response.ok) {
            throw new Error('AI Assist completion failed');
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Reader is not supported');
        }
        const decoder = new TextDecoder();
        let currentText = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                let jsonPayload = '';
                if (trimmed.startsWith('data: ')) {
                    jsonPayload = trimmed.substring(6);
                } else if (trimmed.startsWith('0:')) {
                    jsonPayload = trimmed.substring(2);
                } else {
                    jsonPayload = trimmed;
                }

                if (jsonPayload === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(jsonPayload);
                    if (typeof parsed === 'string') {
                        currentText += parsed;
                        onChunk(currentText);
                    } else if (parsed && typeof parsed === 'object') {
                        if (parsed.type === 'text-delta' && typeof parsed.delta === 'string') {
                            currentText += parsed.delta;
                            onChunk(currentText);
                        } else if (parsed.type === 'error' && parsed.errorText) {
                            throw new Error(parsed.errorText);
                        }
                    }
                } catch (e) {
                    console.warn("Failed to parse stream chunk:", jsonPayload, e);
                }
            }
        }
        return currentText;
    };

    // Correct phrase syntax, improve tone, or translate typed user text
    const handleRephraseInput = async (mode: 'grammar' | 'tone' | 'translate-sw' | 'translate-en') => {
        if (!messageInput.trim()) return;
        setAiAssistLoading(true);
        setShowAiInputMenu(false);
        try {
            let prompt = '';
            if (mode === 'grammar') {
                prompt = `Correct the grammar, spelling, and phrasing syntax of the following message to make it clear and correct. Return ONLY the corrected message text without quotes or explanations:\n\n${messageInput}`;
            } else if (mode === 'tone') {
                prompt = `Improve the professional tone of the following message to make it warm, polite, and encouraging. Return ONLY the rephrased message text without quotes or explanations:\n\n${messageInput}`;
            } else if (mode === 'translate-sw') {
                prompt = `Translate the following message to standard Swahili (Kiswahili). Return ONLY the Swahili translation without quotes or explanations:\n\n${messageInput}`;
            } else if (mode === 'translate-en') {
                prompt = `Translate the following message to clear English. Return ONLY the English translation without quotes or explanations:\n\n${messageInput}`;
            }

            let resultText = '';
            await runAICompletion(prompt, (text) => {
                resultText = text;
            });
            if (resultText) {
                setMessageInput(resultText.trim());
                showToast("Updated by AI Assist", "success");
            }
        } catch (err) {
            showToast("Failed to rephrase statement", "error");
        } finally {
            setAiAssistLoading(false);
        }
    };

    // Summarize active channel's last 20 messages inline
    const handleSummarizeChannelInline = async () => {
        setInlineChatSummaryLoading(true);
        setShowAiInputMenu(false);
        setInlineChatSummary("Generating summary...");
        try {
            const lastMsgs = allActiveMessages.slice(-20);
            const chatTranscript = lastMsgs.map(m => `[${m.senderName} (${m.senderRole})]: ${m.content}`).join('\n');
            const prompt = `Summarize the following recent messages from #${activeChannel?.name || 'this channel'} and highlight any decisions, main topics, and clear action items in a short, bulleted overview:\n\n${chatTranscript}`;
            
            let resultText = '';
            await runAICompletion(prompt, (text) => {
                resultText = text;
                setInlineChatSummary(text);
            });
        } catch (err) {
            showToast("Failed to summarize channel", "error");
            setInlineChatSummary(null);
        } finally {
            setInlineChatSummaryLoading(false);
        }
    };

    // Assist with specific message bubble (summarize, translate, explain)
    const handleMessageBubbleAssist = async (msgId: string, msgContent: string, action: 'summarize' | 'translate-sw' | 'translate-en' | 'explain') => {
        setMessageAiAssists(prev => ({
            ...prev,
            [msgId]: { text: '', loading: true }
        }));
        try {
            let prompt = '';
            if (action === 'summarize') {
                prompt = `Summarize the following message briefly, highlighting the core points and what the user needs to know:\n\n${msgContent}`;
            } else if (action === 'translate-sw') {
                prompt = `Translate the following message to standard Swahili (Kiswahili):\n\n${msgContent}`;
            } else if (action === 'translate-en') {
                prompt = `Translate the following message to standard English:\n\n${msgContent}`;
            } else if (action === 'explain') {
                prompt = `Explain the following message's context, and clarify any complex or technical terms used in simple words:\n\n${msgContent}`;
            }

            let resultText = '';
            await runAICompletion(prompt, (text) => {
                resultText = text;
                setMessageAiAssists(prev => ({
                    ...prev,
                    [msgId]: { text, loading: true }
                }));
            });
            setMessageAiAssists(prev => ({
                ...prev,
                [msgId]: { text: resultText, loading: false }
            }));
        } catch (err) {
            showToast("AI Assist action failed", "error");
            setMessageAiAssists(prev => {
                const next = { ...prev };
                delete next[msgId];
                return next;
            });
        }
    };

    const handleDismissAiAssist = (msgId: string) => {
        setMessageAiAssists(prev => {
            const next = { ...prev };
            delete next[msgId];
            return next;
        });
    };

    // ─── Join a meeting by switching to video tab and setting the code ───
    // This is the single entry point for ALL internal join actions.
    // Inspired by Google Meet / Zoom — state-driven, no ephemeral events.
    const joinMeetingById = useCallback((meetCode: string) => {
        setInternalMeetCode(meetCode);
        setActiveChannelId('video_meetings');
    }, []);

    // Global meeting listeners
    useEffect(() => {
        const handlePrepareMeeting = (e: any) => {
            const mId = e.detail;
            if (!mId) return;
            // Use state-based approach instead of hoping Meetings catches the event
            joinMeetingById(mId);
        };
        const handleBroadcast = async (e: any) => {
            const mId = e.detail;
            if (!mId) {
                console.warn('[broadcast-meeting] No meeting ID in event detail');
                return;
            }
            // Try in priority order: announcement → chat → any first channel
            const targetChannel =
                channels.find(c => c.type === 'announcement') ||
                channels.find(c => c.type === 'chat') ||
                channels[0];

            if (!targetChannel) {
                console.warn('[broadcast-meeting] No channels available to broadcast to');
                showToast('No chat channels found to share the meeting link', 'error');
                return;
            }
            if (!user) {
                console.warn('[broadcast-meeting] No authenticated user');
                showToast('You must be logged in to share a meeting', 'error');
                return;
            }
            try {
                // Build a real shareable URL using the production domain
                // This works cross-device — the ?meet= param is read by App.tsx on load
                const appHost = window.location.origin;
                const shareableUrl = `${appHost}/?meet=${mId}`;
                
                const newData = await addChatMessage(data, {
                    id: crypto.randomUUID(),
                    channelId: targetChannel.id,
                    senderId: userId,
                    senderName: user.name,
                    senderRole: user.role as any,
                    content: `📹 **Live Meeting in progress!**\n\nJoin the session now:\n${shareableUrl}\n\nTap **Join Now** to open the video meeting instantly.`,
                    timestamp: new Date().toISOString()
                } as any);
                onUpdateAppData(newData);
                showToast(`Meeting link shared to #${targetChannel.name}`, 'success');
            } catch (err) {
                console.error('[broadcast-meeting] Failed to send message:', err);
                showToast('Failed to share meeting link', 'error');
            }
        };

        window.addEventListener('prepare-meeting', handlePrepareMeeting);
        window.addEventListener('broadcast-meeting', handleBroadcast);
        return () => {
            window.removeEventListener('prepare-meeting', handlePrepareMeeting);
            window.removeEventListener('broadcast-meeting', handleBroadcast);
        };
    }, [channels, data, onUpdateAppData, showToast, user, userId, joinMeetingById]);

    const [replyToMsg, setReplyToMsg] = useState<ChatMessage | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [showPinnedPanel, setShowPinnedPanel] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showNewChannel, setShowNewChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelDesc, setNewChannelDesc] = useState('');
    const [newChannelType, setNewChannelType] = useState<'chat' | 'announcement'>('chat');
    const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [showInfoDrawer, setShowInfoDrawer] = useState(false);
    const [infoTab, setInfoTab] = useState<'members' | 'media'>('members');

    // Slash Commands State
    const [showSlashCommands, setShowSlashCommands] = useState(false);
    const [slashQuery, setSlashQuery] = useState('');
    const [selectedSlashIdx, setSelectedSlashIdx] = useState(0);

    // Audio recording waveform state
    const [audioLevels, setAudioLevels] = useState<number[]>(new Array(18).fill(2));
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

    useEffect(() => {
        const event = new CustomEvent('communications-mobile-view-change', { detail: mobileView });
        window.dispatchEvent(event);
    }, [mobileView]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const [avatarMap, setAvatarMap] = useState<Record<string, string>>(() => {
        // Immediately seed the current user's own avatar if AuthContext has it
        const own: Record<string, string> = {};
        if (userId && (user as any)?.avatarUrl) own[userId] = (user as any).avatarUrl;
        return own;
    });

    // Remote typing indicators — map of userId → { name, timeoutId }
    const [remoteTypers, setRemoteTypers] = useState<Map<string, { name: string; timeoutId: ReturnType<typeof setTimeout> }>>(new Map());
    const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingCleanupRef = useRef<(() => void) | null>(null);

    // DM State
    const [showNewDM, setShowNewDM] = useState(false);
    const [dmUsers, setDmUsers] = useState<ProfileData[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [dmUserSearch, setDmUserSearch] = useState('');

    // Attachments State — multi-file queue
    const fileInputRef    = useRef<HTMLInputElement>(null);
    const imageInputRef   = useRef<HTMLInputElement>(null);
    const cameraInputRef  = useRef<HTMLInputElement>(null);
    const docInputRef     = useRef<HTMLInputElement>(null);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
    // Mobile attach sheet
    const [showMobileAttachSheet, setShowMobileAttachSheet] = useState(false);
    // Drag-drop
    const [isDragOver, setIsDragOver] = useState(false);
    const chatAreaRef = useRef<HTMLDivElement>(null);

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Voice note decibel visualizer loop
    useEffect(() => {
        if (!isRecording) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {});
                audioContextRef.current = null;
            }
            return;
        }

        let stream: MediaStream | null = null;
        const initAudio = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioContextClass();
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);

                audioContextRef.current = audioCtx;
                analyserRef.current = analyser;

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const update = () => {
                    if (!analyserRef.current) return;
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const levels = Array.from({ length: 18 }, (_, i) => {
                        const bin = Math.floor((i / 18) * dataArray.length);
                        const val = dataArray[bin] || 0;
                        return Math.max(3, Math.min(24, (val / 255) * 24));
                    });
                    setAudioLevels(levels);
                    animationFrameRef.current = requestAnimationFrame(update);
                };
                update();
            } catch (err) {
                // Fallback visualizer simulating realistic human speech frequencies
                let tick = 0;
                const updateFallback = () => {
                    tick += 0.15;
                    const levels = Array.from({ length: 18 }, (_, i) => {
                        const sinVal = Math.sin(tick + i * 0.5) * Math.cos(tick * 0.7 - i * 0.3);
                        return Math.max(3, Math.min(24, Math.abs(sinVal) * 20 + Math.random() * 4));
                    });
                    setAudioLevels(levels);
                    animationFrameRef.current = requestAnimationFrame(updateFallback);
                };
                updateFallback();
            }
        };

        initAudio();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }
        };
    }, [isRecording]);

    // AI command draft helper
    const handleDraftPrompt = async (prompt: string) => {
        if (!prompt.trim()) return;
        setAiAssistLoading(true);
        triggerHaptics('medium');
        try {
            const result = await runAICompletion(`Draft a short, professional chat message about the following topic: "${prompt}". Respond with ONLY the drafted message content and nothing else.`, () => {});
            if (result) {
                setMessageInput(result);
            }
        } catch (err) {
            showToast('Failed to draft message', 'error');
        } finally {
            setAiAssistLoading(false);
        }
    };

    const activeChannel = useMemo(() => channels.find(c => c.id === activeChannelId), [channels, activeChannelId]);
    const allActiveMessages = useMemo(() => messages[activeChannelId] || [], [messages, activeChannelId]);
    const activeMessages = useMemo(() => allActiveMessages.filter(m =>
        !searchQuery || m.content.toLowerCase().includes(searchQuery.toLowerCase()) || m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    ), [allActiveMessages, searchQuery]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // Mobile bottom-sheet state: which message ID has it open
    const [mobileActionMsg, setMobileActionMsg] = useState<ChatMessage | null>(null);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Android customizable chat preferences
    const [chatWallpaper, setChatWallpaper] = useState<'default' | 'midnight' | 'sunset' | 'emerald' | 'doodle' | 'mesh'>(() => {
        const saved = localStorage.getItem('prism_chat_wallpaper');
        if (!saved || saved === 'default') return 'mesh'; // Force 'mesh' as the premium default theme
        return saved as any;
    });
    const [enterIsSend, setEnterIsSend] = useState<boolean>(() => {
        return localStorage.getItem('prism_enter_is_send') !== 'false';
    });
    const [chatFontSize, setChatFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>(() => {
        return (localStorage.getItem('prism_chat_font_size') as any) || 'medium';
    });
    const [enableHaptics, setEnableHaptics] = useState<boolean>(() => {
        return localStorage.getItem('prism_enable_haptics') !== 'false';
    });
    const [chatBubbleTheme, setChatBubbleTheme] = useState<'default' | 'lavender' | 'rose' | 'ocean' | 'emerald' | 'amethyst'>(() => {
        return (localStorage.getItem('prism_chat_bubble_theme') as any) || 'default';
    });
    const [showCustomSettings, setShowCustomSettings] = useState(false);

    useEffect(() => {
        localStorage.setItem('prism_chat_wallpaper', chatWallpaper);
    }, [chatWallpaper]);
    useEffect(() => {
        localStorage.setItem('prism_chat_bubble_theme', chatBubbleTheme);
    }, [chatBubbleTheme]);
    useEffect(() => {
        localStorage.setItem('prism_enter_is_send', String(enterIsSend));
    }, [enterIsSend]);
    useEffect(() => {
        localStorage.setItem('prism_chat_font_size', chatFontSize);
    }, [chatFontSize]);
    useEffect(() => {
        localStorage.setItem('prism_enable_haptics', String(enableHaptics));
    }, [enableHaptics]);

    // Haptics vibration helper
    const triggerHaptics = useCallback(async (type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
        if (!enableHaptics) return;
        if (typeof window !== 'undefined') {
            try {
                const { Capacitor } = await import('@capacitor/core');
                if (Capacitor.isNativePlatform()) {
                    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
                    if (type === 'light') await Haptics.impact({ style: ImpactStyle.Light });
                    else if (type === 'medium') await Haptics.impact({ style: ImpactStyle.Medium });
                    else if (type === 'success') await Haptics.notification({ type: NotificationType.Success });
                    else if (type === 'warning') await Haptics.notification({ type: NotificationType.Warning });
                } else if ('vibrate' in navigator) {
                    navigator.vibrate(type === 'success' || type === 'warning' ? 50 : 15);
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }, [enableHaptics]);

    // Font size scaling helper
    const getFontSizeClass = useCallback(() => {
        switch (chatFontSize) {
            case 'small': return 'text-xs';
            case 'large': return 'text-base';
            case 'xlarge': return 'text-lg';
            case 'medium':
            default:
                return 'text-[15px]';
        }
    }, [chatFontSize]);

    // Wallpaper styling helper
    const getWallpaperStyle = useCallback((): React.CSSProperties => {
        switch (chatWallpaper) {
            case 'midnight':
                return {
                    background: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #030712 100%)',
                };
            case 'sunset':
                return {
                    background: 'linear-gradient(135deg, #fef08a 0%, #f43f5e 50%, #4c1d95 100%)',
                };
            case 'emerald':
                return {
                    background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
                };
            case 'doodle':
                return {
                    backgroundColor: 'var(--md-sys-color-background)',
                    backgroundImage: 'radial-gradient(var(--md-sys-color-outline-variant) 1px, transparent 0px)',
                    backgroundSize: '24px 24px',
                };
            case 'mesh': {
                const isDark = document.documentElement.classList.contains('dark');
                return {
                    background: isDark
                        ? 'radial-gradient(circle at 50% 50%, #0d0e15 0%, #020306 100%)' // Rich dark space
                        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',           // Pristine light gray
                };
            }
            case 'default':
            default:
                return {
                    background: 'var(--md-sys-color-background)',
                };
        }
    }, [chatWallpaper, preferences]);

    // Native app-back-button listener coordinator
    useEffect(() => {
        const handleBackButton = (e: Event) => {
            if (showCustomSettings) {
                e.preventDefault();
                setShowCustomSettings(false);
            } else if (showNewChannel) {
                e.preventDefault();
                setShowNewChannel(false);
            } else if (showNewDM) {
                e.preventDefault();
                setShowNewDM(false);
                setDmUserSearch('');
            } else if (showInfoDrawer) {
                e.preventDefault();
                setShowInfoDrawer(false);
            } else if (showPinnedPanel) {
                e.preventDefault();
                setShowPinnedPanel(false);
            } else if (showSearch) {
                e.preventDefault();
                setShowSearch(false);
                setSearchQuery('');
            } else if (mobileActionMsg) {
                e.preventDefault();
                setMobileActionMsg(null);
            } else if (mobileView === 'chat') {
                e.preventDefault();
                setMobileView('list');
            }
        };
        window.addEventListener('app-back-button', handleBackButton);
        return () => window.removeEventListener('app-back-button', handleBackButton);
    }, [
        mobileView, mobileActionMsg, showCustomSettings,
        showNewChannel, showNewDM, showInfoDrawer, showPinnedPanel, showSearch
    ]);
    // Mobile: whether the formatting toolbar is expanded (hidden by default like WhatsApp)
    const [showMobileFormats, setShowMobileFormats] = useState(false);

    const [visibleGroupsCount, setVisibleGroupsCount] = useState(30);

    // Reset visible count and input state when channel changes
    useEffect(() => {
        setVisibleGroupsCount(30);
        setMessageInput('');
        setReplyToMsg(null);
        setPendingAttachments([]);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [activeChannelId]);

    // Fetch users for DM directory AND eagerly pre-load all their avatars
    useEffect(() => {
        if (dmUsers.length === 0) {
            setIsLoadingUsers(true);
            fetchActiveUsers(userId).then(users => {
                setDmUsers(users);
                setIsLoadingUsers(false);
                // Eagerly seed the avatarMap with all known users right now
                const eagerMap: Record<string, string> = {};
                users.forEach(u => { if (u.avatarUrl) eagerMap[u.id] = u.avatarUrl; });
                if (Object.keys(eagerMap).length > 0) {
                    setAvatarMap(prev => ({ ...eagerMap, ...prev })); // prev wins (own avatar stays)
                }
            }).catch(err => {
                console.error("Failed to load users", err);
                setIsLoadingUsers(false);
            });
        }
    }, [userId]);
    const prevMessagesLengthRef = useRef<number>(0);

    // Track new messages to play receive sound
    useEffect(() => {
        if (!activeChannelId) return;
        const currentMsgs = messages[activeChannelId] || [];
        const prevLength = prevMessagesLengthRef.current;
        
        if (currentMsgs.length > prevLength && prevLength !== 0) {
            // New message(s) arrived. Check if the latest one is from someone else.
            const latestMsg = currentMsgs[currentMsgs.length - 1];
            if (latestMsg && latestMsg.senderId !== userId) {
                playReceiveSound();
            }
        }
        
        prevMessagesLengthRef.current = currentMsgs.length;
    }, [messages, activeChannelId, userId]);

    // Build a lookup map for DM partner names/avatars
    const userProfileMap = useMemo(() => {
        const map: Record<string, { name: string; avatarUrl: string | null }> = {};
        dmUsers.forEach(u => { map[u.id] = { name: u.name, avatarUrl: u.avatarUrl }; });
        return map;
    }, [dmUsers]);

    // Helper to get DM partner name for headers
    const getDMPartnerName = useCallback((channel: any) => {
        if (channel?.type !== 'dm') return channel?.name || '';
        const otherUserId = channel.participants?.find((p: string) => p !== userId) || '';
        return userProfileMap[otherUserId]?.name || 'Direct Message';
    }, [userId, userProfileMap]);

    const scrollToBottom = useCallback(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeMessages.length]);

    useEffect(() => { if (!activeChannelId && channels.length > 0) setActiveChannelId(channels[0].id); }, [channels, activeChannelId]);

    // Collect ALL unique sender IDs across all channels
    const allSenderIds = useMemo(() => {
        const allMsgs = Object.values(messages).flat();
        return [...new Set(allMsgs.map(m => m.senderId).filter(Boolean))];
    }, [messages]);

    // Also include DM users so their avatars load in sidebar/DM header
    const allRelevantIdsKey = useMemo(() => {
        const dmIds = dmUsers.map(u => u.id);
        const uniqueIds = [...new Set([...allSenderIds, ...dmIds])];
        return uniqueIds.sort().join(',');
    }, [allSenderIds, dmUsers]);

    // Fetch avatar map — re-runs ONLY when a new unique user ID appears in the list
    useEffect(() => {
        if (!allRelevantIdsKey) return;
        const ids = allRelevantIdsKey.split(',').filter(Boolean);
        fetchAvatarMap(ids).then(freshMap => {
            setAvatarMap(prev => {
                const merged = { ...prev, ...freshMap };
                const changed = ids.some(id => prev[id] !== merged[id]);
                return changed ? merged : prev;
            });
        }).catch(() => { });
    }, [allRelevantIdsKey]);

    // Subscribe to Supabase realtime profile changes so avatar updates are instant
    useEffect(() => {
        const channel = supabase
            .channel('avatar-updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                const row = payload.new as any;
                if (row?.id && row?.avatar_url) {
                    setAvatarMap(prev => {
                        if (prev[row.id] === row.avatar_url) return prev;
                        return { ...prev, [row.id]: row.avatar_url };
                    });
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    // Listen to insert-sally-draft events to populate the active channel text input
    useEffect(() => {
        const handleInsertDraft = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail && typeof detail.draft === 'string') {
                setMessageInput(detail.draft);
                // Adjust height of textarea
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
                    textareaRef.current.focus();
                }
            }
        };
        window.addEventListener('insert-sally-draft', handleInsertDraft);
        return () => window.removeEventListener('insert-sally-draft', handleInsertDraft);
    }, []);

    // ─── Typing Broadcast Channel ───
    // Subscribe to the typing broadcast channel for the active chat channel.
    // When another user types, we receive their event and show the indicator for 3 seconds.
    useEffect(() => {
        if (!activeChannelId || !userId) return;

        // Clear previous typers when switching channels
        setRemoteTypers(new Map());

        const cleanup = createTypingChannel(activeChannelId, userId, (event: TypingEvent) => {
            setRemoteTypers(prev => {
                const next = new Map(prev);
                if (event.isTyping) {
                    // Clear any existing timeout for this user
                    const existing = next.get(event.userId);
                    if (existing) clearTimeout(existing.timeoutId);

                    // Auto-expire after 3 seconds of no typing
                    const timeoutId = setTimeout(() => {
                        setRemoteTypers(p => {
                            const updated = new Map(p);
                            updated.delete(event.userId);
                            return updated;
                        });
                    }, 3000);

                    next.set(event.userId, { name: event.userName, timeoutId });
                } else {
                    // Explicitly stopped typing
                    const existing = next.get(event.userId);
                    if (existing) clearTimeout(existing.timeoutId);
                    next.delete(event.userId);
                }
                return next;
            });
        });

        typingCleanupRef.current = cleanup;

        return () => {
            // Broadcast that we stopped typing when leaving channel
            if (user) {
                broadcastTyping(activeChannelId, userId, user.name, false);
            }
            cleanup();
            typingCleanupRef.current = null;
            // Clear any pending debounce
            if (typingDebounceRef.current) {
                clearTimeout(typingDebounceRef.current);
                typingDebounceRef.current = null;
            }
        };
    }, [activeChannelId, userId]);

    // Better scrolling logic to prevent the layout crash
    useEffect(() => {
        const timeout = setTimeout(() => scrollToBottom(), 100);
        return () => clearTimeout(timeout);
    }, [activeMessages.length, activeChannelId, scrollToBottom]);

    // Use a ref for data so the markChannelRead effect doesn't loop
    const dataRef = useRef(data);
    dataRef.current = data;

    useEffect(() => {
        if (activeChannelId && userId && allActiveMessages.length > 0) {
            const newData = markChannelRead(dataRef.current, activeChannelId, userId);
            if (newData !== dataRef.current) onUpdateAppData(newData);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChannelId, userId, allActiveMessages.length]);

    // Duplicate auto-scroll removed — handled by scrollToBottom effect above (lines 153-156)

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setShowSearch(s => !s); }
            if (e.key === 'Escape') { setShowNewChannel(false); setShowSearch(false); setShowEmojiPicker(null); setShowInfoDrawer(false); setShowMobileSidebar(false); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    /* ─── Handlers ─── */
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], `Voice_Message_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`, { type: 'audio/webm' });
                setPendingAttachments(prev => [...prev, file].slice(0, 5));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (err) {
            showToast("Microphone access denied or unavailable", "error");
        }
    };

    const stopRecording = (cancel: boolean = false) => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], `Voice_Message_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`, { type: 'audio/webm' });
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                if (!cancel) {
                    handleSendMessage(undefined, file);
                }
            };
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
        }
    };

    const handleSendMessage = async (e?: React.FormEvent, overrideAttachment?: File) => {
        if (e) e.preventDefault();
        // Build unified file list
        const filesToSend: File[] = overrideAttachment
            ? [overrideAttachment]
            : [...pendingAttachments];
        if ((!messageInput.trim() && filesToSend.length === 0) || !activeChannelId || !user) return;
        if (activeChannel?.type === 'announcement' && user.role !== 'admin') { showToast("Only administrators can post announcements.", "error"); return; }

        let attachmentsToSave: ChatAttachment[] = [];

        if (filesToSend.length > 0) {
            setIsUploadingAttachment(true);
            try {
                for (const fileToSend of filesToSend) {
                    const mime = fileToSend.type;
                    let attachmentType = 'document';
                    if (mime.startsWith('image/')) attachmentType = 'image';
                    else if (mime.startsWith('audio/')) attachmentType = 'audio';
                    else if (mime.startsWith('video/')) attachmentType = 'video';

                    const result = await uploadFile('library_documents', fileToSend, {
                        contentType: mime,
                        pathPrefix: 'chat_attachments'
                    });

                    attachmentsToSave.push({
                        id: `att_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                        name: fileToSend.name,
                        type: attachmentType as any,
                        url: result.publicUrl,
                        size: fileToSend.size,
                        mimeType: fileToSend.type
                    });
                }
            } catch (err: any) {
                showToast(`Failed to upload: ${err.message}`, "error");
                setIsUploadingAttachment(false);
                return;
            }
            setIsUploadingAttachment(false);
        }

        // Extract mentions
        const mentionMatches = messageInput.match(/@(\w+)/g);
        const mentionsList = mentionMatches ? mentionMatches.map(m => m.slice(1)) : undefined;

        // For attachment-only messages use a descriptive fallback
        const firstAtt = attachmentsToSave[0];
        const msgContent = messageInput.trim() || (firstAtt
            ? (firstAtt.type === 'audio' ? '🎤 Voice message' : firstAtt.type === 'video' ? '🎬 Video' : firstAtt.type === 'image' ? `📷 ${attachmentsToSave.length > 1 ? `${attachmentsToSave.length} photos` : 'Photo'}` : `📎 ${firstAtt.name}`)
            : '');

        // Optimistic UI update
        const newData = await addChatMessage(data, {
            id: crypto.randomUUID(), // Provide a client-side UUID
            channelId: activeChannelId,
            senderId: userId,
            senderName: user.name,
            senderRole: user.role as any,
            content: msgContent,
            replyToId: replyToMsg?.id,
            mentions: mentionsList,
            attachments: attachmentsToSave
        } as any);

        onUpdateAppData(newData);
        playSendSound();
        triggerHaptics('light');

        // Wait for realtime subscription to pull the message. Just clear input.
        setMessageInput('');
        setReplyToMsg(null);
        setPendingAttachments([]);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        // Stop typing indicator
        if (typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
            typingDebounceRef.current = null;
        }
        broadcastTyping(activeChannelId, userId, user.name, false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (docInputRef.current) docInputRef.current.value = '';
    };

    // ─── Clipboard Paste → attach images ───
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
            if (imageItems.length === 0) return;
            e.preventDefault();
            const newFiles = imageItems
                .map(item => item.getAsFile())
                .filter((f): f is File => f !== null);
            setPendingAttachments(prev => [...prev, ...newFiles].slice(0, 5));
            showToast(`${newFiles.length} image${newFiles.length > 1 ? 's' : ''} pasted`, 'success');
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    // ─── Drag and Drop onto chat area ───
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);
    const handleDragLeave = useCallback(() => setIsDragOver(false), []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const dropped = Array.from(e.dataTransfer.files).slice(0, 5);
        if (dropped.length > 0) {
            setPendingAttachments(prev => [...prev, ...dropped].slice(0, 5));
            showToast(`${dropped.length} file${dropped.length > 1 ? 's' : ''} added`, 'success');
        }
    }, []);

    // Helper to add files from any picker
    const addFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const arr = Array.from(files).slice(0, 5);
        setPendingAttachments(prev => [...prev, ...arr].slice(0, 5));
        setShowMobileAttachSheet(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    const SLASH_COMMANDS = useMemo(() => [
        { cmd: '/summarize', desc: 'Summarize the recent channel messages', action: () => { setMessageInput(''); handleSummarizeChannelInline(); } },
        { cmd: '/translate sw', desc: 'Translate current text to Swahili', action: () => { handleRephraseInput('translate-sw'); } },
        { cmd: '/translate en', desc: 'Translate current text to English', action: () => { handleRephraseInput('translate-en'); } },
        { cmd: '/professional', desc: 'Refine tone to be professional', action: () => { handleRephraseInput('tone'); } },
        { cmd: '/correct', desc: 'Correct spelling and grammar', action: () => { handleRephraseInput('grammar'); } },
        { cmd: '/draft', desc: 'Ask Sally to draft a message', action: (args?: string) => {
            if (args) {
                handleDraftPrompt(args);
                setMessageInput('');
            } else {
                setMessageInput('Draft: [Type topic here]');
                setTimeout(() => {
                    const t = textareaRef.current;
                    if (t) {
                        t.focus();
                        t.setSelectionRange(7, 24);
                    }
                }, 50);
            }
        }},
    ], [handleSummarizeChannelInline, handleRephraseInput, handleDraftPrompt]);

    const filteredCommands = useMemo(() => {
        if (!showSlashCommands) return [];
        return SLASH_COMMANDS.filter(c => c.cmd.startsWith(slashQuery.toLowerCase()));
    }, [showSlashCommands, slashQuery, SLASH_COMMANDS]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSlashCommands && filteredCommands.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSlashIdx(prev => (prev + 1) % filteredCommands.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSlashIdx(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const cmdObj = filteredCommands[selectedSlashIdx];
                const restText = messageInput.substring(cmdObj.cmd.length).trim();
                cmdObj.action(restText);
                setShowSlashCommands(false);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowSlashCommands(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            if (enterIsSend) {
                e.preventDefault();
                handleSendMessage();
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const target = e.target;
        target.style.height = 'auto';
        target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
        
        const val = target.value;
        setMessageInput(val);

        // Slash command trigger detection
        if (val.startsWith('/')) {
            setShowSlashCommands(true);
            const query = val.split(' ')[0] || '';
            setSlashQuery(query);
            setSelectedSlashIdx(0);
        } else {
            setShowSlashCommands(false);
        }

        // Detect @ for mentions
        const lastWord = val.split(/\s/).pop() || '';
        if (lastWord.startsWith('@') && lastWord.length > 1) { setShowMentions(true); setMentionFilter(lastWord.slice(1)); }
        else setShowMentions(false);

        // Broadcast typing indicator to other users immediately on first keystroke, then debounce the clear
        if (val.trim().length > 0 && activeChannelId && user) {
            if (!typingDebounceRef.current) {
                broadcastTyping(activeChannelId, userId, user.name, true);
            } else {
                clearTimeout(typingDebounceRef.current);
            }
            typingDebounceRef.current = setTimeout(() => {
                broadcastTyping(activeChannelId, userId, user.name, false);
                typingDebounceRef.current = null;
            }, 2000);
        } else if (val.trim().length === 0 && activeChannelId && user && typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
            broadcastTyping(activeChannelId, userId, user.name, false);
            typingDebounceRef.current = null;
        }
    };

    const insertMention = (name: string) => {
        const parts = messageInput.split(/\s/);
        parts[parts.length - 1] = `@${name} `;
        setMessageInput(parts.join(' '));
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const insertEmoji = (emoji: string) => {
        const t = textareaRef.current;
        if (!t) {
            setMessageInput(prev => prev + emoji);
            return;
        }
        const s = t.selectionStart, e = t.selectionEnd;
        const val = messageInput;
        const newVal = val.substring(0, s) + emoji + val.substring(e);
        setMessageInput(newVal);
        setTimeout(() => {
            t.style.height = 'auto';
            t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            t.focus();
            t.setSelectionRange(s + emoji.length, s + emoji.length);
        }, 0);
    };

    const handleEditSave = async (chId: string, msgId: string) => {
        if (!editContent.trim()) return;
        const newData = await editChatMessage(data, chId, msgId, editContent.trim());
        onUpdateAppData(newData);
        setEditingMsgId(null);
        setEditContent('');
        showToast('Message updated', 'success');
    };

    const handleDelete = async (chId: string, msgId: string) => {
        const newData = await softDeleteChatMessage(data, chId, msgId);
        onUpdateAppData(newData);
        showToast('Message deleted', 'info');
    };

    const handlePin = async (chId: string, msgId: string) => {
        const newData = await togglePinMessage(data, chId, msgId);
        onUpdateAppData(newData);
        showToast('Pin toggled', 'info');
    };

    const handleReaction = async (chId: string, msgId: string, emoji: string) => {
        const newData = await toggleReaction(data, chId, msgId, emoji, userId);
        onUpdateAppData(newData);
        setShowEmojiPicker(null);
    };

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        const newData = await addChatChannel(data, {
            name: newChannelName.trim(),
            type: newChannelType,
            description: newChannelDesc.trim() || undefined,
            createdBy: userId,
            createdAt: new Date().toISOString()
        });
        onUpdateAppData(newData);
        
        // Find the newly created channel to set it as active
        const newChannel = newData.communications?.channels?.find(c => c.name === newChannelName.trim() && c.type === newChannelType);
        if (newChannel) {
            setActiveChannelId(newChannel.id);
        }
        
        setShowNewChannel(false);
        setNewChannelName('');
        setNewChannelDesc('');
        showToast(`Channel "${newChannelName.trim()}" created`, 'success');
    };

    const handleDeleteChannel = async (channelId: string) => {
        if (channelId === 'chan_general' || channelId === 'chan_announcements') {
            showToast("Default channels can't be deleted", 'error');
            return;
        }
        const newData = await deleteChatChannel(data, channelId);
        onUpdateAppData(newData);
        if (activeChannelId === channelId) setActiveChannelId(channels[0]?.id || '');
        showToast('Channel deleted', 'info');
    };

    const handleStartDM = async (targetUserId: string) => {
        setIsLoadingUsers(true);
        const dmChannel = await createDirectMessage(userId, targetUserId);
        setIsLoadingUsers(false);
        if (dmChannel) {
            // Inject the channel into local state if not already present
            const alreadyExists = channels.some(c => c.id === dmChannel.id);
            if (!alreadyExists) {
                onUpdateAppData({
                    ...data,
                    communications: {
                        ...(data.communications || {}),
                        channels: [...channels, dmChannel],
                        messages: { ...messages, [dmChannel.id]: [] }
                    }
                });
            }
            setActiveChannelId(dmChannel.id);
            setShowNewDM(false);
            setShowMobileSidebar(false);
        } else {
            showToast("Failed to start direct message.", "error");
        }
    };

    const insertFormatting = (pre: string, suf: string) => { const t = textareaRef.current; if (!t) return; const s = t.selectionStart, e = t.selectionEnd; const sel = messageInput.substring(s, e); setMessageInput(messageInput.substring(0, s) + pre + sel + suf + messageInput.substring(e)); setTimeout(() => { t.focus(); t.setSelectionRange(s + pre.length, e + pre.length); }, 0); };

    const pinnedMessages = useMemo(() => allActiveMessages.filter(m => m.isPinned && !m.isDeleted), [allActiveMessages]);
    const uniqueUsers = useMemo(() => { const map = new Map<string, string>(); allActiveMessages.forEach(m => { if (!map.has(m.senderId)) map.set(m.senderId, m.senderName); }); return Array.from(map.entries()); }, [allActiveMessages]);

    const sharedMedia = useMemo(() => {
        const images: any[] = [];
        const docs: any[] = [];
        allActiveMessages.forEach(msg => {
            if (msg.attachments && !msg.isDeleted) {
                msg.attachments.forEach((att: any) => {
                    if (att.type.startsWith('image/')) {
                        images.push({ ...att, msgId: msg.id });
                    } else {
                        docs.push({ ...att, msgId: msg.id });
                    }
                });
            }
        });
        return { images, docs };
    }, [allActiveMessages]);

    // Find the first unread message index
    const firstUnreadIdx = useMemo(() => {
        const lastRead = activeChannel?.lastReadBy?.[userId];
        if (!lastRead) return -1;
        const idx = allActiveMessages.findIndex(m => m.id === lastRead);
        return idx >= 0 && idx < allActiveMessages.length - 1 ? idx + 1 : -1;
    }, [activeChannel, allActiveMessages, userId]);

    const groupedMessages = useMemo(() => {
        if (activeChannel?.type === 'announcement') return activeMessages.filter(m => !m.isDeleted).map(m => [m]);
        const groups: ChatMessage[][] = [];
        let curr: ChatMessage[] = [];
        activeMessages.forEach((msg) => {
            if (curr.length === 0) { curr.push(msg); return; }
            const prev = curr[curr.length - 1];
            if (prev.senderId === msg.senderId && new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime() < 5 * 60 * 1000 && !msg.replyToId) curr.push(msg);
            else { groups.push(curr); curr = [msg]; }
        });
        if (curr.length > 0) groups.push(curr);
        return groups;
    }, [activeMessages, activeChannel]);

    const hasMoreMessages = useMemo(() => {
        if (!activeChannel) return false;
        if (activeChannel.type === 'announcement') {
            return activeMessages.filter(m => !m.isDeleted).length > visibleGroupsCount;
        } else {
            return groupedMessages.length > visibleGroupsCount;
        }
    }, [activeChannel, activeMessages, groupedMessages, visibleGroupsCount]);

    const loadMoreMessages = useCallback(() => {
        if (!hasMoreMessages) return;
        const container = scrollContainerRef.current;
        if (!container) return;

        const previousScrollHeight = container.scrollHeight;
        const previousScrollTop = container.scrollTop;

        setVisibleGroupsCount(prev => prev + 30);

        // Maintain scroll position after state updates and DOM renders
        setTimeout(() => {
            if (container) {
                const newScrollHeight = container.scrollHeight;
                container.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
            }
        }, 10);
    }, [hasMoreMessages]);

    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (container && container.scrollTop < 50 && hasMoreMessages) {
            loadMoreMessages();
        }
    }, [hasMoreMessages, loadMoreMessages]);

    /* ─── Render Helpers ─── */
    const renderReactions = (msg: ChatMessage) => {
        if (!msg.reactions || Object.keys(msg.reactions).length === 0) return null;
        return (
            <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.entries(msg.reactions).map(([emoji, users]) => (
                    <button key={emoji} onClick={() => handleReaction(activeChannelId, msg.id, emoji)} className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all border ripple hover:scale-105 active:scale-95")} style={users.includes(userId) ? { background: 'var(--md-sys-color-primary-container)', borderColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary-container)' } : { background: 'var(--md-sys-color-surface-variant)', borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }} title={users.join(', ')}>
                        <span>{emoji}</span><span>{users.length}</span>
                    </button>
                ))}
            </div>
        );
    };

    const renderReplyPreview = (msg: ChatMessage) => {
        if (!msg.replyToId) return null;
        const original = allActiveMessages.find(m => m.id === msg.replyToId);
        if (!original) return null;
        return (
            <div className="flex items-center gap-2 mb-1 pl-3 text-xs" style={{ borderLeft: '2px solid var(--md-sys-color-primary)', color: 'var(--md-sys-color-secondary)' }}>
                <Reply size={10} /><span className="font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{original.senderName}</span><span className="truncate max-w-[200px]">{original.isDeleted ? 'Deleted message' : original.content}</span>
            </div>
        );
    };

    const renderMsgActions = (msg: ChatMessage) => {
        if (msg.isDeleted) return null;
        const isOwn = msg.senderId === userId, isAdm = user?.role === 'admin';
        const showNudge = !isOwn && activeChannel?.type !== 'dm';
        // Desktop-only hover toolbar (hidden on mobile — mobile uses long-press bottom sheet)
        return (
            <div className={clsx("absolute -top-3 right-2 items-center gap-0.5 glass-panel px-1 py-0.5 z-20 transition-opacity",
                "hidden md:flex opacity-0 md:group-hover/msg:opacity-100")} style={{ boxShadow: 'var(--shadow-elevation-2)' }}>
                <button onClick={() => { setReplyToMsg(msg); textareaRef.current?.focus(); }} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Reply"><Reply size={14} /></button>
                <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="React"><Smile size={14} /></button>
                
                {/* Inline AI Chat Assist Submenu */}
                <div className="relative group/ai z-30">
                    <button className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-400 transition-colors" title="AI Chat Assist"><Sparkles size={14} /></button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover/ai:flex flex-col rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden min-w-[140px]">
                        <button type="button" onClick={() => handleMessageBubbleAssist(msg.id, msg.content, 'summarize')} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium">Summarize</button>
                        <button type="button" onClick={() => handleMessageBubbleAssist(msg.id, msg.content, 'explain')} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium">Explain Terms</button>
                        <button type="button" onClick={() => handleMessageBubbleAssist(msg.id, msg.content, 'translate-sw')} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium">Translate (Swahili)</button>
                        <button type="button" onClick={() => handleMessageBubbleAssist(msg.id, msg.content, 'translate-en')} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium">Translate (English)</button>
                    </div>
                </div>

                {showNudge && <button onClick={() => handleStartDM(msg.senderId)} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-primary-container)] transition-colors" style={{ color: 'var(--md-sys-color-primary)' }} title={`DM ${msg.senderName}`}><UserPlus size={14} /></button>}
                {(isOwn || isAdm) && <button onClick={() => handlePin(activeChannelId, msg.id)} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: msg.isPinned ? 'var(--google-yellow)' : 'var(--md-sys-color-secondary)' }} title="Pin"><Pin size={14} /></button>}
                {isOwn && <button onClick={() => { setEditingMsgId(msg.id); setEditContent(msg.content); }} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Edit"><Pencil size={14} /></button>}
                {(isOwn || isAdm) && <button onClick={() => handleDelete(activeChannelId, msg.id)} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-error)' }} title="Delete"><Trash2 size={14} /></button>}
            </div>
        );
    };

    const renderEmojiPicker = (msgId: string) => showEmojiPicker !== msgId ? null : (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-12 right-0 glass-panel px-2 py-1.5 flex gap-1 z-30" style={{ boxShadow: 'var(--shadow-elevation-3)' }}>
            {EMOJI_OPTIONS.map(emoji => <button key={emoji} onClick={() => handleReaction(activeChannelId, msgId, emoji)} className="w-8 h-8 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-90 ripple" title={emoji}>{emoji}</button>)}
        </motion.div>
    );

    if (channels.length === 0) {
        return (
            <div className="flex-col h-full items-center justify-center flex glass-panel p-8 text-center">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6" style={{ background: 'var(--md-sys-color-primary-container)' }}>
                    <MessageSquare className="w-12 h-12" style={{ color: 'var(--md-sys-color-primary)' }} />
                </div>
                <h2 className="text-2xl font-google font-bold mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>No Channels Yet</h2>
                <p className="font-medium" style={{ color: 'var(--md-sys-color-secondary)' }}>Contact an administrator to set up communication channels.</p>
            </div>
        );
    }

    return (
        <div 
            className={clsx(
                "flex h-full w-full glass-panel overflow-hidden animate-fade-in relative transition-all duration-500",
                chatWallpaper === 'mesh' && "border-white/10 dark:border-white/5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
            )}
            style={getWallpaperStyle()}
        >
            {chatWallpaper === 'mesh' && (
                <MeshBackground className="absolute inset-0 z-0" />
            )}

            {/* Sidebar */}
            <ChannelSidebar 
                channels={channels} 
                activeChannelId={activeChannelId} 
                onSelectChannel={(id) => { 
                    setActiveChannelId(id); 
                    setShowMobileSidebar(false); 
                    setMobileView('chat');
                }} 
                onCreateChannel={() => setShowNewChannel(true)} 
                onStartDM={() => setShowNewDM(true)} 
                avatarMap={avatarMap} 
                userProfileMap={userProfileMap} 
                onDeleteChannel={handleDeleteChannel} 
                getUnreadCount={(chId) => getUnreadCount(data, chId, userId)} 
                isAdmin={user?.role === 'admin'} 
                user={user} 
                isOpen={showMobileSidebar} 
                onToggle={() => setShowMobileSidebar(p => !p)} 
                onNavigate={onNavigate}
                mobileView={mobileView}
            />

            {/* ═══ MAIN CHAT AREA ═══ */}
            {activeChannelId === 'video_meetings' ? (
                <div className={clsx("flex-1 flex flex-col relative overflow-hidden z-10", mobileView === 'chat' ? "flex" : "hidden lg:flex")} style={chatWallpaper === 'mesh' ? { background: 'transparent' } : { background: 'var(--md-sys-color-background)' }}>
                    <Suspense
                        fallback={
                            <div className="flex-1 grid place-items-center p-6">
                                <div className="flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-sm" style={{ background: 'var(--md-sys-color-surface)', borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}>
                                    <div className="h-3 w-3 rounded-full animate-pulse" style={{ background: 'var(--md-sys-color-primary)' }} />
                                    <span className="text-sm font-semibold">Preparing meeting room...</span>
                                </div>
                            </div>
                        }
                    >
                        <Meetings pendingMeetCode={internalMeetCode || pendingMeetCode} />
                    </Suspense>
                </div>
            ) : activeChannel ? (
                <>
                    <div
                        className={clsx("flex-1 flex flex-col relative overflow-hidden z-10", mobileView === 'chat' ? "flex" : "hidden lg:flex")}
                        style={chatWallpaper === 'mesh' ? { background: 'transparent' } : { background: 'var(--md-sys-color-background)' }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* Drag-drop overlay */}
                        <AnimatePresence>
                            {isDragOver && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none rounded-2xl border-4 border-dashed"
                                    style={{ background: 'var(--md-sys-color-primary-container)', borderColor: 'var(--md-sys-color-primary)', opacity: 0.92 }}
                                >
                                    <Paperclip size={48} style={{ color: 'var(--md-sys-color-primary)' }} className="mb-4 animate-bounce" />
                                    <p className="text-xl font-google font-bold" style={{ color: 'var(--md-sys-color-primary)' }}>Drop files to attach</p>
                                    <p className="text-sm mt-1" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>Up to 5 files at once</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Header */}
                        <div className={clsx(
                            "h-14 px-4 flex items-center justify-between flex-shrink-0 z-10 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.05] transition-all duration-300",
                            chatWallpaper === 'mesh' ? "bg-white/30 dark:bg-slate-950/20" : "bg-white/80 dark:bg-slate-950/40"
                        )}>
                            <div className="flex items-center gap-2">
                                {/* Mobile back button (returns to channel list view) */}
                                <button
                                    onClick={() => setMobileView('list')}
                                    className="lg:hidden p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                    title="Back to channel list"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="p-1.5 rounded-lg border border-slate-950/10 dark:border-white/15 bg-slate-950/5 dark:bg-white/5 text-slate-800 dark:text-slate-100">
                                    {activeChannel.type === 'announcement' ? <Megaphone size={15} strokeWidth={1.5} /> : activeChannel.type === 'dm' ? <User size={15} strokeWidth={1.5} /> : <Hash size={15} strokeWidth={1.5} />}
                                </div>
                                <div>
                                    <h1 className="font-google font-bold text-sm tracking-wide text-slate-950 dark:text-white">
                                        {activeChannel.type === 'dm' ? getDMPartnerName(activeChannel) : activeChannel.name}
                                    </h1>
                                    {activeChannel.description && <p className="text-[10px] font-medium hidden md:block text-slate-500 dark:text-slate-400">{activeChannel.description}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {(() => {
                                    const getHeaderBtnClass = (active: boolean) => clsx(
                                        "p-2 rounded-lg border transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 text-xs font-bold",
                                        active
                                            ? (chatWallpaper === 'mesh'
                                                ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-transparent shadow-sm"
                                                : "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white border-white/20")
                                            : (chatWallpaper === 'mesh'
                                                ? "bg-slate-950/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-950/10 dark:border-white/10 hover:bg-slate-950/10 dark:hover:bg-white/10"
                                                : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.05]")
                                    );
                                    return (
                                        <>
                                            {pinnedMessages.length > 0 && (
                                                <button onClick={() => setShowPinnedPanel(!showPinnedPanel)} className={clsx(getHeaderBtnClass(showPinnedPanel), "px-2.5 py-1.5")}>
                                                    <Pin size={13} className={clsx(showPinnedPanel ? (chatWallpaper === 'mesh' ? "text-white dark:text-slate-950" : "text-white") : "text-yellow-500 dark:text-yellow-400")} />
                                                    <span className="font-bold">{pinnedMessages.length}</span>
                                                </button>
                                            )}
                                            <button onClick={() => setShowSearch(!showSearch)} title="Search (Ctrl+K)" className={getHeaderBtnClass(showSearch)}><Search size={15} /></button>
                                            <button onClick={() => setShowInfoDrawer(!showInfoDrawer)} title="Channel info" className={getHeaderBtnClass(showInfoDrawer)}><Users size={15} /></button>
                                            <button onClick={() => { triggerHaptics('light'); setShowCustomSettings(true); }} title="Chat Customization" className={getHeaderBtnClass(showCustomSettings)}><Settings size={15} /></button>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Search / Pinned */}
                        <AnimatePresence>
                            {showSearch && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                                    <div className="p-3 flex items-center gap-2">
                                        <Search size={16} style={{ color: 'var(--md-sys-color-secondary)' }} />
                                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search messages... (Esc to close)" className="flex-1 bg-transparent outline-none text-sm font-google font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }} autoFocus />
                                        {searchQuery && <button onClick={() => setSearchQuery('')} style={{ color: 'var(--md-sys-color-secondary)' }}><X size={14} /></button>}
                                    </div>
                                </motion.div>
                            )}
                            {showPinnedPanel && pinnedMessages.length > 0 && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden max-h-48 overflow-y-auto" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-variant)' }}>
                                    <div className="p-3 space-y-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1" style={{ color: 'var(--google-yellow)' }}><Pin size={10} /> Pinned Messages</h4>
                                        {pinnedMessages.map(msg => (
                                            <div key={msg.id} className="p-2 rounded-xl text-xs" style={{ background: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                                                <span className="font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{msg.senderName}: </span>
                                                <span style={{ color: 'var(--md-sys-color-secondary)' }} className="line-clamp-1">{msg.content}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-1 overflow-hidden relative transition-all duration-500" style={getWallpaperStyle()}>
                            {inlineChatSummary && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    exit={{ opacity: 0, y: -20 }}
                                    className="absolute top-0 left-0 right-0 z-30 p-4 border-b border-indigo-500/20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg flex flex-col gap-2 max-h-60 overflow-y-auto"
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                        <span>Recent Chat Summary ({activeChannel?.name ? `#${activeChannel.name}` : 'Direct Message'})</span>
                                        <button 
                                            onClick={() => setInlineChatSummary(null)} 
                                            className="ml-auto p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
                                            title="Close Summary"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {inlineChatSummaryLoading ? (
                                        <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            Analyzing chat history and composing summary...
                                        </div>
                                    ) : (
                                        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-350 whitespace-pre-wrap select-text">{inlineChatSummary}</p>
                                    )}
                                </motion.div>
                            )}
                            {/* Messages Feed */}
                            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-4" style={{ minHeight: 0 }}>
                                {/* Channel Intro */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-6 pt-4 text-center">
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 mx-auto" style={{ background: 'var(--md-sys-color-primary-container)' }}>
                                        {activeChannel.type === 'announcement' ? <Megaphone size={28} style={{ color: 'var(--md-sys-color-primary)' }} /> : activeChannel.type === 'dm' ? <User size={28} style={{ color: 'var(--md-sys-color-primary)' }} /> : <Hash size={28} style={{ color: 'var(--md-sys-color-primary)' }} />}
                                    </div>
                                    <h2 className="text-xl font-google font-bold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                        {activeChannel.type === 'dm' ? "Direct Message" : `Welcome to #${activeChannel.name}!`}
                                    </h2>
                                    <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-secondary)' }}>
                                        {activeChannel.type === 'dm' ? "This is the start of your secure direct message history." : `This is the start of ${activeChannel.name}.`}
                                    </p>
                                </motion.div>

                                {activeChannel.type === 'announcement' ? (
                                    <div className="space-y-4 max-w-3xl mx-auto">
                                        {hasMoreMessages && (
                                            <div className="text-center py-4">
                                                <button
                                                    onClick={loadMoreMessages}
                                                    className="px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 mx-auto border hover:scale-105 active:scale-95"
                                                    style={{
                                                        background: 'var(--md-sys-color-surface-variant)',
                                                        borderColor: 'var(--md-sys-color-outline-variant)',
                                                        color: 'var(--md-sys-color-primary)'
                                                    }}
                                                >
                                                    <Calendar size={12} />
                                                    Load earlier announcements
                                                </button>
                                            </div>
                                        )}
                                        {activeMessages.filter(m => !m.isDeleted).slice(-visibleGroupsCount).map((msg, i, arr) => (
                                            <React.Fragment key={msg.id}>
                                                {(i === 0 || !isSameDay(msg.timestamp, arr[i - 1].timestamp)) && <DateSeparator date={msg.timestamp} />}
                                                <motion.div layout initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative glass-card p-5 group/msg animate-fade-in break-words hover:shadow-lg transition-all duration-300" style={{ animationFillMode: 'both' }}
                                                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                                                    onMouseLeave={() => { setHoveredMsgId(null); setShowEmojiPicker(null); }}
                                                    onPointerDown={(e) => { if (e.pointerType === 'touch') { longPressTimerRef.current = setTimeout(() => { triggerHaptics('medium'); setMobileActionMsg(msg); }, 400); } }}
                                                    onPointerUp={() => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } }}
                                                    onPointerCancel={() => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } }}>
                                                    {renderMsgActions(msg)}
                                                    {renderEmojiPicker(msg.id)}
                                                    {msg.isPinned && <div className="absolute top-3 right-3"><Pin size={12} style={{ color: 'var(--google-yellow)' }} /></div>}
                                                    <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                                                        <div className="flex items-center gap-3">
                                                            <UserAvatar name={msg.senderName} avatarUrl={avatarMap[msg.senderId]} size={40} />
                                                            <div>
                                                                <span className="font-bold text-sm block leading-none mb-0.5 font-google" style={{ color: 'var(--md-sys-color-on-surface)' }}>{msg.senderName}</span>
                                                                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>{msg.senderRole}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] font-medium flex items-center gap-1" style={{ color: 'var(--md-sys-color-secondary)' }}>
                                                            {msg.editedAt && <span className="italic">(edited)</span>}
                                                            {new Date(msg.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </div>
                                                    </div>
                                                    {editingMsgId === msg.id ? (
                                                        <div className="space-y-2">
                                                            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full rounded-xl p-3 text-sm outline-none resize-none" style={{ background: 'var(--md-sys-color-surface-variant)', border: '1px solid var(--md-sys-color-outline)', color: 'var(--md-sys-color-on-surface)' }} rows={3} />
                                                            <div className="flex gap-2 justify-end">
                                                                <button onClick={() => setEditingMsgId(null)} className="glass-button px-3 py-1.5 text-xs font-bold">Cancel</button>
                                                                <button onClick={() => handleEditSave(activeChannelId, msg.id)} className="btn-primary px-3 py-1.5 text-xs font-bold">Save</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={clsx("leading-relaxed", getFontSizeClass())} style={{ color: 'var(--md-sys-color-on-surface)' }}>{renderMarkdown(msg.content)}</div>
                                                    )}
                                                    {renderReactions(msg)}
                                                </motion.div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-1 max-w-3xl mx-auto">
                                        {hasMoreMessages && (
                                            <div className="text-center py-4">
                                                <button
                                                    onClick={loadMoreMessages}
                                                    className="px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 mx-auto border hover:scale-105 active:scale-95"
                                                    style={{
                                                        background: 'var(--md-sys-color-surface-variant)',
                                                        borderColor: 'var(--md-sys-color-outline-variant)',
                                                        color: 'var(--md-sys-color-primary)'
                                                    }}
                                                >
                                                    <Calendar size={12} />
                                                    Load earlier messages
                                                </button>
                                            </div>
                                        )}
                                        {(() => {
                                            const slicedGroups = groupedMessages.slice(-visibleGroupsCount);
                                            return slicedGroups.map((group, gIdx) => {
                                                const first = group[0];
                                                const prevGroup = gIdx > 0 ? slicedGroups[gIdx - 1] : null;
                                                const prevMsg = prevGroup ? prevGroup[prevGroup.length - 1] : null;
                                                const showDateSep = !prevMsg || !isSameDay(first.timestamp, prevMsg.timestamp);
                                                return (
                                                    <React.Fragment key={`g-${first.id}`}>
                                                        {showDateSep && <DateSeparator date={first.timestamp} />}
                                                        {firstUnreadIdx >= 0 && allActiveMessages.indexOf(first) === firstUnreadIdx && <UnreadSeparator />}
                                                        <MessageGroupRenderer
                                                            group={group}
                                                            userId={userId}
                                                            mIdxOffset={0}
                                                            avatarMap={avatarMap}
                                                            hoveredMsgId={hoveredMsgId}
                                                            setHoveredMsgId={setHoveredMsgId}
                                                            showEmojiPicker={showEmojiPicker}
                                                            setShowEmojiPicker={setShowEmojiPicker}
                                                            editingMsgId={editingMsgId}
                                                            setEditingMsgId={setEditingMsgId}
                                                            editContent={editContent}
                                                            setEditContent={setEditContent}
                                                            handleEditSave={handleEditSave}
                                                            renderMsgActions={renderMsgActions}
                                                            renderEmojiPicker={renderEmojiPicker}
                                                            renderReplyPreview={renderReplyPreview}
                                                            renderReactions={renderReactions}
                                                            activeChannelId={activeChannelId}
                                                            onLongPress={setMobileActionMsg}
                                                            onSwipeReply={(msg: any) => {
                                                                setReplyToMsg(msg);
                                                                textareaRef.current?.focus();
                                                            }}
                                                            onSwipeEdit={(msg: any) => {
                                                                if (msg.senderId === userId && !msg.isDeleted) {
                                                                    setEditingMsgId(msg.id);
                                                                    setEditContent(msg.content);
                                                                }
                                                            }}
                                                            channelData={data}
                                                            chatFontSize={chatFontSize}
                                                            triggerHaptics={triggerHaptics}
                                                            chatBubbleTheme={chatBubbleTheme}
                                                            messageAiAssists={messageAiAssists}
                                                            onDismissAiAssist={handleDismissAiAssist}
                                                            chatWallpaper={chatWallpaper}
                                                        />
                                                    </React.Fragment>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Channel Info Drawer */}
                            <AnimatePresence>
                                {showInfoDrawer && (
                                    <motion.div 
                                        initial={{ width: 0, opacity: 0 }} 
                                        animate={{ width: 310, opacity: 1 }} 
                                        exit={{ width: 0, opacity: 0 }} 
                                        className={clsx(
                                            "flex-shrink-0 overflow-hidden overflow-y-auto custom-scrollbar border-l transition-all duration-500 relative z-20",
                                            chatWallpaper === 'mesh' 
                                                ? "bg-white/20 dark:bg-slate-950/20 border-white/10 dark:border-white/5 backdrop-blur-xl" 
                                                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-white/[0.05]"
                                        )}
                                    >
                                        <div className="p-5 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-google font-bold text-sm text-slate-800 dark:text-slate-200">Channel Info</h3>
                                                <button onClick={() => setShowInfoDrawer(false)} className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={16} /></button>
                                            </div>
                                            <div className="text-center">
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                    {activeChannel.type === 'announcement' ? <Megaphone size={24} /> : activeChannel.type === 'dm' ? <User size={24} /> : <Hash size={24} />}
                                                </div>
                                                <h4 className="font-google font-bold text-slate-800 dark:text-slate-100">{activeChannel.type === 'dm' ? getDMPartnerName(activeChannel) : activeChannel.name}</h4>
                                                {activeChannel.description && <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">{activeChannel.description}</p>}
                                            </div>

                                            {/* Tab Switcher */}
                                            <div className="flex border-b border-slate-200/50 dark:border-white/5">
                                                <button 
                                                    type="button"
                                                    onClick={() => { triggerHaptics('light'); setInfoTab('members'); }} 
                                                    className={clsx(
                                                        "flex-1 pb-2 text-xs font-bold transition-all border-b-2 text-center", 
                                                        infoTab === 'members' 
                                                            ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" 
                                                            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                                    )}
                                                >
                                                    Members
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => { triggerHaptics('light'); setInfoTab('media'); }} 
                                                    className={clsx(
                                                        "flex-1 pb-2 text-xs font-bold transition-all border-b-2 text-center", 
                                                        infoTab === 'media' 
                                                            ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" 
                                                            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                                    )}
                                                >
                                                    Pins & Media
                                                </button>
                                            </div>

                                            {infoTab === 'members' ? (
                                                <div>
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 text-slate-400 dark:text-slate-500">Participants ({uniqueUsers.length})</h5>
                                                    <div className="space-y-2">
                                                        {uniqueUsers.map(([uid, name]) => {
                                                            const isActive = uid === userId || dmUsers.some(u => u.id === uid && u.isActive);
                                                            const role = uid === userId ? (user?.role || 'user') : 'user';
                                                            const isSelf = uid === userId;
                                                            return (
                                                                <div 
                                                                    key={uid} 
                                                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-2xl hover:bg-slate-200/40 dark:hover:bg-white/5 transition-all duration-300 group/member"
                                                                >
                                                                    <div className="relative">
                                                                        <UserAvatar name={name} avatarUrl={avatarMap[uid]} size={28} />
                                                                        <div className={clsx(
                                                                            "absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm",
                                                                            isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                                                                        )} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-xs font-bold font-google truncate text-slate-800 dark:text-slate-200">{name}</div>
                                                                        <div className="text-[8px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                                            {isSelf && <span className="text-indigo-500 dark:text-indigo-400">You</span>}
                                                                            {role === 'admin' && <span className="text-rose-500">Admin</span>}
                                                                        </div>
                                                                    </div>
                                                                    {!isSelf && (
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => {
                                                                                triggerHaptics('light');
                                                                                createDirectMessage(userId, uid).then(newCh => {
                                                                                    if (newCh) {
                                                                                        onUpdateAppData?.({
                                                                                            ...data,
                                                                                            communications: {
                                                                                                ...data.communications,
                                                                                                channels: [...data.communications.channels, newCh]
                                                                                            }
                                                                                        });
                                                                                        setActiveChannelId(newCh.id);
                                                                                        setMobileView('chat');
                                                                                    }
                                                                                });
                                                                            }}
                                                                            className="opacity-0 group-hover/member:opacity-100 p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all scale-90 hover:scale-100"
                                                                            title={`Send Direct Message to ${name}`}
                                                                        >
                                                                            <MessageSquare size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Pinned Messages */}
                                                    <div>
                                                        <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 text-slate-400 dark:text-slate-500 flex items-center gap-1"><Pin size={10} className="text-yellow-500" /> Pinned Messages ({pinnedMessages.length})</h5>
                                                        {pinnedMessages.length === 0 ? (
                                                            <div className="text-[11px] text-slate-400 dark:text-slate-500 italic px-2">No pinned messages yet.</div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {pinnedMessages.map(m => (
                                                                    <div 
                                                                        key={m.id} 
                                                                        onClick={() => {
                                                                            triggerHaptics('light');
                                                                            const el = document.getElementById(`msg-${m.id}`);
                                                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        }}
                                                                        className="p-2.5 rounded-2xl text-[11px] border border-slate-200/50 dark:border-white/5 hover:border-indigo-500/30 cursor-pointer transition-all hover:translate-y-[-1px] hover:shadow-sm"
                                                                        style={chatWallpaper === 'mesh' ? { background: 'rgba(255, 255, 255, 0.15)' } : { background: 'var(--md-sys-color-surface-variant)' }}
                                                                    >
                                                                        <div className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">{m.senderName}</div>
                                                                        <div className="text-slate-650 dark:text-slate-400 line-clamp-2">{m.content}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Shared Photos */}
                                                    <div>
                                                        <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 text-slate-400 dark:text-slate-500 flex items-center gap-1"><ImageIcon size={10} /> Shared Photos ({sharedMedia.images.length})</h5>
                                                        {sharedMedia.images.length === 0 ? (
                                                            <div className="text-[11px] text-slate-400 dark:text-slate-500 italic px-2">No shared photos.</div>
                                                        ) : (
                                                            <div className="grid grid-cols-3 gap-1.5">
                                                                {sharedMedia.images.map((img: any, idx: number) => (
                                                                    <div 
                                                                        key={idx} 
                                                                        onClick={() => {
                                                                            triggerHaptics('light');
                                                                            const el = document.getElementById(`msg-${img.msgId}`);
                                                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        }}
                                                                        className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-200/50 dark:border-white/5 hover:scale-105 active:scale-95 transition-all shadow-sm group/photo"
                                                                    >
                                                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover/photo:brightness-110" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Shared Files */}
                                                    <div>
                                                        <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 text-slate-400 dark:text-slate-500 flex items-center gap-1"><FileText size={10} /> Shared Documents ({sharedMedia.docs.length})</h5>
                                                        {sharedMedia.docs.length === 0 ? (
                                                            <div className="text-[11px] text-slate-400 dark:text-slate-500 italic px-2">No shared files.</div>
                                                        ) : (
                                                            <div className="space-y-1.5">
                                                                {sharedMedia.docs.map((doc: any, idx: number) => (
                                                                    <div 
                                                                        key={idx} 
                                                                        className="flex items-center gap-2 p-2 rounded-2xl border border-slate-200/50 dark:border-white/5 hover:border-indigo-500/20 transition-colors"
                                                                        style={chatWallpaper === 'mesh' ? { background: 'rgba(255, 255, 255, 0.15)' } : { background: 'var(--md-sys-color-surface-variant)' }}
                                                                    >
                                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                                                                            <FileText size={14} />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name}</div>
                                                                            <div className="text-[9px] opacity-60 text-slate-500 dark:text-slate-400">{(doc.size / 1024).toFixed(1)} KB</div>
                                                                        </div>
                                                                        <a 
                                                                            href={doc.url} 
                                                                            download={doc.name}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={() => triggerHaptics('light')}
                                                                            className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/5 text-indigo-650 dark:text-indigo-400 flex-shrink-0"
                                                                            title="Download file"
                                                                        >
                                                                            <Download size={13} />
                                                                        </a>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Input Area */}
                        <div className="relative">
                            <TypingIndicator typers={Array.from(remoteTypers.values()).map(t => t.name)} />
                            
                            {activeChannel.type === 'announcement' && user?.role !== 'admin' ? (
                                <div className="p-4 text-center" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-variant)' }}>
                                    <p className="text-sm font-bold flex items-center justify-center gap-2" style={{ color: 'var(--md-sys-color-secondary)' }}><ShieldAlert size={16} /> Only administrators can broadcast here.</p>
                                </div>
                            ) : (
                                <div className={clsx(
                                    "px-3 pb-safe-bottom pt-3 md:px-5 md:pb-5 transition-all duration-300 border-t border-slate-200/50 dark:border-white/[0.05] backdrop-blur-xl z-20 relative",
                                    chatWallpaper === 'mesh' ? "bg-white/30 dark:bg-slate-950/20" : "bg-white/80 dark:bg-slate-950/40"
                                )} style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
                                <AnimatePresence>
                                    {replyToMsg && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden max-w-4xl mx-auto">
                                            <div className="flex items-center gap-2 mb-2 p-2.5 rounded-2xl text-xs border" style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                                                <Reply size={14} style={{ color: 'var(--md-sys-color-primary)' }} />
                                                <span>Replying to <span className="font-bold">{replyToMsg.senderName}</span></span>
                                                <span className="truncate flex-1 opacity-70">"{replyToMsg.content.slice(0, 60)}"</span>
                                                <button onClick={() => setReplyToMsg(null)} className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"><X size={12} /></button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {/* Formatting toolbar — always visible on desktop, toggle on mobile */}
                                <div className={clsx(
                                    "max-w-4xl mx-auto flex flex-nowrap overflow-x-auto custom-scrollbar items-center gap-1.5 mb-2 px-1 transition-all",
                                    // On mobile: only show when expanded via the '+' button
                                    showMobileFormats ? "flex" : "hidden md:flex"
                                )}>
                                    <button onClick={() => insertFormatting('**', '**')} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Bold"><Bold size={14} /></button>
                                    <button onClick={() => insertFormatting('*', '*')} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Italic"><Italic size={14} /></button>
                                    <button onClick={() => insertFormatting('`', '`')} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Code snippet"><Code size={14} /></button>
                                    <button onClick={() => insertFormatting('', '👍')} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Thumbs up">👍</button>
                                    <button onClick={() => insertFormatting('', '😊')} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Smile">😊</button>
                                    <button onClick={() => insertFormatting('', '🔥')} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Fire">🔥</button>

                                    <div className="flex-1" />
                                    {activeChannel.type === 'announcement' && (
                                        <div className="relative">
                                            <button onClick={() => setShowTemplates(!showTemplates)} className={clsx("glass-button px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5", showTemplates && "btn-primary")}>
                                                <FileText size={14} /> Templates
                                            </button>
                                            <AnimatePresence>
                                                {showTemplates && (
                                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute bottom-full right-0 mb-2 w-56 glass-panel overflow-hidden z-30" style={{ boxShadow: 'var(--shadow-elevation-3)' }}>
                                                        {ANNOUNCEMENT_TEMPLATES.map(t => <button key={t.id} onClick={() => { setMessageInput(t.body); setShowTemplates(false); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--md-sys-color-surface-variant)] transition-colors font-google" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}>{t.title}</button>)}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                     {/* ── Input Slash Commands Popover ── */}
                                     <AnimatePresence>
                                         {showSlashCommands && filteredCommands.length > 0 && (
                                             <>
                                                 <div className="fixed inset-0 z-20" onClick={() => setShowSlashCommands(false)} />
                                                 <motion.div 
                                                     initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                                     animate={{ opacity: 1, y: 0, scale: 1 }} 
                                                     exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                                                     className="absolute bottom-[calc(100%+8px)] left-2 md:left-4 z-30 p-2 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl w-80 max-w-[calc(100vw-32px)] flex flex-col gap-0.5"
                                                 >
                                                     <div className="px-2.5 py-1 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
                                                         <span>Sally AI commands</span>
                                                         <span className="text-[9px] font-medium opacity-65">Press ↑↓ to navigate</span>
                                                     </div>
                                                     <div className="max-h-52 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                                                         {filteredCommands.map((cmd, idx) => {
                                                             const active = selectedSlashIdx === idx;
                                                             return (
                                                                 <button 
                                                                     key={cmd.cmd} 
                                                                     type="button" 
                                                                     onClick={() => {
                                                                         triggerHaptics('light');
                                                                         const restText = messageInput.substring(cmd.cmd.length).trim();
                                                                         cmd.action(restText);
                                                                         setShowSlashCommands(false);
                                                                     }} 
                                                                     className={clsx(
                                                                         "w-full text-left px-3 py-2 text-xs rounded-xl transition-all font-medium flex flex-col gap-0.5",
                                                                         active 
                                                                             ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25" 
                                                                             : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent"
                                                                     )}
                                                                 >
                                                                     <div className="font-bold flex items-center gap-1">
                                                                         <span className={active ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-500"}>{cmd.cmd}</span>
                                                                     </div>
                                                                     <div className="text-[10px] opacity-70">{cmd.desc}</div>
                                                                 </button>
                                                             );
                                                         })}
                                                     </div>
                                                 </motion.div>
                                             </>
                                         )}
                                     </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
                                    {/* ── Multi-file preview chips ── */}
                                    <AnimatePresence>
                                        {pendingAttachments.length > 0 && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
                                                <div className="flex flex-wrap gap-2 p-2">
                                                    {pendingAttachments.map((file, idx) => {
                                                        const isImg = file.type.startsWith('image/');
                                                        const isAudio = file.type.startsWith('audio/');
                                                        const isVideo = file.type.startsWith('video/');
                                                        const objUrl = isImg ? URL.createObjectURL(file) : null;
                                                        return (
                                                            <div key={idx} className="relative flex items-center gap-2 rounded-2xl text-xs border pr-2 overflow-hidden" style={{ background: 'var(--md-sys-color-surface-variant)', borderColor: 'var(--md-sys-color-outline-variant)', maxWidth: '200px' }}>
                                                                {isImg && objUrl
                                                                    ? <img src={objUrl} alt={file.name} className="w-10 h-10 object-cover rounded-l-2xl flex-shrink-0" onLoad={() => URL.revokeObjectURL(objUrl)} />
                                                                    : <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-l-2xl" style={{ background: 'var(--md-sys-color-primary-container)' }}>
                                                                        {isAudio ? <Mic size={16} style={{ color: 'var(--md-sys-color-primary)' }} /> : isVideo ? <ImageIcon size={16} style={{ color: 'var(--md-sys-color-primary)' }} /> : <FileText size={16} style={{ color: 'var(--md-sys-color-primary)' }} />}
                                                                    </div>
                                                                }
                                                                <div className="flex flex-col min-w-0 py-1">
                                                                    <span className="font-bold truncate" style={{ color: 'var(--md-sys-color-on-surface)', maxWidth: '100px' }}>{file.name}</span>
                                                                    <span className="opacity-60" style={{ color: 'var(--md-sys-color-on-surface)' }}>{(file.size / 1024).toFixed(1)} KB</span>
                                                                </div>
                                                                <button type="button" onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))} className="p-1 rounded-full ml-1 hover:bg-[var(--md-sys-color-surface)] transition-colors flex-shrink-0" style={{ color: 'var(--md-sys-color-error)' }}><X size={12} /></button>
                                                            </div>
                                                        );
                                                    })}
                                                    {pendingAttachments.length < 5 && (
                                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-2xl flex items-center justify-center border-2 border-dashed transition-colors hover:border-[var(--md-sys-color-primary)]" style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-secondary)' }}>
                                                            <Plus size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Hidden file inputs for all picker types */}
                                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={e => addFiles(e.target.files)} />
                                    <input type="file" ref={imageInputRef} className="hidden" multiple accept="image/*,video/*" onChange={e => addFiles(e.target.files)} />
                                    <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={e => addFiles(e.target.files)} />
                                    <input type="file" ref={docInputRef} className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" onChange={e => addFiles(e.target.files)} />

                                    {/* ── Mobile Attach Action Sheet ── */}
                                    <AnimatePresence>
                                        {showMobileAttachSheet && (
                                            <>
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowMobileAttachSheet(false)} />
                                                <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 grid grid-cols-4 gap-4" style={{ background: 'var(--md-sys-color-surface)', boxShadow: 'var(--shadow-elevation-3)', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
                                                    {[
                                                        { icon: <ImageIcon size={22} />, label: 'Photos', color: '#3b82f6', action: () => imageInputRef.current?.click() },
                                                        { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M20 7h-3.5l-1.5-2h-6L7.5 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>, label: 'Camera', color: '#10b981', action: () => cameraInputRef.current?.click() },
                                                        { icon: <FileText size={22} />, label: 'Document', color: '#f59e0b', action: () => docInputRef.current?.click() },
                                                        { icon: <Mic size={22} />, label: 'Audio', color: '#8b5cf6', action: () => { setShowMobileAttachSheet(false); startRecording(); } },
                                                    ].map(({ icon, label, color, action }) => (
                                                <button key={label} type="button" onClick={action} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md" style={{ background: color + '22', color }}>
                                                                {icon}
                                                            </div>
                                                            <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{label}</span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>

                                    {/* ── Input Emoji Picker Popover ── */}
                                    <AnimatePresence>
                                        {showEmojiPicker === 'input' && (
                                            <>
                                                <div className="fixed inset-0 z-20" onClick={() => setShowEmojiPicker(null)} />
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                                                    className="absolute bottom-[calc(100%+8px)] left-2 md:left-4 z-30 p-3 rounded-2xl glass-panel w-72 max-w-[calc(100vw-32px)]"
                                                    style={{ boxShadow: 'var(--shadow-elevation-3)', background: 'var(--md-sys-color-surface)' }}
                                                >
                                                    <div className="text-xs font-bold mb-2 uppercase tracking-wider text-[var(--md-sys-color-secondary)]">Insert Emoji</div>
                                                    <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                                                        {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '✅', '👀', '✨', '🤔', '💡', '🚀', '💯', '😊', '🥳', '😎', '😅', '👋', '⭐', '❌', '📅'].map(emoji => (
                                                            <button 
                                                                key={emoji} 
                                                                type="button" 
                                                                onClick={() => {
                                                                    triggerHaptics('light');
                                                                    insertEmoji(emoji);
                                                                }} 
                                                                className="w-10 h-10 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>

                                     <div className={clsx(
                                         "flex items-end rounded-[24px] transition-all duration-300 p-2 gap-2 backdrop-blur-xl border", 
                                         isInputFocused || isRecording 
                                             ? "bg-white/90 dark:bg-slate-900/70 border-indigo-500/40 dark:border-indigo-400/40 shadow-[0_4px_24px_rgba(99,102,241,0.12)] scale-[1.005]" 
                                             : "bg-white/60 dark:bg-slate-900/30 border-slate-200/80 dark:border-white/[0.06] hover:bg-white/80 dark:hover:bg-slate-900/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                                     )}>
                                         <div className="flex items-center gap-1">
                                             {/* Mobile: '+' opens the attach sheet */}
                                             <button type="button" onClick={() => setShowMobileAttachSheet(p => !p)} className="md:hidden p-2 rounded-xl bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90" title="Attach">
                                                 <motion.div animate={{ rotate: showMobileAttachSheet ? 45 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                                                     <Plus size={20} />
                                                 </motion.div>
                                             </button>
                                             {/* Desktop: paperclip opens full picker */}
                                             <button type="button" onClick={() => fileInputRef.current?.click()} className="hidden md:flex p-2 rounded-xl bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Attach file (or drag & drop / paste image)"><Paperclip size={18} /></button>
                                             {/* Dedicated Sally AI Copilot Button (resolves keyboard Send/Enter overlap layout clash) */}
                                             <div className="relative">
                                                 <button 
                                                     type="button" 
                                                     onClick={() => {
                                                         triggerHaptics('light');
                                                         setShowAiInputMenu(prev => !prev);
                                                     }} 
                                                     className={clsx(
                                                         "p-2 rounded-xl transition-all flex items-center justify-center", 
                                                         showAiInputMenu 
                                                             ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" 
                                                             : (chatWallpaper === 'mesh'
                                                                 ? "bg-white/5 hover:bg-white/10 text-slate-400 dark:text-slate-350 border border-slate-200/10 dark:border-white/5"
                                                                 : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400")
                                                     )} 
                                                     title="AI Chat Assist Options"
                                                 >
                                                     {aiAssistLoading ? (
                                                         <div className="w-[18px] h-[18px] border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                     ) : (
                                                         <Sparkles size={18} />
                                                     )}
                                                 </button>
                                                 
                                                 {showAiInputMenu && (
                                                     <>
                                                         <div className="fixed inset-0 z-40" onClick={() => setShowAiInputMenu(false)} />
                                                         <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 p-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden min-w-[210px] flex flex-col gap-0.5">
                                                             <div className="px-2.5 py-1 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide border-b border-slate-100 dark:border-white/5 mb-1">
                                                                 AI Chat Assist
                                                             </div>
                                                             {messageInput.trim() ? (
                                                                 <>
                                                                     <button type="button" onClick={() => handleRephraseInput('grammar')} className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors font-medium">Correct Statement Phrase</button>
                                                                     <button type="button" onClick={() => handleRephraseInput('tone')} className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors font-medium">Make Tone Professional</button>
                                                                     <button type="button" onClick={() => handleRephraseInput('translate-sw')} className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors font-medium">Translate to Swahili</button>
                                                                     <button type="button" onClick={() => handleRephraseInput('translate-en')} className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors font-medium">Translate to English</button>
                                                                 </>
                                                             ) : (
                                                                 <div className="px-3 py-2 text-[10px] text-slate-400 dark:text-slate-500 italic">
                                                                     Type a message to enable phrase assist, translation, or tone corrections.
                                                                 </div>
                                                             )}
                                                             <div className="border-t border-slate-100 dark:border-white/5 my-1" />
                                                             <button type="button" onClick={handleSummarizeChannelInline} className="w-full text-left px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors font-semibold flex items-center justify-between">
                                                                 Summarize Recent Chat
                                                             </button>
                                                         </div>
                                                     </>
                                                 )}
                                             </div>
                                             {/* Emoji Picker Toggle Button */}
                                             <button 
                                                 type="button" 
                                                 onClick={() => {
                                                     triggerHaptics('light');
                                                     setShowEmojiPicker(showEmojiPicker === 'input' ? null : 'input');
                                                 }} 
                                                 className={clsx("p-2 rounded-xl transition-all", showEmojiPicker === 'input' ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20" : "bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300")}
                                                 title="Insert emoji"
                                             >
                                                 <Smile size={18} />
                                             </button>
                                         </div>

                                         {isRecording ? (
                                              <div className="flex-1 flex items-center gap-3 py-1 px-3 min-h-[36px] overflow-hidden">
                                                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping flex-shrink-0" />
                                                  <span className="font-google font-bold text-red-500 text-sm flex-shrink-0">{Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                                                  
                                                  {/* Animating Waveform Visualizer */}
                                                  <div className="flex items-center gap-[3px] h-6 px-3 flex-1 overflow-hidden select-none">
                                                      {audioLevels.map((level, i) => (
                                                          <motion.div 
                                                              key={i} 
                                                              className="w-[3px] rounded-full bg-red-500 dark:bg-red-400"
                                                              style={{ height: `${level}px` }}
                                                              animate={{ height: `${level}px` }}
                                                              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                                                          />
                                                      ))}
                                                  </div>
                                              </div>
                                         ) : (
                                             <textarea ref={textareaRef} value={messageInput} onChange={handleInputChange} onKeyDown={handleKeyDown} onFocus={() => setIsInputFocused(true)} onBlur={() => setTimeout(() => { setIsInputFocused(false); setShowMentions(false); }, 200)} placeholder={activeChannel.type === 'announcement' ? 'Compose broadcast message...' : `Message #${activeChannel.name}`} className="flex-1 bg-transparent py-2 px-2 border-none outline-none focus:outline-none focus:ring-0 resize-none overflow-y-auto max-h-32 min-h-[36px] text-[15px] font-google font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 scrollbar-none" style={{ outline: 'none', border: 'none', boxShadow: 'none' }} rows={1} />
                                         )}

                                         <div className="flex items-center gap-1.5">
                                             {isRecording ? (
                                                 <>
                                                     <button type="button" onClick={() => stopRecording(true)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={18} /></button>
                                                     <button 
                                                         type="button" 
                                                         onClick={() => stopRecording(false)} 
                                                         className={clsx(
                                                             "w-9 h-9 flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm",
                                                             chatWallpaper === 'mesh'
                                                                 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                                                                 : "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white"
                                                         )}
                                                     >
                                                         <Send size={15} className="ml-0.5" />
                                                     </button>
                                                 </>
                                             ) : (
                                                 <button 
                                                     type="button" 
                                                     onClick={e => {
                                                         if (!messageInput.trim() && pendingAttachments.length === 0) { startRecording(); }
                                                         else { handleSendMessage(e as any); }
                                                     }} 
                                                     disabled={isUploadingAttachment} 
                                                     className={clsx(
                                                         "w-9 h-9 flex items-center justify-center rounded-full disabled:opacity-40 hover:scale-108 active:scale-95 transition-all",
                                                         chatWallpaper === 'mesh'
                                                             ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                                                             : "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
                                                     )}
                                                 >
                                                     {isUploadingAttachment
                                                         ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                                         : (!messageInput.trim() && pendingAttachments.length === 0) ? <Mic size={18} /> : <Send size={15} className="ml-0.5" />}
                                                 </button>
                                             )}
                                         </div>
                                    </div>
                                </form>
                            </div>
                        )}
                        </div>
                    </div>
                </>
            ) : (
                <div className={clsx("flex-1 flex items-center justify-center z-10", mobileView === 'chat' ? "flex" : "hidden lg:flex")} style={chatWallpaper === 'mesh' ? { background: 'transparent' } : { background: 'var(--md-sys-color-background)' }}>
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--md-sys-color-primary-container)' }}>
                            <MessageSquare className="w-10 h-10" style={{ color: 'var(--md-sys-color-primary)' }} />
                        </div>
                        <h2 className="text-xl font-google font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Select a channel</h2>
                        <p className="font-medium mt-1" style={{ color: 'var(--md-sys-color-secondary)' }}>Pick a channel from the sidebar to start.</p>
                    </div>
                </div>
            )
            }

            {/* New Channel Modal */}
            <AnimatePresence>
                {showNewChannel && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowNewChannel(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-panel z-50 p-6" style={{ boxShadow: 'var(--shadow-elevation-3)' }}>
                            <h3 className="font-google font-bold text-lg mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>Create Channel</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold uppercase mb-1 block" style={{ color: 'var(--md-sys-color-secondary)' }}>Channel Name</label>
                                    <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="e.g. solar-department" className="w-full px-3 py-2.5 rounded-xl outline-none text-sm font-google" style={{ background: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface)', border: '1px solid var(--md-sys-color-outline)' }} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase mb-1 block" style={{ color: 'var(--md-sys-color-secondary)' }}>Description</label>
                                    <input value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)} placeholder="What's this channel about?" className="w-full px-3 py-2.5 rounded-xl outline-none text-sm font-google" style={{ background: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface)', border: '1px solid var(--md-sys-color-outline)' }} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase mb-1 block" style={{ color: 'var(--md-sys-color-secondary)' }}>Type</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setNewChannelType('chat')} className={clsx("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all", newChannelType === 'chat' ? "btn-primary" : "glass-button")}><Hash size={14} className="inline mr-1" /> Text</button>
                                        <button onClick={() => setNewChannelType('announcement')} className={clsx("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all", newChannelType === 'announcement' ? "btn-primary" : "glass-button")}><Megaphone size={14} className="inline mr-1" /> Broadcast</button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-5">
                                <button onClick={() => setShowNewChannel(false)} className="glass-button px-4 py-2 text-sm font-bold">Cancel</button>
                                <button onClick={handleCreateChannel} disabled={!newChannelName.trim()} className="btn-primary px-5 py-2 text-sm font-bold disabled:opacity-50">Create</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* New DM Modal */}
            <AnimatePresence>
                {showNewDM && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => { setShowNewDM(false); setDmUserSearch(''); }} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-panel z-50 flex flex-col max-h-[80vh] overflow-hidden" style={{ boxShadow: 'var(--shadow-elevation-3)' }}>
                            {/* Header */}
                            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                                <h3 className="font-google font-bold text-lg flex items-center gap-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--md-sys-color-primary)' }}>
                                        <UserPlus size={15} className="text-white" />
                                    </div>
                                    New Message
                                </h3>
                                <button onClick={() => { setShowNewDM(false); setDmUserSearch(''); }} className="p-1.5 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" title="Close"><X size={16} style={{ color: 'var(--md-sys-color-secondary)' }} /></button>
                            </div>

                            {/* Search */}
                            <div className="px-5 pt-4 pb-2">
                                <div className="relative">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--md-sys-color-secondary)' }} />
                                    <input
                                        value={dmUserSearch}
                                        onChange={e => setDmUserSearch(e.target.value)}
                                        placeholder="Search users..."
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none text-sm font-google font-medium"
                                        style={{ background: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* User List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-1">
                                {isLoadingUsers ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                                        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--md-sys-color-primary)', borderTopColor: 'transparent' }}></div>
                                        <span className="text-xs font-medium" style={{ color: 'var(--md-sys-color-secondary)' }}>Loading users...</span>
                                    </div>
                                ) : (() => {
                                    const filtered = dmUsers.filter(u => u.name.toLowerCase().includes(dmUserSearch.toLowerCase()) || u.role.toLowerCase().includes(dmUserSearch.toLowerCase()));
                                    return filtered.length === 0 ? (
                                        <div className="text-center py-8">
                                            <User size={32} className="mx-auto mb-2" style={{ color: 'var(--md-sys-color-secondary)', opacity: 0.5 }} />
                                            <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-secondary)' }}>{dmUserSearch ? 'No users match your search.' : 'No other active users found.'}</p>
                                        </div>
                                    ) : (
                                        filtered.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => handleStartDM(u.id)}
                                                className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-[var(--md-sys-color-surface-variant)] text-left group"
                                            >
                                                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm overflow-hidden" style={getAvatarStyle(u.name)}>
                                                    {u.avatarUrl ? (
                                                        <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        u.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm truncate font-google" style={{ color: 'var(--md-sys-color-on-surface)' }}>{u.name}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--md-sys-color-primary)' }}>{u.role}</div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MessageSquare size={16} style={{ color: 'var(--md-sys-color-primary)' }} />
                                                </div>
                                            </button>
                                        ))
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ═══ MOBILE MESSAGE ACTION BOTTOM-SHEET ═══
                Opens via long-press (400ms) on any message on touch devices.
                Clearly separates safe actions (emoji, reply) from destructive (delete).
                Prevents the old accidental-delete UX bug.
            */}
            <AnimatePresence>
                {mobileActionMsg && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 md:hidden"
                            onClick={() => setMobileActionMsg(null)}
                        />
                        {/* Sheet */}
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-3xl overflow-hidden"
                            style={{ background: 'var(--md-sys-color-surface)', boxShadow: '0 -8px 32px rgba(0,0,0,0.2)' }}
                        >
                            {/* Drag handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--md-sys-color-outline-variant)' }} />
                            </div>

                            {/* Message preview */}
                            <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                                <UserAvatar
                                    name={mobileActionMsg.senderName}
                                    avatarUrl={avatarMap[mobileActionMsg.senderId]}
                                    size={36}
                                    rounded="full"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm font-google truncate" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                        {mobileActionMsg.senderName}
                                    </p>
                                    <p className="text-xs truncate opacity-70" style={{ color: 'var(--md-sys-color-secondary)' }}>
                                        {mobileActionMsg.isDeleted ? 'Deleted message' : mobileActionMsg.content.slice(0, 60)}
                                    </p>
                                </div>
                            </div>

                            {/* Emoji Reactions — always safe, shown first */}
                            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--md-sys-color-secondary)' }}>React</p>
                                <div className="flex gap-3 justify-around">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => {
                                                handleReaction(activeChannelId, mobileActionMsg.id, emoji);
                                                setMobileActionMsg(null);
                                            }}
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all active:scale-90 hover:scale-110"
                                            style={{ background: 'var(--md-sys-color-surface-variant)' }}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="px-4 py-3 space-y-1">
                                {/* Copy Text */}
                                {!mobileActionMsg.isDeleted && (
                                     <>
                                     <button
                                         onClick={() => {
                                             triggerHaptics('success');
                                             navigator.clipboard.writeText(mobileActionMsg.content);
                                             showToast('Message copied to clipboard', 'success');
                                             setMobileActionMsg(null);
                                         }}
                                         className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors text-left"
                                         style={{ background: 'var(--md-sys-color-surface-variant)' }}
                                     >
                                         <Copy size={20} style={{ color: 'var(--md-sys-color-secondary)' }} />
                                         <span className="font-semibold font-google" style={{ color: 'var(--md-sys-color-on-surface)' }}>Copy Text</span>
                                     </button>
                                     <div className="p-2.5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-900/10 space-y-1.5">
                                         <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400">
                                             <Sparkles className="w-3 h-3 animate-pulse" />
                                             AI Chat Assist
                                         </div>
                                         <div className="grid grid-cols-2 gap-1.5">
                                             <button 
                                                 onClick={() => {
                                                     handleMessageBubbleAssist(mobileActionMsg.id, mobileActionMsg.content, 'summarize');
                                                     setMobileActionMsg(null);
                                                 }}
                                                 className="px-3 py-2 text-xs font-semibold rounded-xl text-center bg-white/5 hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/5"
                                             >
                                                 Summarize
                                             </button>
                                             <button 
                                                 onClick={() => {
                                                     handleMessageBubbleAssist(mobileActionMsg.id, mobileActionMsg.content, 'explain');
                                                     setMobileActionMsg(null);
                                                 }}
                                                 className="px-3 py-2 text-xs font-semibold rounded-xl text-center bg-white/5 hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/5"
                                             >
                                                 Explain Terms
                                             </button>
                                             <button 
                                                 onClick={() => {
                                                     handleMessageBubbleAssist(mobileActionMsg.id, mobileActionMsg.content, 'translate-sw');
                                                     setMobileActionMsg(null);
                                                 }}
                                                 className="px-3 py-2 text-xs font-semibold rounded-xl text-center bg-white/5 hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/5"
                                             >
                                                 Translate (SW)
                                             </button>
                                             <button 
                                                 onClick={() => {
                                                     handleMessageBubbleAssist(mobileActionMsg.id, mobileActionMsg.content, 'translate-en');
                                                     setMobileActionMsg(null);
                                                 }}
                                                 className="px-3 py-2 text-xs font-semibold rounded-xl text-center bg-white/5 hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/5"
                                             >
                                                 Translate (EN)
                                             </button>
                                         </div>
                                     </div>
                                     </>
                                )}

                                {/* Reply */}
                                <button
                                    onClick={() => {
                                        setReplyToMsg(mobileActionMsg);
                                        setMobileActionMsg(null);
                                        setTimeout(() => textareaRef.current?.focus(), 100);
                                    }}
                                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors text-left"
                                    style={{ background: 'var(--md-sys-color-surface-variant)' }}
                                >
                                    <Reply size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                                    <span className="font-semibold font-google" style={{ color: 'var(--md-sys-color-on-surface)' }}>Reply</span>
                                </button>

                                {/* Pin — own or admin */}
                                {(mobileActionMsg.senderId === userId || user?.role === 'admin') && (
                                    <button
                                        onClick={() => {
                                            handlePin(activeChannelId, mobileActionMsg.id);
                                            setMobileActionMsg(null);
                                        }}
                                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors text-left"
                                        style={{ background: 'var(--md-sys-color-surface-variant)' }}
                                    >
                                        <Pin size={20} style={{ color: mobileActionMsg.isPinned ? 'var(--google-yellow)' : 'var(--md-sys-color-secondary)' }} />
                                        <span className="font-semibold font-google" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                            {mobileActionMsg.isPinned ? 'Unpin' : 'Pin'}
                                        </span>
                                    </button>
                                )}

                                {/* Edit — own messages only */}
                                {mobileActionMsg.senderId === userId && !mobileActionMsg.isDeleted && (
                                    <button
                                        onClick={() => {
                                            setEditingMsgId(mobileActionMsg.id);
                                            setEditContent(mobileActionMsg.content);
                                            setMobileActionMsg(null);
                                        }}
                                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors text-left"
                                        style={{ background: 'var(--md-sys-color-surface-variant)' }}
                                    >
                                        <Pencil size={20} style={{ color: 'var(--md-sys-color-secondary)' }} />
                                        <span className="font-semibold font-google" style={{ color: 'var(--md-sys-color-on-surface)' }}>Edit</span>
                                    </button>
                                )}

                                {/* DM sender — others only */}
                                {mobileActionMsg.senderId !== userId && activeChannel?.type !== 'dm' && (
                                    <button
                                        onClick={() => {
                                            handleStartDM(mobileActionMsg.senderId);
                                            setMobileActionMsg(null);
                                        }}
                                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors text-left"
                                        style={{ background: 'var(--md-sys-color-surface-variant)' }}
                                    >
                                        <UserPlus size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                                        <span className="font-semibold font-google" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                            Message {mobileActionMsg.senderName}
                                        </span>
                                    </button>
                                )}

                                {/* ── DANGER ZONE — separated visually ── */}
                                {(mobileActionMsg.senderId === userId || user?.role === 'admin') && !mobileActionMsg.isDeleted && (
                                    <div className="pt-2" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                                        <button
                                            onClick={() => {
                                                handleDelete(activeChannelId, mobileActionMsg.id);
                                                setMobileActionMsg(null);
                                            }}
                                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors text-left"
                                            style={{ background: 'rgba(var(--md-sys-color-error-rgb, 186,26,26), 0.08)' }}
                                        >
                                            <Trash2 size={20} style={{ color: 'var(--md-sys-color-error)' }} />
                                            <span className="font-semibold font-google" style={{ color: 'var(--md-sys-color-error)' }}>Delete Message</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Safe area bottom padding */}
                            <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Android Chat Settings Modal */}
            <AnimatePresence>
                {showCustomSettings && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-md" 
                            onClick={() => setShowCustomSettings(false)} 
                        />
                        <motion.div 
                            initial={{ y: '100%', opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: '100%', opacity: 0 }} 
                            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                            className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md w-full glassmorphic-card-premium z-50 p-6 rounded-t-3xl sm:rounded-[24px] overflow-hidden border border-white/10" 
                            style={{ 
                                boxShadow: '0 20px 40px rgba(0,0,0,0.3)', 
                                background: 'rgba(15, 23, 42, 0.75)',
                                paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))'
                            }}
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                                <h3 className="text-base font-google font-bold text-slate-100">Chat Customization</h3>
                                <button onClick={() => { triggerHaptics(); setShowCustomSettings(false); }} className="p-1 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="mt-5 space-y-6 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                {/* Wallpaper Selection */}
                                <div>
                                    <label className="text-xs font-black uppercase tracking-wider block mb-2 text-indigo-400">Chat Wallpaper</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[
                                            { id: 'mesh', label: '3D Mesh', bg: 'linear-gradient(135deg, #1e1b4b 0%, #020617 100%)' },
                                            { id: 'default', label: 'Default', bg: 'var(--md-sys-color-background)' },
                                            { id: 'midnight', label: 'Midnight', bg: 'radial-gradient(circle, #1e1b4b 0%, #030712 100%)' },
                                            { id: 'sunset', label: 'Sunset', bg: 'linear-gradient(135deg, #fef08a 0%, #f43f5e 50%, #4c1d95 100%)' },
                                            { id: 'emerald', label: 'Oasis', bg: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' },
                                            { id: 'doodle', label: 'Doodle', bg: '#111827', border: 'dashed' },
                                        ].map((wp) => (
                                            <button 
                                                key={wp.id} 
                                                type="button"
                                                onClick={() => { triggerHaptics('light'); setChatWallpaper(wp.id as any); }}
                                                className={clsx(
                                                    "h-12 rounded-xl border transition-all flex flex-col items-center justify-center p-1 relative overflow-hidden active:scale-95",
                                                    chatWallpaper === wp.id ? "border-indigo-500 scale-105 shadow-[0_0_10px_rgba(99,102,241,0.4)] opacity-100" : "border-white/10 opacity-70 hover:opacity-100"
                                                )}
                                                title={wp.label}
                                            >
                                                <div className="absolute inset-0.5 rounded-lg" style={{ background: wp.bg }} />
                                                <span className="relative z-10 text-[9px] font-bold text-white bg-black/40 px-1 rounded truncate max-w-full">{wp.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Bubble Color Theme Selection */}
                                <div>
                                    <label className="text-xs font-black uppercase tracking-wider block mb-2 text-indigo-400">Message Bubble Theme</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {[
                                            { id: 'default', label: 'Default', bg: 'var(--md-sys-color-primary)' },
                                            { id: 'lavender', label: 'Indigo', bg: '#4f46e5' },
                                            { id: 'rose', label: 'Rose', bg: '#e11d48' },
                                            { id: 'ocean', label: 'Sky', bg: '#0284c7' },
                                            { id: 'emerald', label: 'Emerald', bg: '#059669' },
                                            { id: 'amethyst', label: 'Purple', bg: '#9333ea' },
                                        ].map((theme) => (
                                            <button 
                                                key={theme.id} 
                                                type="button"
                                                onClick={() => { triggerHaptics('light'); setChatBubbleTheme(theme.id as any); }}
                                                className={clsx(
                                                    "h-12 rounded-xl border transition-all flex flex-col items-center justify-center p-1 relative overflow-hidden active:scale-95",
                                                    chatBubbleTheme === theme.id ? "border-indigo-500 scale-105 shadow-[0_0_10px_rgba(99,102,241,0.4)] opacity-100" : "border-white/10 opacity-70 hover:opacity-100"
                                                )}
                                                title={theme.label}
                                            >
                                                <div className="w-6 h-6 rounded-full" style={{ background: theme.bg }} />
                                                <span className="relative z-10 text-[8px] font-bold text-white bg-black/40 px-1 mt-1 rounded truncate max-w-full">{theme.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Enter Is Send Toggle */}
                                <div className="flex items-center justify-between py-3 border-b border-white/[0.08]">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-100">Enter is Send</h4>
                                        <p className="text-xs text-slate-400">Pressing Enter key on keyboard will send message</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => { triggerHaptics('light'); setEnterIsSend(!enterIsSend); }}
                                        className={clsx(
                                            "w-12 h-6 rounded-full p-1 transition-all duration-300 relative border border-white/10",
                                            enterIsSend ? "bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.3)]" : "bg-white/10"
                                        )}
                                    >
                                        <div 
                                            className={clsx(
                                                "w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-md absolute top-1 left-1",
                                                enterIsSend ? "translate-x-6" : "translate-x-0"
                                            )} 
                                        />
                                    </button>
                                </div>

                                {/* Text Font Size Slider */}
                                <div className="space-y-2 py-3 border-b border-white/[0.08]">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-semibold text-slate-100">Font Size</h4>
                                        <span className="text-xs font-bold text-indigo-400 uppercase font-mono">{chatFontSize}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs opacity-60 text-slate-300">A</span>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="3" 
                                            value={['small', 'medium', 'large', 'xlarge'].indexOf(chatFontSize)}
                                            onChange={(e) => {
                                                triggerHaptics('light');
                                                const sizes: ('small' | 'medium' | 'large' | 'xlarge')[] = ['small', 'medium', 'large', 'xlarge'];
                                                setChatFontSize(sizes[Number(e.target.value)]);
                                            }}
                                            className="flex-1 accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-lg font-bold opacity-80 text-slate-100">A</span>
                                    </div>
                                </div>

                                {/* Enable Haptics Toggle */}
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-100">Tactile Haptic Feedback</h4>
                                        <p className="text-xs text-slate-400">Vibrate on sending message, long-press, and reactions</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const newVal = !enableHaptics;
                                            setEnableHaptics(newVal);
                                            if (newVal) {
                                                if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(30);
                                            }
                                        }}
                                        className={clsx(
                                            "w-12 h-6 rounded-full p-1 transition-all duration-300 relative border border-white/10",
                                            enableHaptics ? "bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.3)]" : "bg-white/10"
                                        )}
                                    >
                                        <div 
                                            className={clsx(
                                                "w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-md absolute top-1 left-1",
                                                enableHaptics ? "translate-x-6" : "translate-x-0"
                                            )} 
                                        />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
}
