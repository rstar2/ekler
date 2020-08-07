/**
 *
 * @param {Number} count
 * @param {String} name
 */
export function pluralize(count, name) {
  if (count > 1) name = name + 's';
  return name;
}

/**
 * Removes any null, undefined values from the object.
 * Looks into nested objects also and arrays if necessary
 * @param {Object} obj
 * @param {Boolean} skipNestedObj
 * @param {Boolean} skipArrays
 * @return {Object}
 */
export function prune(obj, skipNestedObj = false, skipArrays = false) {
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
}
