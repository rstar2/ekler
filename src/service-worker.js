/* eslint-disable no-console */
/* global importScripts:true, firebase: true */

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
// Again some part is in 'registerServiceWorker.js', more specifically in 'firebase-configurePushNotifications.js' file.

// For Firebase Cloud Messaging setting it up is a little different
// https://firebase.google.com/docs/cloud-messaging/js/client?authuser=0
// Whole demo: https://github.com/firebase/quickstart-js/blob/2f2fa6913d/messaging/firebase-messaging-sw.js

// 1 (Either 1.1 or 1.2)

// 1.1 - start
// // These scripts are made available when the app is served or deployed on Firebase Hosting
// // If you do not serve/host your project using Firebase Hosting see https://firebase.google.com/docs/web/setup
// importScripts('/__/firebase/7.17.1/firebase-app.js');
// importScripts('/__/firebase/7.17.1/firebase-messaging.js');
// importScripts('/__/firebase/init.js');
// 1.1 - end

// 1.2 - start
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/7.17.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.17.1/firebase-messaging.js');

// Pass these as env variables (they are not "private" info but like this its not very scalable/customizable as source for another app)
// For this a webpack plugin is used to add the env variables to this created on build 'service-worker-env.js' file
importScripts('service-worker-env.js'); // this file should have all the vars declared
const projectId = process.env.VUE_APP_FIREBASE_PROJECT_ID;
const apiKey = process.env.VUE_APP_FIREBASE_API_KEY;
const messagingSenderId = process.env.VUE_APP_FIREBASE_SENDER_ID;
const appId = process.env.VUE_APP_FIREBASE_APP_ID;

// Initialize the Firebase app in the service worker by passing in your app's Firebase config object.
const config = {
  apiKey,
  projectId,
  // authDomain has to be changed when using real production custom domain,
  // and when this custom domain is added in the list of authorized domains in Firebase Console
  // Also in Google Console it should be in the whitelist of the redirect URLs
  authDomain: `${projectId}.firebaseapp.com`,
  databaseURL: `https://${projectId}.firebaseio.com`,
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId,
  appId
};
firebase.initializeApp(config);

// 1.2 - end

// 2.
// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
messaging.setBackgroundMessageHandler(message => {
  console.log('Received a "background" message', message);

  // NOTE: If you set 'notification' field in your message payload,
  // your setBackgroundMessageHandler callback is not called,
  // and instead the SDK displays a notification based on your message.

  // NOTE: The PushNotification requires a Notification to be shown otherwise the browser
  // will show one on default "This side has been updated in the background"

  const { from, priority, data } = message;
  // Customize notification here
  const notificationTitle = data.title;
  const notificationOptions = {
    body: `From ${from} and priority ${priority} : ${data.body}`,
    icon: '/firebase-logo.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 3. Sending messages using FCM: They should be with specific format:
//    3.1. If they "notification" type like below, then messaging service will show a Notification implicitly
//      {
//          "to" : "{{token}}",
//          "priority" : "high",
//          "notification" : {
//              "title" : "Test",
//              "body" : "Hi :)",
//              "click_action": "http://localhost:8081",
//              "icon": "http://localhost:8081/chrome/chrome-installprocess-128-128.png"
//          }
//      }
//    3.3 But we customize this in the client app if needed by sending messages of the form:
//        and these messages will be received in the setBackgroundMessageHandler() handler.
//        Still the PushNotification API requires again a Notification to be shown ti the user,
//        so that no "hidden" background action can be done
//      {
//        "to" : "{{token}}",
//          "priority" : "high",
//          "data" : {
//              "whatever": "yes",
//              "title" : "Test",
//              "body" : "Hi :)",
//              "click_action": "http://localhost:8081",
//              "icon": "http://localhost:8081/chrome/chrome-installprocess-128-128.png"
//          }
//      }

// Example with cURL :
// $ curl -X POST -H "Authorization: key={{ serverKey }}" \
//    -H "Content-Type: application/json" \
//    -d '{  "to": "{{ token }}",  "notification": {"title": "FCM Message", "body": "This is an FCM Message",    "icon": "./img/icons/android-chrome-192x192.png"  }}' \
//    https://fcm.googleapis.com/fcm/send

// Note: {{serverKey}} is taken from the Firebase console (it's not the VAPID public or private key)
