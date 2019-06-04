import React from 'react'
import { combineReducers } from 'redux'
import _set from 'lodash.set'
import { _get, _pick, _isEmpty } from './lib/util'
import Storage from './lib/storage'
import ModuleGetter from './getter'
import ModuleSetter from './setter'
import Loader from './loader'

/**
 * The prefixes
 */
const prefix = 'rngn'
const prefixState = prefix + 's:'

/**
 * Creates a react context component
 */
const EngineContext = React.createContext({})

/**
 * The module engine
 */
class Engine {

  // True when everything is loaded and ready
  isReady = false
  // Module getter
  getter = null
  // Module setter
  setter = null
  // Options for the framework
  _options = null
  // Holds the user configuration
  _config = null
  // Holds the global redux store
  _store = null
  // Holds the module constructors
  _modules = {}
  // Holds the singleton instances
  _instances = {}
  // Immediate async imports returned by registrar,
  // will also be cleared on ready
  _imports = null
  // Holds the root reducer, init method can consume it 
  // for creating the store
  _reducers = null
  // Root component
  _root = null

  /**
   * Creates an instance
   * 
   * @param {object} config 
   * User configuration
   * @param {object} options 
   * Framework options
   */
  constructor(config = {}, options = {}) {
    this.getter = new ModuleGetter(this)
    this.setter = new ModuleSetter(this)
    this._setOptions(options)
    this._setConfig(config)
  }

  /**
   * Sets options
   * 
   * @param {object} options 
   * Options to check and clean
   */
  _setOptions(options) {
    if (!options.storage)
      options.storage = new Storage(prefix + 'x:')
    this._options = options
  }

  /**
   * Starts the engine. Collects all modules from registrar.
   * 
   * @param {function} app 
   * A function that should return the root component
   * @param {function} registrar 
   * A function that adds modules
   * @returns {component}
   * The component from setup function
   */
  start(app, registrar) {
    this._imports = registrar(this.setter) || []
    return app(this)
  }

  /**
   * Initialize engine and loads all modules. It reads initials
   * state, calls the store creator function and invokes
   * "start" & "ready" to all added modules.
   * 
   * @param {component} root
   * The root component to re-render when needed
   * @param {function} setup 
   * A setup function that should return all needed things
   * @returns {promise}
   */
  init(root, setup) {
    this._root = root
    const loadSyncModules = () => {
      let toLoad = []
      for (const key in this._modules) {
        if (this._modules.hasOwnProperty(key)) {
          const mod = this._modules[key]
          if (mod instanceof Loader && mod.isSync)
            toLoad.push(mod.load(null, null, { silent: true }))
        }
      }
      return Promise.all(toLoad)
    }
    const runSetup = initState => {
      let reducers = {}
      let screens = {}
      let modals = {}
      let extras = {}
      for (const key in this._modules) {
        if (this._modules.hasOwnProperty(key)) {
          const mod = this._modules[key]._module
          if (mod.reducers) reducers[key] = mod.reducers
          if (mod.screens) Object.assign(screens, mod.screens)
          if (mod.modals) Object.assign(modals, mod.modals)
          if (mod.extra) extras[key] = mod.extra
        }
      }
      if (!_isEmpty(reducers))
        this._reducers = combineReducers(reducers)
      if (setup) {
        const result = setup({
          rootReducer: this._reducers,
          initialState: initState,
          navigationScreens: screens,
          navigationModals: modals,
          extras: extras
        }) || {}
        if (result.store) this._setStore(result.store)
      }
    }
    const loadImports = () => {
      return Promise.all(this._imports)
        .then(results => {
          results.forEach(module => {
            this.setter.addModule(module.default)
          })
        })
    }
    const getInitialState = () => this._getInitialState()
    const triggerStart = () => this._trigger('start')
    const loadStartups = startups => Promise.all(startups)
    return Promise.resolve()
      .then(loadSyncModules)
      .then(getInitialState)
      .then(runSetup)
      .then(loadImports)
      .then(triggerStart)
      .then(loadStartups)
      .finally(() => {
        this._imports.length = 0
        this._imports = null
      })
      .then(() => {
        this.isReady = true
        this._trigger('ready')
      })
  }

  /**
   * Get a value from user configuration.
   * 
   * @param {string} pathKey
   * The path to configuration value
   * @param {any} defaultValue 
   * Default value if config is undefined
   * @returns {any}
   */
  getConfig(pathKey, defaultValue) {
    return _get(this._config, pathKey, defaultValue)
  }

  /**
   * Returns the global store.
   * @returns {store}
   */
  getStore() {
    return this._store
  }

