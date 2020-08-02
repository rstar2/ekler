const admin = require('firebase-admin');
const /* firebase.firestore.Firestore */ db = admin.firestore();
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

let /* firebase.firestore.CollectionReference<DocumentData> */ users;
let /* firebase.firestore.CollectionReference<DocumentData> */ eklers;
let /* firebase.firestore.CollectionReference<DocumentData> */ history;

module.exports = {
  /**
   * Initialize the DB
   * @param {String} collUsers
   * @param {String} collEklers
   * @param {String} collHistory
   */
  init(collUsers, collEklers, collHistory) {
    // get the Firestore collections
    users = db.collection(collUsers);
    eklers = db.collection(collEklers);
    history = db.collection(collHistory);
  },

  /**
   * Add new owed eklers from someone to someone
   * @param {String} from user to add (e.g. owe new) eklers to the other 'to'
   * @param {String} to user to whom someone add (e.g. owe new) eklers
   * @return {Promise}
   */
  async eklersAdd({ from, to, count }) {
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
        [to]: {
          owes: fromToCount.owes + count,
          checkout: !!fromToCount.checkout
        }
      });
    } else if (!toFromCount) {
      // 2. check if there's already relation "to=>from" and if not create a new "from=>to" one

      await eklers.doc(from).set(
        {
          [to]: {
            owes: count
          }
        },
        { merge: true }
      );
    } else {
      // 3. so there's already "to=>from" - this means to update/remove it
      // lets say it's 5

      const newToFromCount = toFromCount.owes - count;

      if (newToFromCount > 0) {
        // if count is 3 then newToFromCount will be 2
        await eklers.doc(to).update({
          [from]: {
            owes: newToFromCount,
            checkout: !!toFromCount.checkout
          }
        });
      } else {
        // no "to=>from" relation any more
        await eklers.doc(to).delete();

        if (newToFromCount < 0) {
          // if count is 7 then newToFromCount will be -2, e.g. create opposite relation "from=>to"
          await eklers.doc(from).set(
            {
              [to]: {
                owes: -newToFromCount
              }
            },
            { merge: true }
          );
        }
      }
    }

    return true;
  },

  /**
   * Checkout (request owed) eklers from someone
   * @param {String} from user who wants/requests his/hers owed eklers
   * @param {String} to user (owing the eklers) from whom the other 'from' user requests his eklers
   * @return {Promise}
   */
  async eklersCheckout({ from, to }) {
    const toUser = await eklers
      .doc(to)
      .get()
      .then(docSnapshot => docSnapshot.data());

    if (!toUser) throw new Error(`${to} is not owing any eklers to anybody`);

    const toFromCount = toUser[from];

    if (!toFromCount) throw new Error(`${to} is not owing any eklers to ${from}`);

    const owedEklers = toFromCount.owes;

    if (!owedEklers) throw new Error(`${to} is not owing any eklers to ${from} -internal error`);

    if (toFromCount.checkout) {
      console.log(`${from} has already requested/checkout his eklers from ${to}`);
      return false;
    }

    await eklers.doc(to).update({
      [from]: {
        owes: owedEklers,
        checkout: true
      }
    });

    console.log(`${from} requested/checkout his eklers from ${to}`);

    return true;
  },

  /**
   * Add new "history-record" when a new Ekler is added
   * @param {String} type
   * @param {{ to:String, from:String, count:Number, createdAt:Number? }} data
   * @return {Promise}
   */
  async historyAdd(type, { from, to, count, createdAt }) {
    createdAt = createdAt || Date.now();

    // NOTE: Behind the scenes, .add(...) and .doc().set(...) are completely equivalent
    return history.add(prune({ type, from, to, count, createdAt }));
    // .then(/*FirebaseFirestore.DocumentReference>*/ docRef => docRef.get())
    // .then(
    //   /*FirebaseFirestore.DocumentSnapshot>*/ docSnapshot => {
    //     const data = docSnapshot.data();

    //     return { id: docSnapshot.id, ...data };
    //   }
    // );
  },

  /**
   * History enum types
   */
  history: {
    ADD: 'ADD',
    CHECKOUT: 'CHECKOUT'
  },

  /**
   * Get "user" instance
   * @param {String} uid
   */
  async userGet(uid) {
    return users
      .doc(uid)
      .get()
      .then(docSnapshot => docSnapshot.data());
  },

  /**
   * Add a FCM registration-token to a user
   * @param {String} uid
   * @param {String} token
   * @deprecated Add/Update of the tokens is done from the client Firebase SDK
   */
  async userAddFCMToken(uid, token) {
    const user = users.doc(uid).update({
      fcmTokens: admin.firestore.FieldValue.arrayUnion({ token })
    });

    console.log(`Add new FCM token ${token} to user ${user.name}`);

    return user;
  },

  /**
   * Remove FCM registration-tokens assigned to a user
   * @param {String} uid
   * @param {Object[]} tokens
   */
  async userRemoveFcmTokens(uid, tokens) {
    const user = users.doc(uid).update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(tokens)
    });

    return user;
  }
};
