// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

const functionsConfig = functions.config();

// NOTE: the 'firebase' options are by default present in the functions config object
// but others should have been set as the environment variables, like for 'functionsConfig.cloudinary'
//      Configuring of environment variables in Firebase function is "ugly" and only through the CLI like:
//      firebase functions:config:set someservice.key="THE API KEY" someservice.id="THE CLIENT ID"
//      Keep in mind that only lowercase characters are accepted in keys - so 'apikey', cannot name it 'apiKey'
//      still '_' is allowed so 'api_key' is allowed

// These are actually the mapped environment variables
// VUE_APP_FIREBASE_COLL_HISTORY and VUE_APP_FIREBASE_COLL_EKLERS
// that are set using the firebase-env.js utility
const { collusers, colleklers, collhistory } = functionsConfig.db;

const db = require('./db');
db.init(collusers, colleklers, collhistory);

const messaging = require('./messaging');
const email = require('./email')(functionsConfig, 'Admin Eklers');

// From https://firebase.google.com/docs/functions/config-env
// GCLOUD_PROJECT and FIREBASE_CONFIG are auto-populated environment variables
const APP_URL = `https://${process.env.GCLOUD_PROJECT}.web.app/`;

/**
 * This is HTTPS callable function
 *
 * Add (e.g virtual owe) ekler(s) from someone to someone and store in Firestore DB.
 */
exports.addEklers = functions.https.onCall(async (data, context) => {
  checkAuthorized(context);

  console.log('Add Eklers :', data);

  let errorInvalidArgument;
  if (!data.from) {
    errorInvalidArgument = 'No "uid" present - cannot add Eklers';
  } else if (!data.to) {
    errorInvalidArgument = 'No "to" present - cannot add Eklers';
  } else if (!data.count) {
    errorInvalidArgument = 'No "count" present - cannot add Eklers';
  }
  if (errorInvalidArgument) {
    console.log(errorInvalidArgument);
    // terminate the function and send response
    throw new functions.https.HttpsError('invalid-argument', errorInvalidArgument);
  }

  // add in the 'eklers' collection
  const success = await db.eklersAdd(data);

  if (success) {
    // add in the 'history' collection finally
    await db.historyAdd(db.history.ADD, data);

    const userTo = { ...(await db.userGet(data.to)), uid: data.to };
    const userFrom = { ...(await db.userGet(data.from)), uid: data.from };
    const msg = `${userFrom.name} owes you ${data.count} new ekler(s)`;

    try {
      const invalidTokens = await messaging.sendMessage(userTo, {
        // Create proper Notification
        notification: {
          title: 'New eklers',
          body: msg,
          icon: 'img/notify-add.png',
          clickAction: APP_URL
        }
      });

      // invalidate any of the FCM registration tokens
      if (invalidTokens) {
        await db.userRemoveFcmTokens(data.to, invalidTokens);
      }
    } catch (error) {
      console.error(`Failed to send Push messages to ${userTo}`, error);
    }

    // send email also
    try {
      await email.sendEmail(userTo, { subject: 'Eklers - Received new eklers', text: msg });
    } catch (error) {
      console.error(`Failed to send email to ${userTo}`, error);
    }
  }

  return true;
});

/**
 * This is HTTPS callable function
 *
 * Request/lock someone that owes ekler(s) to someone else.
 */
exports.checkoutEklers = functions.https.onCall(async (data, context) => {
  checkAuthorized(context);

  console.log('Checkout user :', data);

  checkoutOrUnlock(data);

  return true;
});

/**
 * This is HTTPS callable function
 *
 * Unlock someone that owes ekler(s) to someone else and has given them
 */
exports.unlockEklers = functions.https.onCall(async (data, context) => {
  checkAuthorized(context);

  console.log('Unlock user :', data);

  checkoutOrUnlock(data, false);

  return true;
});

/**
 * This is HTTPS callable function
 *
 * Invalidate (any unknown one) user's device-registration-token
 * for FCM messages (e.g. PushNotifications) in Firestore DB.
 */
exports.invalidateFcmToken = functions.https.onCall(async (data, context) => {
  checkAuthorized(context);

  console.log('FCM Register device-token :', data);

  let errorInvalidArgument;
  if (!data.uid) {
    errorInvalidArgument = 'No "uid" present - cannot checkout Eklers';
  }
  if (errorInvalidArgument) {
    console.log(errorInvalidArgument);
    // terminate the function and send response
    throw new functions.https.HttpsError('invalid-argument', errorInvalidArgument);
  }

  // invalidate the current user's FCM tokens - e.g. return the "invalid" ones
  const user = await db.userGet(data.uid);
  const invalidTokens = await messaging.invalidate(user);

  // invalidate any of the FCM registration tokens
  if (invalidTokens) {
    await db.userRemoveFcmTokens(data.uid, invalidTokens);
  }

  return true;
});

/**
 *
 * @param {functions.https.CallableContext} context
 */
function checkAuthorized(context) {
  // To ensure the client gets useful error details, return errors from a callable by throwing
  // (or returning a Promise rejected with) an instance of functions.https.HttpsError.
  // The error has a code attribute that can be one of the values listed at functions.https.HttpsError.
  // The errors also have a string message, which defaults to an empty string.
  // They can also have an optional details field with an arbitrary value.
  // If an error other than HttpsError is thrown from your functions, your client instead receives
  // an error with the message INTERNAL and the code internal.

  // Authentication / user information is automatically added to the request.
  // Checking that the user is authenticated.
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' + 'while authenticated.');
  }
  // const uid = context.auth.uid;

  // validate attributes if necessary
  //   if (!(typeof text === 'string') || text.length === 0) {
  //     // Throwing an HttpsError so that the client gets the error details.
  //     throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
  //         'one arguments "text" containing the message text to add.');
  //   }
}

/**
 *
 * @param {{from: String, to: String}} data
 * @param {Boolean} isCheckout
 */
async function checkoutOrUnlock(data, isCheckout = true) {
  let errorInvalidArgument;
  if (!data.from) {
    errorInvalidArgument = 'No "from" present - cannot checkout/unlock user';
  } else if (!data.to) {
    errorInvalidArgument = 'No "to" present - cannot checkout/unlock user';
  }
  if (errorInvalidArgument) {
    console.log(errorInvalidArgument);
    // terminate the function and send response
    throw new functions.https.HttpsError('invalid-argument', errorInvalidArgument);
  }

  // checkout in the 'eklers' collection
  const success = isCheckout ? await db.eklersCheckout(data) : await db.eklersUnlock(data);

  if (success) {
    // add in the 'history' collection finally
    await db.historyAdd(isCheckout ? db.history.CHECKOUT : db.history.UNLOCK, data);

    const userTo = { ...(await db.userGet(data.to)), uid: data.to };
    const userFrom = { ...(await db.userGet(data.from)), uid: data.from };
    const msg = isCheckout
      ? `${userFrom.name} wants his/hers eklers!!!`
      : `${userFrom.name} is grateful for your eklers!!!`;

    try {
      const invalidTokens = await messaging.sendMessage(userTo, {
        title: isCheckout ? 'Request' : 'Unlock',
        body: msg
      });

      // invalidate any of the FCM registration tokens
      await db.userRemoveFcmTokens(data.to, invalidTokens);
    } catch (error) {
      console.error(`Failed to send Push messages to ${userTo}`, error);
    }

    // send email also
    try {
      await email.sendEmail(userTo, {
        subject: isCheckout ? 'Eklers - Request' : 'Eklers - Unlock',
        text: msg
      });
    } catch (error) {
      console.error(`Failed to send email to ${userTo}`, error);
    }
  }
}
