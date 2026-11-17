self.addEventListener('push', (event) => {
  let data = {
    title: 'REJOINS',
    body: 'Tu as reçu un nouveau message.',
    url: '/',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  ).href;

  event.waitUntil(clients.openWindow(url));
});
