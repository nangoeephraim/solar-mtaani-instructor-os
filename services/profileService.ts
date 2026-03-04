/**
 * PRISM Profile Service
 *
 * Handles user profile CRUD: avatar upload/removal, profile field updates,
 * and fetching profile data from the `profiles` table.
 */

import { supabase } from './supabase';
import { uploadFile, deleteFile, listFiles } from './cloudStorageService';

// ==========================================
// TYPES
// ==========================================

export interface ProfileData {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    phone: string | null;
    department: string | null;
    bio: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProfileUpdatePayload {
    name?: string;
    phone?: string;
    department?: string;
    bio?: string;
    avatarUrl?: string;
}

// ==========================================
// FETCH
// ==========================================

/**
 * Fetch a single user's full profile from the `profiles` table.
 */
export async function fetchProfile(userId: string): Promise<ProfileData | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatarUrl: data.avatar_url || null,
        phone: data.phone || null,
        department: data.department || null,
        bio: data.bio || null,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
}

/**
 * Fetch all active users (except the current user) for the Direct Message directory.
 */
export async function fetchActiveUsers(currentUserId: string): Promise<ProfileData[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (error || !data) return [];

    return data.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        avatarUrl: row.avatar_url || null,
        phone: row.phone || null,
        department: row.department || null,
        bio: row.bio || null,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}

/**
 * Fetch avatar URLs for a list of user IDs.
 * Returns a map of userId → avatarUrl (only includes users who have one).
 */
export async function fetchAvatarMap(userIds: string[]): Promise<Record<string, string>> {
    if (userIds.length === 0) return {};

    const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds)
        .not('avatar_url', 'is', null);

    if (error || !data) return {};

    const map: Record<string, string> = {};
    for (const row of data) {
        if (row.avatar_url) map[row.id] = row.avatar_url;
    }
    return map;
}

// ==========================================
// UPDATE
// ==========================================

/**
 * Update the current user's profile fields via RPC.
 */
export async function updateProfile(payload: ProfileUpdatePayload): Promise<boolean> {
    const { error } = await supabase.rpc('update_own_profile', {
        p_name: payload.name ?? null,
        p_phone: payload.phone ?? null,
        p_department: payload.department ?? null,
        p_bio: payload.bio ?? null,
        p_avatar_url: payload.avatarUrl ?? null,
    });

    if (error) {
        console.error('Failed to update profile:', error.message);
        return false;
    }
    return true;
}

// ==========================================
// AVATAR
// ==========================================

/**
 * Upload a profile avatar for the current user.
 * Stores in student_photos bucket under avatars/ prefix.
 * Returns the public URL.
 */
export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
    // Remove old avatar first (if any)
    try {
        await removeAvatarFiles(userId);
    } catch { /* ignore */ }

    const ext = file.name.split('.').pop() || 'jpg';
    const result = await uploadFile('student_photos', file, {
        pathPrefix: 'avatars',
        fileName: `${userId}.${ext}`,
        upsert: true,
    });

    // Also update the profiles table
    await supabase
        .from('profiles')
        .update({ avatar_url: result.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

    return result.publicUrl;
}

/**
 * Remove the current user's avatar photo and clear the DB field.
 */
export async function removeProfileAvatar(userId: string): Promise<void> {
    await removeAvatarFiles(userId);

    // Clear DB via RPC
    await supabase.rpc('clear_own_avatar');
}

/**
 * Internal: delete avatar files from storage for a user.
 */
async function removeAvatarFiles(userId: string): Promise<void> {
    const files = await listFiles('student_photos', 'avatars');
    const matching = files.filter(f => f.name.startsWith(userId));
    if (matching.length > 0) {
        for (const f of matching) {
            await deleteFile('student_photos', `avatars/${f.name}`);
        }
    }
}
