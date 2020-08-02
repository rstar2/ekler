import Vue from 'vue';
import Vuex from 'vuex';

import auth from '../services/auth';
import db from '../services/db';
import HistoryRecord from '../model/history_record';

const isTestMode = 'true' === process.env.VUE_APP_TEST_MODE;

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

    /* Array */ eklers: [],

    /* Object */ checkouts: {}
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
      return state.authUser && state.authUser.id;
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
    },

    /**
     * @param {*} state
     * @return {Function}
     */
    getEklers(state) {
      return (fromId, toId) => {
        const userEklers = state.eklers.find(({ id }) => id === fromId);

        if (userEklers && userEklers.to[toId]) {
          // user 'fromId' owns eklers to this user 'toId'
          return {
            eklers: userEklers.to[toId].owes,
            checkout: !!userEklers.to[toId].checkout
          };
        }

        return null;
      };
    },

    /**
     * @param {*} state
     * @return {Function}
     */
    isBlocked(state) {
      return userId => !!state.checkouts[userId];
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
     * @param {HistoryRecord[]} history
     */
    historyAdded(state, history) {
      // add new history in font
      state.history.unshift(...history);
    },
    /**
     * @param {*} state
     * @param {{id: String, name: String, title: String}[]} users
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
     * @param {{id: String, to: Object}[]} users
     */
    eklersSet(state, eklers) {
      // set the eklers
      state.eklers = eklers;
    },
    /**
     * @param {*} state
     * @param {{id: String}[]} users
     */
    checkoutsSet(state, checkouts) {
      // set the checkouts
      state.checkouts = checkouts;
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
     * @param {Vuex.Commit} commit
     * @param {{name?:String, photoURL?: String}} payload
     */
    async updateProfile({ commit }, payload) {
      const user = await auth.updateProfile(payload);
      commit('authUser', fixUser(user));
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
      const { eklers, checkouts } = await db.eklersLoad();
      commit('eklersSet', eklers);
      commit('checkoutsSet', checkouts);
    },

    /**
     * Add/Owe eklers
     * @param {Vuex.ActionContext} context
     * @param {{from:String, to: String, count?: Number}} payload
     * @return {Promise}
     */
    async eklersAdd(context, payload) {
      const { from, to, count } = payload;
      await db.eklersAdd(from, to, count);
    },

    /**
     * Add/Owe eklers
     * @param {Vuex.ActionContext} context
     * @param {String} userId
     * @return {Promise}
     */
    async eklersCheckout(context, userId) {
      const { state } = context;
      await db.eklersCheckout(state.authUser.id, userId);
    }
  }
});

export default store;

/**
 * NOTE: don't pass the firebase.User as payload as it doesn't work in Vuex strict mode
 * as Firebase internally changes some of its user's (e.g. payload's) props,
 * so create a new object with needed props
 * @param {firebase.User?} user firebase.User instance enhanced with a 'claims' Object prop
 */
const fixUser = user => {
  return (
    user && {
      id: user.uid,
      email: user.email,
      claims: user.claims,

      // the firebase.User has 'displayName' and 'photoURL' (from the auth service),
      // but will 'sync' them with the users DB also and so will use 'name' and 'photoURL'
      name: user.displayName,
      photoURL: user.photoURL
    }
  );
};

// Initialize the Auth service
/**
 * @param {firebase.User?} user firebase.User instance enhanced with a 'claims' Object prop
 */
auth.init(user => {
  store.commit('authInitialized');
  store.commit('authUser', fixUser(user));
});

// init the DB - like Users/History/Eklers.... - and listen for real-time updates
db.init({
  historyAddCallback: historyRec => {
    store.commit('historyAdded', [HistoryRecord.fromDB(historyRec)]);
  },
  eklersChangeCallback: (eklers, checkouts) => {
    let filteredEklers = eklers,
      filteredCheckouts = checkouts;
    // skip 'testers' in non-test mode
    if (!isTestMode) {
      // TODO: ensure the eklers relations come after the users are committed
      // filteredEklers = users.filter(user => user.title !== 'tester');
    }

    store.commit('eklersSet', filteredEklers);
    store.commit('checkoutsSet', filteredCheckouts);
  },
  usersChangeCallback: users => {
    let filteredUsers = users;
    // skip 'testers' in non-test mode
    if (!isTestMode) {
      filteredUsers = users.filter(user => user.title !== 'tester');
    }
    store.commit('usersSet', filteredUsers);
  }
});
