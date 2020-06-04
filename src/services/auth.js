import logger from '@/lib/logger';
import { db, auth, GoogleAuthProvider } from '@/lib/firebase';

export default {
  /**
   * @param {Function} authChangeCallback
   */
  init(authChangeCallback) {
    // this is used for 2 things:
    // 1. Initial Firebase auth state fetching, as after page-reload
    // 2. As a result to 'createUserWithEmailAndPassword', 'signInWithEmailAndPassword', 'signOut'
    //    so technically the commits after their results are not needed, but let them stay for now
    auth.onAuthStateChanged(user => {
      let promise;

      if (user) {
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
        // no auth user anymore
        promise = Promise.resolve(null);
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

    // asynchronous action than returns Promise so it can be chain in more complex flows
    return auth.createUserWithEmailAndPassword(email, password).then(creds => {
      const user = creds.user;

      // 1. Store limited data in the auth user record
      // we can use either the returned user object or "auth.currentUser"
      //   return user
      //     .updateProfile({
      //       displayName: name
      //       //photoURL: // some photo url
      //     });

      // 2. create new user inside a custom database 'users' collection
      // create it with the same matching uid
      return db
        .collection('users')
        .doc(user.uid)
        .set({
          name: name
          // age: 40
          // ...
        });
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
   * Login with Google
   */
  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    // provider additional OAuth 2.0 scopes
    // googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

    // To localize the provider's OAuth flow to the user's preferred language
    // auth.languageCode = 'pt'

    // Specify additional OAuth provider parameters that you want to send with the OAuth request
    // provider.setCustomParameters({
    //     'login_hint': 'user@example.com'
    //   });

    // To sign in with a pop-up window, call 'signInWithPopup' :
    return auth.signInWithPopup(provider).then(result => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      // const token = result.credential.accessToken;
      // The signed-in user info.
      // const user = result.user;
      // ...
    });

    // To sign in by redirecting to the sign-in page, call 'signInWithRedirect' :
    // auth.signInWithRedirect(provider);
    // auth.getRedirectResult().then(function(result) {
    //     if (result.credential) {
    //       // This gives you a Google Access Token. You can use it to access the Google API.
    //       var token = result.credential.accessToken;
    //       // ...
    //     }
    //     // The signed-in user info.
    //     var user = result.user;
    //   });
  },

  /**
   * Logout
   * @return {Promise}
   */
  logout() {
    return auth.signOut();
  }
};
