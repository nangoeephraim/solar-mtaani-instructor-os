import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppData, LibraryResource } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
    FileText, Download, Trash2, CheckCircle, Clock, Upload, X, 
    ShieldAlert, File, Search, Filter, AlertCircle, BookOpen, 
    FolderOpen, ClipboardList, HelpCircle, LayoutGrid, List, 
    ArrowUpDown, Tag, Calendar, Info, Eye, EyeOff, Edit2, 
    Plus, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { useTheme } from '../contexts/ThemeContext';
import { uploadFile, deleteFile } from '../services/cloudStorageService';
import { incrementLibraryDownloadCount } from '../services/storageService';
import clsx from 'clsx';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface LibraryTabProps {
    data: AppData;
    onAddLibraryResource: (resourceData: Omit<LibraryResource, 'id'>) => void;
    onDeleteLibraryResource: (resourceId: string) => void;
    onUpdateLibraryResource: (updatedResource: LibraryResource) => void;
}

const CATEGORIES = [
    { value: 'lesson-plan', label: 'Lesson Plans', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', icon: FileText },
    { value: 'session-plan', label: 'Session Plans', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', icon: Clock },
    { value: 'notes', label: 'Notes', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', icon: BookOpen },
    { value: 'guide', label: 'Guides / Manuals', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800', icon: FolderOpen },
    { value: 'report', label: 'Reports', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800', icon: ClipboardList },
    { value: 'question-paper', label: 'Question Papers', color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800', icon: HelpCircle },
    { value: 'other', label: 'Other', color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800', icon: File }
];

export default function LibraryTab({ data, onAddLibraryResource, onDeleteLibraryResource, onUpdateLibraryResource }: LibraryTabProps) {
    const { user } = useAuth();
    const { preferences } = useTheme();
    const { showToast } = useToast();

    // Settings / Configuration
    const [uploadLimitMB] = useLocalStorage<number>('admin_upload_limit_mb', 2);
    const [layoutMode, setLayoutMode] = useLocalStorage<'grid' | 'list'>('library_layout_mode', 'grid');

    // Layout/Viewing state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterTerm, setFilterTerm] = useState('all');
    const [filterType, setFilterType] = useState('all');

    // Sorting state (for list view)
    const [sortBy, setSortBy] = useState<'title' | 'size' | 'uploadedAt' | 'downloadsCount'>('uploadedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Modals & Panels state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Upload Form State
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadCategory, setUploadCategory] = useState<LibraryResource['category']>('lesson-plan');
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadTerm, setUploadTerm] = useState<string>('none');
    const [uploadTags, setUploadTags] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Drawer Edit Form State
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editCategory, setEditCategory] = useState<LibraryResource['category']>('lesson-plan');
    const [editTerm, setEditTerm] = useState<string>('none');
    const [editTags, setEditTags] = useState('');

    // Load selected resource values into edit state when it changes
    useEffect(() => {
        if (selectedResource) {
            setEditTitle(selectedResource.title);
            setEditDescription(selectedResource.description || '');
            setEditCategory(selectedResource.category);
            setEditTerm(selectedResource.academicTerm ? selectedResource.academicTerm.toString() : 'none');
            setEditTags(selectedResource.tags ? selectedResource.tags.join(', ') : '');
            setIsPreviewOpen(false);
        } else {
            setIsEditing(false);
        }
    }, [selectedResource]);

    // File drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (user?.role !== 'viewer') {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (user?.role === 'viewer') return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const ext = file.name.split('.').pop()?.toLowerCase();
            const allowed = ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt'];
            
            if (ext && !allowed.includes(ext)) {
                showToast("Unsupported file type. Use PDF, DOC, DOCX, XLS, XLSX etc.", "error");
                return;
            }

            if (file.size > uploadLimitMB * 1024 * 1024) {
                showToast(`File is too large. Max ${uploadLimitMB}MB.`, "error");
                return;
            }

            setSelectedFile(file);
            setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
            setShowUploadModal(true);
        }
    };

    // Main filtering & sorting logic
    const filteredResources = useMemo(() => {
        return (data.library || []).filter(res => {
            // Category filter
            if (filterCategory !== 'all' && res.category !== filterCategory) return false;
            
            // Term filter
            if (filterTerm !== 'all') {
                if (filterTerm === 'none' && res.academicTerm !== undefined) return false;
                if (filterTerm !== 'none' && res.academicTerm !== parseInt(filterTerm)) return false;
            }

            // File type filter
            if (filterType !== 'all') {
                const ext = res.fileName.split('.').pop()?.toLowerCase() || '';
                if (filterType === 'pdf' && ext !== 'pdf') return false;
                if (filterType === 'word' && !['doc', 'docx'].includes(ext)) return false;
                if (filterType === 'excel' && !['xls', 'xlsx'].includes(ext)) return false;
                if (filterType === 'other' && ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) return false;
            }

            // Search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const titleMatch = res.title.toLowerCase().includes(query);
                const fileMatch = res.fileName.toLowerCase().includes(query);
                const descMatch = res.description?.toLowerCase().includes(query) || false;
                const tagMatch = res.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
                if (!titleMatch && !fileMatch && !descMatch && !tagMatch) return false;
            }
            return true;
        }).sort((a, b) => {
            const factor = sortOrder === 'asc' ? 1 : -1;
            if (sortBy === 'title') {
                return a.title.localeCompare(b.title) * factor;
            }
            if (sortBy === 'size') {
                return (a.size - b.size) * factor;
            }
            if (sortBy === 'downloadsCount') {
                return ((a.downloadsCount || 0) - (b.downloadsCount || 0)) * factor;
            }
            // Default uploadedAt
            return (new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()) * factor;
        });
    }, [data.library, filterCategory, filterTerm, filterType, searchQuery, sortBy, sortOrder]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > uploadLimitMB * 1024 * 1024) {
                showToast(`File is too large. Max ${uploadLimitMB}MB.`, "error");
                e.target.value = '';
                return;
            }
            setSelectedFile(file);
            if (!uploadTitle) {
                setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !uploadTitle) return;

        setIsUploading(true);

        try {
            const result = await uploadFile('library_documents', selectedFile, {
                fileName: selectedFile.name,
            });

            onAddLibraryResource({
                title: uploadTitle,
                fileName: selectedFile.name,
                fileType: selectedFile.type || 'application/octet-stream',
                category: uploadCategory,
                uploadedBy: user?.name || 'Unknown Instructor',
                uploadedById: user?.id,
                uploadedAt: new Date().toISOString(),
                size: selectedFile.size,
                isApproved: user?.role === 'admin',
                downloadUrl: result.publicUrl,
                description: uploadDescription || undefined,
                tags: uploadTags ? uploadTags.split(',').map(t => t.trim()).filter(Boolean) : [],
                academicTerm: uploadTerm !== 'none' ? parseInt(uploadTerm) as any : undefined,
                downloadsCount: 0
            });

            showToast("File uploaded successfully", "success");

            // Reset
            setUploadTitle('');
            setUploadDescription('');
            setUploadCategory('lesson-plan');
            setUploadTerm('none');
            setUploadTags('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setShowUploadModal(false);

        } catch (err: any) {
            console.error("Upload failed:", err);
            showToast(`Upload failed: ${err.message || 'Unknown error'}`, "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async (resource: LibraryResource) => {
        if (!resource.isApproved && user?.role !== 'admin') {
            showToast("Cannot download! Document is pending Admin approval.", "error");
            return;
        }

        if (resource.downloadUrl) {
            window.open(resource.downloadUrl, '_blank');
            showToast("Download started", "success");
            
            try {
                await incrementLibraryDownloadCount(resource.id);
                // Dynamically increment count locally so UI updates instantly
                onUpdateLibraryResource({
                    ...resource,
                    downloadsCount: (resource.downloadsCount || 0) + 1
                });
            } catch (e) {
                console.error("Failed to increment download count:", e);
            }
        } else {
            showToast("Download URL not available for this document.", "error");
        }
    };

    const handleToggleApproval = (resource: LibraryResource) => {
        if (user?.role !== 'admin') return;
        const updated = {
            ...resource,
            isApproved: !resource.isApproved
        };
        onUpdateLibraryResource(updated);
        if (selectedResource?.id === resource.id) {
            setSelectedResource(updated);
        }
    };

    const handleSaveChanges = () => {
        if (!selectedResource) return;
        const updated: LibraryResource = {
            ...selectedResource,
            title: editTitle,
            description: editDescription || undefined,
            category: editCategory,
            academicTerm: editTerm !== 'none' ? parseInt(editTerm) as any : undefined,
            tags: editTags ? editTags.split(',').map(t => t.trim()).filter(Boolean) : []
        };
        onUpdateLibraryResource(updated);
        setSelectedResource(updated);
        setIsEditing(false);
        showToast("Document updated successfully", "success");
    };

    const handleDelete = async (resource: LibraryResource) => {
        if (window.confirm("Are you sure you want to delete this document forever?")) {
            if (resource.downloadUrl) {
                try {
                    const urlParts = resource.downloadUrl.split('/library_documents/');
                    if (urlParts[1]) {
                        await deleteFile('library_documents', decodeURIComponent(urlParts[1]));
                    }
                } catch (err) {
                    console.warn('Could not delete file from storage:', err);
                }
            }
            onDeleteLibraryResource(resource.id);
            if (selectedResource?.id === resource.id) {
                setSelectedResource(null);
            }
            showToast("Document deleted", "info");
        }
    };

    const toggleSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const isPdf = (res: LibraryResource) => {
        return res.fileType === 'application/pdf' || 
               res.fileName.toLowerCase().endsWith('.pdf');
    };

    return (
        <div 
            className="flex flex-col h-full animate-fade-in relative"
            onDragOver={handleDragOver}
        >
            {/* Drag & Drop Visual Overlay */}
            <AnimatePresence>
                {isDragging && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="absolute inset-0 bg-indigo-600/10 dark:bg-indigo-600/20 border-4 border-dashed border-indigo-500 rounded-3xl z-40 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto"
                    >
                        <div className="w-20 h-20 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center animate-bounce mb-4">
                            <Upload size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-indigo-700 dark:text-indigo-300">Drop files here</h2>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-2">Upload directly to the PRISM Library</p>
                    </motion.div>
                )}
            </AnimatePresence>

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

                <div className="flex items-center gap-3 ml-auto flex-wrap">
                    {/* Search Field */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search title, details, tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-2 text-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] w-48 focus:w-64 transition-all outline-none input-glow shadow-sm"
                        />
                    </div>

                    {/* Filter Category */}
                    <div className="flex items-center bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg shadow-sm overflow-hidden input-glow">
                        <div className="pl-3 py-2 border-r border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)]">
                            <Filter size={14} />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-2 py-2 text-sm bg-transparent border-none text-[var(--md-sys-color-on-surface)] font-medium outline-none cursor-pointer"
                            aria-label="Filter documents by category"
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>

                    {/* Filter Academic Term */}
                    <div className="flex items-center bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg shadow-sm overflow-hidden input-glow">
                        <div className="pl-3 py-2 border-r border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)]">
                            <Calendar size={14} />
                        </div>
                        <select
                            value={filterTerm}
                            onChange={(e) => setFilterTerm(e.target.value)}
                            className="px-2 py-2 text-sm bg-transparent border-none text-[var(--md-sys-color-on-surface)] font-medium outline-none cursor-pointer"
                            aria-label="Filter documents by academic term"
                        >
                            <option value="all">All Terms</option>
                            <option value="1">Term 1</option>
                            <option value="2">Term 2</option>
                            <option value="3">Term 3</option>
                            <option value="none">Unassigned Term</option>
                        </select>
                    </div>

                    {/* Filter File Type */}
                    <div className="flex items-center bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg shadow-sm overflow-hidden input-glow">
                        <div className="pl-3 py-2 border-r border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)]">
                            <File size={14} />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-2 py-2 text-sm bg-transparent border-none text-[var(--md-sys-color-on-surface)] font-medium outline-none cursor-pointer"
                            aria-label="Filter documents by file extension"
                        >
                            <option value="all">All File Types</option>
                            <option value="pdf">PDF Docs</option>
                            <option value="word">Word Docs</option>
                            <option value="excel">Spreadsheets</option>
                            <option value="other">Other Types</option>
                        </select>
                    </div>

                    {/* Grid/List Toggle Switch */}
                    <div className="flex bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg p-1 gap-1 shadow-sm">
                        <button
                            onClick={() => setLayoutMode('grid')}
                            className={clsx(
                                "p-1.5 rounded transition-all",
                                layoutMode === 'grid' 
                                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
                                    : "text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"
                            )}
                            title="Grid Layout"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setLayoutMode('list')}
                            className={clsx(
                                "p-1.5 rounded transition-all",
                                layoutMode === 'list' 
                                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
                                    : "text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"
                            )}
                            title="List Layout"
                        >
                            <List size={16} />
                        </button>
                    </div>

                    {user?.role !== 'viewer' && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md font-bold flex items-center gap-2 transition-all hover:scale-[1.02]"
                        >
                            <Upload size={16} /> Upload
                        </button>
                    )}
                </div>
            </div>

            {/* Document Content View */}
            <div className="flex-1 overflow-auto p-6">
                {filteredResources.length > 0 ? (
                    layoutMode === 'grid' ? (
                        /* GRID VIEW */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                                            transition={{ delay: idx * 0.01 }}
                                            onClick={() => setSelectedResource(resource)}
                                            className="relative group glass-card rounded-xl overflow-hidden shadow-elevation-1 hover:shadow-elevation-3 transition-all cursor-pointer border border-slate-200 dark:border-slate-800 hover:border-indigo-400 flex flex-col justify-between"
                                        >
                                            {/* Pending / Term indicators */}
                                            <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-20 pointer-events-none">
                                                {resource.academicTerm && (
                                                    <span className="bg-indigo-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                                        {preferences.terminology?.periodLabel || 'Term'} {resource.academicTerm}
                                                    </span>
                                                )}
                                                {!resource.isApproved && (
                                                    <div className="ml-auto bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm flex items-center gap-0.5 shadow-sm">
                                                        <ShieldAlert size={8} /> PENDING
                                                    </div>
                                                )}
                                            </div>

                                            {/* Icon area */}
                                            <div className={clsx("flex items-center justify-center py-6 border-b border-[var(--md-sys-color-outline)]", catInfo.color.split(' ').filter(c => c.startsWith('bg-')).join(' '))}>
                                                <CatFileIcon size={44} className={catInfo.color.split(' ').find(c => c.startsWith('text-'))} />
                                            </div>

                                            {/* File info */}
                                            <div className="p-3 flex-1 flex flex-col justify-between gap-1.5">
                                                <div>
                                                    <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] line-clamp-2 leading-tight" title={resource.title}>
                                                        {resource.title}
                                                    </h4>
                                                    {resource.description && (
                                                        <p className="text-[10px] text-[var(--md-sys-color-secondary)] line-clamp-1 mt-0.5 italic">
                                                            {resource.description}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-col gap-1 mt-auto pt-1">
                                                    <span className={clsx("self-start text-[8px] font-bold px-1.5 py-0.5 rounded-full border", catInfo.color)}>
                                                        {catInfo.label}
                                                    </span>
                                                    
                                                    {/* Tags list (Max 2 tags visible) */}
                                                    {resource.tags && resource.tags.length > 0 && (
                                                        <div className="flex gap-1 overflow-hidden mt-0.5">
                                                            {resource.tags.slice(0, 2).map((t, idx) => (
                                                                <span key={idx} className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.2 rounded font-medium truncate">
                                                                    #{t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between text-[8px] text-[var(--md-sys-color-secondary)] mt-1.5">
                                                        <span>{formatBytes(resource.size)}</span>
                                                        <span>{resource.downloadsCount || 0} dl</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hover action overlay (Desktop) */}
                                            <div className="hidden md:flex absolute inset-0 bg-[var(--md-sys-color-surface)]/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex-col items-center justify-center gap-2 p-3 z-10">
                                                <p className="text-xs font-black text-[var(--md-sys-color-on-surface)] text-center line-clamp-2 px-1 w-full mb-1">{resource.title}</p>
                                                
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDownload(resource); }}
                                                    disabled={!resource.isApproved && user?.role !== 'admin'}
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                                                >
                                                    <Download size={14} /> Download
                                                </button>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedResource(resource); }}
                                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-lg text-xs font-bold transition-all"
                                                >
                                                    <Info size={14} /> Details
                                                </button>

                                                <div className="flex gap-2 w-full mt-1">
                                                    {user?.role === 'admin' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleToggleApproval(resource); }}
                                                            className={clsx(
                                                                "flex-1 py-1 rounded-lg text-white text-[10px] font-bold flex items-center justify-center gap-0.5 transition-colors",
                                                                resource.isApproved ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
                                                            )}
                                                        >
                                                            {resource.isApproved ? 'Revoke' : 'Approve'}
                                                        </button>
                                                    )}
                                                    {(user?.role === 'admin' || user?.id === resource.uploadedById || user?.name === resource.uploadedBy) && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(resource); }}
                                                            className="flex-1 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mobile Static Actions */}
                                            <div className="flex md:hidden flex-col gap-1.5 px-3 pb-3 border-t border-[var(--md-sys-color-outline)] pt-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDownload(resource)}
                                                        disabled={!resource.isApproved && user?.role !== 'admin'}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold"
                                                    >
                                                        <Download size={12} /> Get
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedResource(resource)}
                                                        className="px-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
                                                    >
                                                        <Info size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ) : (
                        /* LIST VIEW TABLE */
                        <div className="overflow-x-auto rounded-2xl border border-[var(--md-sys-color-outline)] shadow-elevation-1 bg-[var(--md-sys-color-surface)]">
                            <table className="w-full border-collapse text-left">
                                <thead className="bg-[var(--md-sys-color-surface-variant)] border-b border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] text-xs font-bold">
                                    <tr>
                                        <th className="p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => toggleSort('title')}>
                                            <div className="flex items-center gap-1.5">
                                                Document Title {sortBy === 'title' && <ArrowUpDown size={12} />}
                                            </div>
                                        </th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Term</th>
                                        <th className="p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => toggleSort('size')}>
                                            <div className="flex items-center gap-1.5">
                                                Size {sortBy === 'size' && <ArrowUpDown size={12} />}
                                            </div>
                                        </th>
                                        <th className="p-4">Uploaded By</th>
                                        <th className="p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => toggleSort('uploadedAt')}>
                                            <div className="flex items-center gap-1.5">
                                                Date {sortBy === 'uploadedAt' && <ArrowUpDown size={12} />}
                                            </div>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => toggleSort('downloadsCount')}>
                                            <div className="flex items-center gap-1.5">
                                                Downloads {sortBy === 'downloadsCount' && <ArrowUpDown size={12} />}
                                            </div>
                                        </th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--md-sys-color-outline)] text-xs text-[var(--md-sys-color-on-surface)]">
                                    <AnimatePresence mode="popLayout">
                                        {filteredResources.map((resource) => {
                                            const catInfo = CATEGORIES.find(c => c.value === resource.category) || CATEGORIES[6];
                                            const CatFileIcon = catInfo.icon;
                                            
                                            return (
                                                <motion.tr 
                                                    key={resource.id}
                                                    layout
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedResource(resource)}
                                                >
                                                    <td className="p-4 font-bold flex items-center gap-3">
                                                        <div className={clsx("p-2 rounded-lg border", catInfo.color)}>
                                                            <CatFileIcon size={16} />
                                                        </div>
                                                        <div className="max-w-[200px] sm:max-w-xs md:max-w-md truncate">
                                                            <span className="truncate block font-google" title={resource.title}>{resource.title}</span>
                                                            <span className="text-[10px] text-[var(--md-sys-color-secondary)] font-normal block truncate mt-0.5">{resource.fileName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={clsx("px-2 py-0.5 rounded-full border text-[10px] font-bold inline-block", catInfo.color)}>
                                                            {catInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {resource.academicTerm ? (
                                                            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-extrabold px-2 py-0.5 rounded-full">
                                                                {preferences.terminology?.periodLabel || 'Term'} {resource.academicTerm}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[var(--md-sys-color-secondary)] italic">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 font-medium text-[var(--md-sys-color-secondary)]">{formatBytes(resource.size)}</td>
                                                    <td className="p-4">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{resource.uploadedBy}</span>
                                                    </td>
                                                    <td className="p-4 text-[var(--md-sys-color-secondary)]">
                                                        {new Date(resource.uploadedAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                                                        {resource.downloadsCount || 0}
                                                    </td>
                                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                onClick={() => handleDownload(resource)}
                                                                disabled={!resource.isApproved && user?.role !== 'admin'}
                                                                className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 hover:dark:bg-indigo-900/50 disabled:opacity-30 rounded-lg transition-colors"
                                                                title="Download File"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedResource(resource)}
                                                                className="p-2 border border-[var(--md-sys-color-outline)] text-slate-600 dark:text-slate-400 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg transition-colors"
                                                                title="Details / View"
                                                            >
                                                                <Info size={14} />
                                                            </button>
                                                            {(user?.role === 'admin' || user?.id === resource.uploadedById || user?.name === resource.uploadedBy) && (
                                                                <button
                                                                    onClick={() => handleDelete(resource)}
                                                                    className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                                                                    title="Delete File"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    /* EMPTY STATE */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
                            <FileText size={48} className="text-indigo-300 dark:text-indigo-700" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-2">No Documents Found</h3>
                        <p className="text-[var(--md-sys-color-secondary)] max-w-md">
                            {searchQuery || filterCategory !== 'all' || filterTerm !== 'all' || filterType !== 'all'
                                ? "Try adjusting your filters or search keywords to find what you're looking for."
                                : "The digital library is currently empty. Upload a lesson plan or manual to get started."}
                        </p>
                        {user?.role !== 'viewer' && !(searchQuery || filterCategory !== 'all' || filterTerm !== 'all' || filterType !== 'all') && (
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

            {/* DETAIL SLIDING DRAWER PANEL */}
            <AnimatePresence>
                {selectedResource && typeof document !== 'undefined' && createPortal(
                    <>
                        {/* Drawer Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedResource(null)}
                            className="fixed inset-0 bg-black z-45"
                        />

                        {/* Drawer content */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md md:max-w-lg bg-[var(--md-sys-color-surface)] shadow-2xl z-50 overflow-hidden flex flex-col border-l border-[var(--md-sys-color-outline)]"
                        >
                            {/* Drawer Header */}
                            <div className="p-5 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Info className="text-indigo-600 dark:text-indigo-400" size={20} />
                                    <h3 className="font-extrabold text-lg text-[var(--md-sys-color-on-surface)]">Document Details</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedResource(null)}
                                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                                    aria-label="Close details"
                                >
                                    <X size={20} className="text-[var(--md-sys-color-on-surface)]" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-auto p-6 space-y-6">
                                {isEditing ? (
                                    /* EDIT FORM */
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1 uppercase">Document Title</label>
                                            <input 
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl outline-none focus:border-indigo-500 font-medium text-sm text-[var(--md-sys-color-on-surface)]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1 uppercase">Description</label>
                                            <textarea 
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                placeholder="Explain what is inside this document..."
                                                rows={4}
                                                className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl outline-none focus:border-indigo-500 font-medium text-xs text-[var(--md-sys-color-on-surface)] resize-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1 uppercase">Category</label>
                                                <select
                                                    value={editCategory}
                                                    onChange={(e) => setEditCategory(e.target.value as any)}
                                                    className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl outline-none focus:border-indigo-500 text-xs font-bold"
                                                >
                                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1 uppercase">Academic {preferences.terminology?.periodLabel || 'Term'}</label>
                                                <select
                                                    value={editTerm}
                                                    onChange={(e) => setEditTerm(e.target.value)}
                                                    className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl outline-none focus:border-indigo-500 text-xs font-bold"
                                                >
                                                    <option value="none">Unassigned</option>
                                                    <option value="1">{preferences.terminology?.periodLabel || 'Term'} 1</option>
                                                    <option value="2">{preferences.terminology?.periodLabel || 'Term'} 2</option>
                                                    <option value="3">{preferences.terminology?.periodLabel || 'Term'} 3</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1 uppercase">Tags (comma separated)</label>
                                            <input 
                                                type="text"
                                                value={editTags}
                                                placeholder="e.g. Solar, Exam, Basics"
                                                onChange={(e) => setEditTags(e.target.value)}
                                                className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl outline-none focus:border-indigo-500 font-medium text-xs"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="flex-1 py-2.5 border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] rounded-xl text-xs font-bold hover:bg-[var(--md-sys-color-surface-variant)]"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveChanges}
                                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* DISPLAY INFO */
                                    <div className="space-y-6">
                                        {/* Main File Header Card */}
                                        <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-800/30 border border-[var(--md-sys-color-outline)] rounded-2xl p-4 shadow-inner">
                                            <div className={clsx("p-4 rounded-2xl border flex-shrink-0", CATEGORIES.find(c => c.value === selectedResource.category)?.color)}>
                                                {React.createElement((CATEGORIES.find(c => c.value === selectedResource.category) || CATEGORIES[6]).icon, { size: 36 })}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="font-extrabold text-sm md:text-base text-[var(--md-sys-color-on-surface)] break-words leading-snug">{selectedResource.title}</h4>
                                                <p className="text-[11px] text-[var(--md-sys-color-secondary)] break-all mt-1">{selectedResource.fileName}</p>
                                                <span className={clsx("inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full border", CATEGORIES.find(c => c.value === selectedResource.category)?.color)}>
                                                    {CATEGORIES.find(c => c.value === selectedResource.category)?.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Metadata Attributes Grid */}
                                        <div className="grid grid-cols-2 gap-3 bg-[var(--md-sys-color-surface-variant)] p-4 rounded-2xl border border-[var(--md-sys-color-outline)]">
                                            <div>
                                                <p className="text-[9px] text-[var(--md-sys-color-secondary)] uppercase font-bold tracking-wider">File Size</p>
                                                <p className="text-xs font-bold mt-0.5">{formatBytes(selectedResource.size)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-[var(--md-sys-color-secondary)] uppercase font-bold tracking-wider">Uploaded At</p>
                                                <p className="text-xs font-bold mt-0.5">{new Date(selectedResource.uploadedAt).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-[var(--md-sys-color-secondary)] uppercase font-bold tracking-wider">Uploader</p>
                                                <p className="text-xs font-bold mt-0.5">{selectedResource.uploadedBy}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-[var(--md-sys-color-secondary)] uppercase font-bold tracking-wider font-google">Download Stats</p>
                                                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{selectedResource.downloadsCount || 0} times</p>
                                            </div>
                                        </div>

                                        {/* Academic Term */}
                                        <div>
                                            <h5 className="text-xs font-black text-[var(--md-sys-color-on-surface)] mb-2 uppercase tracking-wide">Academic {preferences.terminology?.periodLabel || 'Term'} Connection</h5>
                                            {selectedResource.academicTerm ? (
                                                <div className="flex items-center gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-xl text-indigo-700 dark:text-indigo-400">
                                                    <Calendar size={16} />
                                                    <span className="text-xs font-extrabold">Associated with {preferences.terminology?.periodLabel || 'Term'} {selectedResource.academicTerm} Curriculum</span>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-[var(--md-sys-color-secondary)] italic">This resource is not tied to a specific academic {preferences.terminology?.periodLabel?.toLowerCase() || 'term'}.</p>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <h5 className="text-xs font-black text-[var(--md-sys-color-on-surface)] mb-2 uppercase tracking-wide">Description / Notes</h5>
                                            {selectedResource.description ? (
                                                <div className="bg-slate-50 dark:bg-slate-800/20 p-3 rounded-xl border border-[var(--md-sys-color-outline)] text-xs text-[var(--md-sys-color-on-surface)] whitespace-pre-line leading-relaxed font-google">
                                                    {selectedResource.description}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-[var(--md-sys-color-secondary)] italic">No description provided for this file.</p>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        <div>
                                            <h5 className="text-xs font-black text-[var(--md-sys-color-on-surface)] mb-2 uppercase tracking-wide">Taxonomy Tags</h5>
                                            {selectedResource.tags && selectedResource.tags.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedResource.tags.map((tag, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => {
                                                                setSearchQuery(tag);
                                                                setSelectedResource(null);
                                                                showToast(`Filtering by tag: #${tag}`, "info");
                                                            }}
                                                            className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                                                        >
                                                            <Tag size={10} /> {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-[var(--md-sys-color-secondary)] italic">No tags associated with this document.</p>
                                            )}
                                        </div>

                                        {/* PDF Inline Preview Frame */}
                                        {isPdf(selectedResource) && selectedResource.downloadUrl && (
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h5 className="text-xs font-black text-[var(--md-sys-color-on-surface)] uppercase tracking-wide">Document Preview</h5>
                                                    <button
                                                        onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                                                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
                                                    >
                                                        {isPreviewOpen ? 'Hide Preview' : 'Show PDF Preview'}
                                                    </button>
                                                </div>
                                                {isPreviewOpen && (
                                                    <div className="w-full h-80 rounded-xl overflow-hidden border border-[var(--md-sys-color-outline)] shadow-inner bg-white relative">
                                                        <iframe 
                                                            src={`${selectedResource.downloadUrl}#toolbar=0`} 
                                                            className="w-full h-full border-none" 
                                                            title="PDF Document Preview" 
                                                            sandbox="allow-scripts allow-same-origin"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Primary Drawer Actions */}
                                        <div className="pt-4 flex flex-col gap-2 border-t border-[var(--md-sys-color-outline)]">
                                            <button
                                                onClick={() => handleDownload(selectedResource)}
                                                disabled={!selectedResource.isApproved && user?.role !== 'admin'}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                                            >
                                                <Download size={14} /> Download Document
                                            </button>

                                            <div className="grid grid-cols-2 gap-2">
                                                {/* Edit triggers */}
                                                {(user?.role === 'admin' || user?.id === selectedResource.uploadedById || user?.name === selectedResource.uploadedBy) && (
                                                    <button
                                                        onClick={() => setIsEditing(true)}
                                                        className="flex items-center justify-center gap-1.5 py-2.5 border border-[var(--md-sys-color-outline)] text-slate-700 dark:text-slate-300 hover:bg-[var(--md-sys-color-surface-variant)] rounded-xl text-xs font-bold transition-colors"
                                                    >
                                                        <Edit2 size={12} /> Edit Info
                                                    </button>
                                                )}

                                                {/* Delete trigger */}
                                                {(user?.role === 'admin' || user?.id === selectedResource.uploadedById || user?.name === selectedResource.uploadedBy) && (
                                                    <button
                                                        onClick={() => handleDelete(selectedResource)}
                                                        className="flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 text-red-600 rounded-xl text-xs font-bold transition-colors"
                                                    >
                                                        <Trash2 size={12} /> Delete File
                                                    </button>
                                                )}
                                            </div>

                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => handleToggleApproval(selectedResource)}
                                                    className={clsx(
                                                        "w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all mt-2",
                                                        selectedResource.isApproved
                                                            ? "border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100"
                                                            : "border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100"
                                                    )}
                                                >
                                                    {selectedResource.isApproved ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    {selectedResource.isApproved ? 'Revoke Approval (Hide Document)' : 'Approve Document'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>,
                    document.body
                )}
            </AnimatePresence>

            {/* UPLOAD MODAL ENHANCED */}
            <AnimatePresence>
                {showUploadModal && typeof document !== 'undefined' && createPortal(
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
                            className="glass-panel shadow-elevation-3 w-full max-w-lg overflow-hidden flex flex-col"
                        >
                            <div className="p-5 border-b border-[var(--md-sys-color-outline)] flex items-center justify-between bg-indigo-600 text-white rounded-t-3xl">
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

                            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-auto">
                                {user?.role !== 'admin' && (
                                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-400 text-xs">
                                        <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
                                        <p><strong>Security Notice:</strong> All uploaded files must be approved by an Administrator before they are accessible to others.</p>
                                    </div>
                                )}

                                {/* Drop / select area */}
                                <div>
                                    <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1 uppercase">Document File *</label>
                                    <div className="relative border-2 border-dashed border-[var(--md-sys-color-outline)] rounded-xl p-4 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
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
                                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                                                    <FileText size={20} />
                                                </div>
                                                <p className="font-bold text-[var(--md-sys-color-on-surface)] text-xs break-all">{selectedFile.name}</p>
                                                <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-0.5">{formatBytes(selectedFile.size)}</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 text-[var(--md-sys-color-secondary)] rounded-full flex items-center justify-center mb-2">
                                                    <Upload size={20} />
                                                </div>
                                                <p className="font-bold text-[var(--md-sys-color-on-surface)] text-xs">Click to browse files</p>
                                                <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-0.5">PDF, DOC, XLS, TXT (Max {uploadLimitMB}MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Title field */}
                                <div>
                                    <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1 uppercase">Document Title *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Week 4 Introduction to Solar"
                                        className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow text-[var(--md-sys-color-on-surface)] text-xs transition-all font-google font-bold"
                                        value={uploadTitle}
                                        onChange={e => setUploadTitle(e.target.value)}
                                    />
                                </div>

                                {/* Description field */}
                                <div>
                                    <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1 uppercase">Description / Notes</label>
                                    <textarea
                                        placeholder="Provide a quick synopsis of the document contents..."
                                        rows={3}
                                        className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow text-[var(--md-sys-color-on-surface)] text-xs transition-all font-google resize-none"
                                        value={uploadDescription}
                                        onChange={e => setUploadDescription(e.target.value)}
                                    />
                                </div>

                                {/* Academic Term and Tags */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1 uppercase">Academic Term</label>
                                        <select
                                            value={uploadTerm}
                                            onChange={e => setUploadTerm(e.target.value)}
                                            className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-bold"
                                        >
                                            <option value="none">Unassigned</option>
                                            <option value="1">Term 1</option>
                                            <option value="2">Term 2</option>
                                            <option value="3">Term 3</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1 uppercase">Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            placeholder="Solar, Exam, Guides"
                                            className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs"
                                            value={uploadTags}
                                            onChange={e => setUploadTags(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Category Select Cards */}
                                <div>
                                    <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1.5 uppercase">Category *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => setUploadCategory(cat.value as any)}
                                                className={clsx(
                                                    "px-3 py-2 rounded-xl border font-bold text-xs transition-all text-left flex items-center gap-2",
                                                    uploadCategory === cat.value
                                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm"
                                                        : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]"
                                                )}
                                            >
                                                {React.createElement(cat.icon, { size: 14 })}
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        disabled={isUploading}
                                        onClick={() => setShowUploadModal(false)}
                                        className="flex-1 px-4 py-2.5 border border-[var(--md-sys-color-outline)] rounded-xl font-bold hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-xs transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!selectedFile || !uploadTitle || isUploading}
                                        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg active:scale-[0.98] text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...
                                            </>
                                        ) : (
                                            <>Upload Securely</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>
        </div>
    );
}
