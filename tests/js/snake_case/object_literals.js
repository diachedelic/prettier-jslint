import helloYou from "./blah.js";
import MyClass from "./blah.js";

let theExport = {
  helloYou,
  someGlobal,
  someGlobal: helloYou,
  helloYou: someGlobal,
  helloYou: {helloYou},
  MyClass,
};

export default Object.freeze(theExport);
