const Hub = require(".");

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
});

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
    console.log("A:C", conf);
  }
  getName() {
    return "Foo";
  }
}

class ModuleB {

  constructor() {
    this.screens = { b: 1 };
    this.modals = { b: 2 };
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
    console.log("ModuleB: ready");
    // const mA = hub.getModule("modulea");
    console.log("B:C", conf);
    this.getTest();
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
    console.log(ins.getRootReducer());
    console.log(ins.getMainScreens());
    console.log(ins.getModalScreens());
    ins.load().then(() => {
      console.log(ins.getRootReducer());
      console.log(ins.getMainScreens());
      console.log(ins.getModalScreens());
    });
  }, 1000);
});