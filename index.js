const React = require("react");
const { combineReducers } = require("redux");
const _get = require("lodash.get");
const _reduce = require("lodash.reduce");
const ModuleHubContext = React.createContext({});

let store;
let modules = {};
let instances = {};
let config = {};

class ReactModuleHub {

  start(setup) {
    let comp = setup(this);
    this._trigger("start", this);
    return comp;
  }

  ready() {
    this._trigger("ready", this);
  }

  addModule(module, name) {
    name = name || module.name.toLowerCase();
    if (modules[name])
      throw new Error(`Module "${name}" already registered`);
    modules[name] = module;
  }

  addSingletonModule(module, name) {
    this.addModule(module, name);
    module.isSingleton = true;
    this.getModule(name || module.name.toLowerCase());
  }

  setConfig(_config) {
    config = _config;
  }

  setStore(_store) {
    store = _store;
  }

  getConfig(pathKey, defaultValue) {
    let val = _get(config, pathKey);
    return val === undefined ? defaultValue : val;
  }

  getStore() {
    return store;
  }

  getModule(name) {
    let Module = modules[name.toLowerCase()];
    if (!Module) return null;
    return this._instantiateModule(Module);
  }

  getRequiredModule(name) {
    let Module = modules[name.toLowerCase()];
    if (!Module) throw new Error("Module not found");
    return this._instantiateModule(Module);
  }

  getRootReducer() {
    let allReducers = {};
    for (const key in modules) {
      if (modules.hasOwnProperty(key)) {
        const instance = this.getModule(key);
        if (instance.reducers)
          allReducers[key] = instance.reducers;
      }
    }
    return combineReducers(allReducers);
  }

  getMainScreens() {
    let screens = {};
    for (const key in modules) {
      if (modules.hasOwnProperty(key)) {
        const instance = this.getModule(key);
        if (instance.screens)
          Object.assign(screens, instance.screens);
      }
    }
    return screens;
  }

  _instantiateModule(Module) {
    if (!Module) return null;
    if (Module.isSingleton) {
      let name = Module.name.toLowerCase();
      let instance = instances[name];
      if (!instance) {
        instance = new Module(this);
        instances[name] = instance;
      }
      return instance;
    }
    return new Module(this);
  }

  _trigger(event, data) {
    for (const key in modules) {
      if (modules.hasOwnProperty(key)) {
        const instance = this.getModule(key);
        if (instance[event]) instance[event](data);
      }
    }
  }

  _getModules(...names) {
    return _reduce(names, (o, k) => {
      o[k] = this.getModule(k);
      return o;
    }, {});
  }

}

ReactModuleHub.ModuleHubContext = ModuleHubContext;

ReactModuleHub.withModules = function (ChildComponent, ...modules) {
  return class extends React.Component {
    render() {
      return React.createElement(ModuleHubContext.Consumer, null, hub => {
        return React.createElement(ChildComponent, {
          hub,
          ...hub._getModules(modules)
        });
      });
    }
  }
}

module.exports = ReactModuleHub;