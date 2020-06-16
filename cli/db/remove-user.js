const { deleteFromCollection } = require('./utils');

/**
 * @param {admin.auth.Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @param {String} userId
 * @param {String} collUsers
 * @param {String} collEklers
 */
module.exports = async (auth, db, userId, collUsers, collEklers) => {
  if (!userId) throw Error('Missing userId');

  // delete from auth
  await auth.deleteUser(userId);

  // delete form 'users' DB
  await deleteFromCollection(db, collUsers, [userId]);
  console.log(`Removed ${userId} user from ${collUsers}`);

  // delete from 'eklers' DB
  // TODO: implement
};
