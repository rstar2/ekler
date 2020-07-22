/**
 *
 * @param {Number} count
 * @param {String} name
 */
export function pluralize(count, name) {
  if (count > 1) name = name + 's';
  return name;
}
