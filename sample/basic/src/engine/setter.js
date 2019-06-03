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
      this._checkModule(module);

      name = (name || module.module).toLowerCase();
      if (this._engine._modules[name]) throw new Error("Module \"".concat(name, "\" already registered"));
      this._engine._modules[name] = module;
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
      this._checkModule(module);

      name = (name || module.module).toLowerCase();
      this.addScopeModule(module, name);
      module.isSingleton = true;

      this._engine.getter.getModule(name);
    }
    /**
     * Adds an async scoped module to engine. 
     * 
     * The `module` argument should be `() => import('./to/module')`
     * to enable dynamic emport.
     * 
     * @param {function} module 
     * The loader function
     * @param {string} name 
     * The name of the module
     * @returns {undefined}
     */

  }, {
    key: "addScopeAsyncModule",
    value: function addScopeAsyncModule(module, name) {
      // Directly add it to collection, but name 
      // must be explicitly provided 
      if (!name) throw new Error('Async module must explicitly provide a name'); // Mark module as async and convert it to loader object

      this._engine._modules[name.toLowerCase()] = new _loader["default"](module, this._engine._options.loading);
    }
    /**
     * Adds an async singleton module to engine.
     * 
     * The `module` argument should be `() => import('./to/module')`
     * to enable dynamic emport.
     * 
     * @param {function} module 
     * The loader function
     * @param {string} name 
     * The name of the module
     * @returns {undefined}
     */

  }, {
    key: "addAsyncModule",
    value: function addAsyncModule(module, name) {
      module.isSingleton = true;
      this.addScopeAsyncModule(module, name);
    }
    /**
     * Validate a module.
     * 
     * @param {module} module 
     * The module to check
     * @returns {undefined}
     */

  }, {
    key: "_checkModule",
    value: function _checkModule(module) {
      if (!module.module) throw new Error('Not a module. Required static property \'module\' with string value as the name');
    }
  }]);

  return ModuleSetter;
}();
/**
 * Export
 */


var _default = ModuleSetter;
exports["default"] = _default;