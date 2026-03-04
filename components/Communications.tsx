import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppData, ChatChannel, ChatMessage, ChatAttachment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
    MessageSquare, Hash, Megaphone, Search, MoreVertical, Paperclip, Send,
    Image as ImageIcon, FileText, Smile, X, Edit2, Pencil, Trash2, Pin, CornerUpLeft,
    Reply, ShieldAlert, Check, CheckCheck, Clock, Download, Bold, Italic, Code, Menu, Users, AtSign, UserPlus, User
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
        return <React.Fragment key={i}>{Array.isArray(processed) ? processed : processed}{i < lines.length - 1 && <br />}</React.Fragment>;
    });
};

/* ─── Typing Indicator (shows remote users typing) ─── */
const TypingIndicator = ({ typers }: { typers: string[] }) => (
    <AnimatePresence>
        {typers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center gap-2 px-4 py-2 text-xs font-medium" style={{ color: 'var(--md-sys-color-secondary)' }}>
                <div className="flex gap-1">
                    {[0, 1, 2].map(i => <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--md-sys-color-secondary)' }} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />)}
                </div>
                <span>
                    <strong>{typers.length <= 2 ? typers.join(' and ') : `${typers[0]} and ${typers.length - 1} others`}</strong>
                    {typers.length === 1 ? ' is typing...' : ' are typing...'}
                </span>
            </motion.div>
        )}
    </AnimatePresence>
);

