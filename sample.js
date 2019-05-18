const Hub = require(".");

let hub = new Hub();

class ModuleA {
  ready() {
    const mB = hub.getModule("w-t-f");
    console.log("A", mB.getName());
  }
  getName() {
    return "Foo";
  }
}

class ModuleB {
  ready(hub) {
    const mA = hub.getModule("modulea");
    console.log("B", mA.getName());
    console.log("C", hub.getConfig("foo"));
    console.log("D", hub.getConfig("boo.jar.inner", "default"));
  }
  getName() {
    return "Bar";
  }
}

hub.addSingletonModule(ModuleB, "w-t-f");
hub.addSingletonModule(ModuleA);

hub.start(ins => {
  ins.setConfig({
    foo: "bar",
    boo: {
      jar: {
        inner: "yeah"
      }
    }
  });
  setTimeout(() => {
    ins.ready();
    console.log(ins._getModules(["w-t-f"]));
  }, 100);
});