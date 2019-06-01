import EventEmitter from 'events'
import _reduce from 'lodash.reduce'
import _get from 'lodash.get'

class ModuleGetter extends EventEmitter {

  constructor(hub) {
    super()
    this._hub = hub
  }

  getConfig(pathKey, defaultValue) {
    return this._hub.getConfig(pathKey, defaultValue)
  }

  getStore() {
    return this._hub._store
  }

  getModule(name) {
    let module = this._hub._modules[name.toLowerCase()]
    if (!module || module.isAsync) return null
    return this._instantiateModule(module, name)
  }

  getRequiredModule(name) {
    let module = this._hub._modules[name.toLowerCase()]
    if (!module || module.isAsync) throw new Error(`Module "${name}" not found`)
    return this._instantiateModule(module, name)
  }

  getAsyncModule(name, callback) {
    let loader = this._hub._modules[name.toLowerCase()]
    if (!loader) return Promise.resolve(null)
    loader._getInstance().then(callback || (ins => ins))
    return loader
  }

  getRequiredAsyncModule(name) {
    let loader = this._hub._modules[name.toLowerCase()]
    if (!loader) return Promise.reject(new Error(`Module "${name}" not found`))
    return loader._getInstance()
  }

  _instantiateModule(Module, name, forceSingleton) {
    let instances = this._hub._instances
    let config = _get(this._hub._config.modules, name)
    if (forceSingleton || Module.isSingleton) {
      let instance = instances[name]
      if (!instance && typeof Module === 'function') {
        // LAST: 
        // if module is async and contains reducer,
        // we need to add it to existing store.
        // Also test for unused initial state, is it striped out
        // on createStore or not
        instance = new Module(this._hub.getter, config)
        instances[name] = instance
      }
      return instance
    }
    if (Module.isAsync) throw new Error('Async module must be get asynchronously')
    return new Module(this._hub.getter, config)
  }

  // _instantiateAsyncModule(loader, name) {
  //   return 
  //   return loader().then(RealModule => {
  //     return this._instantiateModule(RealModule, name, loader.isSingleton)
  //   })
  // }

  _getModules(names) {
    return _reduce(names, (o, k) => {
      o[k] = this.getModule(k)
      return o
    }, {})
  }

  _getRequiredModules(names) {
    return _reduce(names, (o, k) => {
      o[k] = this.getRequiredModule(k)
      return o
    }, {})
  }

}

export default ModuleGetter