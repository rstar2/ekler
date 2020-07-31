/* eslint-disable no-console */

import Vue from 'vue';

import { register } from 'register-service-worker';

// import configurePushNotifications from './configurePushNotifications';
import configurePushNotifications from './firebase-configurePushNotifications';

// I. New content notification
/**
 * @param {ServiceWorker} swWaiting
 * @return {Promise}
 */
function notifyForUpdatedContent(swWaiting) {
  // plain window confirmation alert
  //   const refresh = confirm('New updated content.  Reload?');
  //   if (refresh) {
  //     return refreshServiceWorker(swWaiting);
  //   } else {
  //     return Promise.reject(new Error('User do not want reload'));
  //   }

  return Vue.confirm({
    text: 'New updated content. Reload?'
    // timeout: 4000
  }).then(() => refreshServiceWorker(swWaiting));
}

/**
 * @param {ServiceWorker} swWaiting
 */
function refreshServiceWorker(swWaiting) {
  // 1. Easier way
  // just post to the service-worker and listen to 'controllerchange'
  // swWaiting.postMessage({ type: 'SKIP_WAITING' });
  // navigator.serviceWorker.addEventListener('controllerchange', () => {
  //   window.location.reload();
  // });

  // 2. Use real request-response pattern, tell the ServiceWorker what to do and let it reply when it's ready
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = event => {
      console.log('Done worker.skipWaiting().');
      event.data.error ? reject(event.data.error) : resolve(event.data);
    };
    swWaiting.postMessage({ type: 'SKIP_WAITING' }, [messageChannel.port2]);
  });
}

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    /**
     * @param {ServiceWorkerRegistration} swRegistration
     */
    ready(swRegistration) {
      console.log('App is being served from cache by a service worker.\nFor more details, visit https://goo.gl/AFskqB');

      configurePushNotifications(swRegistration);
    },
    /**
     * @param {ServiceWorkerRegistration} swRegistration
     */
    registered(swRegistration) {
      console.log('Service worker has been registered.', swRegistration);
    },
    /**
     * @param {ServiceWorkerRegistration} swRegistration
     */
    updated(swRegistration) {
      console.log('New content is available; please refresh.');

      // pass the waiting ServiceWorker
      notifyForUpdatedContent(swRegistration.waiting).then(
        () => {
          console.log('Refreshing after new service worker has been activated');
          window.location.reload();
        },
        // just trace the rejection
        error => console.error(error)
      );
    },
    cached() {
      console.log('Content has been cached for offline use.');
    },
    updatefound() {
      console.log('New content is downloading.');
    },
    offline() {
      console.log('No internet connection found. App is running in offline mode.');
    },
    error(error) {
      console.error('Error during service worker registration:', error);
    }
  });
}
