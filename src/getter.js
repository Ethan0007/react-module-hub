import { Component } from 'react'
import EventEmitter from 'events'
import _reduce from 'lodash.reduce'
import _get from 'lodash.get'

/**
 * Responsible to providing a module to another module.
 * 
 * This will be passed to module's `constructor`,
 * `start` and `ready` lifecycle.
 * 
 * This also provides event-bus feature 
 * using `EventEmittor` from node.
 * 
 */
class ModuleGetter extends EventEmitter {

  // Holds the core.
  _core = null

  constructor(core) {
    super()
    this._core = core
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
    return this._core.getConfig(pathKey, defaultValue)
  }

  /**
   * Returns the global store.
   * @returns {store}
   */
  getStore() {
    return this._core._store
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
    let module = this._core._modules[name.toLowerCase()]
    if (!module || module.isAsync) return null
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
    let module = this._core._modules[name.toLowerCase()]
    if (!module || module.isAsync) throw new Error(`Module "${name}" not found`)
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

    let loader = this._core._modules[name.toLowerCase()]
    if (!loader) return null
    loader._getInstance().then(instance => {
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
    let loader = this._core._modules[name.toLowerCase()]
    if (!loader) return Promise.reject(new Error(`Module "${name}" not found`))
    return this.getAsyncModule(name, callback)
  }

  /**
   * Create an instance of module. If singleton, will save
   * the instance to collection pool.
   * 
   * @param {module} Module 
   * Module to create instance
   * @param {string} name 
   * Name of module
   * @returns {instance}
   * Instance of module 
   */
  _instantiateModule(Module, name) {
    let instances = this._core._instances
    let config = _get(this._core._config.modules, name)
    if (Module.isSingleton) {
      let instance = instances[name]
      if (!instance) {
        instance = new Module(this._core.getter, config)
        instances[name] = instance
      }
      return instance
    }
    if (Module.isAsync) throw new Error('Async module must be get asynchronously')
    return new Module(this._core.getter, config)
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