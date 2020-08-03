import { messaging } from './lib/firebase';

import auth from './services/auth.js';
import db from './services/db.js';

const vapidPublicKey = process.env.VUE_APP_FIREBASE_VAPID_PUBLIC_KEY;

/**
 * This must be called (and thus configured) before
 * any "other" module importing the other exported functions
 * @param {ServiceWorkerRegistration} swReg
 */
export default swReg => {
  if (!vapidPublicKey || !swReg) {
    console.warn('Firebase Push Messaging is not available');
  }

  console.log('Configure Firebase Push Messaging');

  // use current service-worker, otherwise firebase will try to register
  // and use its own firebase-messaging-sw.js file
  messaging.useServiceWorker(swReg);

  // Add the VAPID public key generated from the console
  messaging.usePublicVapidKey(vapidPublicKey);

  auth.onAuthStateChanged(
    /* firebase.firestore.User */ user => {
      // on logout take no action
      if (!user) {
        // delete the token
        // NOTE: we cannot invalidate as the Fireabase Functions may be called only when authorized
        return messaging.deleteToken();
      }

      const authUserId = auth.getUserId();

      // 1. request Notifications showing permission
      // 2. get token
      // 3. store it to DB
      // 4. if failed (like when requesting permission) delete token and invalidate
      messaging
        .requestPermission()
        .then(() => messaging.getToken())
        .then(token => {
          console.log('FCM token OK:', token);

          return db.userAddFcmToken(authUserId, token);
        })
        .catch(error => {
          console.error('FCM token failed:', error);
          return messaging.deleteToken().then(() => db.userInvalidateFcmToken(authUserId));
        });
    }
  );

  messaging.onTokenRefresh(() => {
    // NOTE: this is not called on deleteToken()

    console.log('FCM token refreshed');

    const authUserId = auth.getUserId();

    // 1. get latest token
    // 2. store it to DB
    // 3. invalidate previous
    messaging
      .getToken()
      .then(token => {
        console.log('FCM token OK:', token);
        return db.userAddFcmToken(authUserId, token);
      })
      .then(() => db.userInvalidateFcmToken(authUserId));
  });

  // Handle incoming messages. Called when:
  // - a message is received while the app has focus
  // - the user clicks on an app notification created by a service worker
  //   `messaging.setBackgroundMessageHandler` handler.
  messaging.onMessage(message => {
    console.log('Received a "foreground" message', message);
  });
};
