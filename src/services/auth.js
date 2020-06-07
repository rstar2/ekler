import logger from '../lib/logger';
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
    auth.onAuthStateChanged(user => {
      let promise = Promise.resolve(null);

      // allow only "verified" users
      if (user && user.emailVerified) {
        // auth user - wait to get the custom claims
        promise = user.getIdTokenResult().then(idTokenResult => {
          // this is like s JWT token (aud, iss, iat, exp, email, sub, user_id)
          // and custom ones like 'admin'
          logger.info('Logged in user claims', idTokenResult.claims);

          // store the custom claims directly onto the stored user object (currently 'admin' only)
          user.claims = idTokenResult.claims;
          return user;
        });
      }

      // notify the callback for the auth
      promise.then(authChangeCallback);
    });
  },

  /**
   * Register
   * @param {{name:String, email:String, password: String}} payload
   * @return {Promise}
   */
  register(payload) {
    const { email, password, name } = payload;

    // asynchronous action that returns Promise so it can be chained in more complex flows
    return auth.createUserWithEmailAndPassword(email, password).then(creds => {
      const user = creds.user;

      let sendEmailVerify = user.sendEmailVerification();

      // 1. Store limited data in the auth user record
      // we can use either the returned user object or "auth.currentUser"
      //   return sendEmailVerify.then(() => {
      //     user.updateProfile({
      //       displayName: name
      //       //photoURL: // some photo url
      //     })
      //   });

      // 2. create new user inside a custom database 'users' collection
      // create it with the same matching uid
      return sendEmailVerify.then(() =>
        db
          .collection(process.env.VUE_APP_FIREBASE_COLL_USERS)
          .doc(user.uid)
          .set({
            name: name
            // age: 40
            // ...
          })
          // always "logout" internally from Firebase, until user verifies his email
          .then(() => this.logout())
      );
    });
  },

  /**
   * Login
   * @param {{email:String, password: String}} payload
   * @return {Promise}
   */
  login(payload) {
    const { email, password } = payload;

    return auth.signInWithEmailAndPassword(email, password);
  },

  /**
   * Logout
   * @return {Promise}
   */
  logout() {
    return auth.signOut();
  },

  /**
   * Update currently logged-in user's password
   * @param {String} newPassword
   */
  updatePassword(newPassword) {
    const user = auth.currentUser;

    if (user) {
      return user.updatePassword(newPassword);
    } else {
      return Promise.reject('Not logged in');
    }
  },

  /**
   * Update currently logged-in user's profile
   * @param {String?} displayName
   * @param {String?} photoURL
   */
  updateProfile({ displayName, photoURL }) {
    const user = auth.currentUser;

    if (user) {
      return user.updateProfile({ displayName, photoURL });
    } else {
      return Promise.reject('Not logged in');
    }
  }
};
