import React, { useState, useMemo, useRef } from 'react';
import { AppData, LibraryResource } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Trash2, CheckCircle, Clock, Upload, X, ShieldAlert, File, Search, Filter, AlertCircle, BookOpen, FolderOpen, ClipboardList, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { uploadFile, deleteFile } from '../services/cloudStorageService';
import { supabase } from '../services/supabase';
import clsx from 'clsx';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface LibraryTabProps {
    data: AppData;
    onAddLibraryResource: (resourceData: Omit<LibraryResource, 'id'>) => void;
    onDeleteLibraryResource: (resourceId: string) => void;
    onUpdateLibraryResource: (updatedResource: LibraryResource) => void;
}

const CATEGORIES = [
    { value: 'lesson-plan', label: 'Lesson Plans', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: FileText },
    { value: 'session-plan', label: 'Session Plans', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: Clock },
    { value: 'notes', label: 'Notes', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', icon: BookOpen },
    { value: 'guide', label: 'Guides / Manuals', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', icon: FolderOpen },
    { value: 'report', label: 'Reports', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20', icon: ClipboardList },
    { value: 'question-paper', label: 'Question Papers', color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20', icon: HelpCircle },
    { value: 'other', label: 'Other', color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20', icon: File }
];

export default function LibraryTab({ data, onAddLibraryResource, onDeleteLibraryResource, onUpdateLibraryResource }: LibraryTabProps) {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadLimitMB] = useLocalStorage<number>('admin_upload_limit_mb', 2);

    // Upload Form State
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadCategory, setUploadCategory] = useState<LibraryResource['category']>('lesson-plan');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredResources = useMemo(() => {
        return (data.library || []).filter(res => {
            if (filterCategory !== 'all' && res.category !== filterCategory) return false;
            if (searchQuery && !res.title.toLowerCase().includes(searchQuery.toLowerCase()) && !res.fileName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    }, [data.library, filterCategory, searchQuery]);

    // Group filtered resources by category
    const groupedResources = useMemo(() => {
        const groups: Record<string, typeof filteredResources> = {};
        CATEGORIES.forEach(cat => {
            const items = filteredResources.filter(r => r.category === cat.value);
            if (items.length > 0) {
                groups[cat.value] = items;
            }
        });
        return groups;
    }, [filteredResources]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Enforce admin-configured validation limit
            if (file.size > uploadLimitMB * 1024 * 1024) {
                showToast(`File is too large. Max ${uploadLimitMB}MB.`, "error");
                e.target.value = '';
                return;
            }
            setSelectedFile(file);
            if (!uploadTitle) {
                // Auto-fill title with filename (without extension)
                setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !uploadTitle) return;

        setIsUploading(true);

        try {
            // Upload via cloudStorageService (handles validation, unique naming, and audit logging)
            const result = await uploadFile('library_documents', selectedFile, {
                fileName: selectedFile.name,
            });

            // Construct Resource Metadata for the frontend state
            onAddLibraryResource({
                title: uploadTitle,
                fileName: selectedFile.name,
                fileType: selectedFile.type || 'application/octet-stream',
                category: uploadCategory,
                uploadedBy: user?.name || 'Unknown Instructor',
                uploadedAt: new Date().toISOString(),
                size: selectedFile.size,
                isApproved: user?.role === 'admin', // Auto-approve if Admin
                downloadUrl: result.publicUrl
            });

            showToast("File uploaded successfully", "success");

            // Reset Form
            setUploadTitle('');
            setUploadCategory('lesson-plan');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setShowUploadModal(false);

        } catch (err: any) {
            console.error("Supabase upload failed:", err);
            showToast(`Upload failed: ${err.message || 'Unknown error'}`, "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async (resource: LibraryResource) => {
        // Security check: Must be approved OR user must be admin
        if (!resource.isApproved && user?.role !== 'admin') {
            showToast("Cannot download! Document is pending Admin approval.", "error");
            return;
        }

        if (resource.downloadUrl) {
            window.open(resource.downloadUrl, '_blank');
            showToast("Download started", "success");
        } else {
            showToast("Download URL not available for this document.", "error");
        }
    };

    const handleToggleApproval = (resource: LibraryResource) => {
        if (user?.role !== 'admin') return;
        onUpdateLibraryResource({
            ...resource,
            isApproved: !resource.isApproved
        });
    };

    const handleDelete = async (resource: LibraryResource) => {
        if (window.confirm("Are you sure you want to delete this document forever?")) {
            // Delete the file from Supabase Storage bucket if it has a cloud URL
            if (resource.downloadUrl) {
                try {
                    // Extract the file path from the public URL
                    const urlParts = resource.downloadUrl.split('/library_documents/');
                    if (urlParts[1]) {
                        await deleteFile('library_documents', decodeURIComponent(urlParts[1]));
                    }
                } catch (err) {
                    console.warn('Could not delete file from storage:', err);
                    // Continue with DB deletion even if storage deletion fails
                }
            }
            onDeleteLibraryResource(resource.id);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Library Tools Row */}
            <div className="flex-shrink-0 p-4 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)] flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400">
                        <FileText size={16} />
                        <span className="text-sm font-bold">{data.library?.length || 0} Documents</span>
                    </div>
                    {user?.role === 'admin' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                            <ShieldAlert size={16} />
                            <span className="text-sm font-bold">{(data.library || []).filter(r => !r.isApproved).length} Pending Approval</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-2 text-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] w-48 focus:w-64 transition-all focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                        />
                    </div>

                    <div className="flex items-center bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg shadow-sm overflow-hidden">
                        <div className="pl-3 py-2 border-r border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)]">
                            <Filter size={14} />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-3 py-2 text-sm bg-transparent border-none text-[var(--md-sys-color-on-surface)] font-medium outline-none cursor-pointer"
                            aria-label="Filter documents by category"
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>

                    {user?.role !== 'viewer' && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md font-bold flex items-center gap-2 transition-all hover:scale-[1.02]"
                        >
                            <Upload size={16} /> Upload Document
                        </button>
                    )}
                </div>
            </div>
            {/* Document Grid — Flat Windows Explorer Style */}
            <div className="flex-1 overflow-auto p-6">
                {filteredResources.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        <AnimatePresence mode="popLayout">
                            {filteredResources.map((resource, idx) => {
                                const catInfo = CATEGORIES.find(c => c.value === resource.category) || CATEGORIES[6];
                                const CatFileIcon = catInfo.icon;

                                return (
                                    <motion.div
                                        key={resource.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.85 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="relative group bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl overflow-hidden hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer"
                                        title={`${resource.title}\n${resource.fileName}\nCategory: ${catInfo.label}\n${formatBytes(resource.size)} · ${resource.uploadedBy}\n${new Date(resource.uploadedAt).toLocaleDateString()}`}
                                    >
                                        {/* Pending ribbon */}
                                        {!resource.isApproved && (
                                            <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg z-20 flex items-center gap-0.5">
                                                <ShieldAlert size={8} /> PENDING
                                            </div>
                                        )}

                                        {/* Icon area */}
                                        <div className={clsx("flex items-center justify-center py-4", catInfo.color.split(' ').filter(c => c.startsWith('bg-')).join(' '))}>
                                            <CatFileIcon size={32} className={catInfo.color.split(' ').find(c => c.startsWith('text-'))} />
                                        </div>

                                        {/* File info */}
                                        <div className="px-2 pt-1.5 pb-1.5">
                                            <p className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] truncate leading-tight" title={resource.title}>
                                                {resource.title}
                                            </p>
                                            <p className="text-[9px] text-[var(--md-sys-color-secondary)] truncate mt-0.5">
                                                {formatBytes(resource.size)} · {new Date(resource.uploadedAt).toLocaleDateString()}
                                            </p>
                                            <span className={clsx("inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full", catInfo.color)}>
                                                {catInfo.label}
                                            </span>
                                        </div>

                                        {/* Hover action overlay (Desktop) */}
                                        <div className="hidden md:flex absolute inset-0 bg-[var(--md-sys-color-surface)]/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex-col items-center justify-center gap-1.5 p-2 z-10">
                                            <p className="text-[10px] font-bold text-[var(--md-sys-color-on-surface)] text-center truncate w-full mb-1">{resource.title}</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownload(resource); }}
                                                disabled={!resource.isApproved && user?.role !== 'admin'}
                                                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 rounded-lg text-[10px] font-bold transition-colors tap-target"
                                            >
                                                <Download size={12} /> Download
                                            </button>

                                            <div className="flex gap-1 w-full">
                                                {user?.role === 'admin' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleToggleApproval(resource); }}
                                                        className={clsx(
                                                            "flex-1 py-1 rounded-lg text-white text-[9px] font-bold flex items-center justify-center gap-0.5 transition-colors tap-target",
                                                            resource.isApproved ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
                                                        )}
                                                    >
                                                        {resource.isApproved ? <ShieldAlert size={10} /> : <CheckCircle size={10} />}
                                                        {resource.isApproved ? 'Revoke' : 'Approve'}
                                                    </button>
                                                )}
                                                {(user?.role === 'admin' || user?.name === resource.uploadedBy) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(resource); }}
                                                        className="flex-1 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 rounded-lg text-[9px] font-bold flex items-center justify-center gap-0.5 transition-colors tap-target"
                                                    >
                                                        <Trash2 size={10} /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mobile Static Actions */}
                                        <div className="flex md:hidden flex-col gap-1.5 px-2 pb-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownload(resource); }}
                                                disabled={!resource.isApproved && user?.role !== 'admin'}
                                                className="w-full flex items-center justify-center gap-1 px-2 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 rounded-lg text-[12px] font-bold transition-colors tap-target"
                                            >
                                                <Download size={14} /> Download
                                            </button>

                                            <div className="flex gap-1.5 w-full">
                                                {user?.role === 'admin' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleToggleApproval(resource); }}
                                                        className={clsx(
                                                            "flex-1 py-2 rounded-lg text-white text-[10px] font-bold flex items-center justify-center transition-colors tap-target",
                                                            resource.isApproved ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
                                                        )}
                                                        title={resource.isApproved ? 'Revoke' : 'Approve'}
                                                    >
                                                        {resource.isApproved ? <ShieldAlert size={14} /> : <CheckCircle size={14} />}
                                                    </button>
                                                )}
                                                {(user?.role === 'admin' || user?.name === resource.uploadedBy) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(resource); }}
                                                        className="flex-1 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 rounded-lg flex items-center justify-center transition-colors tap-target"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
                            <FileText size={48} className="text-indigo-300 dark:text-indigo-700" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-2">No Documents Found</h3>
                        <p className="text-[var(--md-sys-color-secondary)] max-w-md">
                            {searchQuery || filterCategory !== 'all'
                                ? "Try adjusting your filters to find what you're looking for."
                                : "The digital library is currently empty. Upload a lesson plan or manual to get started."}
                        </p>
                        {user?.role !== 'viewer' && !(searchQuery || filterCategory !== 'all') && (
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
                            >
                                <Upload size={18} /> Upload First Document
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className="p-5 border-b border-[var(--md-sys-color-outline)] flex items-center justify-between bg-indigo-600 text-white">
                                <div className="flex items-center gap-2">
                                    <Upload size={20} />
                                    <h3 className="font-bold text-lg">Upload to Library</h3>
                                </div>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="p-1 hover:bg-white/20 rounded-full text-white transition-colors"
                                    aria-label="Close upload modal"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
                                {user?.role !== 'admin' && (
                                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-400 text-sm">
                                        <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
                                        <p><strong>Security Notice:</strong> All uploaded files must be approved by an Administrator before they are accessible to others.</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1">Document File *</label>
                                    <div className="relative border-2 border-dashed border-[var(--md-sys-color-outline)] rounded-xl p-6 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                            onChange={handleFileSelect}
                                            aria-label="Select document file to upload"
                                        />
                                        {selectedFile ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                                    <FileText size={24} />
                                                </div>
                                                <p className="font-bold text-[var(--md-sys-color-on-surface)] text-sm break-all">{selectedFile.name}</p>
                                                <p className="text-xs text-[var(--md-sys-color-secondary)] mt-1">{formatBytes(selectedFile.size)}</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-[var(--md-sys-color-secondary)] rounded-full flex items-center justify-center mb-3">
                                                    <Upload size={24} />
                                                </div>
                                                <p className="font-bold text-[var(--md-sys-color-on-surface)] text-sm">Click to browse files</p>
                                                <p className="text-xs text-[var(--md-sys-color-secondary)] mt-1">PDF, DOC, DOCX (Max {uploadLimitMB}MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1">Document Title *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Week 4 Introduction to Solar"
                                        className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-[var(--md-sys-color-on-surface)]"
                                        value={uploadTitle}
                                        onChange={e => setUploadTitle(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-2">Category *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => setUploadCategory(cat.value as any)}
                                                className={clsx(
                                                    "px-3 py-2.5 rounded-xl border font-medium text-sm transition-all",
                                                    uploadCategory === cat.value
                                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm"
                                                        : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]"
                                                )}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        disabled={isUploading}
                                        onClick={() => setShowUploadModal(false)}
                                        className="flex-1 px-4 py-2.5 border border-[var(--md-sys-color-outline)] rounded-xl font-bold hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!selectedFile || !uploadTitle || isUploading}
                                        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...
                                            </>
                                        ) : (
                                            <>Upload Securely</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
