import EventEmitter from 'events'
import _get from 'lodash.get'
import Loader from './loader'

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
class ModuleGetter extends EventEmitter {

  // Holds the engine.
  _engine = null

  constructor(engine) {
    super()
    this._engine = engine
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
  getConfig(pathKey, defaultValue) {
    return this._engine.getConfig(pathKey, defaultValue)
  }

  /**
   * Returns the global store.
   * @returns {store}
   */
  getStore() {
    return this._engine._store
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
  getModule(name) {
    let module = this._engine._modules[name.toLowerCase()]
    if (!module) return null
    return this._instantiateModule(module, name)
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
  getRequiredModule(name) {
    let module = this._engine._modules[name.toLowerCase()]
    if (!module) throw new Error(`Module "${name}" not found`)
    return this._instantiateModule(module, name)
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
  _instantiateModule(Module, name) {
    let instances = this._engine._instances
    let config = _get(this._engine._config.modules, name)
    // Deal with async module
    if (Module instanceof Loader) return Module
    // Continue creating an instance
    if (Module.isSingleton) {
      let instance = instances[name]
      if (!instance) {
        instance = new Module(this._engine.getter, config)
        instances[name] = instance
      }
      return instance
    }
    return new Module(this._engine.getter, config)
  }

  /**
   * Returns multiple modules at once.
   * Provide `null` if one is not found.
   * 
   * @param {array} names 
   * Array of module names to get
   */
  _getModules(names) {
    return names.reduce((o, k) => {
      o[k] = this.getModule(k)
      return o
    }, {})
  }

  /**
   * Returns multiple modules at onces.
   * Throws `error` if one is not found.
   * 
   * @param {array} names 
   * Array of module names to get
   */
  _getRequiredModules(names) {
    return names.reduce((o, k) => {
      o[k] = this.getRequiredModule(k)
      return o
    }, {})
  }

}

/**
 * Export
 */
export default ModuleGetter