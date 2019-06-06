import { Component } from 'react'
import Empty from './components/Empty'
import Loading from './components/Loading'
import { _get } from './lib/util'
import { combineReducers } from 'redux'

/**
 * Responsible for loading an async module.
 */
class Loader {


  constructor(engine, loader) {
    // When module is fetched
    this._fetched = false
    // Holds the module constructor
    this._module = null
    // When module is instaitated
    this.loaded = false
    // Holds the module instance (only singleton)
    this.value = null
    // Alias for instance (only singleton)
    this.$ = null
    // Loading component
    this.Loading = Empty
    // Render view component
    this.View = Empty
    // Component that shows Loading or View
    this.ViewWithLoading = Loading(this)
    this._engine = engine
    this._loader = loader
    if (engine._options.loading)
      this.Loading = engine._options.loading
  }

  /**
   * Fetch the module asynchronously. This does
   * not instantiate the module.
   * 
   * @returns {promise}
   * Passing the module constructor
   */
  _fetch(required) {
    if (!this._loader) {
      if (required)
        throw new Error('Loader is not referenced to a module')
      return Promise.resolve(null)
    }
    // Loading the module
    return this._loader()
      .then(module => {
        // Transfer loader flags to constructor
        module = module.default
        module.isSingleton = this._loader.isSingleton
        module.isSync = this._loader.isSync
        module.module = this._loader.module
        this._module = module
        this._fetched = true
        // Replace reducer
        if (!module.isSync && module.reducer) {
          this._engine._persistModule(module)
          this._engine._store.replaceReducer(
            combineReducers({
              ...this._engine._reducers,
              [module.module]: module.reducer
            })
          )
        }
        return module
      })
  }

  _createInstance(Module, comp) {
    const getter = this._engine.getter
    const config = _get(this._engine._config.modules, Module.module)
    let instance
    if (Module.isSingleton) {
      if (!this.value) {
        instance = new Module(getter, config)
        this.value = instance
        this.$ = instance
        this.loaded = true
        // Attach main content component
        if (instance.view) this.View = instance.view()
        // Trigger module's `start` and `ready` lifecycle
        if (!Module.isSync) {
          const prom = instance.start && instance.start(getter)
          const ready = () => instance.ready && instance.ready(getter)
          if (prom) prom.then(ready)
          else ready()
        }
      } else {
        instance = this.value
      }
    } else {
      instance = new Module(getter, config)
    }
    // Force update if user provided a component
    if (comp instanceof Component) comp.forceUpdate()
    return instance
  }

  /**
   * Load and creates an instance for async module.
   * 
   * @param {component} comp
   * The component to mount the loader
   * @returns {promise}
   * Passing the module instance
   */
  load(comp) {
    const prom = this._fetched
      ? Promise.resolve(this._module)
      : this._fetch()
    return prom.then(Module => {
      if (!Module) return null
      return this._createInstance(Module, comp)
    })
  }

  loadRequired(comp) {
    const prom = this._fetched
      ? Promise.resolve(this._module)
      : this._fetch(true)
    return prom.then(Module => this._createInstance(Module, comp))
  }

  loadToState(comp, name) {
    return this.load().then(instance => {
      comp.setState(() => ({
        [name || instance.constructor.module]: instance
      }))
      return instance
    })
  }

  loadRequiredToState(comp, name) {
    return this.loadRequired().then(instance => {
      comp.setState(() => ({
        [name || instance.constructor.module]: instance
      }))
      return instance
    })
  }

}

/**
 * Export
 */
export default Loader
