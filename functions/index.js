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
const { colleklers, collhistory } = functionsConfig.db;

const db = require('./db')(admin.firestore(), colleklers, collhistory);

/**
 * This is HTTPS callable function
 *
 * Add (e.g virtual owe) ekler(s) from someone to someone and store in Firestore DB.
 */
exports.addEklers = functions.https.onCall(async (data, context) => {
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
  await db.addEkler(data);

  // add in the 'history' collection finally
  await db.addHistory(data);

  console.log('Added Eklers :', data);

  return true;
});

/**
 * This is HTTPS callable function
 *
 * Add (e.g virtual owe) ekler(s) from someone to someone and store in Firestore DB.
 */
exports.checkoutEklers = functions.https.onCall(async (data, context) => {
  // Checking that the user is authenticated.
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' + 'while authenticated.');
  }

  console.log('Checkout Eklers :', data);

  let errorInvalidArgument;
  if (!data.from) {
    errorInvalidArgument = 'No "uid" present - cannot checkout Eklers';
  } else if (!data.to) {
    errorInvalidArgument = 'No "to" present - cannot checkout Eklers';
  }
  if (errorInvalidArgument) {
    console.log(errorInvalidArgument);
    // terminate the function and send response
    throw new functions.https.HttpsError('invalid-argument', errorInvalidArgument);
  }

  // add in the 'eklers' collection
  //   await db.addEkler(data);

  // add in the 'history' collection finally
  await db.addHistory(data);

  console.log('Checked-out  Eklers :', data);

  return true;
});
