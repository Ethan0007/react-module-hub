"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = require("react");

var _events = _interopRequireDefault(require("events"));

var _lodash = _interopRequireDefault(require("lodash.keyby"));

var _loader = _interopRequireDefault(require("./loader"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

/**
 * Responsible to providing a module to another module.
 * 
 * This will be passed to module's `constructor`,
 * `start` and `ready` lifecycle.
 * 
 * This also provides event-bus feature 
 * using `EventEmitter` from node.
 * 
 */
var ModuleGetter =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(ModuleGetter, _EventEmitter);

  function ModuleGetter(engine) {
    var _this;

    _classCallCheck(this, ModuleGetter);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ModuleGetter).call(this));
    _this._engine = engine;
    _this._emptyLoader = new _loader["default"](_this._engine);
    return _this;
  }
  /**
   * Returns a configuration value.
   * 
   * @param {string} pathKey 
   * Path to value
   * @param {any} defaultValue 
   * Fallback value when undefined
   * @returns {any}
   * The config value
   */


  _createClass(ModuleGetter, [{
    key: "getConfig",
    value: function getConfig(pathKey, defaultValue) {
      return this._engine.getConfig(pathKey, defaultValue);
    }
    /**
     * Returns the global store.
     * @returns {store}
     */

  }, {
    key: "getStore",
    value: function getStore() {
      return this._engine._store;
    }
    /**
     * Returns an instance of the module. If the module
     * is added as a singleton, then it will return the
     * instance in the collection pool. instead of
     * creating new one.
     * 
     * For async modules, this will return `Loader`
     * 
     * @param {object} name 
     * The name of the module to get
     * @returns {module|loader|null}
     * The module instance, or null if not found, 
     * or `Loader` for async
     */

  }, {
    key: "getModule",
    value: function getModule(name) {
      var module = this._engine._modules[name.toLowerCase()];

      if (!module) return this._emptyLoader;
      return module;
    }
  }, {
    key: "getRequiredModule",
    value: function getRequiredModule(name) {
      var module = this._engine._modules[name.toLowerCase()];

      if (!module) throw new Error("Missing required module: ".concat(name));
      return module;
    }
    /**
     * Loads all loaders in object and re-render when component is passed.
     * 
     * @param {object} objLoaders 
     * Loaders in object
     * @param {component} comp 
     * Component to update state
     * @returns {object}
     * All loaded modules
     */

  }, {
    key: "loadAll",
    value: function loadAll(objLoaders, comp) {
      var toLoad = [];

      for (var key in objLoaders) {
        if (objLoaders.hasOwnProperty(key)) {
          var loader = objLoaders[key];
          toLoad.push(loader.load(null, null));
        }
      }

      return Promise.all(toLoad).then(function (results) {
        var objResults = (0, _lodash["default"])(results, 'constructor.module');
        if (comp instanceof _react.Component) comp.forceUpdate();
        return objResults;
      });
    }
  }, {
    key: "loadAllToState",
    value: function loadAllToState(objLoaders, comp) {
      this.loadAll(objLoaders).then(function (results) {
        if (comp instanceof _react.Component) comp.setState(function () {
          return results;
        });
        return results;
      });
    }
    /**
     * Returns multiple modules at once.
     * Provide `null` if one is not found.
     * 
     * @param {array} names 
     * Array of module names to get
     */

  }, {
    key: "_getModules",
    value: function _getModules(names) {
      var _this2 = this;

      return names.reduce(function (result, name) {
        result[name] = _this2.getModule(name);
        return result;
      }, {});
    }
  }]);

  return ModuleGetter;
}(_events["default"]);
/**
 * Export
 */


var _default = ModuleGetter;
exports["default"] = _default;