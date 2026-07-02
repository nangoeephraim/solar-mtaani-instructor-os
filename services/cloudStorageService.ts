/**
 * PRISM Cloud Storage Service
 * 
 * Reusable utility for interacting with Supabase Storage buckets.
 * Handles uploads, downloads, signed URLs, file deletion, and listing.
 * 
 * Buckets:
 *   - library_documents  → Lesson plans, guides, notes
 *   - student_photos     → Student profile images
 *   - certificates       → Generated certificates/reports
 *   - backups            → JSON database backup snapshots
 */

import { supabase } from './supabase';
import { logSecurityEvent } from './security';
import { getAuthHeaders } from './authHeaders';

// ==========================================
// TYPES
// ==========================================

export type StorageBucket = 'library_documents' | 'student_photos' | 'certificates' | 'backups';

export interface UploadOptions {
    /** Cache-Control header (seconds). Default: 3600 */
    cacheControl?: string;
    /** Overwrite existing file at the same path? Default: false */
    upsert?: boolean;
    /** Custom content type. Auto-detected if omitted. */
    contentType?: string;
}

export interface UploadResult {
    path: string;
    publicUrl: string;
    fullPath: string;
}

export interface StorageFileInfo {
    name: string;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    size?: number;
    metadata?: Record<string, any>;
}

// File size limits per bucket (in bytes)
const BUCKET_SIZE_LIMITS: Record<StorageBucket, number> = {
    library_documents: 20 * 1024 * 1024,  // 20MB (matches Supabase bucket)
    student_photos: 2 * 1024 * 1024,  //  2MB
    certificates: 10 * 1024 * 1024,  // 10MB
    backups: 50 * 1024 * 1024,  // 50MB
};

// Allowed MIME types per bucket
const BUCKET_ALLOWED_TYPES: Record<StorageBucket, string[]> = {
    library_documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'audio/webm',
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/mp4',
        'audio/aac',
        'video/mp4',
        'video/webm',
        'video/quicktime',
    ],
    student_photos: [
        'image/jpeg',
        'image/png',
        'image/webp',
    ],
    certificates: [
        'application/pdf',
        'image/png',
        'image/jpeg',
    ],
    backups: [
        'application/json',
        'text/plain',
    ],
};


// ==========================================
// VALIDATION
// ==========================================

/**
 * Validate a file before upload (size and type).
 * Returns an error message string if invalid, or null if OK.
 */
export const validateFile = (
    file: File | Blob,
    bucket: StorageBucket
): string | null => {
    const maxSize = BUCKET_SIZE_LIMITS[bucket];
    if (file.size > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
        return `File is too large. Maximum size for this bucket is ${maxMB}MB.`;
    }

    const allowedTypes = BUCKET_ALLOWED_TYPES[bucket];
    // Validate MIME type for File objects (Blobs from MediaRecorder skip this)
    const fileType = (file instanceof File ? file.type : (file as any).type) || '';
    if (fileType && allowedTypes.length > 0) {
        // Accept if exact match OR if the MIME prefix matches a known media category
        const isExactMatch = allowedTypes.includes(fileType);
        const isMediaType = fileType.startsWith('image/') || fileType.startsWith('audio/') || fileType.startsWith('video/');
        const bucketAcceptsMedia = bucket === 'library_documents';
        
        if (!isExactMatch && !(isMediaType && bucketAcceptsMedia)) {
            return `File type "${fileType}" is not allowed. Accepted types: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`;
        }
    }

    return null;
};

/**
 * Generate a unique, sanitized file path for storage.
 */
const generateFilePath = (fileName: string, prefix?: string): string => {
    const sanitized = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}_${sanitized}`;
    return prefix ? `${prefix}/${uniqueName}` : uniqueName;
};


// ==========================================
// CORE OPERATIONS
// ==========================================

/**
 * Upload a file to a Vercel Blob storage.
 * Validates file size and type before uploading.
 */
export const uploadFile = async (
    bucket: StorageBucket,
    file: File | Blob,
    options?: UploadOptions & { fileName?: string; pathPrefix?: string }
): Promise<UploadResult> => {
    // Validate
    const validationError = validateFile(file, bucket);
    if (validationError) {
        throw new Error(validationError);
    }

    const fileName = options?.fileName || (file instanceof File ? file.name : 'file');
    const pathPrefix = options?.pathPrefix || '';

    const headers = await getAuthHeaders({
        'x-filename': fileName,
        'x-bucket': bucket,
        'x-path-prefix': pathPrefix,
        'Content-Type': file.type || 'application/octet-stream'
    });

    const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: file
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload failed: ${errText || response.statusText}`);
    }

    const data = await response.json();

    // Log the upload event
    await logSecurityEvent({
        eventType: 'FILE_UPLOADED',
        severity: 'info',
        resourceType: bucket,
        details: { fileName, path: data.path, size: file.size },
    });

    return {
        path: data.path,
        publicUrl: data.publicUrl,
        fullPath: data.fullPath || data.path
    };
};

