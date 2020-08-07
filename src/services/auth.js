import logger from '../lib/logger';
import { prune } from '../lib/util';
import { db, auth } from '../lib/firebase';

export default {
  /**
   * @param {Function} authChangeCallback
   */
  init(authChangeCallback) {
    logger.info('Auth init');

    // this is used for 2 things:
    // 1. Initial Firebase auth state fetching, as after page-reload
    // 2. As a result to 'createUserWithEmailAndPassword', 'signInWithEmailAndPassword', 'signOut'
    //    so technically the commits after their results are not needed, but let them stay for now
    const _this = this; // firebase calls this callback inside a Promise so this inside it is the Promise itself
    this.onAuthStateChanged(user => {
      let promise = Promise.resolve(null);

      // allow only "verified" users
      if (user) {
        if (user.emailVerified) {
          // auth user - wait to get the custom claims
          promise = user.getIdTokenResult().then(idTokenResult => {
            // this is like s JWT token (aud, iss, iat, exp, email, sub, user_id)
            // and custom ones like 'admin'
            logger.info('Logged in user claims', idTokenResult.claims);

            // store the custom claims directly onto the stored user object (currently 'admin' only)
            user.claims = idTokenResult.claims;
            return user;
          });
        } else {
          _this.logout();
        }
      }

      // notify the callback for the auth
      promise.then(authChangeCallback);
    });
  },

  /**
   * Listen to auth change events
   * @param {Function} callback
   */
  onAuthStateChanged(callback) {
    auth.onAuthStateChanged(callback);
  },

  /**
   * Register
   * @param {{name:String, email:String, password: String}} payload
   * @return {Promise}
   */
  async register(payload) {
    const { email, password, name } = payload;

    return (
      // 1. create/register the user in the auth service
      auth
        .createUserWithEmailAndPassword(email, password)
        // we can use either the returned user object or "auth.currentUser"
        .then(creds => creds.user)

        // 2. send the user a verification email
        .then(user => user.sendEmailVerification() && user)

        // 3. Store limited data in the auth user record
        .then(user => user.updateProfile({ displayName: name }) && user)

        // 4. create new user inside a custom database 'users' collection
        // create it with the same matching uid
        .then(user =>
          db
            .collection(process.env.VUE_APP_FIREBASE_COLL_USERS)
            .doc(user.uid)
            .set({ email: user.email, name: name })
        )

        // 5. always "logout" internally from Firebase, until user verifies his email
        .then(() => this.logout())
    );
  },

  /**
   * Login
   * @param {{email:String, password: String}} payload
   * @return {Promise}
   */
  async login(payload) {
    const { email, password } = payload;

    return auth.signInWithEmailAndPassword(email, password);
  },

  /**
   * Logout
   * @return {Promise}
   */
  async logout() {
    return auth.signOut();
  },

  /**
   * Update currently logged-in user's password
   * @param {String} newPassword
   * @return {Promise}
   */
  async updatePassword(newPassword) {
    const user = auth.currentUser;

    if (user) {
      return user.updatePassword(newPassword);
    } else {
      return Promise.reject('Not logged in');
    }
  },

  /**
   * Update currently logged-in user's profile
   * @param {String?} name
   * @param {String?} photoURL
   * @return {Promise<}
   */
  async updateProfile({ name, photoURL }) {
    const user = auth.currentUser;

    if (user) {
      return (
        user
          // 1. update in the auth service
          .updateProfile({ displayName: name, photoURL })
          // 2. update in the 'users' DB
          .then(() => {
            // update in the DB if necessary
            if (name || photoURL) {
              db.collection(process.env.VUE_APP_FIREBASE_COLL_USERS)
                .doc(user.uid)
                .set(prune({ name, jiraOwnerId: photoURL }), { merge: true });
            }
          })
          .then(() => user)
      );
    } else {
      return Promise.reject('Not logged in');
    }
  },

  /**
   * Return current user's ID
   * @return {String}
   */
  getUserId() {
    const user = auth.currentUser;

    if (!user) throw new Error('Not logged in user');

    return user.uid;
  }
};
