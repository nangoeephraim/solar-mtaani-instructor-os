import React, { SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Sparkles, MessageSquare, FileText, Paperclip, BarChart3, Users, X, AlertCircle, CheckCircle2, Copy, Upload, Download, Plus, Trash2, Check, MessageCircleQuestion, ThumbsUp, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import type { MeetingMessage, MeetingFile, MeetingPoll, MeetingQuestion, SidebarTab, BlurLevel } from './types';

export interface MeetingSidebarProps {
    showSidebar: SidebarTab | null;
    setShowSidebar: (tab: SidebarTab | null) => void;
    setBackgroundBlur: (level: BlurLevel) => void;
    backgroundBlur: BlurLevel;
    addToast: (text: string, icon: string) => void;
    setSelectedBg: (bg: number | null) => void;
    selectedBg: number | null;
    lowLightMode: boolean;
    setLowLightMode: (b: boolean) => void;
    studioLighting: boolean;
    setStudioLighting: (b: boolean) => void;
    notesContent: string;
    setNotesContent: (s: string) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    isUploading: boolean;
    handleFileUpload: (files: FileList | null) => void;
    meetingFiles: MeetingFile[];
    getFileIcon: (type: string) => string;
    formatFileSize: (bytes: number) => string;
    pollsTab: 'polls' | 'qa';
    setPollsTab: (tab: 'polls' | 'qa') => void;
    polls: MeetingPoll[];
    questions: MeetingQuestion[];
    showPollCreator: boolean;
    setShowPollCreator: (b: boolean) => void;
    newPollQuestion: string;
    setNewPollQuestion: (s: string) => void;
    newPollOptions: string[];
    setNewPollOptions: React.Dispatch<React.SetStateAction<string[]>>;
    createPoll: () => void;
    userName: string;
    endPoll: (id: string) => void;
    votePoll: (pollId: string, optionIndex: number) => void;
    newQuestionText: string;
    setNewQuestionText: (s: string) => void;
    submitQuestion: () => void;
    upvoteQuestion: (id: string) => void;
    markQuestionAnswered: (id: string) => void;
    audioEnabled: boolean;
    audioLevel: number;
    userAvatar: string | null;
    user: any;
    videoEnabled: boolean;
    copyMeetingLink: () => void;
    copied: boolean;
    chatMessages: MeetingMessage[];
    chatEndRef: React.RefObject<HTMLDivElement | null>;
    handleSendChat: () => void;
    chatFileInputRef: React.RefObject<HTMLInputElement | null>;
    handleChatFileAttach: (files: FileList | null) => void;
    chatInput: string;
    setChatInput: (s: string) => void;
}

export default function MeetingSidebar(props: MeetingSidebarProps) {
    const {
        showSidebar, setShowSidebar, setBackgroundBlur, backgroundBlur, addToast,
        setSelectedBg, selectedBg, lowLightMode, setLowLightMode, studioLighting,
        setStudioLighting, notesContent, setNotesContent, fileInputRef, isUploading,
        handleFileUpload, meetingFiles, getFileIcon, formatFileSize, pollsTab,
        setPollsTab, polls, questions, showPollCreator, setShowPollCreator,
        newPollQuestion, setNewPollQuestion, newPollOptions, setNewPollOptions,
        createPoll, userName, endPoll, votePoll, newQuestionText, setNewQuestionText,
        submitQuestion, upvoteQuestion, markQuestionAnswered, audioEnabled, audioLevel,
        userAvatar, user, videoEnabled, copyMeetingLink, copied, chatMessages,
        chatEndRef, handleSendChat, chatFileInputRef, handleChatFileAttach,
        chatInput, setChatInput
    } = props;

    return (
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
    );
}
