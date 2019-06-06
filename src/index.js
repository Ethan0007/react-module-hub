import React from 'react'
import { combineReducers, createStore } from 'redux'
import { connect } from 'react-redux'
import _set from 'lodash.set'
import { _get, _isEmpty } from './lib/util'
import Storage from './lib/storage'
import ModuleGetter from './getter'
import ModuleSetter from './setter'
import Loader from './loader'
import EngineProvider from './components/Provider'

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

  /**
   * Creates an instance
   * 
   * @param {object} config 
   * User configuration
   * @param {object} options 
   * Framework options
   */
  constructor(config = {}, options = {}) {
    // True when everything is loaded and ready
    this.isReady = false
    // Module getter
    this.getter = null
    // Module setter
    this.setter = null
    // Options for the framework
    this._options = null
    // Holds the user configuration
    this._config = null
    // Holds the global redux store
    this._store = null
    // Holds the module constructors
    this._modules = {}
    // Holds the singleton instances
    this._instances = {}
    // Immediate async imports returned by registrar,
    // will also be cleared on ready
    this._imports = null
    // Holds the root reducer, init method can consume it 
    // for creating the store
    this._reducers = {}
    this._setOptions(options)
    this._setConfig(config)
    this.getter = new ModuleGetter(this)
    this.setter = new ModuleSetter(this)
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
  init(setup) {
    const loadModules = () => {
      let toLoad = []
      for (const key in this._modules) {
        if (this._modules.hasOwnProperty(key)) {
          const mod = this._modules[key]
          if (mod instanceof Loader && mod._loader.isSync)
            toLoad.push(mod.load())
        }
      }
      return Promise.all(toLoad)
    }
    const runSetup = initState => {
      let combinedReducer = null
      let screens = {}
      let modals = {}
      let extras = {}
      for (const key in this._modules) {
        if (this._modules.hasOwnProperty(key)) {
          const mod = this._modules[key]._module
          if (mod) {
            if (mod.reducer) this._reducers[key] = mod.reducer
            if (mod.screens) Object.assign(screens, mod.screens)
            if (mod.modals) Object.assign(modals, mod.modals)
            if (mod.extra) extras[key] = mod.extra
          }
        }
      }
      if (!_isEmpty(this._reducers))
        combinedReducer = combineReducers(this._reducers)
      let setupResult
      if (setup) {
        setupResult = setup({
          rootReducer: combinedReducer,
          initialState: initState,
          navigationScreens: screens,
          navigationModals: modals,
          extras: extras
        })
      }
      const processResult = (result = {}) => {
        this._setStore(result.store || createStore(
          combinedReducer || (s => s),
          initState || {}
        ))
      }
      if (setupResult instanceof Promise)
        return setupResult.then(processResult)
      processResult(setupResult)
    }
    const addImports = () => {
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
      .then(getInitialState)
      .then(runSetup)
      .then(addImports)
      .then(loadModules)
      .then(triggerStart)
      .then(loadStartups)
      .then(() => {
        this._imports.length = 0
        this._imports = null
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
    let state = {}
    let { storage } = this._options
    if (storage) {
      return storage.getAllKeys()
        .then(keys => {
          const toGet = []
          keys.forEach(key => {
            if (!key.startsWith(prefixState)) return
            const path = key.split(':')[1]
            toGet.push(
              storage.getItem(key).then(value => {
                try {
                  _set(state, path, JSON.parse(value))
                } catch (error) {
                  // TODO: put something here
                }
              })
            )
          })
          return Promise.all(toGet)
        })
        .then(() => state)
    }
    return Promise.resolve({})
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
      if (mod && mod.persist)
        this._persistModule(mod)
    }
  }

  _persistModule(mod) {
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

function mapStateToProps(moduleNames, state) {
  return moduleNames.reduce((o, k) => {
    const val = state[k]
    if (val) o[k] = val
    return o
  }, {})
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

function createComponentWithModules(ChildComponent, moduleNames) {
  return props => {
    return (
      React.createElement(EngineContext.Consumer, null, engine => {
        return React.createElement(ChildComponent, {
          engine: engine.getter,
          modules: engine.getter._getModules(moduleNames),
          ...props
        })
      })
    )
  }
}

/**
 * An HOCs to inject modules to the component
 */
export function withModules(ChildComponent, ...moduleNames) {
  return connect(state => ({ state: mapStateToProps(moduleNames, state) }))(
    createComponentWithModules(ChildComponent, moduleNames)
  )
}

export function withOnlyModules(ChildComponent, ...moduleNames) {
  return createComponentWithModules(ChildComponent, moduleNames)
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
  EngineProvider,
  EngineContext,
  createModule,
  createModule as asModule
}
