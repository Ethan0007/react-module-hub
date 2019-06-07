"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._get = _get;
exports._pick = _pick;
exports._isEmpty = _isEmpty;
exports._mapObject = _mapObject;

/**
 * Utilities
 */
function _get(obj, path) {
  var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  return String.prototype.split.call(path, /[,[\].]+?/).filter(Boolean).reduce(function (a, c) {
    return Object.hasOwnProperty.call(a, c) ? a[c] : defaultValue;
  }, obj);
}

function _pick(object, keys) {
  return keys.reduce(function (obj, key) {
    if (object && object.hasOwnProperty(key)) {
      obj[key] = object[key];
    }

    return obj;
  }, {});
}

function _isEmpty(obj) {
  return [Object, Array].includes((obj || {}).constructor) && !Object.entries(obj || {}).length;
}

function _mapObject(object, mapFn) {
  return Object.keys(object).reduce(function (result, key) {
    result[key] = mapFn(object[key]);
    return result;
  }, {});
}