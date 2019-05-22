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
    ins.load();
  }, 1000);
});