const admin = require('firebase-admin');

const { auth, db } = (() => {
  const projectId = process.env.VUE_APP_FIREBASE_PROJECT_ID;

  // generate from the Firebase Console -> ServiceAccounts -> GeneratePrivateKey
  const serviceAccount = require('../firebaseAdminServiceAccountKey.json');

  // Initialize Firebase Admin
  const config = {
    // if credentials are get from env variable
    // credential: admin.credential.applicationDefault(),

    // if explicitly passed the credentials file
    credential: admin.credential.cert(serviceAccount),

    databaseURL: `https://${projectId}.firebaseio.com`
  };

  admin.initializeApp(config);

  return { auth: admin.auth(), db: admin.firestore() };
})();

const collUsers = process.env.VUE_APP_FIREBASE_COLL_USERS;
const collHistory = process.env.VUE_APP_FIREBASE_COLL_HISTORY;
const collEklers = process.env.VUE_APP_FIREBASE_COLL_EKLERS;

/**
 * @param {String} command
 * @param {{[key]: String}} args
 */
module.exports = async function(command, args) {
  switch (command) {
    case 'add-user': {
      // Usage:
      // node cli/index.js db-add-user --email test@test.test --password pass123 --name Rumen --title dev
      const { email, password, name, title } = args;
      await require('./add-user')(auth, db, { email, password, name, title }, collUsers);
      break;
    }

    case 'remove-user': {
      // Usage:
      // node cli/index.js db-remove-user --uid OawVFntH2iVM21ZFykSGnjmah9K2
      const { uid } = args;
      await require('./remove-user')(auth, db, uid, collUsers, collEklers);
      break;
    }

    default:
      throw new Error(`Unknown DB command ${command}`);
  }
};
