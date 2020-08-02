const admin = require('firebase-admin');
const messaging = admin.messaging();

const db = require('../db');

module.exports = {
  /**
   * Send a message to all user's assigned FCM device tokens
   * @param {String} toUid
   * @param {admin.messaging.MessagingPayload} payload
   * @param {Boolean} dryRun
   */
  async sendMessage(toUid, payload, dryRun = false) {
    // This registration token comes from the client FCM SDKs and saved in Firestore
    const user = await db.userGet(toUid);
    const /* Array */ fcmTokens = user.fcmTokens;

    console.log(`FCM tokens for user ${user}`, fcmTokens);

    if (!fcmTokens) return 'No Push messaging registration';

    // each fcmToken can be of the sort { token: 'XXX', deviceId: 'YYY;, .... } (e.g. have more complex data stored)
    const tokens = fcmTokens.map(fcmToken => fcmToken.token);

    //   const message = {
    //     data,
    //     tokens
    //   };
    //   // Send a message to a specific device corresponding to the provided registration token.
    //   return messaging
    //     .sendMulticast(message)
    //     .then(response => {
    //       // Response is a message ID string.
    //       console.log('Successfully sent message:', response);
    //     })
    //     .catch(error => {
    //       console.log('Error sending message:', error);
    //     });

    return messaging
      .sendToDevice(
        tokens, // ['token_1', 'token_2', ...]
        payload,
        {
          // Required for background/quit data-only messages on iOS
          contentAvailable: true,
          // Required for background/quit data-only messages on Android
          priority: 'high',

          dryRun
        }
      )
      .then(({ /* Number */ failureCount, /* Array */ results }) => {
        // check which user's FCM tokens have expired (or jut not valid any more)
        let invalidFcmTokens = null;
        if (failureCount > 0) {
          invalidFcmTokens = [];
          // the order of the results is the same as of the tokens
          // find all "failed" tokens and later remove them
          results.forEach((aResult, index) => {
            if (aResult.error) {
              invalidFcmTokens.push(fcmTokens[index]);
            }
          });
          console.warn(`Invalid ${invalidFcmTokens.length} tokens`);
        }
        return invalidFcmTokens;
      });
  },

  /**
   * Invalidate (check which are invalid) user's FCM device tokens
   * @param {String} uid
   */
  async invalidate(uid) {
    return this.sendMessage(uid, { data: { test: true } }, true);
  }
};
