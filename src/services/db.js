import logger from '@/lib/logger';
import { db, functions } from '@/lib/firebase';

// get the Firebase function to call
const placeUploader = functions.httpsCallable('dbAddPlaceApp');

const /* firebase.firestore.CollectionReference */ tags = db.collection('tags');
const /* firebase.firestore.CollectionReference */ places = db.collection(process.env.VUE_APP_FIREBASE_COLL_PLACES);

// Use pagination cursors: https://firebase.google.com/docs/firestore/query-data/query-cursors
let paginationCursor = null;
let hasMore = true;

export default {
  /**
   * Get all tags stored in the DB
   * @return {Promise<String[]>}
   */
  tagsLoad() {
    return tags.get().then(snapshot => {
      const tagsDocs = [];
      snapshot.forEach(doc => {
        // the tags are store just as empty documents - e.g. no data-fields in them
        // and with predefined IDs
        tagsDocs.push(doc.id);
      });

      return tagsDocs;
    });
  },

  /**
   * Get places
   * @param {Number} count Zero or less means no limits/pages
   * @return {Promise<{places: {id:String, [field: string]: any}[], hasMore: Boolean}>}
   */
  placesLoad(count = -1) {
    // fail fast if no more
    if (!hasMore) return Promise.resolve({ places: [], hasMore: false });

    // .where('uid', '==', 'testerUID')

    // get the latest places first
    // NOTE - in order this to work there has to be created Firebase Composite index
    let query = places.orderBy('createdAt', 'desc').orderBy('title');
    if (count > 0) {
      query = query.limit(count);
    }

    // start after the last known pagination cursor
    if (paginationCursor) {
      query = query.startAfter(paginationCursor);
    }

    return query.get().then(snapshot => {
      const size = snapshot.size;
      const places = [];
      if (size) {
        snapshot.forEach(doc => {
          // doc.data() is never undefined for query doc snapshots
          places.push({ id: doc.id, ...doc.data() });
        });

        if (count > 0) {
          if (size < count) {
            // returned less then requested (e.g. all the last) - so no more to load
            hasMore = false;
            paginationCursor = null;
          } else {
            // mark the last known pagination cursor
            paginationCursor = snapshot.docs[size - 1];
          }
        } else {
          // returned the whole collection - so no more to load
          hasMore = false;
          paginationCursor = null;
        }
      } else {
        // nothing/empty is returned - so no more to load
        hasMore = false;
        paginationCursor = null;
      }

      logger.info(`PlacesService: Fetched new ${places.length} places`);
      return {
        places,
        hasMore
      };
    });
  },

  /**
   * Update an existing place
   * @param {String} placeId The place id to update
   * @param {String[]?} tags the updated tags
   * @param {String?} title the updated title
   * @param {String?} description the updated description
   * @return {Promise<{id:String, [field: String]: any}>}
   */
  placeUpdate(placeId, { tags, title, description }) {
    const placeDoc = places.doc(placeId);
    // pass only "valid" fields - cannot pass 'undefined'
    // and 'null' is valid value
    const place = {
      ...(tags && { tags }),
      ...(title && { title }),
      ...(description && { description })
    };
    return placeDoc.set(place, { merge: true }).then(() => ({ id: placeId, ...place }));
  },

  /**
   * Add a new place
   * @param {*} data the place's data
   * @return {Promise}
   */
  placeAdd(data) {
    // 1. Use the use client Firebase Firestore API - this could be disabled in the Firestore rules
    // so that only Firebase Functions should be used
    // return places
    //   .add(data)
    //   .then(/*FirebaseFirestore.DocumentReference>*/ docRef => docRef.get())
    //   .then(/*FirebaseFirestore.DocumentSnapshot>*/ docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() }));

    // 2. Use the Firebase HTTPS function (e.g. using normal fetch/axios)
    // return fetch('https://us-central1-ma-place.cloudfunctions.net/dbAddPlaceWeb', {
    //   method: 'POST',
    //   headers: {
    //     // NOTE: this is obligatory for JSON encoded data so that the Express 'body-parser' to parse it properly
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(data)
    // }).then(res => res.json());

    // 3. Use the Firebase Callable function
    return placeUploader(data).then(result => result.data);
  },

  /**
   * Delete an existing place
   * @param {String} placeId The place id to update
   * @return {Promise}
   */
  placeDelete(placeId) {
    // use client Firebase Firestore API
    return places.doc(placeId).delete();
  }
};
