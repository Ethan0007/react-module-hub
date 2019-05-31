const EventEmitter = require("events");
const React = require("react");
const { combineReducers } = require("redux");
const _get = require("lodash.get");
const _set = require("lodash.set");
const _reduce = require("lodash.reduce");
const _isEmpty = require("lodash.isempty");
const HubContext = React.createContext({});
const prefix = "__HUB__:";

function checkModule(module) {
  if (!module.module)
    throw new Error("Not a module. Require static property 'module' with string value as the name.");
}

class ModuleGetter extends EventEmitter {
  constructor(hub) {
    super();
    this.__hub = hub;
  }

  getConfig(pathKey, defaultValue) {
    return this.__hub.getConfig(pathKey, defaultValue);
  }

  getStore() {
    return this.__hub.__store;
  }

  getModule(name = "") {
    let Module = this.__hub.__modules[name.toLowerCase()];
    if (!Module) return null;
    return this.__instantiateModule(Module, name);
  }

  getRequiredModule(name = "") {
    let Module = this.__hub.__modules[name.toLowerCase()];
    if (!Module) throw new Error(`Module "${name}" not found`);
    return this.__instantiateModule(Module, name);
  }

  __instantiateModule(Module, name) {
    if (!Module) return null;
    let instances = this.__hub.__instances;
    let config = _get(this.__hub.__config.modules, name);
    if (Module.isSingleton) {
      let instance = instances[name];
      if (!instance) {
        instance = new Module(this.__hub.getter, config);
        instances[name] = instance;
      }
      return instance;
    }
    return new Module(this.__hub.getter, config);
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

class ModuleSetter {
  constructor(hub) {
    this.__hub = hub;
  }

  getConfig(pathKey, defaultValue) {
    return this.__hub.getConfig(pathKey, defaultValue);
  }

  addScopeModule(module, name) {
    checkModule(module);
    name = (name || module.module).toLowerCase();
    if (this.__hub.__modules[name])
      throw new Error(`Module "${name}" already registered`);
    this.__hub.__modules[name] = module;
  }

  addModule(module, name) {
    checkModule(module);
    name = (name || module.module).toLowerCase();
    this.addScopeModule(module, name);
    module.isSingleton = true;
    this.__hub.getter.getModule(name);
  }
}

class ReactModuleHub {

  constructor(config = {}, options = {}) {
    this.isReady = false;
    this.getter = new ModuleGetter(this);
    this.setter = new ModuleSetter(this);
    this.__options = options;
    this.__config = null;
    this.__store = null;
    this.__modules = {};
    this.__instances = {};
    this.__startups = [];
    this.__reducers = null;
    this.__setConfig(config);
  }

  start(setup, registrar) {
    let reducers = {};
    let screens = {};
    let modals = {};
    let extra = {};
    // First of all, get all modules
    registrar(this.setter);
    // Parsing
    for (const key in this.__modules) {
      if (this.__modules.hasOwnProperty(key)) {
        const mod = this.__modules[key];
        if (mod.reducers) reducers[key] = mod.reducers;
        if (mod.screens) Object.assign(screens, mod.screens);
        if (mod.modals) Object.assign(modals, mod.modals);
        // Extra data to pass
        if (mod.extra) extra[key] = mod.extra;
      }
    }
    // Combine all reducers from modules
    if (!_isEmpty(reducers))
      this.__reducers = combineReducers(reducers);
    // Call component setup from user
    return setup(this, {
      screens,
      modals,
      extra
    });
  }

  init(createStore) {
    return this.__getInitialState()
      .then(initState => {
        if (createStore && this.__reducers) {
          const store = createStore(this.__reducers, initState);
          if (store) this.__setStore(store);
        }
      })
      .then(() => this.__trigger("start", this.__startups))
      .then(() => Promise.all(this.__startups))
      .finally(() => {
        this.__startups.length = 0;
        this.__startups = null;
        this.__reducers = null;
      })
      .then(() => {
        this.isReady = true;
        this.__trigger("ready");
      });
  }

  getConfig(pathKey, defaultValue) {
    return _get(this.__config, pathKey, defaultValue);
  }

  __getInitialState() {
    return new Promise((resolve, reject) => {
      let state = {};
      let { storage } = this.__options;
      let hasPersist = false;
      for (const key in this.__modules) {
        if (!this.__modules.hasOwnProperty(key)) continue;
        const mod = this.__modules[key];
        if (mod.persist && storage) {
          hasPersist = true;
          if (mod.persist === true) {
            storage.getItem(prefix + mod.module)
              .then(value => _set(state, mod.module, JSON.parse(value || "{}")))
              .then(resolve)
              .catch(reject);
          } else {
            let promises = [];
            mod.persist.forEach(path => {
              path = mod.module + "." + path;
              promises.push(
                storage.getItem(prefix + path)
                  .then(value => {
                    try {
                      _set(state, path, JSON.parse(value));
                    } catch {
                      // Nothing to do
                    }
                  })
              );
            });
            Promise.all(promises).then(() => resolve(state)).catch(reject);
          }
        }
      }
      if (!hasPersist) resolve({});
    });
  }

  __setConfig(config) {
    if (!config.modules) config.modules = {};
    this.__config = config;
  }

  __setStore(store) {
    this.__store = store;
    // Observe those modules who set persist property
    for (const key in this.__modules) {
      if (!this.__modules.hasOwnProperty(key)) continue;
      const mod = this.__modules[key];
      if (mod.persist) {
        if (mod.persist === true) {
          // Persist whole module
          this.__persistState(mod.module);
        } else {
          // Should be array, persist by keys
          mod.persist.forEach(path => {
            this.__persistState(mod.module + "." + path);
          });
        }
      }
    }
  }

  __persistState(path) {
    let lastState;
    let { storage } = this.__options;
    let handleChange = () => {
      let currentState = _get(this.__store.getState(), path);
      if (currentState !== lastState) {
        lastState = currentState;
        // Write to storage
        if (storage && path)
          storage.setItem(prefix + path, JSON.stringify(currentState));
      }
    };
    let unsubscribe = this.__store.subscribe(handleChange);
    handleChange();
    return unsubscribe;
  }

  __trigger(event, results) {
    let { modules: moduleConfigs } = this.__config;
    for (let key in this.__modules) {
      if (this.__modules.hasOwnProperty(key)) {
        let instance = this.getter.getModule(key);
        if (instance[event]) {
          let res = instance[event](this.getter, moduleConfigs[key]);
          if (results) results.push(res);
        }
      }
    }
  }

}

ReactModuleHub.withModules = function (ChildComponent, ...modules) {
  return class extends React.Component {
    render() {
      return React.createElement(HubContext.Consumer, null, hub => {
        return React.createElement(ChildComponent, {
          hub: hub.getter,
          modules: hub.getter.__getModules(modules),
          ...this.props
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
          hub: hub.getter,
          modules: hub.getter.__getRequiredModules(modules),
          ...this.props
        });
      });
    }
  };
};

function createModule(name, module, options = {}) {
  module.module = name;
  Object.assign(module, options);
  return module;
}
ReactModuleHub.createModule = createModule;
ReactModuleHub.asModule = createModule;
ReactModuleHub.HubContext = HubContext;
module.exports = ReactModuleHub;
