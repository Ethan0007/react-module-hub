import Loading from './components/Loading'

/**
 * Responsible to loading an async module.
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
  // Holds the module instance
  instance = null
  // Alias for instance
  $ = null
  // Loading component
  Loading = null

  constructor(loader, loading) {
    this._loader = loader
    this.Loading = loading || Loading
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
          this.instance = new Module(getter, config)
          this.$ = this.instance
          this.loaded = true
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