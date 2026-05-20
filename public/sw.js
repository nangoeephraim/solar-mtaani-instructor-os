self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push notifications (from server/Web Push)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'PRISM Instructor OS Alert';
  const options = {
    body: data.body || 'New update received!',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    tag: data.tag || 'prism-general',
    data: data.data || {},
    actions: data.actions || [],
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click (open or focus the app)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Define where to redirect or focus
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Check if there is already a window open with this URL and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Listen for background scheduler / messages from the client
self.addEventListener('message', (event) => {
  const messageData = event.data;

  if (messageData && messageData.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delayMs, url, icon } = messageData;
    
    // Use self.setTimeout to schedule the notification in the service worker background thread
    self.setTimeout(() => {
      self.registration.showNotification(title || 'Mock Alert', {
        body: body || 'Test notification from PRISM OS',
        icon: icon || '/logo.png',
        badge: '/logo.png',
        data: { url: url || '/' },
        vibrate: [100, 50, 100],
        tag: 'prism-test-' + Date.now()
      });
    }, delayMs || 3000);
  }
});
