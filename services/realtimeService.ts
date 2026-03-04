/**
 * PRISM Real-Time Sync Service
 * 
 * Manages Supabase Realtime subscriptions for live data updates.
 * This notifies the client automatically when another user (or another tab)
 * modifies data, ensuring all clients stay perfectly in sync.
 * 
 * Also provides Broadcast-based typing indicators so users can see
 * who is currently typing in a channel — no DB writes needed.
 */

import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Define the payload structure for our callbacks
export type RealtimePayload<T> = {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: T | null;
    old: Partial<T> | null;
    table: string;
};

// Typing event payload for Broadcast
export type TypingEvent = {
    userId: string;
    userName: string;
    channelId: string;
    isTyping: boolean;
};

// Store active channels so we can unsubscribe if needed
const activeChannels: Record<string, RealtimeChannel> = {};
const typingChannels: Record<string, RealtimeChannel> = {};

// Track registered callbacks so we can detect when a new callback replaces an old one
const activeCallbacks: Record<string, Function> = {};

// Health monitor interval ID
let healthMonitorId: ReturnType<typeof setInterval> | null = null;

/**
 * Check if a cached channel is still healthy (subscribed).
 * Supabase channels expose a `.state` property we can inspect.
 */
const isChannelHealthy = (channel: RealtimeChannel): boolean => {
    try {
        const state = (channel as any).state ?? (channel as any)._state;
        if (!state) return true;
        return ['joined', 'SUBSCRIBED'].includes(state);
    } catch {
        return true;
    }
};

/**
 * Generic subscriber for any table.
 * IMPORTANT: Always tears down + re-creates the channel when called again
 * with a new callback, to prevent stale closures from firing.
 */
export const subscribeToTable = <T extends Record<string, any>>(
    tableName: string,
    callback: (payload: RealtimePayload<T>) => void,
    filter?: string
): RealtimeChannel => {
    const channelName = filter ? `prism-db:${tableName}:${filter}` : `prism-db:${tableName}`;

    // If the channel exists but callback changed, tear it down to avoid stale closures
    if (activeChannels[channelName]) {
        if (activeCallbacks[channelName] === callback && isChannelHealthy(activeChannels[channelName])) {
            return activeChannels[channelName]; // Same callback, healthy channel — reuse
        }
        // Either callback changed or channel is stale — remove and re-create
        supabase.removeChannel(activeChannels[channelName]).catch(() => { });
        delete activeChannels[channelName];
        delete activeCallbacks[channelName];
    }

    let channel = supabase.channel(channelName);
    const filterConfig = filter
        ? { event: '*', schema: 'public', table: tableName, filter }
        : { event: '*', schema: 'public', table: tableName };

    channel = channel
        .on(
            'postgres_changes',
            filterConfig as any,
            (payload) => {
                callback(payload as unknown as RealtimePayload<T>);
            }
        )
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log(`[Realtime] ✓ Subscribed to ${channelName}`);
            } else if (status === 'CHANNEL_ERROR') {
                console.error(`[Realtime] ✗ Error on ${channelName}:`, err);
                delete activeChannels[channelName];
                delete activeCallbacks[channelName];
            } else if (status === 'TIMED_OUT') {
                console.warn(`[Realtime] ⏱ Timed out on ${channelName}`);
                delete activeChannels[channelName];
                delete activeCallbacks[channelName];
            }
        });

    activeChannels[channelName] = channel;
    activeCallbacks[channelName] = callback;
    return channel;
};

/**
 * Unsubscribe from a specific channel
 */
export const unsubscribe = async (channelName: string): Promise<void> => {
    if (activeChannels[channelName]) {
        await supabase.removeChannel(activeChannels[channelName]);
        delete activeChannels[channelName];
        delete activeCallbacks[channelName];
    }
};

/**
 * Unsubscribe from all active channels and stop the health monitor
 */
export const unsubscribeAll = async (): Promise<void> => {
    stopHealthMonitor();
    await supabase.removeAllChannels();
    Object.keys(activeChannels).forEach(key => delete activeChannels[key]);
    Object.keys(activeCallbacks).forEach(key => delete activeCallbacks[key]);
    Object.keys(typingChannels).forEach(key => delete typingChannels[key]);
};

/**
 * Start a recurring health check that auto-recovers dropped channels.
 * Checks every 30 seconds. If a channel is unhealthy it is torn down;
 * the next data-sync cycle will re-subscribe it.
 */
