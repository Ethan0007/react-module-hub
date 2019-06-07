"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withModules = withModules;
exports.withRequiredModules = withRequiredModules;
exports.withOnlyModules = withOnlyModules;
exports.withOnlyRequiredModules = withOnlyRequiredModules;
exports.asModule = exports.createModule = createModule;
Object.defineProperty(exports, "EngineProvider", {
  enumerable: true,
  get: function get() {
    return _Provider["default"];
  }
});
exports.EngineContext = exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _redux = require("redux");

var _reactRedux = require("react-redux");

var _lodash = _interopRequireDefault(require("lodash.set"));

var _util = require("./lib/util");

var _storage = _interopRequireDefault(require("./lib/storage"));

var _getter = _interopRequireDefault(require("./getter"));

var _setter = _interopRequireDefault(require("./setter"));

var _loader = _interopRequireDefault(require("./loader"));

var _Provider = _interopRequireDefault(require("./components/Provider"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The prefixes
 */
var prefix = 'rngn';
var prefixState = prefix + 's:';
/**
 * Creates a react context component
 */

var EngineContext = _react["default"].createContext({});
/**
 * The module engine
 */


exports.EngineContext = EngineContext;

var Engine =
/*#__PURE__*/
function () {
  /**
   * Creates an instance
   * 
   * @param {object} config 
   * User configuration
   * @param {object} options 
   * Framework options
   */
  function Engine() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Engine);

    // True when everything is loaded and ready
    this.isReady = false; // Module getter

    this.getter = null; // Module setter

    this.setter = null; // Options for the framework

    this._options = null; // Holds the user configuration

    this._config = null; // Holds the global redux store

    this._store = null; // Holds the module constructors

    this._modules = {}; // Holds the singleton instances

    this._instances = {}; // Immediate async imports returned by registrar,
    // will also be cleared on ready

    this._imports = null; // Holds the root reducer, init method can consume it 
    // for creating the store

    this._reducers = {};

    this._setOptions(options);

    this._setConfig(config);

    this.getter = new _getter["default"](this);
    this.setter = new _setter["default"](this);
  }
  /**
   * Sets options
   * 
   * @param {object} options 
   * Options to check and clean
   */


  _createClass(Engine, [{
    key: "_setOptions",
    value: function _setOptions(options) {
      if (!options.storage) options.storage = new _storage["default"](prefix + 'x:');
      this._options = options;
    }
    /**
     * Starts the engine. Collects all modules from registrar.
     * 
     * @param {function} app 
     * A function that should return the root component
     * @param {function} registrar 
     * A function that adds modules
     * @returns {component}
     * The component from setup function
     */

  }, {
    key: "start",
    value: function start(app, registrar) {
      this._imports = registrar(this.setter) || [];
      return app(this);
    }
    /**
     * Initialize engine and loads all modules. It reads initials
     * state, calls the store creator function and invokes
     * "start" & "ready" to all added modules.
     * 
     * @param {component} root
     * The root component to re-render when needed
     * @param {function} setup 
     * A setup function that should return all needed things
     * @returns {promise}
     */

  }, {
    key: "init",
    value: function init(setup) {
      var _this = this;

      var args = null;

      var runSetup = function runSetup(initState) {
        var combinedReducer = null;
        var screens = {};
        var modals = {};
        var extras = {}; // Combine things from all modules

        for (var key in _this._modules) {
          if (_this._modules.hasOwnProperty(key)) {
            var mod = _this._modules[key]._module;

            if (mod) {
              if (mod.reducer) _this._reducers[key] = mod.reducer;
              if (mod.screens) Object.assign(screens, mod.screens);
              if (mod.modals) Object.assign(modals, mod.modals);
              if (mod.extra) extras[key] = mod.extra;
            }
          }
        }

        if (!(0, _util._isEmpty)(_this._reducers)) combinedReducer = (0, _redux.combineReducers)(_this._reducers); // Create setup data

        var setupResult;
        args = {
          rootReducer: combinedReducer,
          initialState: initState,
          navigationScreens: screens,
          navigationModals: modals,
          extras: extras // Run setup

        };
        if (setup) setupResult = setup(args); // Process result of setup

        var processResult = function processResult() {
          var result = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

          _this._setStore(result.store || (0, _redux.createStore)(combinedReducer || function (s) {
            return s;
          }, initState || {}));
        };

        if (setupResult instanceof Promise) return setupResult.then(processResult);
        processResult(setupResult);
      };

      var addImports = function addImports() {
        return Promise.all(_this._imports).then(function (results) {
          results.forEach(function (module) {
            _this.setter.addModule(module["default"]);
          });
        });
      };

      var loadModules = function loadModules() {
        var toLoad = [];

        for (var key in _this._modules) {
          if (_this._modules.hasOwnProperty(key)) {
            var mod = _this._modules[key];
            if (mod instanceof _loader["default"] && mod._loader.isSync) toLoad.push(mod.load());
          }
        }

        return Promise.all(toLoad);
      };

      var getInitialState = function getInitialState() {
        return _this._getInitialState();
      };

      var triggerStart = function triggerStart() {
        return _this._trigger('start');
      };

      var loadStartups = function loadStartups(startups) {
        return Promise.all(startups);
      };

      return Promise.resolve().then(getInitialState).then(runSetup).then(addImports).then(loadModules).then(triggerStart).then(loadStartups).then(function () {
        _this._imports.length = 0;
        _this._imports = null;
        _this.isReady = true;

        _this._trigger('ready');

        return args;
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
      return (0, _util._get)(this._config, pathKey, defaultValue);
    }
    /**
     * Returns the global store.
     * @returns {store}
     */

  }, {
    key: "getStore",
    value: function getStore() {
      return this._store;
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
      var state = {};
      var storage = this._options.storage;

      if (storage) {
        return storage.getAllKeys().then(function (keys) {
          var toGet = [];
          keys.forEach(function (key) {
            if (!key.startsWith(prefixState)) return;
            var path = key.split(':')[1];
            toGet.push(storage.getItem(key).then(function (value) {
              try {
                (0, _lodash["default"])(state, path, JSON.parse(value));
              } catch (error) {// TODO: put something here
              }
            }));
          });
          return Promise.all(toGet);
        }).then(function () {
          return state;
        });
      }

      return Promise.resolve({});
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
      this._store = store; // Observe those modules who set persist property

      for (var key in this._modules) {
        if (!this._modules.hasOwnProperty(key)) continue;
        var mod = this._modules[key]._module;
        if (mod && mod.persist) this._persistModule(mod);
      }
    }
  }, {
    key: "_persistModule",
    value: function _persistModule(mod) {
      var _this2 = this;

      if (mod.persist === true) {
        // Persist whole module
        this._persistState(mod.module);
      } else {
        // Should be array, persist by keys
        mod.persist.forEach(function (path) {
          _this2._persistState(mod.module + '.' + path);
        });
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
      var _this3 = this;

      var lastState;
      var storage = this._options.storage;

      var handleChange = function handleChange() {
        var currentState = (0, _util._get)(_this3._store.getState(), path);

        if (currentState !== lastState) {
          lastState = currentState; // Write to storage

          if (storage && path) storage.setItem(prefixState + path, JSON.stringify(currentState));
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
    value: function _trigger(event) {
      var moduleConfigs = this._config.modules;
      var results = [];

      for (var key in this._modules) {
        if (!this._modules.hasOwnProperty(key)) continue;
        var mod = this._modules[key];

        if (mod.loaded && mod.value[event]) {
          var res = mod.value[event](this.getter, moduleConfigs[key]);
          results.push(res);
        }
      }

      return results;
    }
  }]);

  return Engine;
}();

function mapStateToProps(moduleNames, state) {
  return moduleNames.reduce(function (result, name) {
    var val = state[name];
    if (val) result[name] = val;
    return result;
  }, {});
}

function checkModules(engine, moduleNames) {
  var missings = [];
  moduleNames.forEach(function (name) {
    if (!engine._modules[name]) missings.push(name);
  });
  return missings;
}
/**
 * Create a component that wraps the child with modules 
 * in the props.
 * 
 * All async module will provide `Loader` and sync ones
 * will provide instance of the module
 * 
 * @param {component} ChildComponent 
 * Child component for higher component
 * @param {array} moduleNames 
 * Array of string module names
 * @returns {component}
 * The HOC component
 */


function createComponentWithModules(ChildComponent, moduleNames, isRequired) {
  return function (props) {
    return _react["default"].createElement(EngineContext.Consumer, null, function (engine) {
      // Check for required modules
      if (isRequired) {
        var missing = checkModules(engine, moduleNames);
        if (missing.length) throw new Error("Missing required modules: ".concat(missing.join(', ')));
      }

      return _react["default"].createElement(ChildComponent, _objectSpread({
        engine: engine.getter,
        modules: engine.getter._getModules(moduleNames)
      }, props));
    });
  };
}
/**
 * An HOCs to inject modules to the component
 */


function withModules(ChildComponent) {
  for (var _len = arguments.length, moduleNames = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    moduleNames[_key - 1] = arguments[_key];
  }

  return (0, _reactRedux.connect)(function (state) {
    return {
      state: mapStateToProps(moduleNames, state)
    };
  })(createComponentWithModules(ChildComponent, moduleNames));
}

function withRequiredModules(ChildComponent) {
  for (var _len2 = arguments.length, moduleNames = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    moduleNames[_key2 - 1] = arguments[_key2];
  }

  return (0, _reactRedux.connect)(function (state) {
    return {
      state: mapStateToProps(moduleNames, state)
    };
  })(createComponentWithModules(ChildComponent, moduleNames, true));
}

function withOnlyModules(ChildComponent) {
  for (var _len3 = arguments.length, moduleNames = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    moduleNames[_key3 - 1] = arguments[_key3];
  }

  return createComponentWithModules(ChildComponent, moduleNames);
}

function withOnlyRequiredModules(ChildComponent) {
  for (var _len4 = arguments.length, moduleNames = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
    moduleNames[_key4 - 1] = arguments[_key4];
  }

  return createComponentWithModules(ChildComponent, moduleNames, true);
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


var _default = Engine;
exports["default"] = _default;