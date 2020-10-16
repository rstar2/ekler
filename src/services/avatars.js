import { storage } from '../lib/firebase';

const avatarsRef = storage.ref().child('avatars');
const DEFAULT = 'avatar.png';

// a single promise for the default avatar - reuse it where needed
let avatarDef = null;

/**
 * Local server default avatar
 * @constant
 */
export const DEF = `img/${DEFAULT}`;

/**
 * Lazily create the default avatar Promise
 * @return {Promise<String>} always valid
 */
const getAvatarDef = () => {
  if (!avatarDef) {
    // avatarDef = avatarsRef.child(DEFAULT).getDownloadURL();

    // get it from the local webserver
    avatarDef = Promise.resolve(DEF);
    // avatarDef = Promise.resolve('');
  }
  return avatarDef;
};

/**
 * Get a avatar URL wrapped in a Promise
 * @param {{id: String}} user user data with optional avatar path in it
 * @param {Boolean} useDefault whether or not to use the default when there's no avatar, or real one failed
 * @return {Promise<String>} valid url string, or null if no avatar is set and 'useDefault' is 'false'
 */
export async function getAvatar(user, useDefault = true) {
  // just load from the user's available avatarURL
  if (user.avatarURL) return Promise.resolve(user.avatarURL);
  return useDefault ? getAvatarDef() : Promise.resolve(null);

//   const avatarName = user.id;

//   // if no avatar set then always return the default
//   if (!avatarName) return useDefault ? getAvatarDef() : Promise.resolve(null);

//   // otherwise try do download it and if fail then return the default
//   return avatarsRef
//     .child(avatarName)
//     .getDownloadURL()
//     .catch(err => {
//       if (useDefault) return getAvatarDef();
//       // rethrow error
//       throw err;
//     });
}

/**
 * Upload the avatar and return it's URL wrapped in a Promise
 * @param {{id: String}} user user data with optional avatar path in it
 * @param {Blob|Uint8Array|ArrayBuffer} avatarData avatar's data
 * @return {Promise<String}
 */
export async function uploadAvatar(user, avatarData) {
  const avatarName = user.id;
  const ref = avatarsRef.child(avatarName);

  // if no data - remove
  if (!avatarData) return ref.delete().then(() => null);

  // otherwise - update
  return ref.put(avatarData).then(() => ref.getDownloadURL());
}
