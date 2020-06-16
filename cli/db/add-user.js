const { addToCollection } = require('./utils');

/**
 * @param {admin.auth.Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @param {String} email
 * @param {String} password
 * @param {String?} name
 * @param {String?} title
 * @param {String} collUsers
 */
module.exports = async (auth, db, { email, password, name, title }, collUsers) => {
  if (!email) throw Error('Missing email');
  if (!password) throw Error('Missing password');

  // create in auth
  const userRecord = await auth.createUser({
    email,
    password,
    emailVerified: true // no need user to verify it
  });

  // add in 'users' DB
  const user = { id: userRecord.uid };
  // cannot add undefined fields in the document - so add them explicitly
  if (name) user.name = name;
  if (title) user.title = title;

  await addToCollection(db, collUsers, [user]);

  console.log(`Added new user to ${collUsers}`);
};
