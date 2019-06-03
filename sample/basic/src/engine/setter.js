"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _loader = _interopRequireDefault(require("./loader"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Responsible for adding modules to the engine.
 * This will be passed to `registrar` function 
 * in `start` method of engine
 */
var ModuleSetter =
/*#__PURE__*/
function () {
  // Holds the engine.
  function ModuleSetter(engine) {
    _classCallCheck(this, ModuleSetter);

    _defineProperty(this, "_engine", null);

    this._engine = engine;
  }
  /**
   * Returns a configuration value
   * 
   * @param {string} pathKey 
   * Path to value
   * @param {any} defaultValue 
   * Fallback value when undefined
   * @returns {any}
   * The config value
   */


  _createClass(ModuleSetter, [{
    key: "getConfig",
    value: function getConfig(pathKey, defaultValue) {
      return this._engine.getConfig(pathKey, defaultValue);
    }
    /**
     * Adds a scoped module to engine. Scoped modules are 
     * not referenced in engine when instantiating it.
     * 
     * @param {constructor} module 
     * The module constructor
     * @param {string} name 
     * Optional name to override the default
     * one in the module
     * @returns {undefined}
     */

  }, {
    key: "addScopeModule",
    value: function addScopeModule(module, name) {
      // If no module name, treat it as async module
      if (!module.module) {
        this._addScopeAsyncModule(module, name);

        return;
      }

      name = (name || module.module).toLowerCase();
      module.module = name;
      if (this._engine._modules[name]) throw new Error("Module \"".concat(name, "\" already registered"));

      var loader = function loader() {
        return Promise.resolve({
          "default": module
        });
      };

      loader.isSingleton = module.isSingleton;
      return this._addScopeAsyncModule(loader, name);
    }
    /**
     * Adds a singleton module to engine. Singleton modules
     * are added to the collection pool and keeps the 
     * instance for later use.
     * 
     * @param {constructor} module 
     * The module constructor
     * @param {string} name 
     * Optional name to override the default
     * one in the module
     * @returns {undefined}
     */

  }, {
    key: "addModule",
    value: function addModule(module, name) {
      // If no module name, treat it as async module
      if (!module.module) {
        this._addAsyncModule(module, name);

        return;
      }

      name = (name || module.module).toLowerCase();
      module.isSingleton = true;
      this.addScopeModule(module, name).load();
    }
    /**
     * Adds an async scoped module to engine. 
     * 
     * The `module` argument should be `() => import('./to/module')`
     * to enable dynamic emport.
     * 
     * @param {function} loader 
     * The loader function
     * @param {string} name 
     * The name of the module
     * @returns {undefined}
     */

  }, {
    key: "_addScopeAsyncModule",
    value: function _addScopeAsyncModule(loader, name) {
      // Directly add it to collection, but name 
      // must be explicitly provided 
      if (!name) throw new Error('Async module must explicitly provide a name'); // Attach the name to loader

      loader.module = name.toLowerCase(); // Convert to real loader object

      return this._engine._modules[loader.module] = new _loader["default"](this._engine, loader);
    }
    /**
     * Adds an async singleton module to engine.
     * 
     * The `module` argument should be `() => import('./to/module')`
     * to enable dynamic emport.
     * 
     * @param {function} loader 
     * The loader function
     * @param {string} name 
     * The name of the module
     * @returns {undefined}
     */

  }, {
    key: "_addAsyncModule",
    value: function _addAsyncModule(loader, name) {
      loader.isSingleton = true;
      return this._addScopeAsyncModule(loader, name);
    }
  }]);

  return ModuleSetter;
}();
/**
 * Export
 */


var _default = ModuleSetter;
exports["default"] = _default;