/* eslint-disable no-console */
/* global workbox:true */

/**
 * @type {ServiceWorker} self
 */

// I. Caching
// TODO:

// II. New content notification
// https://levelup.gitconnected.com/vue-pwa-example-298a8ea953c9

// First in 'registerServiceWorker.js' is the main part that listens for updates to the service-worker file.
// Note changes to the app's JS, CSS will cause changes to the the precache-manifest during build,
// so it will cause the service-worker file to be changes - update will be fired.
// So when there's update the 'registerServiceWorker.js' will notify the user and if user confirms
// it will post 'SKIP_WAITING' type even to this waiting service-worker and here it just 'activates' it by calling skipWaiting
self.addEventListener('message', event => {
  console.log('[Service Worker] Message Received.');
  const replyPort = event.ports[0];
  const message = event.data;
  if (replyPort && message && message.type === 'SKIP_WAITING') {
    event.waitUntil(
      self.skipWaiting().then(
        () => replyPort.postMessage({ error: null }),
        error => replyPort.postMessage({ error })
      )
    );
  }
});

// III. TODO Push notifications
// Again some part is in 'registerServiceWorker.js' file. Also finally the browser's
// Notifications API is used so proper permissions have to be requested and granted
// Like in // https://www.blog.plint-sites.nl/how-to-add-push-notifications-to-a-progressive-web-app/

// Listen to Push events
self.addEventListener('push', event => {
  const body = event.data.text();
  console.log(`[Service Worker] PushMessage received: "${body}"`);

  // There are multiple options tat can be used
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
  // https://tests.peter.sh/notification-generator/
  const title = 'Ekler';
  const options = {
    body,
    icon: 'images/icon.png',
    image: 'images/image.png',
    badge: 'images/badge.png',
    vibrate: [300, 200, 300],

    actions: [
      { action: 'explore', title: 'Explore this new world', icon: 'images/checkmark.png' },
      { action: 'close', title: 'Close notification', icon: 'images/xmark.png' }
    ],

    // arbitrary data, can be any type
    data: {
      xxx: 111,
      yyy: 222
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen to events interacting with a notification
self.addEventListener('notificationclose', event => {
  const notification = event.notification;
  const xxx = notification.data.xxx;
  console.log('[Service Worker] Notification closed' + xxx);
});
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');

  // close notification if desired
  event.notification.close();

  // if it has actions we can see which one has been clicked
  const action = event.action;
  if (action === 'close') {
    //notification.close();
  } else {
    // open a new window
    event.waitUntil(clients.openWindow('https://developers.google.com/web/'));
  }
});

// for Firebase Cloud Messaging it is a little different
// https://firebase.google.com/docs/cloud-messaging/js/client?authuser=0