  /**
   * Gets the initial state from storage, if available
   * 
   * @returns {object}
   * The initial state
   */
  _getInitialState() {
    return new Promise((resolve, reject) => {
      let state = {}
      let { storage } = this._options
      let hasPersist = false
      for (const key in this._modules) {
        if (!this._modules.hasOwnProperty(key)) continue
        const mod = this._modules[key]._module
        if (mod.persist && storage) {
          hasPersist = true
          if (mod.persist === true) {
            storage.getItem(prefixState + mod.module)
              .then(value => value !== null && _set(
                state, mod.module, JSON.parse(value)))
              .then(resolve)
              .catch(reject)
          } else {
            let promises = []
            mod.persist.forEach(path => {
              path = mod.module + '.' + path
              promises.push(
                storage.getItem(prefixState + path)
                  .then(value => {
                    try {
                      _set(state, path, JSON.parse(value))
                    } catch {
                      // Nothing to do
                    }
                  })
              )
            })
            Promise.all(promises).then(() => resolve(state)).catch(reject)
          }
        }
      }
      if (!hasPersist) resolve({})
    })
  }

  /**
   * Sets the user configuration.
   * 
   * @param {object} config 
   * @returns {undefined}
   */
  _setConfig(config) {
    if (!config.modules) config.modules = {}
    this._config = config
  }

  /**
   * Sets the global redux store.
   * 
   * @param {store} store 
   * The redux store
   * @returns {undefined}
   */
  _setStore(store) {
    this._store = store
    // Observe those modules who set persist property
    for (const key in this._modules) {
      if (!this._modules.hasOwnProperty(key)) continue
      const mod = this._modules[key]._module
      if (mod.persist) {
        if (mod.persist === true) {
          // Persist whole module
          this._persistState(mod.module)
        } else {
          // Should be array, persist by keys
          mod.persist.forEach(path => {
            this._persistState(mod.module + '.' + path)
          })
        }
      }
    }
  }

  /**
   * Saves a value from state to storage.
   * 
   * @param {string} path 
   * The path to value to persist in state
   * @returns {function}
   * The unsubscribe function generated by 
   * redux's subscribe
   */
  _persistState(path) {
    let lastState
    let { storage } = this._options
    let handleChange = () => {
      let currentState = _get(this._store.getState(), path)
      if (currentState !== lastState) {
        lastState = currentState
        // Write to storage
        if (storage && path)
          storage.setItem(prefixState + path, JSON.stringify(currentState))
      }
    }
    let unsubscribe = this._store.subscribe(handleChange)
    handleChange()
    return unsubscribe
  }

  /**
   * Invokes a method in all singleton modules.
   * 
   * @param {string} event 
   * The method name to invoke in module
   * @param {array} results 
   * The placeholder to hold the result of
   * invoked method
   */
  _trigger(event) {
    let { modules: moduleConfigs } = this._config
    let results = []
    for (const key in this._modules) {
      if (!this._modules.hasOwnProperty(key)) continue
      const mod = this._modules[key]
      if (mod.loaded && mod.value[event]) {
        let res = mod.value[event](this.getter, moduleConfigs[key])
        results.push(res)
      }
    }
    return results
  }

}

/**
 * To get a required or non-required module.
 * 
 * @param {engine} engine 
 * @param {array} moduleNames 
 * @param {boolean} isRequired 
 * @returns {object}
 */
function getModules(engine, moduleNames, isRequired) {
  return isRequired ?
    engine.getter._getRequiredModules(moduleNames) :
    engine.getter._getModules(moduleNames)
}

/**
 * Create a component that wraps the child with modules 
 * in the props.
 * 
 * All async module will provide `Loader` and sync ones
 * will provide instance of the module
 * 
 * @param {component} ChildComponent 
 * Child component for higher component
 * @param {array} moduleNames 
 * Array of string module names
 * @param {boolean} isRequired 
 * @returns {component}
 * The HOC component
 */
function createComponentWithModules(ChildComponent, moduleNames, isRequired) {
  return class extends React.Component {
    render() {
      return React.createElement(EngineContext.Consumer, null, engine => {
        const store = engine.getter.getStore()
        return React.createElement(ChildComponent, {
          engine: engine.getter,
          modules: getModules(engine, moduleNames, isRequired),
          state: store && _pick(store.getState(), moduleNames),
          ...this.props
        })
      })
    }
  }
}

/**
 * An HOC to inject modules to the component
 */
export function withModules(ChildComponent, ...moduleNames) {
  return createComponentWithModules(ChildComponent, moduleNames)
}

/**
 * An HOC to inject required modules to the component
 */
export function withRequiredModules(ChildComponent, ...moduleNames) {
  return createComponentWithModules(ChildComponent, moduleNames, true)
}

/**
 * Helper function to create a module.
 * 
 * @param {string} name 
 * Name of the module
 * @param {class} module 
 * The module constructor
 * @param {object} options 
 * The options to inject to constructor
 */
function createModule(name, module, options = {}) {
  module.module = name
  Object.assign(module, options)
  return module
}

/**
 * Export
 */
export default Engine
export {
  EngineContext,
  createModule,
  createModule as asModule
}
