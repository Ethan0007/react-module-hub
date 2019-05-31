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
    this._hub = hub;
  }

  getConfig(pathKey, defaultValue) {
    return this._hub.getConfig(pathKey, defaultValue);
  }

  getStore() {
    return this._hub._store;
  }

  getModule(name = "") {
    let Module = this._hub._modules[name.toLowerCase()];
    if (!Module) return null;
    return this._instantiateModule(Module, name);
  }

  getRequiredModule(name = "") {
    let Module = this._hub._modules[name.toLowerCase()];
    if (!Module) throw new Error(`Module "${name}" not found`);
    return this._instantiateModule(Module, name);
  }

  _instantiateModule(Module, name) {
    if (!Module) return null;
    let instances = this._hub._instances;
    let config = _get(this._hub._config.modules, name);
    if (Module.isSingleton) {
      let instance = instances[name];
      if (!instance) {
        instance = new Module(this._hub.getter, config);
        instances[name] = instance;
      }
      return instance;
    }
    return new Module(this._hub.getter, config);
  }

  _getModules(names) {
    return _reduce(names, (o, k) => {
      o[k] = this.getModule(k);
      return o;
    }, {});
  }

  _getRequiredModules(names) {
    return _reduce(names, (o, k) => {
      o[k] = this.getRequiredModule(k);
      return o;
    }, {});
  }

}

class ModuleSetter {
  constructor(hub) {
    this._hub = hub;
  }

  getConfig(pathKey, defaultValue) {
    return this._hub.getConfig(pathKey, defaultValue);
  }

  addScopeModule(module, name) {
    checkModule(module);
    name = (name || module.module).toLowerCase();
    if (this._hub._modules[name])
      throw new Error(`Module "${name}" already registered`);
    this._hub._modules[name] = module;
  }

  addModule(module, name) {
    checkModule(module);
    name = (name || module.module).toLowerCase();
    this.addScopeModule(module, name);
    module.isSingleton = true;
    this._hub.getter.getModule(name);
  }

}

class ReactModuleHub {

  constructor(config = {}, options = {}) {
    this.isReady = false;
    this.getter = new ModuleGetter(this);
    this.setter = new ModuleSetter(this);
    this._options = options;
    this._config = null;
    this._store = null;
    this._modules = {};
    this._instances = {};
    // Holds the root reducer (will be cleared when init is done)
    // Init method should consume it for creating the store
    this._reducers = null;
    // Promises returned by start lifecycle (will be cleared)
    this._startups = [];
    // Async imports returned by registrar (will be cleared)
    this._imports = null;
    this._setConfig(config);
  }

  start(setup, registrar) {
    let reducers = {};
    let screens = {};
    let modals = {};
    let extra = {};
    // First of all, get all modules
    this._imports = registrar(this.setter) || [];
    // Parsing
    for (const key in this._modules) {
      if (this._modules.hasOwnProperty(key)) {
        const mod = this._modules[key];
        if (mod.reducers) reducers[key] = mod.reducers;
        if (mod.screens) Object.assign(screens, mod.screens);
        if (mod.modals) Object.assign(modals, mod.modals);
        // Extra data to pass
        if (mod.extra) extra[key] = mod.extra;
      }
    }
    // Combine all reducers from modules
    if (!_isEmpty(reducers))
      this._reducers = combineReducers(reducers);
    // Call component setup from user
    return setup(this, {
      screens,
      modals,
      extra
    });
  }

  init(createStore) {
    return this._getInitialState()
      .then(initState => {
        if (createStore && this._reducers) {
          const store = createStore(this._reducers, initState);
          if (store) this._setStore(store);
        }
      })
      .then(() => Promise.all(this._imports))
      .then(() => this._trigger("start", this._startups))
      .then(() => Promise.all(this._startups))
      .finally(() => {
        this._reducers = null;
        this._startups.length = 0;
        this._startups = null;
        this._imports.length = 0;
        this._imports = null;
      })
      .then(() => {
        this.isReady = true;
        this._trigger("ready");
      });
  }

  getConfig(pathKey, defaultValue) {
    return _get(this._config, pathKey, defaultValue);
  }

  _getInitialState() {
    return new Promise((resolve, reject) => {
      let state = {};
      let { storage } = this._options;
      let hasPersist = false;
      for (const key in this._modules) {
        if (!this._modules.hasOwnProperty(key)) continue;
        const mod = this._modules[key];
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

  _setConfig(config) {
    if (!config.modules) config.modules = {};
    this._config = config;
  }

  _setStore(store) {
    this._store = store;
    // Observe those modules who set persist property
    for (const key in this._modules) {
      if (!this._modules.hasOwnProperty(key)) continue;
      const mod = this._modules[key];
      if (mod.persist) {
        if (mod.persist === true) {
          // Persist whole module
          this._persistState(mod.module);
        } else {
          // Should be array, persist by keys
          mod.persist.forEach(path => {
            this._persistState(mod.module + "." + path);
          });
        }
      }
    }
  }

  _persistState(path) {
    let lastState;
    let { storage } = this._options;
    let handleChange = () => {
      let currentState = _get(this._store.getState(), path);
      if (currentState !== lastState) {
        lastState = currentState;
        // Write to storage
        if (storage && path)
          storage.setItem(prefix + path, JSON.stringify(currentState));
      }
    };
    let unsubscribe = this._store.subscribe(handleChange);
    handleChange();
    return unsubscribe;
  }

  _trigger(event, results) {
    let { modules: moduleConfigs } = this._config;
    for (let key in this._modules) {
      if (this._modules.hasOwnProperty(key)) {
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
          modules: hub.getter._getModules(modules),
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
          modules: hub.getter._getRequiredModules(modules),
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
