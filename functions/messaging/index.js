const admin = require('firebase-admin');
const messaging = admin.messaging();

const db = require('../db');

/**
 *
 * @param {String} toUid
 * @param {Object} data
 */
module.exports.sendMessage = async function(toUid, data) {
  // This registration token comes from the client FCM SDKs and saved in Firestore
  const user = await db.getUser(toUid);
  const fcmTokens = user.fcmTokens;

  console.log(`FCM tokens for user ${user}`, fcmTokens);

  if (!fcmTokens) return 'No Push messaging registration';

  const message = {
    data,
    tokens: fcmTokens
  };
  

  // Send a message to a specific device corresponding to the provided registration token.
  return messaging
    .sendMulticast(message)
    .then(response => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch(error => {
      console.log('Error sending message:', error);
    });
};
