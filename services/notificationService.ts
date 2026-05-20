/**
 * PRISM Notification Service
 * 
 * Handles client-side browser push notifications using the web Notification API.
 * Also provides functions to call the Supabase Edge Function to send push/sms
 * out to other users/devices.
 */

import { supabase } from './supabase';

export interface SendNotificationParams {
    userId?: string;
    title: string;
    body: string;
    type?: 'push' | 'sms' | 'email';
    payload?: Record<string, any>;
}

class NotificationService {
    /**
     * Request permission from the user to show browser push notifications.
     */
    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    /**
     * Show a local browser notification immediately.
     * Uses Service Worker registration.showNotification when available to support PWA/mobile environments.
     */
    async showLocalNotification(title: string, options?: NotificationOptions) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            // Check if service worker is active and ready
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
                    console.error('Failed to show notification via service worker, falling back to window Notification:', e);
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

            console.log('Notification dispatched:', data);
            return true;
        } catch (error) {
            console.error('Failed to send remote notification:', error);
            return false;
        }
    }

    /**
     * Subscribe to notifications channel for realtime remote alerts meant for this user.
     */
    subscribeToUserNotifications(userId: string, onNotify: (payload: any) => void) {
        const channel = supabase.channel(`user-notifications-${userId}`)
            .on('broadcast', { event: 'notification' }, (payload) => {
                const { title, body } = payload.payload;
                this.showLocalNotification(title, { body });
                onNotify(payload.payload);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
}

export const notificationService = new NotificationService();
