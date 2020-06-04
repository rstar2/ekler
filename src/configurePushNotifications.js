/* eslint-disable no-console */

// https://developers.google.com/web/fundamentals/push-notifications/
// https://developers.google.com/web/ilt/pwa/introduction-to-push-notifications
// https://www.blog.plint-sites.nl/how-to-add-push-notifications-to-a-progressive-web-app/

/**
 * @type {ServiceWorkerRegistration}
 */
let swRegistration = null;

/**
 * @type {PushSubscription}
 */
let pushSubscription = null;

export const notificationsSupported = 'Notification' in window && navigator.serviceWorker;

// configure VAPID key for instance with https://web-push-codelab.glitch.me/
const applicationServerPublicKey = process.env.VUE_APP_PUSH_API_KEY;

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * @return {Promise<Boolean>}
 */
function requestNotificationPermission() {
  // NOTE: the Promise API is the new way but if we want to support old callback style API
  // we have to implement both
  //   return Notification.requestPermission().then(permission => {
  //     // if granted, create new subscription
  //     if (permission !== 'granted') throw new Error('Client Notifications not granted');
  //   });

  return new Promise((resolve, reject) => {
    const permissionPromise = Notification.requestPermission(result => {
      // old callback Notification API
      resolve(result);
    });

    // check if new Promise NotificationAPI
    if (permissionPromise) {
      permissionPromise.then(resolve, reject);
    }
  }).then(permission => {
    if (permission !== 'granted') {
      throw new Error('Client Notifications not granted');
    }
  });
}

function updateSubscriptionOnServer(subscription) {
  // TODO: Send subscription to application server, so that it can send Push Notifications
  // NOTE: Note that a user can have multiple subscriptions for different devices/browsers
  // so removing them will be trickier
  const subscriptionJson = subscription ? JSON.stringify(subscription) : null;
  const uid = 'UID_TESTER';
  console.log(`Update push subscription on server for ${uid}`, subscriptionJson);
}

/**
 * This must be called (and thus configured) before
 * any "other" module importing the other exported functions
 * @param {ServiceWorkerRegistration} swReg
 */
export default swReg => {
  swRegistration = swReg;

  // try go get current state
  hasSubscription();

  // for testing immediate subscription
  // createSubscription();
};

/**
 * @return {Promise<Boolean>}
 */
export function hasSubscription() {
  if (!notificationsSupported) return Promise.reject(new Error('Client Notifications not supported'));
  if (!swRegistration)
    return Promise.reject(new Error("The default exported module's function has to be called first"));

  return swRegistration.pushManager
    .getSubscription()
    .then(subscription => {
      if (pushSubscription !== subscription) {
        updateSubscriptionOnServer(subscription);
      }
      pushSubscription = subscription;
      return !!subscription;
    })
    .catch(error => {
      updateSubscriptionOnServer(null);
      pushSubscription = null;
      throw error; // rethrow the same rejected error
    });
}

/**
 * Request/Check permission to use Notification API and if granted configure Push Notifications.
 * @return {Promise<PushSubscription}
 */
export function createSubscription() {
  if (!notificationsSupported) return Promise.reject(new Error('Client Notifications not supported'));
  if (!swRegistration)
    return Promise.reject(new Error("The default exported module's function has to be called first"));

  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);

  return requestNotificationPermission()
    .then(() =>
      // this will also return current returned Push subscription if any
      // Permissions and subscribe()
      //There is one side effect of calling subscribe(). If your web app doesn't have permissions for showing notifications
      // at the time of calling subscribe(), the browser will request the permissions for you.
      // This is useful if your UI works with this flow, but if you want more control  stick to the Notification.requestPermission() API.
      swRegistration.pushManager.subscribe({
        // The userVisibleOnly parameter is basically an admission that you will show a notification every time a push is sent.
        // At the time of writing this value is required and must be true.
        userVisibleOnly: true,
        applicationServerKey
      })
    )
    .then(subscription => {
      if (subscription) {
        console.log('User IS subscribed.');
      } else {
        console.log('User is NOT subscribed.');
      }

      if (pushSubscription !== subscription) {
        updateSubscriptionOnServer(subscription);
      }
      pushSubscription = subscription;
    })
    .catch(error => {
      console.error('User is NOT subscribed because of', error);
      pushSubscription = null;
      updateSubscriptionOnServer(null);
      throw error; // rethrow the same rejected error
    });
}

/**
 * @return {Promise<Boolean>}
 */
export function removeSubscription() {
  // NOTE: this assumes hasPermission() has been called
  if (!pushSubscription) return Promise.resolve(true);

  return pushSubscription.unsubscribe().then(result => {
    updateSubscriptionOnServer(null);
    return result;
  });
}
