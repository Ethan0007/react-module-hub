const EventEmitter = require("events");
const React = require("react");
const { combineReducers } = require("redux");
const _get = require("lodash.get");
const _set = require("lodash.set");
const _reduce = require("lodash.reduce");
const HubContext = React.createContext({});
const prefix = "__HUB__:";

class ReactModuleHub extends EventEmitter {

  constructor(config = {}, options = {}) {
    super();
    this.__options = options;
    this.__config = null;
    this.__store = null;
    this.__modules = {};
    this.__instances = {};
    this.__startups = [];
    this.__reducers = null;
    this.__screens = {};
    this.__modals = {};
    this.__setConfig(config);
    this.once("start", () => this.__trigger("start", this.__startups));
    this.once("ready", () => this.__trigger("ready"));
  }

  start(setup) {
    let reducers = {};
    for (const key in this.__modules) {
      if (this.__modules.hasOwnProperty(key)) {
        const ins = this.getModule(key);
        // Reducers
        if (ins.reducers) reducers[key] = ins.reducers;
        // Screens
        if (ins.screens) Object.assign(this.__screens, ins.screens);
        // Modals
        if (ins.modals) Object.assign(this.__modals, ins.modals);
      }
    }
    this.__reducers = combineReducers(reducers);
    // Call component setup from user
    return setup(this);
  }

  init(createStore) {
    return this.getInitialState().then(initState => {
      const store = createStore(this.getRootReducer(), initState);
      this.setStore(store);
    }).then(() => {
      this.emit("start");
    });
  }

  load() {
    return Promise.all(this.__startups)
      .finally(() => {
        this.__startups.length = 0;
        this.__startups = null;
        this.__reducers = null;
        this.__screens = null;
        this.__modals = null;
      })
      .then(() => this.emit("ready"));
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
    // Observe those modules who set persist property
    for (const key in this.__modules) {
      if (!this.__modules.hasOwnProperty(key)) continue;
      const ins = this.getModule(key);
      if (ins.persist) {
        if (ins.persist === true) {
          // Persist whole module
          this.__persistState(ins.__name);
        } else {
          // Should be array, persist by keys
          ins.persist.forEach(path => {
            this.__persistState(ins.__name + "." + path);
          });
        }
      }
    }
  }

  getConfig(pathKey, defaultValue) {
    return _get(this.__config, pathKey, defaultValue);
  }

  getStore() {
    return this.__store;
  }

  getInitialState() {
    return new Promise((resolve, reject) => {
      let state = {};
      let { storage } = this.__options;
      let hasPersist = false;
      for (const key in this.__modules) {
        if (!this.__modules.hasOwnProperty(key)) continue;
        const ins = this.getModule(key);
        if (ins.persist && storage) {
          hasPersist = true;
          if (ins.persist === true) {
            storage.getItem(prefix + ins.__name)
              .then(value => _set(state, ins.__name, value || {}))
              .then(resolve)
              .catch(reject);
          } else {
            let promises = [];
            ins.persist.forEach(path => {
              path = ins.__name + "." + path;
              promises.push(
                storage.getItem(prefix + path)
                  .then(value => {
                    _set(state, path, value);
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

  getModule(name = "") {
    let Module = this.__modules[name.toLowerCase()];
    if (!Module) return null;
    return this.__instantiateModule(Module, name);
  }

  getRequiredModule(name = "") {
    let Module = this.__modules[name.toLowerCase()];
    if (!Module) throw new Error(`Module "${name}" not found`);
    return this.__instantiateModule(Module, name);
  }

  getRootReducer() {
    return this.__reducers;
  }

  getMainScreens() {
    return this.__screens;
  }

  getModalScreens() {
    return this.__modals;
  }

  __setConfig(config) {
    if (!config.modules) config.modules = {};
    this.__config = config;
  }

  __persistState(path) {
    let lastState;
    let { storage } = this.__options;
    let handleChange = () => {
      let currentState = _get(this.__store.getState(), path);
      if (currentState !== lastState) {
        lastState = currentState;
        // Write to storage
        if (storage) storage.setItem(prefix + path, currentState);
      }
    };
    let unsubscribe = this.__store.subscribe(handleChange);
    handleChange();
    return unsubscribe;
  }

  __instantiateModule(Module, name) {
    if (!Module) return null;
    name = name || Module.name.toLowerCase();
    let config = _get(this.__config.modules, name);
    if (Module.isSingleton) {
      let instance = this.__instances[name];
      if (!instance) {
        instance = new Module(this, config);
        instance.__name = name;
        this.__instances[name] = instance;
      }
      return instance;
    }
    return new Module(this, config);
  }

  __trigger(event, results) {
    let { modules: moduleConfigs } = this.__config;
    for (let key in this.__modules) {
      if (this.__modules.hasOwnProperty(key)) {
        let instance = this.getModule(key);
        if (instance[event]) {
          let res = instance[event](this, moduleConfigs[key]);
          if (results) results.push(res);
        }
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
          ...this.props,
          ...hub.__getModules(modules),
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
          ...this.props,
          ...hub.__getRequiredModules(modules),
        });
      });
    }
  };
};

ReactModuleHub.HubContext = HubContext;

module.exports = ReactModuleHub;