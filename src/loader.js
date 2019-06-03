import Loading from './components/Loading'
import _get from 'lodash.get'

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
  instance = null
  // Alias for instance (only singleton)
  $ = null
  // Loading component
  Loading = Loading
  // Render content component
  Content = null
  // Main component that shows loading or the content
  View = null

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
        // Transfer flags loader to contructor
        module = module.default
        module.isSingleton = this._loader.isSingleton
        module.module = this._loader.module
        this._module = module
        this._fetched = true
        return module
      })
  }

  /**
   * Load and creates an instance for async module.
   * 
   * @param {getter} getter 
   * Module getter to pass to module
   * @param {object} config 
   * Configuration for the module
   * @returns {promise}
   * Passing the module instance
   */
  load() {
    const prom = this._fetched
      ? Promise.resolve(this._module)
      : this._fetch()
    return prom.then(Module => {
      const getter = this._engine.getter
      const config = _get(this._engine._config.modules, Module.module)
      if (this._loader.isSingleton) {
        if (!this.instance) {
          const instance = new Module(getter, config)
          this.instance = instance
          this.$ = instance
          this.loaded = true
          // Trigger module's `start` and `ready` lifecycle
          const prom = instance.start && instance.start(getter)
          const ready = () => instance.ready && instance.ready(getter)
          if (prom) prom.then(ready)
          else ready()
        }
        return this.instance
      }
      return new Module(getter, config)
    })
  }

}

/**
 * Export
 */
export default Loader