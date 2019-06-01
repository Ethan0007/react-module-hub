import React from 'react'
import { combineReducers } from 'redux'
import _get from 'lodash.get'
import _set from 'lodash.set'
import _pick from 'lodash.pick'
import _isEmpty from 'lodash.isempty'
import ModuleGetter from './getter'
import ModuleSetter from './setter'

/**
 * The prefix to use when saving the 
 * state to store
 */
const prefix = '__HUB__:'

/**
 * Creates a react context for HOC
 */
const HubContext = React.createContext({})

/**
 * The module hub
 */
class ReactModuleHub {

  // Truw when everything is loaded
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
   * Starts the core. Collects all necessary data for it
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
        if (mod.isAsync) continue
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
   * Initialize hub and loads all modules. It reads initials
   * state, calls the store creator function and invokes
   * "start" & "ready" to all added modules.
   * 
   * @param {function} storeCreator 
   * A function that should return the store
   * @returns {promise}
   */
  init(storeCreator) {
    return this._getInitialState()
      .then(initState => {
        if (storeCreator && this._reducers) {
          const store = storeCreator(this._reducers, initState)
          if (store) this._setStore(store)
        }
      })
      .then(() => Promise.all(this._imports))
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
        if (mod.isAsync) continue
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
      if (mod.isAsync) continue
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
   * Invokes a method in all modules.
   * 
   * @param {string} event 
   * The method name to invoke in module
   * @param {array} results 
   * The placeholder to hold the result of
   * invoked method
   */
  _trigger(event, results) {
    let { modules: moduleConfigs } = this._config
    for (let key in this._modules) {
      if (this._modules.hasOwnProperty(key)) {
        let instance = this.getter.getModule(key)
        if (instance && instance[event]) {
          let res = instance[event](this.getter, moduleConfigs[key])
          if (results) results.push(res)
        }
      }
    }
  }

}

/**
 * An HOC to inject modules to the component
 */
ReactModuleHub.withModules = function (ChildComponent, ...modules) {
  return class extends React.Component {
    render() {
      return React.createElement(HubContext.Consumer, null, hub => {
        const store = hub.getter.getStore()
        return React.createElement(ChildComponent, {
          hub: hub.getter,
          modules: hub.getter._getModules(modules),
          state: store && _pick(store.getState(), modules),
          ...this.props
        })
      })
    }
  }
}

/**
 * An HOC to inject required modules to the component
 */
ReactModuleHub.withRequiredModules = function (ChildComponent, ...modules) {
  return class extends React.Component {
    render() {
      return React.createElement(HubContext.Consumer, null, hub => {
        const store = hub.getter.getStore()
        return React.createElement(ChildComponent, {
          hub: hub.getter,
          modules: hub.getter._getRequiredModules(modules),
          state: store && _pick(store.getState(), modules),
          ...this.props
        })
      })
    }
  }
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
ReactModuleHub.createModule = createModule
ReactModuleHub.asModule = createModule

/**
 * Expose the hub context
 */
ReactModuleHub.HubContext = HubContext

/**
 * Export
 */
export default ReactModuleHub