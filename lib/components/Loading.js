"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// eslint-disable-next-line no-unused-vars
var _default = function _default(module) {
  return function () {
    return _react["default"].createElement(module.loaded ? module.View : module.Loading);
  };
};

exports["default"] = _default;