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
            <div className="p-5 flex items-center gap-3 border-b border-slate-950/[0.06] dark:border-white/[0.05]">
                {onNavigate && (
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        title="Back to dashboard"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-950/10 dark:border-white/15 bg-slate-950/5 dark:bg-white/5 text-slate-900 dark:text-white">
                    <MessageSquare size={16} strokeWidth={1.5} />
                </div>
                <div>
                    <h2 className="font-google font-bold text-sm tracking-wide text-slate-950 dark:text-white">Messages</h2>
                    <p className="text-[9px] font-black tracking-[0.25em] uppercase text-indigo-500 dark:text-indigo-400 font-space">PRISM Comms</p>
                </div>
                {/* Mobile close */}
                <button onClick={onToggle} className="ml-auto lg:hidden p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"><X size={18} /></button>
            </div>

            {/* Channel Lists */}
            <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6 custom-scrollbar">
                {/* Broadcasts */}
                {broadcasts.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2.5 px-3">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 font-space whitespace-nowrap">Broadcasts</h3>
                            <div className="flex-1 h-[1px] bg-slate-250 dark:bg-white/10 opacity-40" />
                        </div>
                        <div className="space-y-0.5">
                            {broadcasts.map(ch => {
                                const unread = getUnreadCount(ch.id);
                                const active = activeChannelId === ch.id;
                                return (
                                    <button 
                                        key={ch.id} 
                                        onClick={() => onSelectChannel(ch.id)} 
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 text-xs font-semibold text-left relative group hover:translate-x-0.5 border border-transparent", 
                                            active 
                                                ? "bg-slate-950/[0.04] dark:bg-white/[0.08] text-slate-950 dark:text-white border-slate-950/10 dark:border-white/15 z-10 shadow-sm" 
                                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-950/[0.01] dark:hover:bg-white/[0.02] hover:text-slate-950 dark:hover:text-white"
                                        )}
                                    >
                                        {active && (
                                            <div className="absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-indigo-500 dark:bg-indigo-400 rounded-r" />
                                        )}
                                        <div className={clsx(
                                            "transition-colors duration-300", 
                                            active ? "text-slate-950 dark:text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                                        )}>
                                            <Megaphone size={14} strokeWidth={1.5} />
                                        </div>
                                        <span className="truncate flex-1 font-google tracking-wide transition-all duration-300 group-hover:translate-x-0.5">{ch.name}</span>
                                        {unread > 0 && (
                                            <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded text-center text-white bg-indigo-600">
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
                    <div className="flex items-center gap-2 mb-2.5 px-3">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 font-space whitespace-nowrap">Meetings</h3>
                        <div className="flex-1 h-[1px] bg-slate-250 dark:bg-white/10 opacity-40" />
                    </div>
                    <div className="space-y-0.5">
                        <button 
                            onClick={() => onSelectChannel('video_meetings')} 
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 text-xs font-semibold text-left relative group hover:translate-x-0.5 border border-transparent", 
                                activeChannelId === 'video_meetings' 
                                    ? "bg-slate-950/[0.04] dark:bg-white/[0.08] text-slate-950 dark:text-white border-slate-950/10 dark:border-white/15 z-10 shadow-sm" 
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-950/[0.01] dark:hover:bg-white/[0.02] hover:text-slate-950 dark:hover:text-white"
                            )}
                        >
                            {activeChannelId === 'video_meetings' && (
                                <div className="absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-indigo-500 dark:bg-indigo-400 rounded-r" />
                            )}
                            <div className={clsx(
                                "transition-colors duration-300", 
                                activeChannelId === 'video_meetings' ? "text-slate-950 dark:text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                            )}>
                                <Video size={14} strokeWidth={1.5} />
                            </div>
                            <span className="truncate flex-1 font-google tracking-wide transition-all duration-300 group-hover:translate-x-0.5">Video Meet</span>
                        </button>
                    </div>
                </div>

                {/* Text Channels */}
                <div>
                    <div className="flex items-center justify-between mb-2.5 px-3">
                        <div className="flex items-center gap-2 flex-1">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 font-space whitespace-nowrap">Channels</h3>
                            <div className="flex-1 h-[1px] bg-slate-250 dark:bg-white/10 opacity-40" />
                        </div>
                        {isAdmin && (
                            <button 
                                onClick={onCreateChannel} 
                                className="w-5 h-5 rounded-md flex items-center justify-center transition-all bg-slate-950/5 dark:bg-white/5 hover:bg-slate-950/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 hover:scale-105 ml-2" 
                                title="Create Channel"
                            >
                                <span className="text-xs leading-none font-bold">+</span>
                            </button>
                        )}
                    </div>
                    <div className="space-y-0.5">
                        {chats.map(ch => {
                            const unread = getUnreadCount(ch.id);
                            const active = activeChannelId === ch.id;
                            return (
                                <div key={ch.id} className="group/item relative">
                                    <button 
                                        onClick={() => onSelectChannel(ch.id)} 
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 text-xs font-semibold text-left group hover:translate-x-0.5 relative border border-transparent", 
                                            active 
                                                ? "bg-slate-950/[0.04] dark:bg-white/[0.08] text-slate-950 dark:text-white border-slate-950/10 dark:border-white/15 z-10 shadow-sm" 
                                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-950/[0.01] dark:hover:bg-white/[0.02] hover:text-slate-950 dark:hover:text-white"
                                        )}
                                    >
                                        {active && (
                                            <div className="absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-indigo-500 dark:bg-indigo-400 rounded-r" />
                                        )}
                                        <div className={clsx(
                                            "transition-colors duration-300", 
                                            active ? "text-slate-950 dark:text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                                        )}>
                                            <Hash size={14} strokeWidth={1.5} />
                                        </div>
                                        <span className="truncate flex-1 font-google tracking-wide transition-all duration-300 group-hover:translate-x-0.5">{ch.name}</span>
                                        {unread > 0 && (
                                            <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded text-center text-white bg-indigo-600">
                                                {unread}
                                            </span>
                                        )}
                                    </button>
                                    {isAdmin && ch.id !== 'chan_general' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteChannel(ch.id); }} 
                                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 rounded transition-all hover:bg-red-500/10 text-red-500 hover:text-red-400 hover:scale-105"
                                        >
                                            <X size={11} />
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
                        <div className="flex items-center gap-2 flex-1">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 font-space whitespace-nowrap">Direct Messages</h3>
                            <div className="flex-1 h-[1px] bg-slate-250 dark:bg-white/10 opacity-40" />
                        </div>
                        <button 
                            onClick={onStartDM} 
                            className="w-5 h-5 rounded-md flex items-center justify-center transition-all bg-slate-950/5 dark:bg-white/5 hover:bg-slate-950/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 hover:scale-105 ml-2" 
                            title="New Direct Message"
                        >
                            <span className="text-xs leading-none font-bold">+</span>
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
                                <div key={ch.id} className="group/item relative">
                                    <button 
                                        onClick={() => onSelectChannel(ch.id)} 
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 text-xs font-semibold text-left group hover:translate-x-0.5 relative border border-transparent", 
                                            active 
                                                ? "bg-slate-950/[0.04] dark:bg-white/[0.08] text-slate-950 dark:text-white border-slate-950/10 dark:border-white/15 z-10 shadow-sm" 
                                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-950/[0.01] dark:hover:bg-white/[0.02] hover:text-slate-950 dark:hover:text-white"
                                        )}
                                    >
                                        {active && (
                                            <div className="absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-indigo-500 dark:bg-indigo-400 rounded-r" />
                                        )}
                                        <div 
                                            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm overflow-hidden text-white text-[10px] font-black border transition-all duration-300" 
                                            style={{ 
                                                borderColor: active ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.08)', 
                                                ...(displayAvatar ? { background: 'var(--md-sys-color-surface-variant)' } : getAvatarStyle(displayName)) 
                                            }}
                                        >
                                            {displayAvatar ? (
                                                <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                displayName.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span className="truncate flex-1 font-google tracking-wide transition-all duration-300 group-hover:translate-x-0.5">{displayName}</span>
                                        {unread > 0 && (
                                            <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded text-center text-white bg-indigo-600">
                                                {unread}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                        {dms.length === 0 && (
                            <div className="px-3 py-3 text-[11px] text-center italic text-slate-400 dark:text-slate-500">
                                No direct messages yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Footer */}
            <div className="p-3 border-t border-slate-950/[0.06] dark:border-white/[0.05]">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/[0.01] dark:bg-white/[0.02] border border-slate-950/[0.06] dark:border-white/[0.06] hover:border-slate-950/[0.1] dark:hover:border-white/[0.1] transition-all duration-300">
                    <div className="relative flex-shrink-0">
                        {/* pulsing active ring */}
                        <div className="absolute inset-0 rounded bg-emerald-500 animate-ping opacity-15 scale-105" />
                        <div className="w-8 h-8 rounded text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden relative z-10 border border-slate-950/10 dark:border-white/10"
                            style={user?.avatarUrl ? { background: 'transparent' } : getAvatarStyle(user?.name || 'U')}>
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded" />
                            ) : (
                                user?.name?.charAt(0).toUpperCase()
                            )}
                        </div>
                        {/* active dot */}
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 z-20 shadow-md" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs truncate font-google text-slate-800 dark:text-slate-200">{user?.name}</div>
                        <div className="text-[8px] font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-500 flex items-center gap-1 mt-0.5">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
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
                "w-full lg:w-72 flex-col flex-shrink-0 sidebar-glass backdrop-blur-2xl bg-white/35 dark:bg-slate-950/15 z-20 h-full border-r border-slate-950/[0.06] dark:border-white/[0.05]",
                mobileView === 'list' ? 'flex' : 'hidden lg:flex'
            )}>
                {sidebarContent}
            </div>

            {/* Mobile Sidebar (Slide drawer fallback) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle} />
                        <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }} className="fixed left-0 top-0 bottom-0 w-72 flex flex-col z-50 lg:hidden sidebar-glass backdrop-blur-2xl bg-white/70 dark:bg-slate-950/60 border-r border-slate-950/[0.06] dark:border-white/[0.05]">
                            {sidebarContent}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
