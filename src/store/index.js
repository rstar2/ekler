import Vue from 'vue';
import Vuex from 'vuex';

import auth from '../services/auth';
import db from '../services/db';
import HistoryRecord from '../model/history_record';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    // whether the app is initialized it's authUser state - set only once
    /* Boolean */ authInitialized: false,

    // the authenticated user,
    /* firebase.User like */ authUser: null,

    /* -------------------------------------- */

    /* Array */ users: null,
    /* Boolean */ usersLoaded: false,

    /* HistoryRecord[] */ history: [],

    /* Array */ eklers: []
  },
  getters: {
    /**
     * @param {*} state
     * @return {Boolean}
     */
    isAuth(state) {
      return !!state.authUser;
    },
    /**
     * @param {*} state
     * @return {Boolean}
     */
    isAdmin(state) {
      return !!state.authUser && !!state.authUser.claims.admin;
    },
    /**
     * @param {*} state
     * @return {String|null}
     */
    authId(state) {
      return !!state.authUser && state.authUser.id;
    },
    /**
     * @param {*} state
     * @return {Function}
     */
    checkAuthUser(state, getters) {
      // 1. getters receive other getters as second argument
      // 2. return as a function, so it can be used like this from a VM:
      // this.$store.getters.checkAuthUser("asd")
      return id => {
        const authId = getters.authId;
        return authId && authId === id;
      };
    },

    /* -------------------------------------- */

    /**
     * @param {*} state
     * @return {Function}
     */
    getUserName(state, getters) {
      return id => {
        let user;
        if (state.authUser && id === getters.authId) user = state.authUser;
        else user = state.users.find(user => user.id === id);
        return user && user.name;
      };
    }
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
    },

    /* -------------------------------------- */

    /**
     * @param {*} state
     * @param {HistoryRecord} history
     */
    historyAdded(state, history) {
      // add all specified new places
      state.history.push(...history);
    },
    /**
     * @param {*} state
     * @param {{id: String, name: String}[]} users
     */
    usersSet(state, users) {
      // set the users
      state.users = users;
    },
    /**
     * @param {*} state
     */
    usersLoaded(state) {
      state.usersLoaded = true;
    },
    /**
     * @param {*} state
     * @param {{id: String, name: String}[]} users
     */
    eklersSet(state, eklers) {
      // set the eklers
      state.eklers = eklers;
    }
  },
  actions: {
    /**
     * Login
     * @param {Vuex.ActionContext} context
     * @param {{email:String, password: String}} payload
     * @return {Promise}
     */
    async login(context, payload) {
      return auth.login(payload);
    },

    /**
     * Register (and auto login) a new user
     * @param {Vuex.ActionContext} context
     * @param {{name:String, email:String, password: String}} payload
     * @return {Promise}
     */
    async register(context, payload) {
      return auth.register(payload);
    },

    /**
     * Logout current user
     * @return {Promise}
     */
    async logout() {
      return auth.logout();
    },

    /**
     * Update current user's profile
     * @param {Vuex.State} state
     * @param {Vuex.Commit} commit
     * @param {{displayName?:String, photoURL?: String}} payload
     */
    async updateProfile({ state, commit }, payload) {
      const user = await auth.updateProfile(payload);

      // merge into current
      const authUser = state.authUser;
      authUser.displayName = user.displayName;
      authUser.photoURL = user.photoURL;
      commit('authUser', authUser);
    },

    /* -------------------------------------- */

    /**
     * Load history
     * @param {Vuex.Commit} commit
     * @param {Number} count
     * @return {Promise}
     */
    async historyLoad({ commit }, count) {
      const { history } = await db.historyLoad(count);

      commit(
        'historyAdded',
        history.map(record => HistoryRecord.fromDB(record))
      );
    },

    /**
     * Load users
     * @param {Vuex.Commit} commit
     * @return {Promise}
     */
    async usersLoad({ commit }) {
      let loadError;
      try {
        const users = await db.usersLoad();
        commit('usersSet', users);
      } catch (error) {
        loadError = error;
      }

      commit('usersLoaded');

      // rethrow the error
      if (loadError) throw loadError;
    },

    /**
     * Load eklers
     * @param {Vuex.Commit} commit
     * @return {Promise}
     */
    async eklersLoad({ commit }) {
      const eklers = await db.eklersLoad();
      commit('eklersSet', eklers);
    }
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
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    claims: user.claims
  };
  store.commit('authUser', authUser);
});

// init the DB - like Users/History/Eklers....
db.init();
