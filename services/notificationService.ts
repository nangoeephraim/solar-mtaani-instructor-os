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
            console.warn('This browser does not support desktop notification');
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
     */
    showLocalNotification(title: string, options?: NotificationOptions) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/logo.png',
                ...options
            });
        }
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
