import logger from '../lib/logger';
import firebase, { db, functions } from '../lib/firebase';

// get the Firebase functions to call
const eklersAddFn = functions.httpsCallable('addEklers');
const eklersCheckoutFn = functions.httpsCallable('checkoutEklers');
const invalidateFcmTokenFn = functions.httpsCallable('invalidateFcmToken');

const /* firebase.firestore.CollectionReference */ users = db.collection(process.env.VUE_APP_FIREBASE_COLL_USERS);
const /* firebase.firestore.CollectionReference */ history = db.collection(process.env.VUE_APP_FIREBASE_COLL_HISTORY);
const /* firebase.firestore.CollectionReference */ eklers = db.collection(process.env.VUE_APP_FIREBASE_COLL_EKLERS);

// Use pagination cursors: https://firebase.google.com/docs/firestore/query-data/query-cursors
const historyLoad = {
  pageCursor: null,
  hasMore: true,
  realtimeAddCallback: null,

  // NOTE: As in the docs: (but I want to skip this behavior)
  //     The first query snapshot contains added events for all existing documents that match the query.
  //     This is because you're getting a set of changes that bring your query snapshot current with the initial state of the query.
  //     This allows you, for instance, to directly populate your UI from the changes you receive in the first query snapshot,
  //     without needing to add special logic for handling the initial state.
  realtimeSkippedFirst: false
};

const eklersLoad = {
  realtimeChangeCallback: null,
  realtimeSkippedFirst: false
};

const usersLoad = {
  realtimeChangeCallback: null,
  realtimeSkippedFirst: false
};

const initHistoryRealtime = () => {
  if (historyLoad.realtimeAddCallback) {
    logger.info('History: Listen for realtime updates');

    history.onSnapshot(snapshot => {
      // skip the first snapshot ass we already have the docs
      if (!historyLoad.realtimeSkippedFirst) {
        historyLoad.realtimeSkippedFirst = true;
        return;
      }
      snapshot.docChanges().forEach(change => {
        // for history only add can happen
        // no need to listen for change.type === 'modified' and change.type === 'removed'
        if (change.type === 'added') {
          const history = change.doc.data();
          historyLoad.realtimeAddCallback(history);
          logger.info('History: Added new record', history);
        }
      });
    });
  }
};

const initEklersRealtime = () => {
  if (eklersLoad.realtimeChangeCallback) {
    logger.info('Eklers: Listen for realtime updates');

    eklers.onSnapshot(snapshot => {
      // skip the first snapshot ass we already have the docs
      if (!eklersLoad.realtimeSkippedFirst) {
        eklersLoad.realtimeSkippedFirst = true;
        return;
      }

      // this is as if the whole collection is fetched now
      const { eklersDocs, checkoutsDocs } = parseEklers(snapshot);
      logger.info(`Eklers: Updated ${eklersDocs.length}`);

      eklersLoad.realtimeChangeCallback(eklersDocs, checkoutsDocs);
    });
  }
};

/**
 * Parse all eklers
 * @param {firebase.firestore.DocumentSnapshot} snapshot
 * @returns {{ eklersDocs:Array, checkoutsDocs:Array }}
 */
const parseEklers = snapshot => {
  const eklersDocs = [];
  const checkoutsDocs = {};
  snapshot.forEach(doc => {
    const data = doc.data();

    eklersDocs.push({ id: doc.id, to: { ...data } });

    Object.keys(data).forEach(userId => {
      const user = data[userId];
      if (user.checkout) checkoutsDocs[doc.id] = true;
    });
  });
  return { eklersDocs, checkoutsDocs };
};

const initUsersRealtime = () => {
  if (usersLoad.realtimeChangeCallback) {
    logger.info('Users: Listen for realtime updates');

    users.onSnapshot(snapshot => {
      // skip the first snapshot ass we already have the docs
      if (!usersLoad.realtimeSkippedFirst) {
        usersLoad.realtimeSkippedFirst = true;
        return;
      }

      // this is as if the whole collection is fetched now
      const usersDocs = parseUsers(snapshot);
      logger.info(`Users: Updated ${usersDocs.length}`);

      usersLoad.realtimeChangeCallback(usersDocs);
    });
  }
};
/**
 * Parse all eklers
 * @param {firebase.firestore.DocumentSnapshot} snapshot
 * @returns {Array}
 */
const parseUsers = snapshot => {
  const usersDocs = [];
  snapshot.forEach(doc => {
    usersDocs.push({ id: doc.id, ...doc.data() });
  });
  return usersDocs;
};

