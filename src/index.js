import React from 'react'
import { combineReducers } from 'redux'
import _get from 'lodash.get'
import _set from 'lodash.set'
import _pick from 'lodash.pick'
import _isEmpty from 'lodash.isempty'
import ModuleGetter from './getter'
import ModuleSetter from './setter'
import Loader from './loader'

/**
 * The prefix to use when saving the 
 * state to storage
 */
const prefix = '__RNGN__:'

/**
 * Creates a react context for HOC
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
  // Promises returned by start lifecycle,
  // will be cleared on ready
  _startups = []
  // Immediate async imports returned by registrar,
  // will also be cleared on ready
  _imports = null
  // Holds the root reducer, init method can consume it 
  // for creating the store
  _reducers = null

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
    this._options = options
    this._setConfig(config)
  }

  /**
   * Starts the engine. Collects all necessary data for it
   * to get initialized.
   * 
   * @param {function} setup 
   * A setup function that should return the root component
   * @param {function} registrar 
   * A function that adds modules
   * @returns {component}
   * The component from setup function
   */
  start(setup, registrar) {
    let reducers = {}
    let screens = {}
    let modals = {}
    let extra = {}
    // First of all, get all modules
    this._imports = registrar(this.setter) || []
    // Parsing
    for (const key in this._modules) {
      if (this._modules.hasOwnProperty(key)) {
        const mod = this._modules[key]
        if (mod instanceof Loader) continue
        if (mod.reducers) reducers[key] = mod.reducers
        if (mod.screens) Object.assign(screens, mod.screens)
        if (mod.modals) Object.assign(modals, mod.modals)
        // Extra data to pass
        if (mod.extra) extra[key] = mod.extra
      }
    }
    // Combine all reducers from modules
    if (!_isEmpty(reducers))
      this._reducers = combineReducers(reducers)
    // Call component setup from user
    return setup(this, {
      screens,
      modals,
      extra
    })
  }

  /**
   * Initialize engine and loads all modules. It reads initials
   * state, calls the store creator function and invokes
   * "start" & "ready" to all added modules.
   * 
   * @param {function} storeCreator 
   * A function that should return the store
   * @returns {promise}
   */
  init(storeCreator) {
    const linkImmediateAsyncModules = results => {
      results.forEach(module => {
        this.setter.addModule(module.default)
      })
    }
    return this._getInitialState()
      .then(initState => {
        if (storeCreator && this._reducers) {
          const store = storeCreator(this._reducers, initState)
          if (store) this._setStore(store)
        }
      })
      .then(() => Promise.all(this._imports))
      .then(linkImmediateAsyncModules)
      .then(() => this._trigger('start', this._startups))
      .then(() => Promise.all(this._startups))
      .finally(() => {
        this._startups.length = 0
        this._startups = null
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
        const mod = this._modules[key]
        if (mod instanceof Loader) continue
        if (mod.persist && storage) {
          hasPersist = true
          if (mod.persist === true) {
            storage.getItem(prefix + mod.module)
              .then(value => _set(state, mod.module, JSON.parse(value || '{}')))
              .then(resolve)
              .catch(reject)
          } else {
            let promises = []
            mod.persist.forEach(path => {
              path = mod.module + '.' + path
              promises.push(
                storage.getItem(prefix + path)
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
      const mod = this._modules[key]
      if (mod instanceof Loader) continue
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
          storage.setItem(prefix + path, JSON.stringify(currentState))
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
  _trigger(event, results) {
    let { modules: moduleConfigs } = this._config
    for (let key in this._instances) {
      if (this._instances.hasOwnProperty(key)) {
        let instance = this._instances[key]
        if (instance && instance[event]) {
          let res = instance[event](this.getter, moduleConfigs[key])
          if (results) results.push(res)
        }
      }
    }
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
        let modules = getModules(engine, moduleNames, isRequired)
        let toLoad = []
        for (const key in modules) {
          if (modules.hasOwnProperty(key) && modules[key] instanceof Loader) {
            const loader = modules[key]
            if (!loader.loaded) toLoad.push(loader.load())
          }
        }
        if (toLoad.length)
          Promise.all(toLoad).then(() => this.forceUpdate())
        return React.createElement(ChildComponent, {
          engine: engine.getter,
          modules,
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