"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withModules = withModules;
exports.withRequiredModules = withRequiredModules;
exports.asModule = exports.createModule = createModule;
exports.CoreContext = exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _redux = require("redux");

var _lodash = _interopRequireDefault(require("lodash.get"));

var _lodash2 = _interopRequireDefault(require("lodash.set"));

var _lodash3 = _interopRequireDefault(require("lodash.pick"));

var _lodash4 = _interopRequireDefault(require("lodash.isempty"));

var _getter = _interopRequireDefault(require("./getter"));

var _setter = _interopRequireDefault(require("./setter"));

var _loader = _interopRequireDefault(require("./loader"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * The prefix to use when saving the 
 * state to storage
 */
var prefix = '__CORE__:';
/**
 * Creates a react context for HOC
 */

var CoreContext = _react["default"].createContext({});
/**
 * The module core
 */


exports.CoreContext = CoreContext;

var Core =
/*#__PURE__*/
function () {
  // True when everything is loaded and ready
  // Module getter
  // Module setter
  // Options for the framework
  // Holds the user configuration
  // Holds the global redux store
  // Holds the module constructors
  // Holds the singleton instances
  // Promises returned by start lifecycle,
  // will be cleared on ready
  // Immediate async imports returned by registrar,
  // will also be cleared on ready
  // Holds the root reducer, init method can consume it 
  // for creating the store

  /**
   * Creates an instance
   * 
   * @param {object} config 
   * User configuration
   * @param {object} options 
   * Framework options
   */
  function Core() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Core);

    _defineProperty(this, "isReady", false);

    _defineProperty(this, "getter", null);

    _defineProperty(this, "setter", null);

    _defineProperty(this, "_options", null);

    _defineProperty(this, "_config", null);

    _defineProperty(this, "_store", null);

    _defineProperty(this, "_modules", {});

    _defineProperty(this, "_instances", {});

    _defineProperty(this, "_startups", []);

    _defineProperty(this, "_imports", null);

    _defineProperty(this, "_reducers", null);

    this.getter = new _getter["default"](this);
    this.setter = new _setter["default"](this);
    this._options = options;

    this._setConfig(config);
  }
  /**
   * Starts the core. Collects all necessary data for it
   * to get initialized.
   * 
   * @param {function} setup 
   * A setup function that should return the root component
   * @param {function} registrar 
   * A function that adds modules
   * @returns {component}
   * The component from setup function
   */


  _createClass(Core, [{
    key: "start",
    value: function start(setup, registrar) {
      var reducers = {};
      var screens = {};
      var modals = {};
      var extra = {}; // First of all, get all modules

      this._imports = registrar(this.setter) || []; // Parsing

      for (var key in this._modules) {
        if (this._modules.hasOwnProperty(key)) {
          var mod = this._modules[key];
          if (mod instanceof _loader["default"]) continue;
          if (mod.reducers) reducers[key] = mod.reducers;
          if (mod.screens) Object.assign(screens, mod.screens);
          if (mod.modals) Object.assign(modals, mod.modals); // Extra data to pass

          if (mod.extra) extra[key] = mod.extra;
        }
      } // Combine all reducers from modules


      if (!(0, _lodash4["default"])(reducers)) this._reducers = (0, _redux.combineReducers)(reducers); // Call component setup from user

      return setup(this, {
        screens: screens,
        modals: modals,
        extra: extra
      });
    }
    /**
     * Initialize core and loads all modules. It reads initials
     * state, calls the store creator function and invokes
     * "start" & "ready" to all added modules.
     * 
     * @param {function} storeCreator 
     * A function that should return the store
     * @returns {promise}
     */

  }, {
    key: "init",
    value: function init(storeCreator) {
      var _this = this;

      var linkImmediateAsyncModules = function linkImmediateAsyncModules(results) {
        results.forEach(function (module) {
          _this.setter.addModule(module["default"]);
        });
      };

      return this._getInitialState().then(function (initState) {
        if (storeCreator && _this._reducers) {
          var store = storeCreator(_this._reducers, initState);
          if (store) _this._setStore(store);
        }
      }).then(function () {
        return Promise.all(_this._imports);
      }).then(linkImmediateAsyncModules).then(function () {
        return _this._trigger('start', _this._startups);
      }).then(function () {
        return Promise.all(_this._startups);
      })["finally"](function () {
        _this._startups.length = 0;
        _this._startups = null;
        _this._imports.length = 0;
        _this._imports = null;
      }).then(function () {
        _this.isReady = true;

        _this._trigger('ready');
      });
    }
    /**
     * Get a value from user configuration.
     * 
     * @param {string} pathKey
     * The path to configuration value
     * @param {any} defaultValue 
     * Default value if config is undefined
     * @returns {any}
     */

  }, {
    key: "getConfig",
    value: function getConfig(pathKey, defaultValue) {
      return (0, _lodash["default"])(this._config, pathKey, defaultValue);
    }
    /**
     * Gets the initial state from storage, if available
     * 
     * @returns {object}
     * The initial state
     */

  }, {
    key: "_getInitialState",
    value: function _getInitialState() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var state = {};
        var storage = _this2._options.storage;
        var hasPersist = false;

        var _loop = function _loop(key) {
          if (!_this2._modules.hasOwnProperty(key)) return "continue";
          var mod = _this2._modules[key];
          if (mod instanceof _loader["default"]) return "continue";

          if (mod.persist && storage) {
            hasPersist = true;

            if (mod.persist === true) {
              storage.getItem(prefix + mod.module).then(function (value) {
                return (0, _lodash2["default"])(state, mod.module, JSON.parse(value || '{}'));
              }).then(resolve)["catch"](reject);
            } else {
              var promises = [];
              mod.persist.forEach(function (path) {
                path = mod.module + '.' + path;
                promises.push(storage.getItem(prefix + path).then(function (value) {
                  try {
                    (0, _lodash2["default"])(state, path, JSON.parse(value));
                  } catch (_unused) {// Nothing to do
                  }
                }));
              });
              Promise.all(promises).then(function () {
                return resolve(state);
              })["catch"](reject);
            }
          }
        };

        for (var key in _this2._modules) {
          var _ret = _loop(key);

          if (_ret === "continue") continue;
        }

        if (!hasPersist) resolve({});
      });
    }
    /**
     * Sets the user configuration.
     * 
     * @param {object} config 
     * @returns {undefined}
     */

  }, {
    key: "_setConfig",
    value: function _setConfig(config) {
      if (!config.modules) config.modules = {};
      this._config = config;
    }
    /**
     * Sets the global redux store.
     * 
     * @param {store} store 
     * The redux store
     * @returns {undefined}
     */

  }, {
    key: "_setStore",
    value: function _setStore(store) {
      var _this3 = this;

      this._store = store; // Observe those modules who set persist property

      var _loop2 = function _loop2(key) {
        if (!_this3._modules.hasOwnProperty(key)) return "continue";
        var mod = _this3._modules[key];
        if (mod instanceof _loader["default"]) return "continue";

        if (mod.persist) {
          if (mod.persist === true) {
            // Persist whole module
            _this3._persistState(mod.module);
          } else {
            // Should be array, persist by keys
            mod.persist.forEach(function (path) {
              _this3._persistState(mod.module + '.' + path);
            });
          }
        }
      };

      for (var key in this._modules) {
        var _ret2 = _loop2(key);

        if (_ret2 === "continue") continue;
      }
    }
    /**
     * Saves a value from state to storage.
     * 
     * @param {string} path 
     * The path to value to persist in state
     * @returns {function}
     * The unsubscribe function generated by 
     * redux's subscribe
     */

  }, {
    key: "_persistState",
    value: function _persistState(path) {
      var _this4 = this;

      var lastState;
      var storage = this._options.storage;

      var handleChange = function handleChange() {
        var currentState = (0, _lodash["default"])(_this4._store.getState(), path);

        if (currentState !== lastState) {
          lastState = currentState; // Write to storage

          if (storage && path) storage.setItem(prefix + path, JSON.stringify(currentState));
        }
      };

      var unsubscribe = this._store.subscribe(handleChange);

      handleChange();
      return unsubscribe;
    }
    /**
     * Invokes a method in all singleton modules.
     * 
     * @param {string} event 
     * The method name to invoke in module
     * @param {array} results 
     * The placeholder to hold the result of
     * invoked method
     */

  }, {
    key: "_trigger",
    value: function _trigger(event, results) {
      var moduleConfigs = this._config.modules;

      for (var key in this._instances) {
        if (this._instances.hasOwnProperty(key)) {
          var instance = this._instances[key];

          if (instance && instance[event]) {
            var res = instance[event](this.getter, moduleConfigs[key]);
            if (results) results.push(res);
          }
        }
      }
    }
  }]);

  return Core;
}();
/**
 * To get a required or non-required module.
 * 
 * @param {core} core 
 * @param {array} modules 
 * @param {boolean} isRequired 
 * @returns {object}
 */


