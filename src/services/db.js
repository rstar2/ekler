import logger from '../lib/logger';
import { db, functions } from '../lib/firebase';

// get the Firebase function to call
const eklerAddFn = functions.httpsCallable('dbAddEkler_app');

const /* firebase.firestore.CollectionReference */ users = db.collection(process.env.VUE_APP_FIREBASE_COLL_USERS);
const /* firebase.firestore.CollectionReference */ history = db.collection(process.env.VUE_APP_FIREBASE_COLL_HISTORY);
const /* firebase.firestore.CollectionReference */ eklers = db.collection(process.env.VUE_APP_FIREBASE_COLL_EKLERS);

// Use pagination cursors: https://firebase.google.com/docs/firestore/query-data/query-cursors
let historyLoad = {
  pageCursor: null,
  hasMore: true
};

export default {
  init() {
    logger.info('DB init');
  },

  /**
   * Get the workspace (e.g. all users)
   * @return {Promise<[]>}
   */
  usersLoad() {
    return users.get().then(snapshot => {
      const usersDocs = [];
      snapshot.forEach(doc => {
        usersDocs.push({ id: doc.id, ...doc.data() });
      });

      logger.info(`Users: Loaded ${usersDocs.length} users`);

      return usersDocs;
    });
  },

  /**
   * Get history
   * @param {Number} count Zero or less means no limits/pages
   * @return {Promise<{history: {[field: string]: any}[], hasMore: Boolean}>}
   */
  historyLoad(count = -1) {
    // fail fast if no more
    if (!historyLoad.hasMore) return Promise.resolve({ history: [], hasMore: false });

    // .where('uid', '==', 'testerUID')

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

      logger.info(`History: Fetched new ${historyDocs.length} records`);
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
  eklersLoad() {
    return eklers.get().then(snapshot => {
      const eklersDocs = [];
      snapshot.forEach(doc => {
        eklersDocs.push({ id: doc.id, owes: { ...doc.data() } });
      });

      logger.info(`Eklers: Loaded ${eklersDocs.length} eklers`);

      return eklersDocs;
    });
  },

  /**
   * Add an Ekler
   * @return {Promise<>}
   */
  eklerAdd(from, to, count = 1) {
    // the Firebase Firestore DB is protected from unauthorized add/update/delete
    // so use a Firebase Callable Function
    return eklerAddFn({ from, to, count }).then(result => result.data);
  }
};
