import Loader from './loader'

class ModuleSetter {

  constructor(hub) {
    this._hub = hub
  }

  getConfig(pathKey, defaultValue) {
    return this._hub.getConfig(pathKey, defaultValue)
  }

  addScopeModule(module, name) {
    this._checkModule(module)
    name = (name || module.module).toLowerCase()
    if (this._hub._modules[name])
      throw new Error(`Module "${name}" already registered`)
    this._hub._modules[name] = module
  }

  addModule(module, name) {
    this._checkModule(module)
    name = (name || module.module).toLowerCase()
    this.addScopeModule(module, name)
    module.isSingleton = true
    this._hub.getter.getModule(name)
  }

  addScopeAsyncModule(module, name) {
    // Directly add it to collection, without checking
    // but name must be explicitly provided 
    if (!name) throw new Error('Async module must explicitly provide a name')
    // Mark module as async and treating it as a loader
    this._hub._modules[name.toLowerCase()] = new Loader(module)
  }

  addAsyncModule(module, name) {
    module.isSingleton = true
    this.addScopeAsyncModule(module, name)
  }

  _checkModule(module) {
    if (!module.module)
      throw new Error('Not a module. Required static property \'module\' with string value as the name')
  }

}

export default ModuleSetter