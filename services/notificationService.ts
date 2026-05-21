/**
 * PRISM Notification Service v2.0
 * 
 * Enhanced notification engine with:
 * - Service Worker bridge for background notifications
 * - Category-based notification routing (payment, schedule, message, student)
 * - Notification permission management with persistent tracking
 * - Realtime event → native notification bridge
 * - Sound and vibration support
 */

import { supabase } from './supabase';

export type NotificationCategory = 'payment' | 'schedule' | 'message' | 'student' | 'general';

export interface SendNotificationParams {
    userId?: string;
    title: string;
    body: string;
    type?: 'push' | 'sms' | 'email';
    payload?: Record<string, any>;
}

export interface LocalNotificationOptions {
    body: string;
    category?: NotificationCategory;
    tag?: string;
    url?: string;
    data?: Record<string, any>;
    silent?: boolean;
}

class NotificationService {
    private _permissionGranted: boolean = false;
    private _swReady: boolean = false;

    constructor() {
        this._permissionGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
        // Warm up SW readiness check
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(() => { this._swReady = true; }).catch(() => {});
        }
    }

    /** Whether notification permission is currently granted */
    get isPermissionGranted(): boolean {
        return this._permissionGranted;
    }

    /**
     * Request permission from the user to show browser push notifications.
     * Returns true if granted (either now or previously).
     */
    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('[Notifications] This browser does not support desktop notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            this._permissionGranted = true;
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this._permissionGranted = permission === 'granted';
            return this._permissionGranted;
        }

        return false;
    }

    /**
     * Show a local browser notification immediately.
     * Uses Service Worker registration.showNotification when available to support PWA/mobile environments.
     * Falls back to window.Notification for older browsers.
     */
    async showLocalNotification(title: string, options?: NotificationOptions) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            // Prefer Service Worker notifications — they persist even when tab is backgrounded
            if ('serviceWorker' in navigator) {
                try {
                    const reg = await navigator.serviceWorker.ready;
                    reg.showNotification(title, {
                        icon: '/logo.png',
                        badge: '/logo.png',
                        ...options
                    });
                    return;
                } catch (e) {
                    console.error('[Notifications] SW notification failed, falling back:', e);
                }
            }

            // Fallback to normal window Notification
            new Notification(title, {
                icon: '/logo.png',
                ...options
            });
        }
    }

    /**
     * Bridge a realtime event to the Service Worker for a background notification.
     * This is the primary method used by the realtime handlers in App.tsx.
     * 
     * The Service Worker will apply the correct notification template (actions, vibration)
     * based on the category.
     */
    async notifyViaServiceWorker(title: string, opts: LocalNotificationOptions): Promise<boolean> {
        if (!this._permissionGranted) return false;

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title,
                body: opts.body,
                category: opts.category || 'general',
                tag: opts.tag,
                url: opts.url || '/',
                data: opts.data,
                silent: opts.silent || false
            });
            return true;
        }

        // Fallback: show directly if no SW controller
        await this.showLocalNotification(title, {
            body: opts.body,
            tag: opts.tag,
            data: { url: opts.url || '/', ...(opts.data || {}) }
        });
        return true;
    }

    /**
     * Convenience: Notify about a new/updated payment
     */
    async notifyPayment(studentName: string, amount: number, status: string) {
        const statusLabel = status === 'completed' ? '✅ Confirmed' : status === 'pending' ? '⏳ Pending' : `📋 ${status}`;
        return this.notifyViaServiceWorker(
            `Payment ${statusLabel}`,
            {
                body: `KSh ${amount.toLocaleString()} from ${studentName}`,
                category: 'payment',
                url: '/?view=fees',
                tag: `payment-${Date.now()}`
            }
        );
    }

    /**
     * Convenience: Notify about a schedule change
     */
    async notifyScheduleChange(action: 'added' | 'updated' | 'cancelled', subject: string, grade: string) {
        const emoji = action === 'added' ? '📅' : action === 'updated' ? '🔄' : '❌';
        return this.notifyViaServiceWorker(
            `${emoji} Schedule ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            {
                body: `Grade ${grade} — ${subject}`,
                category: 'schedule',
                url: '/?view=schedule',
                tag: `schedule-${Date.now()}`
            }
        );
    }

    /**
     * Convenience: Notify about a new chat message (when not viewing communications)
     */
    async notifyMessage(senderName: string, channelName: string, preview: string) {
        return this.notifyViaServiceWorker(
            `💬 ${senderName}`,
            {
                body: `#${channelName}: ${preview}`,
                category: 'message',
                url: '/?view=communications',
                tag: `message-${channelName}-${Date.now()}`
            }
        );
    }

    /**
     * Convenience: Notify about student changes
     */
    async notifyStudent(action: 'enrolled' | 'updated' | 'removed', studentName: string) {
        return this.notifyViaServiceWorker(
            `Student ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            {
                body: studentName,
                category: 'student',
                url: '/?view=students',
                tag: `student-${Date.now()}`
            }
        );
    }

    /**
     * Schedule a timed mock notification via Service Worker in the background.
     * This will arrive even if the app goes to the background or the screen locks.
     */
    scheduleTestNotification(title: string, body: string, delayMs: number = 3000): boolean {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SCHEDULE_NOTIFICATION',
                title,
                body,
                delayMs,
                url: window.location.href,
                icon: '/logo.png'
            });
            return true;
        }
        return false;
    }

    /**
     * Invoke the Supabase Edge Function to send a notification to a specific user.
     * Use this when you want to alert another user, or send an SMS.
     */
    async sendRemoteNotification(params: SendNotificationParams): Promise<boolean> {
        try {
            const { data, error } = await supabase.functions.invoke('send-notification', {
                body: params
            });

            if (error) throw error;

            console.log('[Notifications] Remote notification dispatched:', data);
            return true;
        } catch (error) {
            console.error('[Notifications] Failed to send remote notification:', error);
            return false;
        }
    }

    /**
     * Subscribe to notifications channel for realtime remote alerts meant for this user.
     */
    subscribeToUserNotifications(userId: string, onNotify: (payload: any) => void) {
        const channel = supabase.channel(`user-notifications-${userId}`)
            .on('broadcast', { event: 'notification' }, (payload) => {
                const { title, body, category } = payload.payload;
                this.notifyViaServiceWorker(title, { body, category: category || 'general' });
                onNotify(payload.payload);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    /**
     * Listen for Service Worker messages (e.g., NOTIFICATION_NAVIGATE).
     * Call this once during app initialization.
     */
    listenForServiceWorkerMessages(onNavigate: (view: string, data?: any) => void): () => void {
        if (!('serviceWorker' in navigator)) return () => {};

        const handler = (event: MessageEvent) => {
            const msg = event.data;
            if (msg?.type === 'NOTIFICATION_NAVIGATE') {
                onNavigate(msg.view || 'dashboard', msg.data);
            }
        };

        navigator.serviceWorker.addEventListener('message', handler);
        return () => {
            navigator.serviceWorker.removeEventListener('message', handler);
        };
    }
}

export const notificationService = new NotificationService();
