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
        localStorage.setItem(key, JSON.stringify(value));
      },
      getItem(key) {
        return JSON.parse(localStorage.getItem(key));
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
  constructor() {
    this.screens = { a: 1 };
    this.modals = { a: 2 };
  }
  start() {
    console.log("ModuleA: start");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
  }
  ready(hub, conf) {
    console.log("ModuleA: ready");
    // const mB = hub.getRequiredModule("moduleb");
    // console.log("A:C", conf);
  }
  getName() {
    return "Foo";
  }
}

class ModuleB {
  constructor() {
    this.screens = { b: 1 };
    this.modals = { b: 2 };
    this.persist = ["counter"];
    this.reducers = combineReducers({
      todos,
      counter
    });
  }
  start() {
    console.log("ModuleB: start");
    // return new Promise((resolve) => {
    //   setTimeout(() => {
    //     resolve();
    //   }, 3000);
    // });
  }
  ready(hub, conf) {
    const store = hub.getStore();
    const state = store.getState();
    console.log("ModuleB: ready");
    // const mA = hub.getModule("modulea");
    // console.log("B:C", conf);
    console.log(state);
    this.getTest();
    store.dispatch({
      type: "CLEAR"
    });
  }
  getName() {
    return "Bar";
  }
  getTest() {
    return 1;
  }
}

hub.addSingletonModule(ModuleA);
hub.addSingletonModule(ModuleB);

hub.start(ins => {
  setTimeout(() => {
    // Methods `getRootReducers`, `getMainScreens` and `getModalScreens`
    // must be called before `load` if you need it
    const initialState = ins.getInitialState();
    const store = createStore(
      ins.getRootReducer(),
      initialState
    );
    ins.setStore(store);
    ins.load();
  }, 1000);
});