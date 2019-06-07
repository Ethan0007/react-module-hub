import { Component } from 'react'
import EventEmitter from 'events'
import _keyBy from 'lodash.keyby'
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

  constructor(engine) {
    super()
    this._engine = engine
    this._emptyLoader = new Loader(this._engine)
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
    if (!module) return this._emptyLoader
    return module
  }

  getRequiredModule(name) {
    let module = this._engine._modules[name.toLowerCase()]
    if (!module)
      throw new Error(`Missing required module: ${name}`)
    return module
  }

  /**
   * Loads all loaders in object and re-render when component is passed.
   * 
   * @param {object} objLoaders 
   * Loaders in object
   * @param {component} comp 
   * Component to update state
   * @returns {object}
   * All loaded modules
   */
  loadAll(objLoaders, comp) {
    let toLoad = []
    for (const key in objLoaders) {
      if (objLoaders.hasOwnProperty(key)) {
        const loader = objLoaders[key]
        toLoad.push(
          loader.load(null, null)
        )
      }
    }
    return Promise.all(toLoad).then(results => {
      const objResults = _keyBy(results, 'constructor.module')
      if (comp instanceof Component) comp.forceUpdate()
      return objResults
    })
  }

  loadAllToState(objLoaders, comp) {
    this.loadAll(objLoaders).then(results => {
      if (comp instanceof Component) comp.setState(() => results)
      return results
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
    return names.reduce((result, name) => {
      result[name] = this.getModule(name)
      return result
    }, {})
  }

}

/**
 * Export
 */
export default ModuleGetter
