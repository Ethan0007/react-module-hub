"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = require("react");

var _Empty = _interopRequireDefault(require("./components/Empty"));

var _Loading = _interopRequireDefault(require("./components/Loading"));

var _util = require("./lib/util");

var _redux = require("redux");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Responsible for loading an async module.
 */
var Loader =
/*#__PURE__*/
function () {
  function Loader(engine, loader) {
    _classCallCheck(this, Loader);

    // When module is fetched
    this._fetched = false; // Holds the module constructor

    this._module = null; // When module is instaitated

    this.loaded = false; // Holds the module instance (only singleton)

    this.value = null; // Alias for instance (only singleton)

    this.$ = null; // Loading component

    this.Loading = _Empty["default"]; // Render view component

    this.View = _Empty["default"]; // Component that shows Loading or View

    this.ViewWithLoading = (0, _Loading["default"])(this);
    this._engine = engine;
    this._loader = loader;
    if (engine._options.loading) this.Loading = engine._options.loading;
  }
  /**
   * Fetch the module asynchronously. This does
   * not instantiate the module.
   * 
   * @returns {promise}
   * Passing the module constructor
   */


  _createClass(Loader, [{
    key: "_fetch",
    value: function _fetch(required) {
      var _this = this;

      if (!this._loader) {
        if (required) throw new Error('Loader is not referenced to a module');
        return Promise.resolve(null);
      } // Loading the module


      return this._loader().then(function (module) {
        // Transfer loader flags to constructor
        module = module["default"];
        module.isSingleton = _this._loader.isSingleton;
        module.isSync = _this._loader.isSync;
        module.module = _this._loader.module;
        _this._module = module;
        _this._fetched = true; // Replace reducer

        if (!module.isSync && module.reducer) {
          _this._engine._persistModule(module);

          _this._engine._store.replaceReducer((0, _redux.combineReducers)(_objectSpread({}, _this._engine._reducers, _defineProperty({}, module.module, module.reducer))));
        }

        return module;
      });
    }
  }, {
    key: "_createInstance",
    value: function _createInstance(Module, comp) {
      var getter = this._engine.getter;
      var config = (0, _util._get)(this._engine._config.modules, Module.module);
      var instance;

      if (Module.isSingleton) {
        if (!this.value) {
          instance = new Module(getter, config);
          this.value = instance;
          this.$ = instance;
          this.loaded = true; // Attach main content component

          if (instance.view) this.View = instance.view(); // Trigger module's `start` and `ready` lifecycle

          if (!Module.isSync) {
            var prom = instance.start && instance.start(getter);

            var ready = function ready() {
              return instance.ready && instance.ready(getter);
            };

            if (prom) prom.then(ready);else ready();
          }
        } else {
          instance = this.value;
        }
      } else {
        instance = new Module(getter, config);
      } // Force update if user provided a component


      if (comp instanceof _react.Component) comp.forceUpdate();
      return instance;
    }
    /**
     * Load and creates an instance for async module.
     * 
     * @param {component} comp
     * The component to mount the loader
     * @returns {promise}
     * Passing the module instance
     */

  }, {
    key: "load",
    value: function load(comp) {
      var _this2 = this;

      var prom = this._fetched ? Promise.resolve(this._module) : this._fetch();
      return prom.then(function (Module) {
        if (!Module) return null;
        return _this2._createInstance(Module, comp);
      });
    }
  }, {
    key: "loadRequired",
    value: function loadRequired(comp) {
      var _this3 = this;

      var prom = this._fetched ? Promise.resolve(this._module) : this._fetch(true);
      return prom.then(function (Module) {
        return _this3._createInstance(Module, comp);
      });
    }
  }, {
    key: "loadToState",
    value: function loadToState(comp, name) {
      return this.load().then(function (instance) {
        comp.setState(function () {
          return _defineProperty({}, name || instance.constructor.module, instance);
        });
        return instance;
      });
    }
  }, {
    key: "loadRequiredToState",
    value: function loadRequiredToState(comp, name) {
      return this.loadRequired().then(function (instance) {
        comp.setState(function () {
          return _defineProperty({}, name || instance.constructor.module, instance);
        });
        return instance;
      });
    }
  }]);

  return Loader;
}();
/**
 * Export
 */


var _default = Loader;
exports["default"] = _default;