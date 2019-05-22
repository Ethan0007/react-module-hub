const EventEmitter = require("events");
const React = require("react");
const { combineReducers } = require("redux");
const _get = require("lodash.get");
const _reduce = require("lodash.reduce");
const HubContext = React.createContext({});

class ReactModuleHub extends EventEmitter {

  constructor(config = {}) {
    super();
    this.__config = null;
    this.__store = null;
    this.__modules = {};
    this.__instances = {};
    this.__setConfig(config);
    this.once("start", () => this.__trigger("start"));
    this.once("ready", () => this.__trigger("ready"));
  }

  start(setup) {
    let comp = setup(this);
    this.emit("start");
    return comp;
  }

  addModule(module, name) {
    name = name || module.name.toLowerCase();
    if (this.__modules[name])
      throw new Error(`Module "${name}" already registered`);
    this.__modules[name] = module;
  }

  addSingletonModule(module, name) {
    this.addModule(module, name);
    module.isSingleton = true;
    this.getModule(name || module.name.toLowerCase());
  }

  setStore(store) {
    this.__store = store;
  }

  getConfig(pathKey, defaultValue) {
    return _get(this.__config, pathKey, defaultValue);
  }

  getStore() {
    return this.__store;
  }

  getModule(name = "") {
    let Module = this.__modules[name.toLowerCase()];
    if (!Module) return null;
    return this.__instantiateModule(Module);
  }

  getRequiredModule(name = "") {
    let Module = this.__modules[name.toLowerCase()];
    if (!Module) throw new Error(`Module "${name}" not found`);
    return this.__instantiateModule(Module);
  }

  getRootReducer() {
    let allReducers = {};
    for (const key in this.__modules) {
      if (this.__modules.hasOwnProperty(key)) {
        const instance = this.getModule(key);
        if (instance.reducers)
          allReducers[key] = instance.reducers;
      }
    }
    return combineReducers(allReducers);
  }

  getMainScreens() {
    let screens = {};
    for (const key in this.__modules) {
      if (this.__modules.hasOwnProperty(key)) {
        const instance = this.getModule(key);
        if (instance.screens)
          Object.assign(screens, instance.screens);
      }
    }
    return screens;
  }

  __setConfig(config) {
    if (!config.modules) config.modules = {};
    this.__config = config;
  }

  __instantiateModule(Module) {
    if (!Module) return null;
    let name = Module.name.toLowerCase();
    if (Module.isSingleton) {
      let instance = this.__instances[name];
      if (!instance) {
        instance = new Module(this, _get(this.__config.modules, name));
        this.__instances[name] = instance;
      }
      return instance;
    }
    return new Module(this, _get(this.__config.modules, name));
  }

  __trigger(event) {
    for (const key in this.__modules) {
      if (this.__modules.hasOwnProperty(key)) {
        const instance = this.getModule(key);
        if (instance[event]) instance[event](
          this,
          _get(this.__config.modules, key)
        );
      }
    }
  }

  __getModules(names) {
    return _reduce(names, (o, k) => {
      o[k] = this.getModule(k);
      return o;
    }, {});
  }

  __getRequiredModules(names) {
    return _reduce(names, (o, k) => {
      o[k] = this.getRequiredModule(k);
      return o;
    }, {});
  }

}

ReactModuleHub.withModules = function (ChildComponent, ...modules) {
  return class extends React.Component {
    render() {
      return React.createElement(HubContext.Consumer, null, hub => {
        return React.createElement(ChildComponent, {
          hub,
          ...hub.__getModules(modules)
        });
      });
    }
  };
};

ReactModuleHub.withRequiredModules = function (ChildComponent, ...modules) {
  return class extends React.Component {
    render() {
      return React.createElement(HubContext.Consumer, null, hub => {
        return React.createElement(ChildComponent, {
          hub,
          ...hub.__getRequiredModules(modules)
        });
      });
    }
  };
};

ReactModuleHub.HubContext = HubContext;

module.exports = ReactModuleHub;