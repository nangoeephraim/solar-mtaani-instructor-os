import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarStyle } from './helpers';
import { Hash, Megaphone, MessageSquare, Pin, Search, Users, X, ChevronRight, Menu, UserPlus, User } from 'lucide-react';
import clsx from 'clsx';

/* ─── Channel Sidebar ─── */
interface ChannelSidebarProps {
    channels: any[];
    activeChannelId: string;
    onSelectChannel: (id: string) => void;
    onCreateChannel: () => void;
    onStartDM: () => void;
    onDeleteChannel: (id: string) => void;
    getUnreadCount: (channelId: string) => number;
    isAdmin: boolean;
    user: any;
    isOpen: boolean;
    onToggle: () => void;
    avatarMap: Record<string, string>;
    userProfileMap: Record<string, { name: string; avatarUrl: string | null }>;
}

export function ChannelSidebar({ channels, activeChannelId, onSelectChannel, onCreateChannel, onStartDM, onDeleteChannel, getUnreadCount, isAdmin, user, isOpen, onToggle, avatarMap, userProfileMap }: ChannelSidebarProps) {
    const broadcasts = channels.filter(c => c.type === 'announcement');
    const chats = channels.filter(c => c.type === 'chat');
    const dms = channels.filter(c => c.type === 'dm');

    const sidebarContent = (
        <>
            {/* Header */}
            <div className="p-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'var(--md-sys-color-primary)' }}>
                    <MessageSquare size={17} className="text-white" />
                </div>
                <div>
                    <h2 className="font-google font-bold text-base" style={{ color: 'var(--md-sys-color-on-surface)' }}>Messages</h2>
                    <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--md-sys-color-secondary)' }}>PRISM Comms</p>
                </div>
                {/* Mobile close */}
                <button onClick={onToggle} className="ml-auto lg:hidden p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)]"><X size={18} /></button>
            </div>

            {/* Channel Lists */}
            <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6 custom-scrollbar">
                {/* Broadcasts */}
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.15em] mb-2 px-3" style={{ color: 'var(--md-sys-color-secondary)' }}>Broadcasts</h3>
                    <div className="space-y-0.5">
                        {broadcasts.map(ch => {
                            const unread = getUnreadCount(ch.id);
                            const active = activeChannelId === ch.id;
                            return (
                                <button key={ch.id} onClick={() => onSelectChannel(ch.id)} className={clsx("w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 text-sm font-medium text-left relative ripple", active ? "shadow-md scale-[1.02] z-10" : "hover:bg-[var(--md-sys-color-surface-variant)] hover:scale-[1.01]")} style={active ? { background: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' } : { color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    <div className={clsx("p-1.5 rounded-lg shadow-sm", active ? "bg-white/20 text-white" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)]")}>
                                        <Megaphone size={15} />
                                    </div>
                                    <span className="truncate flex-1 font-google">{ch.name}</span>
                                    {unread > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center text-white animate-pulse shadow-sm" style={{ background: 'var(--md-sys-color-error)' }}>{unread}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Text Channels */}
                <div>
                    <div className="flex items-center justify-between mb-2 px-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'var(--md-sys-color-secondary)' }}>Channels</h3>
                        {isAdmin && (
                            <button onClick={onCreateChannel} className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--md-sys-color-primary-container)]" style={{ color: 'var(--md-sys-color-primary)' }}>
                                <span className="text-lg leading-none">+</span>
                            </button>
                        )}
                    </div>
                    <div className="space-y-0.5">
                        {chats.map(ch => {
                            const unread = getUnreadCount(ch.id);
                            const active = activeChannelId === ch.id;
                            return (
                                <div key={ch.id} className="group relative">
                                    <button onClick={() => onSelectChannel(ch.id)} className={clsx("w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 text-sm font-medium text-left ripple", active ? "shadow-md scale-[1.02] z-10" : "hover:bg-[var(--md-sys-color-surface-variant)] hover:scale-[1.01]")} style={active ? { background: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' } : { color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        <div className={clsx("p-1.5 rounded-lg shadow-sm", active ? "bg-white/20 text-white" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)]")}>
                                            <Hash size={15} />
                                        </div>
                                        <span className="truncate flex-1 font-google">{ch.name}</span>
                                        {unread > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center text-black shadow-sm outline outline-2 outline-white" style={{ background: 'var(--google-yellow)' }}>{unread}</span>}
                                    </button>
                                    {isAdmin && ch.id !== 'chan_general' && (
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteChannel(ch.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all" style={{ color: 'var(--md-sys-color-error)' }}>
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Direct Messages */}
                <div>
                    <div className="flex items-center justify-between mb-2 px-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'var(--md-sys-color-secondary)' }}>Direct Messages</h3>
                        <button onClick={onStartDM} className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--md-sys-color-primary-container)]" style={{ color: 'var(--md-sys-color-primary)' }} title="New Direct Message">
                            <span className="text-lg leading-none">+</span>
                        </button>
                    </div>
                    <div className="space-y-0.5">
                        {dms.map(ch => {
                            const unread = getUnreadCount(ch.id);
                            const active = activeChannelId === ch.id;
                            const otherUserId = ch.participants?.find((p: string) => p !== user?.id) || '';
                            const profile = userProfileMap[otherUserId];
                            const displayName = profile?.name || 'Direct Message';
                            const displayAvatar = profile?.avatarUrl || avatarMap[otherUserId] || null;
                            return (
                                <div key={ch.id} className="group relative">
                                    <button onClick={() => onSelectChannel(ch.id)} className={clsx("w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 text-sm font-medium text-left ripple", active ? "shadow-md scale-[1.02] z-10" : "hover:bg-[var(--md-sys-color-surface-variant)] hover:scale-[1.01]")} style={active ? { background: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' } : { color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm overflow-hidden text-white text-xs font-bold border-2" style={{ borderColor: active ? 'rgba(255,255,255,0.3)' : 'transparent', ...(displayAvatar ? { background: 'var(--md-sys-color-surface-variant)' } : getAvatarStyle(displayName)) }}>
                                            {displayAvatar ? (
                                                <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                displayName.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span className="truncate flex-1 font-google" style={{ color: active ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)' }}>{displayName}</span>
                                        {unread > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center text-white shadow-sm" style={{ background: 'var(--md-sys-color-error)' }}>{unread}</span>}
                                    </button>
                                </div>
                            );
                        })}
                        {dms.length === 0 && (
                            <div className="px-3 py-2 text-xs text-center italic" style={{ color: 'var(--md-sys-color-secondary)' }}>
                                No direct messages yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Footer */}
            <div className="p-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--md-sys-color-surface-variant)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-sm" style={getAvatarStyle(user?.name || 'U')}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate font-google" style={{ color: 'var(--md-sys-color-on-surface)' }}>{user?.name}</div>
                        <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--md-sys-color-primary)' }}>{user?.role}</div>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex w-72 flex-col flex-shrink-0 sidebar-glass z-20" style={{ borderRight: '1px solid var(--md-sys-color-outline-variant)' }}>
                {sidebarContent}
            </div>

            {/* Mobile Sidebar (Slide drawer) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onToggle} />
                        <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="fixed left-0 top-0 bottom-0 w-72 flex flex-col z-50 lg:hidden" style={{ background: 'var(--md-sys-color-surface)' }}>
                            {sidebarContent}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
