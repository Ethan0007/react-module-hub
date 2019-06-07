"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * This is a polyfill for asyncStorage that's 
 * using localStorage
 */
var Storage =
/*#__PURE__*/
function () {
  function Storage(key) {
    _classCallCheck(this, Storage);

    try {
      localStorage.setItem(key, 'LS');
      localStorage.removeItem(key);
      this.available = true;
    } catch (e) {
      this.available = false;
    }
  }

  _createClass(Storage, [{
    key: "setItem",
    value: function setItem(key, val) {
      if (this.available) localStorage.setItem(key, val);
      return Promise.resolve();
    }
  }, {
    key: "getItem",
    value: function getItem(key) {
      var val = null;
      if (this.available) val = localStorage.getItem(key);
      return Promise.resolve(val);
    }
  }, {
    key: "getAllKeys",
    value: function getAllKeys() {
      return Promise.resolve(this.available ? Object.keys(localStorage) : []);
    }
  }]);

  return Storage;
}();

var _default = Storage;
exports["default"] = _default;