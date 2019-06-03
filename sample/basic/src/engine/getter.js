"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _events = _interopRequireDefault(require("events"));

var _lodash = _interopRequireDefault(require("lodash.get"));

var _loader = _interopRequireDefault(require("./loader"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

  // Holds the engine.
  function ModuleGetter(engine) {
    var _this;

    _classCallCheck(this, ModuleGetter);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ModuleGetter).call(this));

    _defineProperty(_assertThisInitialized(_this), "_engine", null);

    _this._engine = engine;
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

      if (!module) return null;
      return this._instantiateModule(module, name);
    }
    /**
     * Returns an instance of the module. Same with
     * `getModule` method, but throws `error` if not found.
     * 
     * @param {string} name 
     * The name of the module to get
     * @returns {module|loader}
     * The module instance
     */

  }, {
    key: "getRequiredModule",
    value: function getRequiredModule(name) {
      var module = this._engine._modules[name.toLowerCase()];

      if (!module) throw new Error("Module \"".concat(name, "\" not found"));
      return this._instantiateModule(module, name);
    }
    /**
     * Create an instance of module. If singleton, will save
     * the instance to collection pool.
     * 
     * If the module is async, return `Loader`
     * 
     * @param {module} Module 
     * Module to create instance
     * @param {string} name 
     * Name of module
     * @returns {instance|loader}
     * Instance of module or `Loader` for async
     */

  }, {
    key: "_instantiateModule",
    value: function _instantiateModule(Module, name) {
      var instances = this._engine._instances;
      var config = (0, _lodash["default"])(this._engine._config.modules, name); // Deal with async module

      if (Module instanceof _loader["default"]) return Module; // Continue creating an instance

      if (Module.isSingleton) {
        var instance = instances[name];

        if (!instance) {
          instance = new Module(this._engine.getter, config);
          instances[name] = instance;
        }

        return instance;
      }

      return new Module(this._engine.getter, config);
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

      return names.reduce(function (o, k) {
        o[k] = _this2.getModule(k);
        return o;
      }, {});
    }
    /**
     * Returns multiple modules at onces.
     * Throws `error` if one is not found.
     * 
     * @param {array} names 
     * Array of module names to get
     */

  }, {
    key: "_getRequiredModules",
    value: function _getRequiredModules(names) {
      var _this3 = this;

      return names.reduce(function (o, k) {
        o[k] = _this3.getRequiredModule(k);
        return o;
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