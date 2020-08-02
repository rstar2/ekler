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

  // TODO: Make it better and send registrations/tokens to Firebase
  auth.onAuthStateChanged(user => {
    // on logout take no action
    if (!user) {
      // TODO: delete the registration also if possible
      return messaging.deleteToken();
    }

    // just check
    messaging
      .requestPermission()
      .then(() => messaging.getToken())
      .then(token => {
        console.log('FCM token OK:', token);

        return db.userAddFcmToken(auth.getUserId(), token);
      })
      .catch(error => {
        console.error('FCM token failed:', error);
        return messaging.deleteToken();
      });
  });

  messaging.onTokenRefresh(() => {
    // TODO: check is it called on delete
    console.log('FCM token refreshed');
  });

  //   // Get Instance ID token. Initially this makes a network call, once retrieved
  //   // subsequent calls to getToken will return from cache.
  //   messaging
  //     .getToken()
  //     .then(currentToken => {
  //       if (currentToken) {
  //         sendTokenToServer(currentToken);
  //         updateUIForPushEnabled(currentToken);
  //       } else {
  //         // Show permission request.
  //         console.log('No Instance ID token available. Request permission to generate one.');
  //         // Show permission UI.
  //         updateUIForPushPermissionRequired();
  //         setTokenSentToServer(false);
  //       }
  //     })
  //     .catch(err => {
  //       console.log('An error occurred while retrieving token. ', err);
  //       showToken('Error retrieving Instance ID token. ', err);
  //       setTokenSentToServer(false);
  //     });

  //   // Callback fired if Instance ID token is updated.
  //   messaging.onTokenRefresh(() => {
  //     messaging
  //       .getToken()
  //       .then(refreshedToken => {
  //         console.log('Token refreshed.');
  //         // Indicate that the new Instance ID token has not yet been sent to the
  //         // app server.
  //         setTokenSentToServer(false);
  //         // Send Instance ID token to app server.
  //         sendTokenToServer(refreshedToken);
  //         // ...
  //       })
  //       .catch(err => {
  //         console.log('Unable to retrieve refreshed token ', err);
  //         showToken('Unable to retrieve refreshed token ', err);
  //       });
  //   });

  // Handle incoming messages. Called when:
  // - a message is received while the app has focus
  // - the user clicks on an app notification created by a service worker
  //   `messaging.setBackgroundMessageHandler` handler.
  messaging.onMessage(message => {
    console.log('Received a "foreground" message', message);
  });
};
