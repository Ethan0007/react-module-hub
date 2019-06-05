import Loader from './loader'

/**
 * Responsible for adding modules to the engine.
 * This will be passed to `registrar` function 
 * in `start` method of engine
 */
class ModuleSetter {

  constructor(engine) {
    this._engine = engine
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
    return this._engine.getConfig(pathKey, defaultValue)
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
  addScopeModule(module, name) {
    // If no module name, then it's an async loader
    if (!module.module)
      return this._addScopeAsyncModule(module, name)
    // Now, it's a sync module that need to convert to async
    name = (name || module.module).toLowerCase()
    // Make sure it's not registered
    if (this._engine._modules[name])
      throw new Error(`Module "${name}" already registered`)
    // Replace to explicit name
    module.module = name
    // Convert to fake async loader
    const loader = () => Promise.resolve({ default: module })
    loader.isSingleton = module.isSingleton
    loader.isSync = true
    return this._addScopeAsyncModule(loader, name)
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
  addModule(module, name) {
    // If no module name, then it's as async loader
    if (!module.module)
      return this._addAsyncModule(module, name)
    // Continue adding module
    name = (name || module.module).toLowerCase()
    module.isSingleton = true
    this.addScopeModule(module, name)._fetch()
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
  _addScopeAsyncModule(loader, name) {
    // Directly add it to collection, but name 
    // must be explicitly provided 
    if (!name) throw new Error('Async module must explicitly provide a name')
    // Attach the name to loader
    loader.module = name.toLowerCase()
    // Convert to real loader object
    return this._engine._modules[loader.module] = new Loader(
      this._engine,
      loader
    )
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
  _addAsyncModule(loader, name) {
    loader.isSingleton = true
    return this._addScopeAsyncModule(loader, name)
  }

}

/**
 * Export
 */
export default ModuleSetter
