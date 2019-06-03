import { Component } from 'react'
import EventEmitter from 'events'
import _reduce from 'lodash.reduce'
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
   * @param {object} name 
   * The name of the module to get
   * @returns {module|null}
   * The module instance or `null` if not found
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
   * @returns {module}
   * The module instance
   */
  getRequiredModule(name) {
    let module = this._engine._modules[name.toLowerCase()]
    if (!module) throw new Error(`Module "${name}" not found`)
    return this._instantiateModule(module, name)
  }

  /**
   * Returns a loader object that loads the module
   * asynchronously. When done, invokes the callback
   * passing the instance of the module.
   * 
   * @param {string} name 
   * Name of module to get
   * @param {function} callback 
   * Function to call when loading is complete
   * and pass the instance of the module
   * @returns {loader|null}
   * Loader object or null if not registered
   */
  getAsyncModule(name, callback) {

    // TODO: 
    // If module is async and contains reducer,
    // we need to add it to existing store.
    // Also test for unused initial state, is it striped out
    // on createStore or not

    let loader = this._engine._modules[name.toLowerCase()]
    if (!loader) return null
    let config = _get(this._engine._config.modules, name)
    loader._getInstance(this, config).then(instance => {
      if (callback) {
        if (callback instanceof Component)
          callback.setState(() => ({ [name]: instance }))
        else
          callback(instance)
      }
    })
    return loader
  }

  /**
   * Returns a loader object that loads the module
   * asynchronously. When done, invokes the callback
   * passing the instance of the module.
   * 
   * Throws as `error` if module not registered.
   * 
   * @param {stringh} name 
   * Name of module to get
   * @param {function} callback 
   * Function to call when loading is complete
   * and pass the instance of the module
   * @returns {loader}
   * Loader object
   */
  getRequiredAsyncModule(name, callback) {
    let loader = this._engine._modules[name.toLowerCase()]
    if (!loader) return Promise.reject(new Error(`Module "${name}" not found`))
    return this.getAsyncModule(name, callback)
  }

  /**
   * Create an instance of module. If singleton, will save
   * the instance to collection pool.
   * 
   * If the module is async and is loaded, also create
   * an instance and return it, otherwise return `null`
   * 
   * @param {module} Module 
   * Module to create instance
   * @param {string} name 
   * Name of module
   * @returns {instance|null}
   * Instance of module or `null` if not found for async
   */
  _instantiateModule(Module, name) {
    let instances = this._engine._instances
    let config = _get(this._engine._config.modules, name)
    // Deal with async module
    if (Module instanceof Loader) {
      if (Module._fetched) Module = Module._module
      else return null
    }
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
    return _reduce(names, (o, k) => {
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
    return _reduce(names, (o, k) => {
      o[k] = this.getRequiredModule(k)
      return o
    }, {})
  }

}

/**
 * Export
 */
export default ModuleGetter