const Hub = require(".");
const { createStore, combineReducers } = require("redux");
var LocalStorage = require("node-localstorage").LocalStorage,
  localStorage = new LocalStorage("./scratch");

let hub = new Hub({
  foo: "bar",
  boo: {
    jar: {
      inner: "yeah"
    }
  },
  modules: {
    moduleb: {
      isFoo: "Bar"
    }
  }
}, {
    storage: {
      setItem(key, value) {
        return Promise.resolve().then(() => {
          return localStorage.setItem(key, value);
        });
      },
      getItem(key) {
        return Promise.resolve().then(() => {
          return localStorage.getItem(key);
        });
      }
    }
  });

function todos(state = [], action) {
  switch (action.type) {
    case "ADD_TODO":
      return state.concat([action.text]);
    default:
      return state;
  }
}

function counter(state = 0, action) {
  switch (action.type) {
    case "INCREMENT":
      return state + 1;
    case "DECREMENT":
      return state - 1;
    case "CLEAR":
      return null;
    default:
      return state;
  }
}

class ModuleA {
  start(hub) {
    console.log("ModuleA: start");
    const mB1 = hub.getModule("moduleb");
    console.log(mB1.getName());
    const mB2 = hub.getModule("moduleb");
    console.log("X", mB1 == mB2);
  }
  ready() {
    console.log("ModuleA: ready");
  }
  getName() {
    return "Module From A";
  }
}

ModuleA.label = "modulea";
// ModuleA.reducers = todos;

class ModuleB {
  start(hub, config) {
    console.log("ModuleB: start");
    const mA = hub.getModule("modulea");
    console.log(mA.getName());
    console.log(hub.getRequiredModule);
    console.log(hub.getRequiredModule);
    console.log(config);
  }
  ready() {
    console.log("ModuleB: ready");
  }
  getName() {
    return "Module From B";
  }
}

let newModuleB = Hub.createModule("moduleb", ModuleB, {
  reducers: todos
});

hub.register(ins => {
  ins.addModule(ModuleA);
  ins.addModule(newModuleB);
});

console.log(hub.isReady);

hub.start(ins => {
  setTimeout(() => {
    ins.init((rootReducer, initialState) => {
      return createStore(rootReducer, initialState);
    }).then(() => {
      console.log(hub.isReady);
    });
  }, 1000);
});