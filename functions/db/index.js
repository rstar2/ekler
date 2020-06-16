/**
 * Removes any null, undefined values from the object.
 * Looks into nested objects also and arrays if necessary
 * @param {Object} obj
 * @param {Boolean} skipNestedObj
 * @param {Boolean} skipArrays
 * @return {Object}
 */
const prune = (obj, skipNestedObj = false, skipArrays = false) => {
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    // obj[key] === 'object' is for Object and Arrays - and it will work as expected
    // if arrays are not required to be pruned then Array.isArray() will be used
    if (value === undefined || value === null) {
      delete obj[key];
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        // this is real array
        !skipArrays && prune(value);
      } else {
        // this is real object
        !skipNestedObj && prune(value);
      }
    }
  });
  return obj;
};

/**
 * @param {firebase.firestore.Firestore} db
 * @param {String} collEklers
 * @param {String} collHistory
 */
module.exports = (db, collEklers, collHistory) => {
  // get the Firestore collections
  const eklers = db.collection(collEklers);
  const history = db.collection(collHistory);

  return {
    /**
     * Add new "history-record" when a new Ekler is added
     * @return {Promise}
     */
    async addEkler({ to, from, count }) {
      if (!count || count < 0) throw new Error('Count must be positive number');

      const fromUser = await eklers
        .doc(from)
        .get()
        .then(docSnapshot => docSnapshot.data());

      const fromToCount = fromUser && fromUser[to];

      const toUser = await eklers
        .doc(to)
        .get()
        .then(docSnapshot => docSnapshot.data());
      const toFromCount = toUser && toUser[from];

      // 1. check if there's already a relation "from=>to"
      if (fromToCount) {
        await eklers.doc(from).update({
          [to]: fromToCount + count
        });
      } else if (!toFromCount) {
        // 2. check if there's already relation "to=>from" and if not create a new "from=>to" one

        await eklers.doc(from).set({
          [to]: count
        });
      } else {
        // 3. so there's already "to=>from" - this means to update/remove it
        // lets say it's 5

        const newToFromCount = toFromCount - count;

        if (newToFromCount > 0) {
          // if count is 3 then newToFromCount will be 2
          await eklers.doc(to).update({
            [from]: newToFromCount
          });
        } else {
          // no "to=>from" relation any more
          await eklers.doc(to).delete();

          if (newToFromCount < 0) {
            // if count is 7 then newToFromCount will be -2, e.g. create opposite relation "from=>to"
            await eklers.doc(from).set({
              [to]: -newToFromCount
            });
          }
        }
      }

      return true;

      //   return eklers.add({ to, from, count, createdAt });
      // .then(/*FirebaseFirestore.DocumentReference>*/ docRef => docRef.get())
      // .then(
      //   /*FirebaseFirestore.DocumentSnapshot>*/ docSnapshot => {
      //     const data = docSnapshot.data();

      //     return { id: docSnapshot.id, ...data };
      //   }
      // );
    },

    /**
     * Add new "history-record" when a new Ekler is added
     * @return {Promise}
     */
    async addHistory({ to, from, count, createdAt }) {
      createdAt = createdAt || Date.now();

      // NOTE: Behind the scenes, .add(...) and .doc().set(...) are completely equivalent
      return history.add({ to, from, count, createdAt });
      // .then(/*FirebaseFirestore.DocumentReference>*/ docRef => docRef.get())
      // .then(
      //   /*FirebaseFirestore.DocumentSnapshot>*/ docSnapshot => {
      //     const data = docSnapshot.data();

      //     return { id: docSnapshot.id, ...data };
      //   }
      // );
    }
  };
};
