import Vue from 'vue';
import Vuex from 'vuex';

import auth from '../services/auth';
import db from '../services/db';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    // whether the app is initialized it's authUser state - set only once
    /* Boolean */ authInitialized: false,

    // the authenticated user,
    /* firebase.User like */ authUser: null

    /* -------------------------------------- */
  },
  getters: {
    isAuth(state) {
      return !!state.authUser;
    },
    isAdmin(state) {
      return !!state.authUser && !!state.authUser.claims.admin;
    },
    authUid(state) {
      return !!state.authUser && state.authUser.uid;
    },
    checkAuthUser(state, getters) {
      // 1. getters receive other getters as second argument
      // 2. return as a function, so it can be used like this from a VM:
      // this.$store.getters.checkAuthUser("asd")
      return uid => {
        const authUid = getters.authUid;
        return authUid && authUid === uid;
      };
    }

    /* -------------------------------------- */
  },
  mutations: {
    /**
     * @param {*} state
     */
    authInitialized(state) {
      // if (state.authInitialized) this.$logger.warn("Store's 'auth' state is already initialized");
      state.authInitialized = true;
    },
    /**
     * @param {*} state
     * @param {firebase.User?} user "fixed" firebase.User instance enhanced with a 'claims' Object prop
     */
    authUser(state, user) {
      state.authUser = user;
    }

    /* -------------------------------------- */
  },
  actions: {
    /**
     * Login action
     * @param {Vuex.ActionContext} context
     * @param {{email:String, password: String}} payload
     * @return {Promise}
     */
    login(context, payload) {
      return auth.login(payload);
    },

    /**
     * Register action
     * @param {Vuex.ActionContext} context
     * @param {{name:String, email:String, password: String}} payload
     * @return {Promise}
     */
    register(context, payload) {
      return auth.register(payload);
    },

    /**
     * Logout action
     * @return {Promise}
     */
    logout() {
      return auth.logout();
    }

    /* -------------------------------------- */
  }
});

export default store;

// Initialize the Auth service
/**
 * @param {firebase.User?} user firebase.User instance enhanced with a 'claims' Object prop
 */
auth.init(user => {
  store.commit('authInitialized');

  // NOTE: don't pass the firebase.User as payload as it doesn't work in Vuex strict mode
  // as Firebase internally changes some of its user's (e.g. payload's) props
  // const authUser = user; - will not work so create a new object with needed props
  const authUser = user && {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    claims: user.claims
  };
  store.commit('authUser', authUser);
});

// init the Workspace
db.init();
