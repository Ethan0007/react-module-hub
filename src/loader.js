import Loading from './components/Loading'

/**
 * Responsible for loading an async module.
 */
class Loader {

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

  constructor(loader, loading) {
    this._loader = loader
    if (loading) this.Loading = loading
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
        // Transfer singleton flag to contructor
        module = module.default
        module.isSingleton = this._loader.isSingleton
        this._module = module
        this._fetched = true
        return module
      })
  }

  /**
   * Creates an instance for async module.
   * 
   * @param {getter} getter 
   * Module getter to pass to module
   * @param {object} config 
   * Configuration for the module
   * @returns {promise}
   * Passing the module instance
   */
  _getInstance(getter, config) {
    const prom = this._fetched
      ? Promise.resolve(this._module)
      : this._fetch()
    return prom.then(Module => {
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