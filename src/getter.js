import { Component } from 'react'
import EventEmitter from 'events'
import _keyBy from 'lodash.keyby'

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
    return module
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
    return module
  }

  /**
   * Loads all loaders in object and re-render when component is passed.
   * 
   * @param {object} objLoaders 
   * Loaders in object
   * @param {component} comp 
   * Component to update state
   * @param {object} opt 
   * Options: `silent` will not re-render
   * @returns {object}
   * All loaded modules
   */
  loadAll(objLoaders, comp, opt = {}) {
    let toLoad = []
    for (const key in objLoaders) {
      if (objLoaders.hasOwnProperty(key)) {
        const loader = objLoaders[key]
        if (!loader.loaded)
          toLoad.push(loader.load(null, null, { silent: true }))
      }
    }
    return Promise.all(toLoad).then(results => {
      const objResults = _keyBy(results, 'constructor.module')
      if (!opt.silent) {
        if (comp instanceof Component) comp.setState(() => objResults)
        else this._engine._root.forceUpdate()
      }
      return objResults
    })
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
