/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {String} collectionPath
 * @param {Number} batchSize
 */
function deleteCollection(db, collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, batchSize, resolve, reject);
  });
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {FirebaseFirestore.Query} query
 * @param {Number} batchSize
 * @param {Function} resolve
 * @param {Function} reject
 */
function deleteQueryBatch(db, query, batchSize, resolve, reject) {
  query
    .get()
    .then(snapshot => {
      // When there are no documents left, we are done
      if (snapshot.size == 0) {
        return 0;
      }

      // Delete documents in a batch
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));

      return batch.commit().then(() => snapshot.size);
    })
    .then(numDeleted => {
      if (numDeleted === 0) {
        resolve();
        return;
      }

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(() => {
        deleteQueryBatch(db, query, batchSize, resolve, reject);
      });
    })
    .catch(reject);
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {String} collectionPath
 * @param {String[]} docIds
 */
function deleteFromCollection(db, collectionPath, docIds) {
  // Delete documents in a batch
  const batch = db.batch();

  const collectionRef = db.collection(collectionPath);

  docIds.forEach(docId => {
    batch.delete(collectionRef.doc(docId));
  });

  // Commit the batch
  return batch.commit();
}

/**
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {String} collectionPath
 * @param {Array} docs
 */
function addToCollection(db, collectionPath, docs) {
  // Get a new write batch
  const batch = db.batch();

  const collectionRef = db.collection(collectionPath);

  docs.forEach(doc => {
    if (doc.id) {
      // create a new document with predefined path (e.g. ID)
      const { id, ..._doc } = doc;
      batch.set(collectionRef.doc(id), _doc);
    } else {
      // create a new document with auto-generated path (e.g. ID)
      batch.set(collectionRef.doc(), doc);
    }
  });

  // Commit the batch
  return batch.commit();
}

module.exports = {
  deleteCollection,
  addToCollection,
  deleteFromCollection
};
