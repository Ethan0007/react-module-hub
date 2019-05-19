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
  ready(hub, conf) {
    const mB = hub.getRequiredModule("moduleb");
    console.log("A:C", conf);
  }
  getName() {
    return "Foo";
  }
}

class ModuleB {
  ready(hub, conf) {
    const mA = hub.getModule("modulea");
    // console.log("B", mA.getName());
    // console.log("C", hub.getConfig("foo"));
    // console.log("D", hub.getConfig("boo.jar.inner", "default"));
    // console.log("X", this);
    // console.log("Y", hub);
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

hub.addSingletonModule(ModuleB);
hub.addSingletonModule(ModuleA);

hub.start(ins => {
  setTimeout(() => {
    ins.ready();
  }, 100);
});