function getModules(core, modules, isRequired) {
  return isRequired ? core.getter._getRequiredModules(modules) : core.getter._getModules(modules);
}
/**
 * Create a component that wraps the child with modules 
 * in the props.
 * 
 * @param {component} ChildComponent 
 * Child component for higher component
 * @param {array} modules 
 * Array of string module names
 * @param {boolean} isRequired 
 * @returns {component}
 * The HOC component
 */


function createComponentWithModules(ChildComponent, modules, isRequired) {
  return (
    /*#__PURE__*/
    function (_React$Component) {
      _inherits(_class, _React$Component);

      function _class() {
        _classCallCheck(this, _class);

        return _possibleConstructorReturn(this, _getPrototypeOf(_class).apply(this, arguments));
      }

      _createClass(_class, [{
        key: "render",
        value: function render() {
          var _this5 = this;

          return _react["default"].createElement(CoreContext.Consumer, null, function (core) {
            var store = core.getter.getStore();
            return _react["default"].createElement(ChildComponent, _objectSpread({
              core: core.getter,
              modules: getModules(core, modules, isRequired),
              state: store && (0, _lodash3["default"])(store.getState(), modules)
            }, _this5.props));
          });
        }
      }]);

      return _class;
    }(_react["default"].Component)
  );
}
/**
 * An HOC to inject modules to the component
 */


function withModules(ChildComponent) {
  for (var _len = arguments.length, modules = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    modules[_key - 1] = arguments[_key];
  }

  return createComponentWithModules(ChildComponent, modules);
}
/**
 * An HOC to inject required modules to the component
 */


function withRequiredModules(ChildComponent) {
  for (var _len2 = arguments.length, modules = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    modules[_key2 - 1] = arguments[_key2];
  }

  return createComponentWithModules(ChildComponent, modules, true);
}
/**
 * Helper function to create a module.
 * 
 * @param {string} name 
 * Name of the module
 * @param {class} module 
 * The module constructor
 * @param {object} options 
 * The options to inject to constructor
 */


function createModule(name, module) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  module.module = name;
  Object.assign(module, options);
  return module;
}
/**
 * Export
 */


var _default = Core;
exports["default"] = _default;