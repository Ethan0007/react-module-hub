import Loader from './loader'

/**
 * Responsible for adding modules to the core.
 * This will be passed to `registrar` function 
 * in `start` method of core
 */
class ModuleSetter {

  // Holds the core.
  _core = null

  constructor(core) {
    this._core = core
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
  getConfig(pathKey, defaultValue) {
    return this._core.getConfig(pathKey, defaultValue)
  }

  /**
   * Adds a scoped module to core. Scoped modules are 
   * not referenced in core when instantiating it.
   * 
   * @param {constructor} module 
   * The module constructor
   * @param {string} name 
   * Optional name to override the default
   * one in the module
   * @returns {undefined}
   */
  addScopeModule(module, name) {
    this._checkModule(module)
    name = (name || module.module).toLowerCase()
    if (this._core._modules[name])
      throw new Error(`Module "${name}" already registered`)
    this._core._modules[name] = module
  }

  /**
   * Adds a singleton module to core. Singleton modules
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
  addModule(module, name) {
    this._checkModule(module)
    name = (name || module.module).toLowerCase()
    this.addScopeModule(module, name)
    module.isSingleton = true
    this._core.getter.getModule(name)
  }

  /**
   * Adds an async scoped module to core. 
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
  addScopeAsyncModule(module, name) {
    // Directly add it to collection, but name 
    // must be explicitly provided 
    if (!name) throw new Error('Async module must explicitly provide a name')
    // Mark module as async and convert it to loader object
    this._core._modules[name.toLowerCase()] = new Loader(
      module,
      this._core._options.loading
    )
  }

  /**
   * Adds an async singleton module to core.
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
  addAsyncModule(module, name) {
    module.isSingleton = true
    this.addScopeAsyncModule(module, name)
  }

  /**
   * Validate a module.
   * 
   * @param {module} module 
   * The module to check
   * @returns {undefined}
   */
  _checkModule(module) {
    if (!module.module)
      throw new Error('Not a module. Required static property \'module\' with string value as the name')
  }

}

/**
 * Export
 */
export default ModuleSetter