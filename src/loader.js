import { Component } from 'react'
import Empty from './components/Empty'
import Content from './components/Content'
import { _get } from './lib/util'

/**
 * Responsible for loading an async module.
 */
class Loader {

  _engine = null
  // Holds the loader function from user
  _loader = null
  // When module is fetched
  _fetched = false
  // Holds the module constructor
  _module = null
  // When module is instaitated
  loaded = false
  // Holds the module instance (only singleton)
  value = null
  // Alias for instance (only singleton)
  $ = null
  // Loading component
  Loading = Empty
  // Render view component
  View = Empty
  // Component that shows Loading or View
  Content = Content(this)

  constructor(engine, loader) {
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
  _fetch() {
    // Loading the module
    return this._loader()
      .then(module => {
        // Transfer loader flags to contructor
        module = module.default
        module.isSingleton = this._loader.isSingleton
        module.isSync = this._loader.isSync
        module.module = this._loader.module
        this._module = module
        this._fetched = true
        return module
      })
  }

  /**
   * Load and creates an instance for async module.
   * 
   * @param {component} comp
   * The component to mount the loader
   * @param {string} name 
   * Explicit key name of the loader
   * @returns {promise}
   * Passing the module instance
   */
  load(comp, name) {
    const prom = this._fetched
      ? Promise.resolve(this._module)
      : this._fetch()
    return prom
      .then(Module => {
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
            if (!comp && this._engine._root)
              this._engine._root.forceUpdate()
          } else {
            instance = this.value
          }
        } else {
          instance = new Module(getter, config)
        }
        if (comp instanceof Component) {
          comp.setState(() => ({
            [name || instance.constructor.module]: instance
          }))
        }
        return instance
      })
  }

}

/**
 * Export
 */
export default Loader
