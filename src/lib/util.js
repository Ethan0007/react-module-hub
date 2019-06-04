
/**
 * Utilities
 */

export function _get(obj, path, defaultValue = null) {
  return String.prototype.split.call(path, /[,[\].]+?/)
    .filter(Boolean)
    .reduce((a, c) => (Object.hasOwnProperty.call(a, c) ? a[c] : defaultValue), obj)
}

export function _pick(object, keys) {
  return keys.reduce((obj, key) => {
    if (object && object.hasOwnProperty(key)) {
      obj[key] = object[key]
    }
    return obj
  }, {})
}

export function _isEmpty(obj) {
  return [Object, Array].includes((obj || {}).constructor) && !Object.entries((obj || {})).length
}
