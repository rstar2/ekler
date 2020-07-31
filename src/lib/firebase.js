// import the Firebase core and then the Firestore functionality that will be used
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/functions';
import 'firebase/messaging';

const projectId = process.env.VUE_APP_FIREBASE_PROJECT_ID;
const apiKey = process.env.VUE_APP_FIREBASE_API_KEY;

// needed to init the messaging service
const messagingSenderId = process.env.VUE_APP_FIREBASE_SENDER_ID;
const appId = process.env.VUE_APP_FIREBASE_APP_ID;

// Initialize Firebase
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

const messaging = firebase.messaging();
const db = firebase.firestore();
const functions = firebase.functions();
const auth = firebase.auth();
const GoogleAuthProvider = firebase.auth.GoogleAuthProvider;

if (process.env.VUE_APP_FIREBASE_OFFLINE_SUPPORT === 'true') {
  // enable Firestore offline persistence
  db.enablePersistence().catch(function(err) {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled
      // in one tab at a a time.
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
    }
  });
  // Subsequent queries will use persistence, if it was enabled successfully
}

export { messaging, db, functions, auth, GoogleAuthProvider };
export default firebase;
