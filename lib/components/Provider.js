"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _reactRedux = require("react-redux");

var _ = require("..");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = function _default(props) {
  var engine = props.engine;
  var store = engine.getStore();
  return engine.isReady ? _react["default"].createElement(_.EngineContext.Provider, {
    value: engine
  }, !store ? props.children : _react["default"].createElement(_reactRedux.Provider, {
    store: store
  }, props.children)) : props.loading || null;
};

exports["default"] = _default;