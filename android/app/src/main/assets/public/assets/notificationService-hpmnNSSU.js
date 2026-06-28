import { a9 as supabase } from "./index-D-ESeA_n.js";
class NotificationService {
  constructor() {
    this._permissionGranted = false;
    this._swReady = false;
    this._permissionGranted = typeof Notification !== "undefined" && Notification.permission === "granted";
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => {
        this._swReady = true;
      }).catch(() => {
      });
    }
  }
  /** Whether notification permission is currently granted */
  get isPermissionGranted() {
    return this._permissionGranted;
  }
  /**
   * Request permission from the user to show browser push notifications.
   * Returns true if granted (either now or previously).
   */
  async requestPermission() {
    if (!("Notification" in window)) {
      console.warn("[Notifications] This browser does not support desktop notifications");
      return false;
    }
    if (Notification.permission === "granted") {
      this._permissionGranted = true;
      return true;
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this._permissionGranted = permission === "granted";
      return this._permissionGranted;
    }
    return false;
  }
  /**
   * Show a local browser notification immediately.
   * Uses Service Worker registration.showNotification when available to support PWA/mobile environments.
   * Falls back to window.Notification for older browsers.
   */
  async showLocalNotification(title, options) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, {
            icon: "/logo.png",
            badge: "/logo.png",
            ...options
          });
          return;
        } catch (e) {
          console.error("[Notifications] SW notification failed, falling back:", e);
        }
      }
      new Notification(title, {
        icon: "/logo.png",
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
  async notifyViaServiceWorker(title, opts) {
    if (!this._permissionGranted) return false;
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        body: opts.body,
        category: opts.category || "general",
        tag: opts.tag,
        url: opts.url || "/",
        data: opts.data,
        silent: opts.silent || false
      });
      return true;
    }
    await this.showLocalNotification(title, {
      body: opts.body,
      tag: opts.tag,
      data: { url: opts.url || "/", ...opts.data || {} }
    });
    return true;
  }
  /**
   * Convenience: Notify about a new/updated payment
   */
  async notifyPayment(studentName, amount, status) {
    const statusLabel = status === "completed" ? "✅ Confirmed" : status === "pending" ? "⏳ Pending" : `📋 ${status}`;
    return this.notifyViaServiceWorker(
      `Payment ${statusLabel}`,
      {
        body: `KSh ${amount.toLocaleString()} from ${studentName}`,
        category: "payment",
        url: "/?view=fees",
        tag: `payment-${Date.now()}`
      }
    );
  }
  /**
   * Convenience: Notify about a schedule change
   */
  async notifyScheduleChange(action, subject, grade) {
    const emoji = action === "added" ? "📅" : action === "updated" ? "🔄" : "❌";
    return this.notifyViaServiceWorker(
      `${emoji} Schedule ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      {
        body: `Grade ${grade} — ${subject}`,
        category: "schedule",
        url: "/?view=schedule",
        tag: `schedule-${Date.now()}`
      }
    );
  }
  /**
   * Convenience: Notify about a new chat message (when not viewing communications)
   */
  async notifyMessage(senderName, channelName, preview) {
    return this.notifyViaServiceWorker(
      `💬 ${senderName}`,
      {
        body: `#${channelName}: ${preview}`,
        category: "message",
        url: "/?view=communications",
        tag: `message-${channelName}-${Date.now()}`
      }
    );
  }
  /**
   * Convenience: Notify about student changes
   */
  async notifyStudent(action, studentName) {
    return this.notifyViaServiceWorker(
      `Student ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      {
        body: studentName,
        category: "student",
        url: "/?view=students",
        tag: `student-${Date.now()}`
      }
    );
  }
  /**
   * Schedule a timed mock notification via Service Worker in the background.
   * This will arrive even if the app goes to the background or the screen locks.
   */
  scheduleTestNotification(title, body, delayMs = 3e3) {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SCHEDULE_NOTIFICATION",
        title,
        body,
        delayMs,
        url: window.location.href,
        icon: "/logo.png"
      });
      return true;
    }
    return false;
  }
  /**
   * Invoke the Supabase Edge Function to send a notification to a specific user.
   * Use this when you want to alert another user, or send an SMS.
   */
  async sendRemoteNotification(params) {
    try {
      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: params
      });
      if (error) throw error;
      console.log("[Notifications] Remote notification dispatched:", data);
      return true;
    } catch (error) {
      console.error("[Notifications] Failed to send remote notification:", error);
      return false;
    }
  }
  /**
   * Subscribe to notifications channel for realtime remote alerts meant for this user.
   */
  subscribeToUserNotifications(userId, onNotify) {
    const channel = supabase.channel(`user-notifications-${userId}`).on("broadcast", { event: "notification" }, (payload) => {
      const { title, body, category } = payload.payload;
      this.notifyViaServiceWorker(title, { body, category: category || "general" });
      onNotify(payload.payload);
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }
  /**
   * Listen for Service Worker messages (e.g., NOTIFICATION_NAVIGATE).
   * Call this once during app initialization.
   */
  listenForServiceWorkerMessages(onNavigate) {
    if (!("serviceWorker" in navigator)) return () => {
    };
    const handler = (event) => {
      const msg = event.data;
      if ((msg == null ? void 0 : msg.type) === "NOTIFICATION_NAVIGATE") {
        onNavigate(msg.view || "dashboard", msg.data);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }
}
const notificationService = new NotificationService();
export {
  notificationService
};
