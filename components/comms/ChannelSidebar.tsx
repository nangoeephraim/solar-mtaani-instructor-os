import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarStyle } from './helpers';
import { Hash, Megaphone, MessageSquare, Pin, Search, Users, X, ChevronRight, Menu, UserPlus, User, Video, ChevronLeft } from 'lucide-react';
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
    onNavigate?: (view: string) => void;
    mobileView?: 'list' | 'chat';
}

export function ChannelSidebar({ channels, activeChannelId, onSelectChannel, onCreateChannel, onStartDM, onDeleteChannel, getUnreadCount, isAdmin, user, isOpen, onToggle, avatarMap, userProfileMap, onNavigate, mobileView = 'list' }: ChannelSidebarProps) {
    const broadcasts = channels.filter(c => c.type === 'announcement');
    const chats = channels.filter(c => c.type === 'chat');
    const dms = channels.filter(c => c.type === 'dm');

    const sidebarContent = (
        <>
            {/* Header */}
            <div className="p-5 flex items-center gap-3 border-b border-slate-200/80 dark:border-white/[0.05]">
                {onNavigate && (
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="lg:hidden p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        title="Back to dashboard"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500">
                    <MessageSquare size={17} className="text-white" />
                </div>
                <div>
                    <h2 className="font-google font-bold text-base text-slate-800 dark:text-slate-100">Messages</h2>
                    <p className="text-[10px] font-black tracking-widest uppercase text-indigo-600 dark:text-indigo-400 font-space">PRISM Comms</p>
                </div>
                {/* Mobile close */}
                <button onClick={onToggle} className="ml-auto lg:hidden p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"><X size={18} /></button>
            </div>

            {/* Channel Lists */}
            <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6 custom-scrollbar">
                {/* Broadcasts */}
                {broadcasts.length > 0 && (
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 px-3 text-slate-500 dark:text-indigo-300/60 font-space">Broadcasts</h3>
                        <div className="space-y-1">
                            {broadcasts.map(ch => {
                                const unread = getUnreadCount(ch.id);
                                const active = activeChannelId === ch.id;
                                return (
                                    <button 
                                        key={ch.id} 
                                        onClick={() => onSelectChannel(ch.id)} 
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 text-sm font-semibold text-left relative group hover:translate-x-1", 
                                            active 
                                                ? "bg-gradient-to-r from-indigo-600/95 to-violet-600/95 text-white shadow-[0_4px_15px_rgba(99,102,241,0.25)] scale-[1.02] border border-white/10 z-10" 
                                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        <div className={clsx(
                                            "p-1.5 rounded-lg shadow-sm transition-transform group-hover:scale-110 duration-300", 
                                            active ? "bg-white/20 text-white" : "bg-slate-200/50 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                                        )}>
                                            <Megaphone size={15} />
                                        </div>
                                        <span className="truncate flex-1 font-google">{ch.name}</span>
                                        {unread > 0 && (
                                            <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full min-w-[18px] text-center text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_8px_rgba(99,102,241,0.4)] animate-pulse">
                                                {unread}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Video Meetings */}
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 px-3 text-slate-500 dark:text-indigo-300/60 font-space">Meetings</h3>
                    <div className="space-y-1">
                        <button 
                            onClick={() => onSelectChannel('video_meetings')} 
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 text-sm font-semibold text-left relative group hover:translate-x-1", 
                                activeChannelId === 'video_meetings' 
                                    ? "bg-gradient-to-r from-indigo-600/95 to-violet-600/95 text-white shadow-[0_4px_15px_rgba(99,102,241,0.25)] scale-[1.02] border border-white/10 z-10" 
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <div className={clsx(
                                "p-1.5 rounded-lg shadow-sm transition-transform group-hover:scale-110 duration-300", 
                                activeChannelId === 'video_meetings' ? "bg-white/20 text-white" : "bg-slate-200/50 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                            )}>
                                <Video size={15} />
                            </div>
                            <span className="truncate flex-1 font-google">Video Meet</span>
                        </button>
                    </div>
                </div>

                {/* Text Channels */}
                <div>
                    <div className="flex items-center justify-between mb-2.5 px-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-indigo-300/60 font-space">Channels</h3>
                        {isAdmin && (
                            <button 
                                onClick={onCreateChannel} 
                                className="w-5 h-5 rounded-full flex items-center justify-center transition-all bg-slate-200/50 dark:bg-white/5 hover:bg-indigo-500/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110 active:scale-95" 
                                title="Create Channel"
                            >
                                <span className="text-sm leading-none font-bold">+</span>
                            </button>
                        )}
                    </div>
                    <div className="space-y-1">
                        {chats.map(ch => {
                            const unread = getUnreadCount(ch.id);
                            const active = activeChannelId === ch.id;
                            return (
                                <div key={ch.id} className="group/item relative">
                                    <button 
                                        onClick={() => onSelectChannel(ch.id)} 
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 text-sm font-semibold text-left group hover:translate-x-1", 
                                            active 
                                                ? "bg-gradient-to-r from-indigo-600/95 to-violet-600/95 text-white shadow-[0_4px_15px_rgba(99,102,241,0.25)] scale-[1.02] border border-white/10 z-10" 
                                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        <div className={clsx(
                                            "p-1.5 rounded-lg shadow-sm transition-transform group-hover:scale-110 duration-300", 
                                            active ? "bg-white/20 text-white" : "bg-slate-200/50 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                                        )}>
                                            <Hash size={15} />
                                        </div>
                                        <span className="truncate flex-1 font-google">{ch.name}</span>
                                        {unread > 0 && (
                                            <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full min-w-[18px] text-center text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_8px_rgba(99,102,241,0.4)] animate-pulse">
                                                {unread}
                                            </span>
                                        )}
                                    </button>
                                    {isAdmin && ch.id !== 'chan_general' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteChannel(ch.id); }} 
                                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg transition-all hover:bg-red-500/10 text-red-500 hover:text-red-400 hover:scale-110"
                                        >
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
                    <div className="flex items-center justify-between mb-2.5 px-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-indigo-300/60 font-space">Direct Messages</h3>
                        <button 
                            onClick={onStartDM} 
                            className="w-5 h-5 rounded-full flex items-center justify-center transition-all bg-slate-200/50 dark:bg-white/5 hover:bg-indigo-500/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110 active:scale-95" 
                            title="New Direct Message"
                        >
                            <span className="text-sm leading-none font-bold">+</span>
                        </button>
                    </div>
                    <div className="space-y-1">
                        {dms.map(ch => {
                            const unread = getUnreadCount(ch.id);
                            const active = activeChannelId === ch.id;
                            const otherUserId = ch.participants?.find((p: string) => p !== user?.id) || '';
                            const profile = userProfileMap[otherUserId];
                            const displayName = profile?.name || 'Direct Message';
                            const displayAvatar = profile?.avatarUrl || avatarMap[otherUserId] || null;
                            return (
                                <div key={ch.id} className="group/item relative">
                                    <button 
                                        onClick={() => onSelectChannel(ch.id)} 
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 text-sm font-semibold text-left group hover:translate-x-1", 
                                            active 
                                                ? "bg-gradient-to-r from-indigo-600/95 to-violet-600/95 text-white shadow-[0_4px_15px_rgba(99,102,241,0.25)] scale-[1.02] border border-white/10 z-10" 
                                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center shadow-md overflow-hidden text-white text-xs font-black border transition-all group-hover:scale-105 duration-300" 
                                            style={{ 
                                                borderColor: active ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.1)', 
                                                ...(displayAvatar ? { background: 'var(--md-sys-color-surface-variant)' } : getAvatarStyle(displayName)) 
                                            }}
                                        >
                                            {displayAvatar ? (
                                                <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                displayName.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span className="truncate flex-1 font-google">{displayName}</span>
                                        {unread > 0 && (
                                            <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full min-w-[18px] text-center text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_8px_rgba(99,102,241,0.4)] animate-pulse">
                                                {unread}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                        {dms.length === 0 && (
                            <div className="px-3 py-3 text-xs text-center italic text-slate-500">
                                No direct messages yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Footer */}
            <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.05]">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05] hover:border-slate-300/85 dark:hover:border-white/[0.1] transition-all duration-300">
                    <div className="relative flex-shrink-0">
                        {/* pulsing active ring */}
                        <div className="absolute inset-0 rounded-xl bg-emerald-500 animate-ping opacity-20 scale-110" />
                        <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-md overflow-hidden relative z-10 border border-slate-200 dark:border-white/10"
                            style={user?.avatarUrl ? { background: 'transparent' } : getAvatarStyle(user?.name || 'U')}>
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                user?.name?.charAt(0).toUpperCase()
                            )}
                        </div>
                        {/* active dot */}
                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 z-20 shadow-md" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate font-google text-slate-800 dark:text-slate-200">{user?.name}</div>
                        <div className="text-[9px] font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active • {user?.role}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Main Sidebar (Desktop sidebar or Mobile full screen list view) */}
            <div className={clsx(
                "w-full lg:w-72 flex-col flex-shrink-0 sidebar-glass backdrop-blur-xl bg-white/85 dark:bg-slate-950/20 z-20 h-full border-r border-slate-200/80 dark:border-white/[0.06]",
                mobileView === 'list' ? 'flex' : 'hidden lg:flex'
            )}>
                {sidebarContent}
            </div>

            {/* Mobile Sidebar (Slide drawer fallback) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle} />
                        <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }} className="fixed left-0 top-0 bottom-0 w-72 flex flex-col z-50 lg:hidden sidebar-glass backdrop-blur-xl bg-white/95 dark:bg-slate-950/80 border-r border-slate-200/80 dark:border-white/[0.06]">
                            {sidebarContent}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