export default {
  /**
   * @param {Function} historyAddCallback
   * @param {Function} eklersChangeCallback
   * @param {Function} usersChangeCallback
   */
  init({ historyAddCallback, eklersChangeCallback, usersChangeCallback }) {
    logger.info('DB init');

    historyLoad.realtimeAddCallback = historyAddCallback;
    eklersLoad.realtimeChangeCallback = eklersChangeCallback;
    usersLoad.realtimeChangeCallback = usersChangeCallback;
  },

  /**
   * Get the workspace (e.g. all users)
   * @return {Promise<[]>}
   */
  async usersLoad() {
    return users.get().then(snapshot => {
      const usersDocs = parseUsers(snapshot);
      logger.info(`Users: Loaded ${usersDocs.length}`);

      initUsersRealtime();

      return usersDocs;
    });
  },

  /**
   * Get history
   * @param {Number} count Zero or less means no limits/pages
   * @return {Promise<{history: {[field: string]: any}[], hasMore: Boolean}>}
   */
  async historyLoad(count = -1) {
    // fail fast if no more
    if (!historyLoad.hasMore) return Promise.resolve({ history: [], hasMore: false });

    // get the latest history records first
    let query = history.orderBy('createdAt', 'desc');
    if (count > 0) {
      query = query.limit(count);
    }

    // start after the last known pagination cursor
    if (historyLoad.pageCursor) {
      query = query.startAfter(historyLoad.pageCursor);
    }

    return query.get().then(snapshot => {
      const size = snapshot.size;
      const historyDocs = [];
      if (size) {
        snapshot.forEach(doc => {
          // doc.data() is never undefined for query doc snapshots
          historyDocs.push(doc.data());
        });

        if (count > 0) {
          if (size < count) {
            // returned less then requested (e.g. all the last) - so no more to load
            historyLoad.hasMore = false;
          } else {
            // mark the last known pagination cursor
            historyLoad.pageCursor = snapshot.docs[size - 1];
          }
        } else {
          // returned the whole collection - so no more to load
          historyLoad.hasMore = false;
        }
      } else {
        // nothing/empty is returned - so no more to load
        historyLoad.hasMore = false;
      }

      logger.info(`History: Fetched new ${historyDocs.length} records, hasMore: ${historyLoad.hasMore}`);

      // if all of the history is added we can start listening to changes
      if (!historyLoad.hasMore) {
        initHistoryRealtime();
      }

      return {
        history: historyDocs,
        hasMore: historyLoad.hasMore
      };
    });
  },

  /**
   * Get the Eklers "graph"
   * @return {Promise<[]>}
   */
  async eklersLoad() {
    return eklers.get().then(snapshot => {
      const { eklersDocs, checkoutsDocs } = parseEklers(snapshot);
      logger.info(`Eklers: Loaded ${eklersDocs.length}`);

      initEklersRealtime();

      return { eklers: eklersDocs, checkouts: checkoutsDocs };
    });
  },

  /**
   * Add an Ekler
   * @param {String} from
   * @param {String} to
   * @return {Promise<>}
   */
  async eklersAdd(from, to, count = 1) {
    // the Firebase Firestore DB is protected from unauthorized add/update/delete
    // so use a Firebase Callable Function
    return eklersAddFn({ from, to, count }).then(result => result.data);
  },

  /**
   * Request to checkout 'own' eklers from someone
   * @param {String} from user requesting the checkout, e.g. the one to which the other user owes eklers
   * @param {String} to user being 'check-outed', e.g. the one owning the eklers
   */
  async eklersCheckout(from, to) {
    // the Firebase Firestore DB is protected from unauthorized add/update/delete
    // so use a Firebase Callable Function
    console.log('Checkout func', from, '->', to);

    return eklersCheckoutFn({ from, to }).then(result => result.data);
  },

  /**
   * Add/assign the FCM device token to a user
   * @param {String} uid
   * @param {String} token
   */
  async userAddFcmToken(uid, token) {
    // add/merge into the array of tokens
    // NOTE: it will not add a duplicate item
    return users.doc(uid).update({
      fcmTokens: firebase.firestore.FieldValue.arrayUnion({ token })
    });
  },

  /**
   * Invalidate the FCM device token of a user - but it's unknown which one exactly so
   * just notify the "server" to check
   * @param {String} uid
   */
  async userInvalidateFcmToken(uid) {
    // notify to invalidate (and recheck assigned tokens)
    return invalidateFcmTokenFn(uid);
  }
};
