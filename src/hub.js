import React from 'react'
import { combineReducers } from 'redux'
import _get from 'lodash.get'
import _set from 'lodash.set'
import _pick from 'lodash.pick'
import _isEmpty from 'lodash.isempty'
import ModuleGetter from './getter'
import ModuleSetter from './setter'

const prefix = '__HUB__:'
const HubContext = React.createContext({})

class ReactModuleHub {

  constructor(config = {}, options = {}) {
    this.isReady = false
    this.getter = new ModuleGetter(this)
    this.setter = new ModuleSetter(this)
    this._options = options
    this._config = null
    this._store = null
    this._modules = {}
    this._instances = {}
    // Holds the root reducer, init method can consume it 
    // for creating the store
    this._reducers = null
    // Promises returned by start lifecycle,
    // will be cleared on ready
    this._startups = []
    // Immediate async imports returned by registrar,
    // will also be cleared on ready
    this._imports = null
    this._setConfig(config)
  }

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

  getConfig(pathKey, defaultValue) {
    return _get(this._config, pathKey, defaultValue)
  }

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

  _setConfig(config) {
    if (!config.modules) config.modules = {}
    this._config = config
  }

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

function createModule(name, module, options = {}) {
  module.module = name
  Object.assign(module, options)
  return module
}
ReactModuleHub.createModule = createModule
ReactModuleHub.asModule = createModule
ReactModuleHub.HubContext = HubContext

export default ReactModuleHub