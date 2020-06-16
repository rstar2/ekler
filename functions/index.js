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
exports.dbAddEkler_app = functions.https.onCall(async (data, context) => {
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

  console.log('New Ekler(s) add :', data);

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

  console.log('New Ekler(s) added :', data);

  return true;
});

// /**
//  * This is HTTPS triggered function
//  *
//  * Store uploaded image meta data in the database.
//  * This function's HTTP URL is registered as a notification WebHook that is called by Cloudinary
//  * when upload is successful
//  */
// exports.dbAddPlaceWeb = functions.https.onRequest(async (req, res) => {
//   // enable CORS
//   // these are needed for the preflight response and the actual response
//   res.setHeader('Access-Control-Allow-Origin', '*'); // TODO: do this for certain hosts only
//   res.setHeader('Access-Control-Allow-Credentials', true);
//   //   res.setHeader('Access-Control-Expose-Headers', 'XXXX');
//   const method = req.method.toUpperCase();
//   if (method === 'OPTIONS') {
//     // preflight

//     // reflect the request headers
//     res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
//     // allow all methods 'GET,HEAD,PUT,PATCH,POST,DELETE' or just what is expected
//     res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
//     // res.setHeader('Access-Control-Max-Age', 'XXXXX');

//     // Safari (and potentially other browsers) need content-length 0, for 204 or they just hang waiting for a body
//     res.setHeader('Content-Length', '0');

//     res.statusCode = 204;
//     res.end();
//     return;
//   }
//   // actual response

//   //   console.log(
//   //     'Request headers:',
//   //     Object.keys(req.headers)
//   //       .map(header => header + '=' + req.headers[header])
//   //       .join(',')
//   //   );
//   //   console.log('Request body:', req.body);

//   // The body of the request is automatically parsed based on the 'content-type' header
//   // and made available via your HTTP function's arguments.
//   // If it's 'application/json' and sent data is '{"name":"John"}' so request.body will be valid JSON

//   const { body } = req;

//   const { uid, location, title, description, tags, url, meta = {} } = body;

//   if (!uid) {
//     const message = "No uid present - don't add it in the DB";
//     console.log(message);
//     // terminate the function and send response
//     return res.status(500).send(message);
//   }

//   const { latitude, longitude } = location;

//   if (!latitude || !longitude) {
//     const message = "No GPS location present in the image metadata - don't add it in the DB";
//     console.log(message);
//     // terminate the function and send response
//     return res.status(500).send(message);
//   }

//   // use 'creation date' from the upload response
//   const createdAt = Date.now();

//   const place = await db.addPlace({ uid, title, description, location, tags, url, createdAt, meta });

//   console.log(`New place added to DB  - ${place.id}, location:`, place.location);

//   // send response
//   res.status(200).json(place);
// });
