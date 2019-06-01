/**
 * Responsible to loading an async module.
 */
class Loader {

  constructor(loader) {
    this._loader = loader
    this._loaded = false
    // Holds the module constructor
    this._module = null
    // Holds the module instance
    this.instance = null
    // Alias for instance
    this.$ = null
  }

  /**
   * Loads the module asynchronously.
   * 
   * @returns {promise}
   * Passing the module constructor
   */
  _load() {
    // Loading the module
    return this._loader()
      .then(module => {
        this._module = module
        this._loaded = true
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
    const prom = this._loaded
      ? Promise.resolve(this._module)
      : this._load()
    return prom.then(Module => {
      if (this._loader.isSingleton) {
        if (!this.instance) {
          this.instance = new Module(getter, config)
          this.$ = this.instance
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