/* ─── Date Separator ─── */
const DateSeparator = ({ date }: { date: string }) => (
    <div className="flex items-center justify-center my-6">
        <div className="bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full z-10">
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
    activeChannelId
}: any) => {
    const first = group[0];

    return (
        <div className={clsx("group/cluster flex gap-3 py-1", first.senderId === userId && "flex-row-reverse")}>
            <div className="flex-shrink-0 w-8 pt-0.5 flex flex-col items-center">
                {first.senderId !== userId && <UserAvatar name={first.senderName} avatarUrl={avatarMap[first.senderId]} size={32} />}
            </div>
            <div className={clsx("flex-1 min-w-0 flex flex-col", first.senderId === userId ? "items-end" : "items-start")}>
                <div className={clsx("flex items-baseline gap-2 mb-1", first.senderId === userId && "flex-row-reverse")}>
                    <span className="font-bold text-xs font-google" style={{ color: 'var(--md-sys-color-on-surface)' }}>{first.senderName}</span>
                    {first.senderRole === 'admin' && <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-primary)' }}><ShieldAlert size={9} /> Admin</span>}
                    <span className="text-[10px] font-medium" style={{ color: 'var(--md-sys-color-secondary)' }}>
                        {new Date(first.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className={clsx("space-y-0.5 flex flex-col max-w-[85%]", first.senderId === userId ? "items-end" : "items-start")}>
                    {group.map((msg: any, mIdx: number) => {
                        const isMyMsg = msg.senderId === userId;
                        const isFirst = mIdx === 0;
                        const isLast = mIdx === group.length - 1;

                        return (
                            <div key={msg.id} className={clsx("relative px-3 py-2 text-[15px] group/msg",
                                isMyMsg
                                    ? `bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] ${isFirst ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${isLast ? 'rounded-br-2xl' : 'rounded-br-md'} rounded-l-2xl`
                                    : `rounded-r-2xl text-[var(--md-sys-color-on-surface)] ${isFirst ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${isLast ? 'rounded-bl-2xl' : 'rounded-bl-md'}`
                            )} style={!isMyMsg ? { background: 'var(--md-sys-color-surface)' } : {}}
                                onMouseEnter={() => setHoveredMsgId(msg.id)} onMouseLeave={() => { setHoveredMsgId(null); setShowEmojiPicker(null); }}>
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
                                    <div className="leading-relaxed">
                                        {renderMarkdown(msg.content)}
                                        {msg.editedAt && <span className="text-[10px] ml-1 italic opacity-70">(edited)</span>}
                                        {msg.isPinned && <Pin size={10} className="inline ml-1" style={{ color: 'var(--google-yellow)' }} />}
                                    </div>
                                )}
                                {renderReactions(msg)}

                                {/* Render Attachments */}
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
                            </div>
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

    // Check message deep references (React state update gives new references on change)
    for (let i = 0; i < prevProps.group.length; i++) {
        if (prevProps.group[i] !== nextProps.group[i]) return false;
    }

    return true;
});

/* ─── Props ─── */
interface CommunicationsProps {
    data: AppData;
    onUpdateAppData: (newData: AppData) => void;
}

export default function Communications({ data, onUpdateAppData }: CommunicationsProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const channels = data.communications?.channels || [];
    const messages = data.communications?.messages || {};

    const [activeChannelId, setActiveChannelId] = useState<string>(channels[0]?.id || '');
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
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
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});

    // Remote typing indicators — map of userId → { name, timeoutId }
    const [remoteTypers, setRemoteTypers] = useState<Map<string, { name: string; timeoutId: ReturnType<typeof setTimeout> }>>(new Map());
    const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingCleanupRef = useRef<(() => void) | null>(null);

    // DM State
    const [showNewDM, setShowNewDM] = useState(false);
    const [dmUsers, setDmUsers] = useState<ProfileData[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [dmUserSearch, setDmUserSearch] = useState('');

    // Attachments State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
    const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);

    const activeChannel = channels.find(c => c.id === activeChannelId);
    const allActiveMessages = messages[activeChannelId] || [];
    const activeMessages = allActiveMessages.filter(m =>
        !searchQuery || m.content.toLowerCase().includes(searchQuery.toLowerCase()) || m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const userId = user?.id || 'sys-user';

    // Fetch users for DM directory (eagerly, so sidebar can display names)
    useEffect(() => {
        if (dmUsers.length === 0) {
            setIsLoadingUsers(true);
            fetchActiveUsers(userId).then(users => {
                setDmUsers(users);
                setIsLoadingUsers(false);
            }).catch(err => {
                console.error("Failed to load users", err);
                setIsLoadingUsers(false);
            });
        }
    }, [userId]);

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

    // Fetch avatar map for all users who have sent messages
    useEffect(() => {
        const allMsgs = Object.values(messages).flat();
        const ids = [...new Set(allMsgs.map(m => m.senderId).filter(Boolean))];
        if (ids.length > 0) {
            fetchAvatarMap(ids).then(setAvatarMap).catch(() => { });
        }
    }, [messages]);

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

    useEffect(() => {
        if (activeChannelId && userId && allActiveMessages.length > 0) {
            const newData = markChannelRead(data, activeChannelId, userId);
            if (newData !== data) onUpdateAppData(newData);
        }
    }, [activeChannelId, userId, allActiveMessages.length, data, onUpdateAppData]);

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
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!messageInput.trim() && !pendingAttachment) || !activeChannelId || !user) return;
        if (activeChannel?.type === 'announcement' && user.role !== 'admin') { showToast("Only administrators can post announcements.", "error"); return; }

        let attachmentsToSave: ChatAttachment[] = [];

        if (pendingAttachment) {
            setIsUploadingAttachment(true);
            try {
                // Determine attachment type based on MIME
                const isImage = pendingAttachment.type.startsWith('image/');
                const attachmentType = isImage ? 'image' : 'document';

                const result = await uploadFile('library_documents', pendingAttachment);

                attachmentsToSave.push({
                    id: `att_${Date.now()} `,
                    name: pendingAttachment.name,
                    type: attachmentType as any,
                    url: result.publicUrl,
                    size: pendingAttachment.size,
                    mimeType: pendingAttachment.type
                });
            } catch (err: any) {
                showToast(`Failed to upload attachment: ${err.message} `, "error");
                setIsUploadingAttachment(false);
                return; // Abort send if upload fails
            }
            setIsUploadingAttachment(false);
        }

        // Extract mentions
        const mentionMatches = messageInput.match(/@(\w+)/g);
        const mentionsList = mentionMatches ? mentionMatches.map(m => m.slice(1)) : undefined;

        await addChatMessage(data, {
            channelId: activeChannelId,
            senderId: userId,
            senderName: user.name,
            senderRole: user.role as any,
            content: messageInput.trim(),
            replyToId: replyToMsg?.id,
            mentions: mentionsList,
            attachments: attachmentsToSave
        } as any);

        // Wait for realtime subscription to pull the message. Just clear input.
        setMessageInput('');
        setReplyToMsg(null);
        setPendingAttachment(null);

        // Stop typing indicator for other users
        if (typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
            typingDebounceRef.current = null;
        }
        broadcastTyping(activeChannelId, userId, user.name, false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setMessageInput(val);
        // Detect @ for mentions
        const lastWord = val.split(/\s/).pop() || '';
        if (lastWord.startsWith('@') && lastWord.length > 1) { setShowMentions(true); setMentionFilter(lastWord.slice(1)); }
        else setShowMentions(false);

        // Broadcast typing indicator to other users (debounced 500ms)
        if (val.trim().length > 0 && activeChannelId && user) {
            if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
            typingDebounceRef.current = setTimeout(() => {
                broadcastTyping(activeChannelId, userId, user.name, true);
            }, 500);
        }
    };

    const insertMention = (name: string) => {
        const parts = messageInput.split(/\s/);
        parts[parts.length - 1] = `@${name} `;
        setMessageInput(parts.join(' '));
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const handleEditSave = async (chId: string, msgId: string) => {
        if (!editContent.trim()) return;
        await editChatMessage(data, chId, msgId, editContent.trim());
        setEditingMsgId(null);
        setEditContent('');
        showToast('Message updated', 'success');
    };

    const handleDelete = async (chId: string, msgId: string) => {
        await softDeleteChatMessage(data, chId, msgId);
        showToast('Message deleted', 'info');
    };

    const handlePin = async (chId: string, msgId: string) => {
        await togglePinMessage(data, chId, msgId);
        showToast('Pin toggled', 'info');
    };

    const handleReaction = async (chId: string, msgId: string, emoji: string) => {
        await toggleReaction(data, chId, msgId, emoji, userId);
        setShowEmojiPicker(null);
    };

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        await addChatChannel(data, {
            name: newChannelName.trim(),
            type: newChannelType,
            description: newChannelDesc.trim() || undefined,
            createdBy: userId,
            createdAt: new Date().toISOString()
        });
        setShowNewChannel(false);
        setNewChannelName('');
        setNewChannelDesc('');
        showToast(`Channel "${newChannelName}" created`, 'success');
    };

    const handleDeleteChannel = async (channelId: string) => {
        if (channelId === 'chan_general' || channelId === 'chan_announcements') {
            showToast("Default channels can't be deleted", 'error');
            return;
        }
        await deleteChatChannel(data, channelId);
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
                        ...data.communications,
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

    /* ─── Render Helpers ─── */
    const renderReactions = (msg: ChatMessage) => {
        if (!msg.reactions || Object.keys(msg.reactions).length === 0) return null;
        return (
            <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.entries(msg.reactions).map(([emoji, users]) => (
                    <button key={emoji} onClick={() => handleReaction(activeChannelId, msg.id, emoji)} className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all border")} style={users.includes(userId) ? { background: 'var(--md-sys-color-primary-container)', borderColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary-container)' } : { background: 'var(--md-sys-color-surface-variant)', borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }} title={users.join(', ')}>
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
        return (
            <div className="absolute -top-3 right-2 flex items-center gap-0.5 glass-panel px-1 py-0.5 z-20 opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-opacity" style={{ boxShadow: 'var(--shadow-elevation-2)' }}>
                <button onClick={() => { setReplyToMsg(msg); textareaRef.current?.focus(); }} className="p-2.5 md:p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors tap-target md:min-h-0 md:min-w-0" style={{ color: 'var(--md-sys-color-secondary)' }} title="Reply"><Reply size={16} className="md:w-3.5 md:h-3.5" /></button>
                <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-2.5 md:p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors tap-target md:min-h-0 md:min-w-0" style={{ color: 'var(--md-sys-color-secondary)' }} title="React"><Smile size={16} className="md:w-3.5 md:h-3.5" /></button>
                {showNudge && <button onClick={() => handleStartDM(msg.senderId)} className="p-2.5 md:p-1.5 rounded-lg hover:bg-[var(--md-sys-color-primary-container)] transition-colors tap-target md:min-h-0 md:min-w-0" style={{ color: 'var(--md-sys-color-primary)' }} title={`DM ${msg.senderName}`}><UserPlus size={16} className="md:w-3.5 md:h-3.5" /></button>}
                {(isOwn || isAdm) && <button onClick={() => handlePin(activeChannelId, msg.id)} className="p-2.5 md:p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors tap-target md:min-h-0 md:min-w-0" style={{ color: msg.isPinned ? 'var(--google-yellow)' : 'var(--md-sys-color-secondary)' }} title="Pin"><Pin size={16} className="md:w-3.5 md:h-3.5" /></button>}
                {isOwn && <button onClick={() => { setEditingMsgId(msg.id); setEditContent(msg.content); }} className="p-2.5 md:p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors tap-target md:min-h-0 md:min-w-0" style={{ color: 'var(--md-sys-color-secondary)' }} title="Edit"><Pencil size={16} className="md:w-3.5 md:h-3.5" /></button>}
                {(isOwn || isAdm) && <button onClick={() => handleDelete(activeChannelId, msg.id)} className="p-2.5 md:p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors tap-target md:min-h-0 md:min-w-0" style={{ color: 'var(--md-sys-color-error)' }} title="Delete"><Trash2 size={16} className="md:w-3.5 md:h-3.5" /></button>}
            </div>
        );
    };

    const renderEmojiPicker = (msgId: string) => showEmojiPicker !== msgId ? null : (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-12 right-0 glass-panel px-2 py-1.5 flex gap-1 z-30" style={{ boxShadow: 'var(--shadow-elevation-3)' }}>
            {EMOJI_OPTIONS.map(emoji => <button key={emoji} onClick={() => handleReaction(activeChannelId, msgId, emoji)} className="w-8 h-8 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center text-lg transition-all hover:scale-110" title={emoji}>{emoji}</button>)}
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
        <div className="flex h-full w-full pb-20 lg:pb-0 glass-panel overflow-hidden animate-fade-in relative">
            {/* Sidebar */}
            <ChannelSidebar channels={channels} activeChannelId={activeChannelId} onSelectChannel={(id) => { setActiveChannelId(id); setShowMobileSidebar(false); }} onCreateChannel={() => setShowNewChannel(true)} onStartDM={() => setShowNewDM(true)} avatarMap={avatarMap} userProfileMap={userProfileMap} onDeleteChannel={handleDeleteChannel} getUnreadCount={(chId) => getUnreadCount(data, chId, userId)} isAdmin={user?.role === 'admin'} user={user} isOpen={showMobileSidebar} onToggle={() => setShowMobileSidebar(p => !p)} />

            {/* ═══ MAIN CHAT AREA ═══ */}
            {activeChannel ? (
                <>
                    <div className="flex-1 flex flex-col relative overflow-hidden" style={{ background: 'var(--md-sys-color-background)' }}>
                        {/* Header */}
                        <div className="h-14 px-4 flex items-center justify-between flex-shrink-0 z-10 sidebar-glass" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)]"><Menu size={20} style={{ color: 'var(--md-sys-color-on-surface)' }} /></button>
                                <div className="p-1.5 rounded-xl" style={{ background: 'var(--md-sys-color-primary-container)' }}>
                                    {activeChannel.type === 'announcement' ? <Megaphone size={16} style={{ color: 'var(--md-sys-color-primary)' }} /> : activeChannel.type === 'dm' ? <User size={16} style={{ color: 'var(--md-sys-color-primary)' }} /> : <Hash size={16} style={{ color: 'var(--md-sys-color-primary)' }} />}
                                </div>
                                <div>
                                    <h1 className="font-google font-bold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                        {activeChannel.type === 'dm' ? getDMPartnerName(activeChannel) : activeChannel.name}
                                    </h1>
                                    {activeChannel.description && <p className="text-[10px] font-medium hidden md:block" style={{ color: 'var(--md-sys-color-secondary)' }}>{activeChannel.description}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {pinnedMessages.length > 0 && (
                                    <button onClick={() => setShowPinnedPanel(!showPinnedPanel)} className={clsx("glass-button px-2.5 py-1.5 text-xs flex items-center gap-1", showPinnedPanel && "btn-primary")} style={showPinnedPanel ? {} : {}}>
                                        <Pin size={13} /><span className="font-bold">{pinnedMessages.length}</span>
                                    </button>
                                )}
                                <button onClick={() => setShowSearch(!showSearch)} title="Search (Ctrl+K)" className={clsx("glass-button p-2", showSearch && "btn-primary")}><Search size={15} /></button>
                                <button onClick={() => setShowInfoDrawer(!showInfoDrawer)} title="Channel info" className={clsx("glass-button p-2", showInfoDrawer && "btn-primary")}><Users size={15} /></button>
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

                        <div className="flex flex-1 overflow-hidden relative">
                            {/* Messages Feed */}
                            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-4" style={{ minHeight: 0 }}>
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
                                        {activeMessages.filter(m => !m.isDeleted).map((msg, i, arr) => (
                                            <React.Fragment key={msg.id}>
                                                {(i === 0 || !isSameDay(msg.timestamp, arr[i - 1].timestamp)) && <DateSeparator date={msg.timestamp} />}
                                                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="relative glass-card p-5 group/msg">
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
                                                        <div className="text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface)' }}>{renderMarkdown(msg.content)}</div>
                                                    )}
                                                    {renderReactions(msg)}
                                                </motion.div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-1 max-w-3xl mx-auto">
                                        {groupedMessages.map((group, gIdx) => {
                                            const first = group[0];
                                            const prevGroup = gIdx > 0 ? groupedMessages[gIdx - 1] : null;
                                            const prevMsg = prevGroup ? prevGroup[prevGroup.length - 1] : null;
                                            const showDateSep = !prevMsg || !isSameDay(first.timestamp, prevMsg.timestamp);
                                            return (
                                                <React.Fragment key={`g - ${gIdx} -${first.id} `}>
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
                                                    />
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                )}
                                <TypingIndicator typers={Array.from(remoteTypers.values()).map(t => t.name)} />
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Channel Info Drawer */}
                            <AnimatePresence>
                                {showInfoDrawer && (
                                    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex-shrink-0 overflow-hidden overflow-y-auto custom-scrollbar" style={{ borderLeft: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface)' }}>
                                        <div className="p-5 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-google font-bold text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>Channel Info</h3>
                                                <button onClick={() => setShowInfoDrawer(false)} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)]"><X size={16} style={{ color: 'var(--md-sys-color-secondary)' }} /></button>
                                            </div>
                                            <div className="text-center">
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--md-sys-color-primary-container)' }}>
                                                    {activeChannel.type === 'announcement' ? <Megaphone size={24} style={{ color: 'var(--md-sys-color-primary)' }} /> : <Hash size={24} style={{ color: 'var(--md-sys-color-primary)' }} />}
                                                </div>
                                                <h4 className="font-google font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{activeChannel.name}</h4>
                                                {activeChannel.description && <p className="text-xs mt-1" style={{ color: 'var(--md-sys-color-secondary)' }}>{activeChannel.description}</p>}
                                            </div>
                                            <div>
                                                <h5 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--md-sys-color-secondary)' }}>Participants ({uniqueUsers.length})</h5>
                                                <div className="space-y-2">
                                                    {uniqueUsers.map(([uid, name]) => (
                                                        <div key={uid} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors">
                                                            <UserAvatar name={name} avatarUrl={avatarMap[uid]} size={28} />
                                                            <span className="text-sm font-medium font-google" style={{ color: 'var(--md-sys-color-on-surface)' }}>{name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {pinnedMessages.length > 0 && (
                                                <div>
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--md-sys-color-secondary)' }}>Pinned ({pinnedMessages.length})</h5>
                                                    <div className="space-y-2">
                                                        {pinnedMessages.map(m => <div key={m.id} className="p-2 rounded-xl text-xs" style={{ background: 'var(--md-sys-color-surface-variant)' }}><span className="font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{m.senderName}:</span> <span style={{ color: 'var(--md-sys-color-secondary)' }}>{m.content.slice(0, 80)}</span></div>)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Input Area */}
                        {activeChannel.type === 'announcement' && user?.role !== 'admin' ? (
                            <div className="p-4 text-center" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-variant)' }}>
                                <p className="text-sm font-bold flex items-center justify-center gap-2" style={{ color: 'var(--md-sys-color-secondary)' }}><ShieldAlert size={16} /> Only administrators can broadcast here.</p>
                            </div>
                        ) : (
                            <div className="px-5 pb-5 pt-3" style={{ background: 'var(--md-sys-color-surface)' }}>
                                <AnimatePresence>
                                    {replyToMsg && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden max-w-4xl mx-auto">
                                            <div className="flex items-center gap-2 mb-2 p-2.5 rounded-2xl text-xs backdrop-blur-md border" style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                                                <Reply size={14} style={{ color: 'var(--md-sys-color-primary)' }} />
                                                <span>Replying to <span className="font-bold">{replyToMsg.senderName}</span></span>
                                                <span className="truncate flex-1 opacity-70">"{replyToMsg.content.slice(0, 60)}"</span>
                                                <button onClick={() => setReplyToMsg(null)} className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"><X size={12} /></button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="max-w-4xl mx-auto flex items-center gap-1.5 mb-2 px-1">
                                    <button onClick={() => insertFormatting('**', '**')} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Bold"><Bold size={14} /></button>
                                    <button onClick={() => insertFormatting('*', '*')} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Italic"><Italic size={14} /></button>
                                    <button onClick={() => insertFormatting('`', '`')} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Code snippet"><Code size={14} /></button>
                                    <button onClick={() => insertFormatting('', '👍')} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Thumbs up">👍</button>
                                    <button onClick={() => insertFormatting('', '😊')} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Smile">😊</button>
                                    <button onClick={() => insertFormatting('', '🔥')} className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors" style={{ color: 'var(--md-sys-color-secondary)' }} title="Fire">🔥</button>

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
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
                                    <AnimatePresence>
                                        {pendingAttachment && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
                                                <div className="flex items-center gap-2 p-2.5 rounded-2xl text-xs backdrop-blur-md border" style={{ background: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                                                    {pendingAttachment.type.startsWith('image/') ? <ImageIcon size={16} className="text-blue-500" /> : <FileText size={16} className="text-orange-500" />}
                                                    <span className="font-bold truncate flex-1">{pendingAttachment.name}</span>
                                                    <span className="opacity-60">{(pendingAttachment.size / 1024).toFixed(1)} KB</span>
                                                    <button type="button" onClick={() => setPendingAttachment(null)} className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-2)] transition-colors"><X size={14} /></button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className={clsx("flex items-end bg-[var(--md-sys-color-surface-variant)] rounded-[32px] shadow-sm border transition-all duration-300", isInputFocused ? "border-[var(--md-sys-color-primary)] shadow-md" : "border-[var(--md-sys-color-outline-variant)]")}>
                                        <div className="pl-3 pb-3 pt-3 flex items-center h-full">
                                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { if (e.target.files?.[0]) { setPendingAttachment(e.target.files[0]); setTimeout(() => textareaRef.current?.focus(), 100); } }} />
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full hover:bg-[var(--md-sys-color-surface-2)] transition-colors text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-primary)]" title="Attach file"><Paperclip size={18} /></button>
                                        </div>
                                        <textarea ref={textareaRef} value={messageInput} onChange={handleInputChange} onKeyDown={handleKeyDown} onFocus={() => setIsInputFocused(true)} onBlur={() => setTimeout(() => { setIsInputFocused(false); setShowMentions(false); }, 200)} placeholder={activeChannel.type === 'announcement' ? 'Compose broadcast message...' : `Message #${activeChannel.name}`} className="flex-1 bg-transparent py-4 px-2 outline-none resize-none overflow-hidden max-h-32 min-h-[56px] text-[15px] font-google font-medium text-[var(--md-sys-color-on-surface)]" rows={1} />
                                        <div className="pr-3 pb-3 pt-3 flex items-center h-full">
                                            <button type="submit" disabled={(!messageInput.trim() && !pendingAttachment) || isUploadingAttachment} className="bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-40 hover:opacity-90 hover:scale-105 transition-all shadow-md active:scale-95 disabled:hover:scale-100 disabled:shadow-none">
                                                {isUploadingAttachment ? <div className="w-4 h-4 rounded-full border-2 border-[var(--md-sys-color-on-primary)] border-t-transparent animate-spin" /> : <Send size={16} className="ml-0.5" />}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--md-sys-color-background)' }}>
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
        </div >
    );
}