/**
 * Download a file from Vercel Blob. Returns a Blob.
 */
export const downloadFile = async (
    bucket: StorageBucket,
    path: string
): Promise<Blob> => {
    const url = path.startsWith('http') ? path : getPublicUrl(bucket, path);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
    }
    return response.blob();
};

/**
 * Generate a signed URL. Since Vercel Blobs are public, returns the public URL directly.
 */
export const getSignedUrl = async (
    bucket: StorageBucket,
    path: string,
    expiresIn: number = 3600
): Promise<string> => {
    return path.startsWith('http') ? path : getPublicUrl(bucket, path);
};

/**
 * Get the public URL for a file.
 */
export const getPublicUrl = (bucket: StorageBucket, path: string): string => {
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

/**
 * Delete a file from Vercel Blob.
 */
export const deleteFile = async (
    bucket: StorageBucket,
    path: string
): Promise<void> => {
    if (!path.startsWith('http')) {
        // Fallback for old Supabase path deletions
        await supabase.storage.from(bucket).remove([path]);
        return;
    }

    const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
    const response = await fetch('/api/delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ urls: [path] })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Delete failed: ${errText || response.statusText}`);
    }

    await logSecurityEvent({
        eventType: 'FILE_DELETED',
        severity: 'info',
        resourceType: bucket,
        details: { path },
    });
};

/**
 * Delete multiple files from Vercel Blob.
 */
export const deleteFiles = async (
    bucket: StorageBucket,
    paths: string[]
): Promise<void> => {
    if (paths.length === 0) return;

    // Filter out Supabase vs Vercel paths
    const vercelUrls = paths.filter(p => p.startsWith('http'));
    const supabasePaths = paths.filter(p => !p.startsWith('http'));

    if (supabasePaths.length > 0) {
        await supabase.storage.from(bucket).remove(supabasePaths);
    }

    if (vercelUrls.length > 0) {
        const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers,
            body: JSON.stringify({ urls: vercelUrls })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Bulk delete failed: ${errText || response.statusText}`);
        }
    }
};

/**
 * List files in Vercel Blob storage.
 */
export const listFiles = async (
    bucket: StorageBucket,
    prefix?: string,
    options?: { limit?: number; offset?: number; sortBy?: { column: string; order: 'asc' | 'desc' } }
): Promise<StorageFileInfo[]> => {
    const headers = await getAuthHeaders();
    const queryPrefix = `${bucket}/${prefix || ''}`;
    
    const response = await fetch(`/api/list?prefix=${encodeURIComponent(queryPrefix)}`, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`List failed: ${errText || response.statusText}`);
    }

    const { blobs } = await response.json();
    return (blobs || []).map((blob: any) => {
        const name = blob.pathname.substring(blob.pathname.lastIndexOf('/') + 1);
        return {
            name,
            id: blob.url,
            createdAt: blob.uploadedAt,
            updatedAt: blob.uploadedAt,
            size: blob.size,
            metadata: {},
        };
    });
};


// ==========================================
// CONVENIENCE: Student Photo Operations
// ==========================================

/**
 * Upload a student's profile photo. Replaces the old one if it exists.
 * @returns The public URL of the uploaded photo.
 */
export const uploadStudentPhoto = async (
    studentId: string,
    file: File
): Promise<string> => {
    const result = await uploadFile('student_photos', file, {
        pathPrefix: 'profiles',
        fileName: `${studentId}.${file.name.split('.').pop() || 'jpg'}`,
        upsert: true, // Replace existing photo
    });
    return result.publicUrl;
};

/**
 * Delete a student's profile photo.
 */
export const deleteStudentPhoto = async (studentId: string): Promise<void> => {
    // We don't know the exact extension, so list and delete
    const files = await listFiles('student_photos', 'profiles');
    const matchingFiles = files.filter(f => f.name.startsWith(studentId));
    if (matchingFiles.length > 0) {
        await deleteFiles('student_photos', matchingFiles.map(f => `profiles/${f.name}`));
    }
};


// ==========================================
// CONVENIENCE: Backup Operations
// ==========================================

/**
 * Upload a JSON backup to cloud storage.
 * @returns The path of the uploaded backup.
 */
export const uploadBackup = async (jsonString: string): Promise<string> => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup_${timestamp}.json`;
    const blob = new Blob([jsonString], { type: 'application/json' });

    const result = await uploadFile('backups', blob, {
        fileName,
        upsert: false,
    });
    return result.path;
};

/**
 * Download a backup file and return its JSON content.
 */
export const downloadBackup = async (path: string): Promise<string> => {
    const blob = await downloadFile('backups', path);
    return blob.text();
};

/**
 * List all available backups, newest first.
 */
export const listBackups = async (): Promise<StorageFileInfo[]> => {
    return listFiles('backups', '', {
        sortBy: { column: 'created_at', order: 'desc' },
    });
};
