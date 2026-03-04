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
    library_documents: 10 * 1024 * 1024,  // 10MB
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
    if (file instanceof File && allowedTypes.length > 0) {
        const fileType = file.type || 'application/octet-stream';
        if (!allowedTypes.includes(fileType)) {
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
 * Upload a file to a Supabase Storage bucket.
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
    const filePath = generateFilePath(fileName, options?.pathPrefix);

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: options?.cacheControl || '3600',
            upsert: options?.upsert || false,
            contentType: options?.contentType,
        });

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    // Log the upload event
    await logSecurityEvent({
        eventType: 'FILE_UPLOADED',
        severity: 'info',
        resourceType: bucket,
        details: { fileName, path: data.path, size: file.size },
    });

    return {
        path: data.path,
        publicUrl: urlData.publicUrl,
        fullPath: data.fullPath || `${bucket}/${data.path}`,
    };
};

/**
 * Download a file from a bucket. Returns a Blob.
 */
export const downloadFile = async (
    bucket: StorageBucket,
    path: string
): Promise<Blob> => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

    if (error) {
        throw new Error(`Download failed: ${error.message}`);
    }
    return data;
};

/**
 * Generate a signed URL for time-limited access to a private file.
 * @param expiresIn - Seconds until the URL expires (default: 3600 = 1 hour)
 */
export const getSignedUrl = async (
    bucket: StorageBucket,
    path: string,
    expiresIn: number = 3600
): Promise<string> => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

    if (error) {
        throw new Error(`Signed URL generation failed: ${error.message}`);
    }
    return data.signedUrl;
};

/**
 * Get the public URL for a file (only works for public buckets).
 */
export const getPublicUrl = (bucket: StorageBucket, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

/**
 * Delete a file from a bucket.
 */
export const deleteFile = async (
    bucket: StorageBucket,
    path: string
): Promise<void> => {
    const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

    if (error) {
        throw new Error(`Delete failed: ${error.message}`);
    }

    await logSecurityEvent({
        eventType: 'FILE_DELETED',
        severity: 'info',
        resourceType: bucket,
        details: { path },
    });
};

/**
 * Delete multiple files from a bucket.
 */
export const deleteFiles = async (
    bucket: StorageBucket,
    paths: string[]
): Promise<void> => {
    if (paths.length === 0) return;

    const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);

    if (error) {
        throw new Error(`Bulk delete failed: ${error.message}`);
    }
};

/**
 * List files in a bucket directory.
 */
export const listFiles = async (
    bucket: StorageBucket,
    prefix?: string,
    options?: { limit?: number; offset?: number; sortBy?: { column: string; order: 'asc' | 'desc' } }
): Promise<StorageFileInfo[]> => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .list(prefix || '', {
            limit: options?.limit || 100,
            offset: options?.offset || 0,
            sortBy: options?.sortBy || { column: 'created_at', order: 'desc' },
        });

    if (error) {
        throw new Error(`List failed: ${error.message}`);
    }

    return (data || []).map(item => ({
        name: item.name,
        id: item.id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        size: item.metadata?.size,
        metadata: item.metadata,
    }));
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