export const startHealthMonitor = (): void => {
    if (healthMonitorId) return; // Already running
    healthMonitorId = setInterval(() => {
        for (const [name, channel] of Object.entries(activeChannels)) {
            if (!isChannelHealthy(channel)) {
                console.warn(`[Realtime] Health check: ${name} is unhealthy, removing for re-subscribe`);
                supabase.removeChannel(channel).catch(() => { });
                delete activeChannels[name];
                delete activeCallbacks[name];
            }
        }
    }, 30_000);
};

/**
 * Stop the health monitor.
 */
export const stopHealthMonitor = (): void => {
    if (healthMonitorId) {
        clearInterval(healthMonitorId);
        healthMonitorId = null;
    }
};

// ==========================================
// SPECIFIC APP SUBSCRIPTIONS
// ==========================================

export const subscribeToStudents = (callback: (payload: RealtimePayload<any>) => void) => {
    return subscribeToTable('students', callback);
};

export const subscribeToSchedule = (callback: (payload: RealtimePayload<any>) => void) => {
    return subscribeToTable('schedule_slots', callback);
};

export const subscribeToChatMessages = (channelId: string | null, callback: (payload: RealtimePayload<any>) => void) => {
    const filter = channelId ? `channel_id=eq.${channelId}` : undefined;
    return subscribeToTable('chat_messages', callback, filter);
};

export const subscribeToChatChannels = (callback: (payload: RealtimePayload<any>) => void) => {
    return subscribeToTable('chat_channels', callback);
};

export const subscribeToLibrary = (callback: (payload: RealtimePayload<any>) => void) => {
    return subscribeToTable('library_resources', callback);
};

export const subscribeToFeePayments = (callback: (payload: RealtimePayload<any>) => void) => {
    return subscribeToTable('fee_payments', callback);
};

// ==========================================
// TYPING INDICATOR (Broadcast Channel)
// ==========================================
// Uses Supabase Broadcast — ephemeral WebSocket events, no DB writes.
// Each chat channel gets its own typing broadcast channel.

/**
 * Create (or reuse) a Broadcast channel for typing indicators in a specific chat channel.
 * Returns a cleanup function.
 */
export const createTypingChannel = (
    chatChannelId: string,
    currentUserId: string,
    onTypingEvent: (event: TypingEvent) => void
): (() => void) => {
    const broadcastName = `prism-typing:${chatChannelId}`;

    // Clean up any existing channel for this chat first
    if (typingChannels[broadcastName]) {
        supabase.removeChannel(typingChannels[broadcastName]).catch(() => { });
        delete typingChannels[broadcastName];
    }

    const channel = supabase.channel(broadcastName, {
        config: { broadcast: { self: false } } // Don't receive own broadcasts
    });

    channel
        .on('broadcast', { event: 'typing' }, (payload) => {
            const data = payload.payload as TypingEvent;
            // Ignore own events (safety check)
            if (data.userId === currentUserId) return;
            onTypingEvent(data);
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`[Typing] Subscribed to typing channel for ${chatChannelId}`);
            }
        });

    typingChannels[broadcastName] = channel;

    // Return cleanup function
    return () => {
        if (typingChannels[broadcastName]) {
            supabase.removeChannel(typingChannels[broadcastName]).catch(() => { });
            delete typingChannels[broadcastName];
        }
    };
};

/**
 * Broadcast a typing event to other users in the same chat channel.
 */
export const broadcastTyping = (
    chatChannelId: string,
    userId: string,
    userName: string,
    isTyping: boolean = true
): void => {
    const broadcastName = `prism-typing:${chatChannelId}`;
    const channel = typingChannels[broadcastName];
    if (!channel) return;

    channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
            userId,
            userName,
            channelId: chatChannelId,
            isTyping
        } as TypingEvent
    }).catch((err) => {
        console.warn('[Typing] Failed to broadcast typing event:', err);
    });
};

/**
 * Clean up a specific typing channel.
 */
export const cleanupTypingChannel = (chatChannelId: string): void => {
    const broadcastName = `prism-typing:${chatChannelId}`;
    if (typingChannels[broadcastName]) {
        supabase.removeChannel(typingChannels[broadcastName]).catch(() => { });
        delete typingChannels[broadcastName];
    }
};
