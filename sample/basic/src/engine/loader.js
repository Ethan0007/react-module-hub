"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Loading = _interopRequireDefault(require("./components/Loading"));

var _lodash = _interopRequireDefault(require("lodash.get"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Responsible for loading an async module.
 */
var Loader =
/*#__PURE__*/
function () {
  // Holds the loader function from user
  // When module is fetched
  // Holds the module constructor
  // When module is instaitated
  // Holds the module instance (only singleton)
  // Alias for instance (only singleton)
  // Loading component
  // Render content component
  // Main component that shows loading or the content
  function Loader(engine, loader) {
    _classCallCheck(this, Loader);

    _defineProperty(this, "_engine", null);

    _defineProperty(this, "_loader", null);

    _defineProperty(this, "_fetched", false);

    _defineProperty(this, "_module", null);

    _defineProperty(this, "loaded", false);

    _defineProperty(this, "instance", null);

    _defineProperty(this, "$", null);

    _defineProperty(this, "Loading", _Loading["default"]);

    _defineProperty(this, "Content", null);

    _defineProperty(this, "View", null);

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
    value: function _fetch() {
      var _this = this;

      // Loading the module
      return this._loader().then(function (module) {
        // Transfer flags loader to contructor
        module = module["default"];
        module.isSingleton = _this._loader.isSingleton;
        module.module = _this._loader.module;
        _this._module = module;
        _this._fetched = true;
        return module;
      });
    }
    /**
     * Load and creates an instance for async module.
     * 
     * @param {getter} getter 
     * Module getter to pass to module
     * @param {object} config 
     * Configuration for the module
     * @returns {promise}
     * Passing the module instance
     */

  }, {
    key: "load",
    value: function load() {
      var _this2 = this;

      var prom = this._fetched ? Promise.resolve(this._module) : this._fetch();
      return prom.then(function (Module) {
        var getter = _this2._engine.getter;
        var config = (0, _lodash["default"])(_this2._engine._config.modules, Module.module);

        if (_this2._loader.isSingleton) {
          if (!_this2.instance) {
            var instance = new Module(getter, config);
            _this2.instance = instance;
            _this2.$ = instance;
            _this2.loaded = true; // Trigger module's `start` and `ready` lifecycle

            var _prom = instance.start && instance.start(getter);

            var ready = function ready() {
              return instance.ready && instance.ready(getter);
            };

            if (_prom) _prom.then(ready);else ready();
          }

          return _this2.instance;
        }

        return new Module(getter, config);
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