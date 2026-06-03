/* ═══════════════════════════════════════════════════════════
   PRISM Instructor OS — Service Worker v2.0
   Enhanced with: notification actions, smart routing,
   stale-while-revalidate caching, and background sync hooks.
   ═══════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'v3';
const CACHE_NAME = `prism-static-cache-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json',
  '/frog_weather.png',
  '/mascot.png',
  '/mascot-build.png',
  '/mascot-chill.png',
  '/mascot_sleeping.png',
  '/mascot_success.png'
];

// ── Install: pre-cache core assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches & claim clients ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: stale-while-revalidate for same-origin & Google Fonts ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSelfOrigin = url.origin === self.location.origin;
  const isGoogleFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');

  if (isSelfOrigin || isGoogleFont) {
    // Skip dev-server files
    if (
      url.pathname.includes('/@vite/') ||
      url.pathname.includes('/@react-refresh') ||
      url.pathname.includes('node_modules') ||
      url.pathname.includes('/ws') ||
      event.request.method !== 'GET'
    ) {
      return;
    }

    // Network-First for Navigation requests (HTML pages / route entry points)
    // This prevents serving stale index.html which may reference deleted assets/chunks,
    // while still providing offline support.
    const isNavigation = event.request.mode === 'navigate' || 
                         url.pathname === '/' || 
                         url.pathname === '/index.html';

    if (isNavigation) {
      event.respondWith(
        fetch(event.request)
          .then((res) => {
            if (res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
            }
            return res;
          })
          .catch(() => {
            return caches.match('/').then((cached) => cached || caches.match('/index.html'));
          })
      );
      return;
    }

    // Stale-While-Revalidate for sub-resources (JS, CSS, images, fonts)
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          // Serve cached immediately; revalidate in background
          fetch(event.request)
            .then((res) => {
              if (res.status === 200) {
                caches.open(CACHE_NAME).then((c) => c.put(event.request, res));
              }
            })
            .catch(() => {});
          return cached;
        }

        return fetch(event.request)
          .then((res) => {
            if (res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
            }
            return res;
          })
          .catch((err) => {
            throw err;
          });
      })
    );
  }
});

/* ═══════════════════════════════════════════════════════════
   PUSH NOTIFICATIONS
   ═══════════════════════════════════════════════════════════ */

// Notification category templates with action buttons
const NOTIFICATION_TEMPLATES = {
  payment: {
    tag: 'prism-payment',
    actions: [
      { action: 'view-payment', title: '💳 View Payment' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true
  },
  schedule: {
    tag: 'prism-schedule',
    actions: [
      { action: 'view-schedule', title: '📅 View Schedule' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    vibrate: [200, 100, 200]
  },
  message: {
    tag: 'prism-message',
    actions: [
      { action: 'view-message', title: '💬 Reply' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    vibrate: [100, 50, 100]
  },
  student: {
    tag: 'prism-student',
    actions: [
      { action: 'view-student', title: '👤 View Student' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    vibrate: [200, 100, 200]
  },
  general: {
    tag: 'prism-general',
    actions: [],
    vibrate: [200, 100, 200]
  }
};

// Map action names to app views for smart routing
const ACTION_VIEW_MAP = {
  'view-payment': 'fees',
  'view-schedule': 'schedule',
  'view-message': 'communications',
  'view-student': 'students'
};

// ── Push Event Handler ──
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notification', body: event.data.text() };
    }
  }

  const category = data.category || 'general';
  const template = NOTIFICATION_TEMPLATES[category] || NOTIFICATION_TEMPLATES.general;

  const title = data.title || 'PRISM Instructor OS Alert';
  const options = {
    body: data.body || 'New update received!',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    tag: data.tag || template.tag,
    data: {
      ...(data.data || {}),
      category,
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: data.actions || template.actions,
    vibrate: template.vibrate,
    requireInteraction: template.requireInteraction || false,
    silent: data.silent || false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification Click Handler (with action button routing) ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notifData = event.notification.data || {};

  // If user clicked "dismiss", just close
  if (action === 'dismiss') return;

  // Determine target URL based on action or default
  let targetView = ACTION_VIEW_MAP[action] || null;
  let urlToOpen;

  if (targetView) {
    urlToOpen = new URL(`/?view=${targetView}`, self.location.origin).href;
  } else if (notifData.url && notifData.url !== '/') {
    urlToOpen = new URL(notifData.url, self.location.origin).href;
  } else if (notifData.category && ACTION_VIEW_MAP[`view-${notifData.category}`]) {
    urlToOpen = new URL(`/?view=${ACTION_VIEW_MAP[`view-${notifData.category}`]}`, self.location.origin).href;
  } else {
    urlToOpen = new URL('/', self.location.origin).href;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to focus an existing window
      for (const client of windowClients) {
        if ('focus' in client) {
          // Post a message to navigate within the SPA
          client.postMessage({
            type: 'NOTIFICATION_NAVIGATE',
            view: targetView || 'dashboard',
            data: notifData
          });
          return client.focus();
        }
      }
      // No window open — open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

/* ═══════════════════════════════════════════════════════════
   MESSAGE HANDLER (Client → SW communication)
   ═══════════════════════════════════════════════════════════ */
self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg) return;

  // Scheduled test notification
  if (msg.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delayMs, url, icon } = msg;
    self.setTimeout(() => {
      self.registration.showNotification(title || 'Mock Alert', {
        body: body || 'Test notification from PRISM OS',
        icon: icon || '/logo.png',
        badge: '/logo.png',
        data: { url: url || '/', category: 'general' },
        vibrate: [100, 50, 100],
        tag: 'prism-test-' + Date.now()
      });
    }, delayMs || 3000);
  }

  // Show a notification immediately (from realtime bridge)
  if (msg.type === 'SHOW_NOTIFICATION') {
    const category = msg.category || 'general';
    const template = NOTIFICATION_TEMPLATES[category] || NOTIFICATION_TEMPLATES.general;

    self.registration.showNotification(msg.title || 'PRISM Alert', {
      body: msg.body || '',
      icon: msg.icon || '/logo.png',
      badge: '/logo.png',
      tag: msg.tag || template.tag + '-' + Date.now(),
      data: {
        category,
        url: msg.url || '/',
        ...(msg.data || {})
      },
      actions: template.actions,
      vibrate: template.vibrate,
      requireInteraction: template.requireInteraction || false
    });
  }
});
