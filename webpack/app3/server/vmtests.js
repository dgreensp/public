var vm = require('vm');

var numAsserts = 0;
var numPasses = 0;
function assert(bool, what) {
  numAsserts++;
  if (! bool) console.log("FAILED: " + what);
  else numPasses++;
};

var subglobal = Object.create(global);
assert(! vm.isContext(subglobal), "subglobal not a context at first");
vm.createContext(subglobal);
assert(vm.isContext(subglobal), "subglobal becomes a context");
assert(subglobal.Array === Array, "subglobal still has same Array");
subglobal.require = function () { return 123; };

var result = vm.runInContext('[require(), 456, [] instanceof Array]', subglobal);
assert(result instanceof Array, "result is instanceof Array");
assert(result.join(',') === '123,456,true', '123,456,true: '+result.join(','));

console.log("Passed " + numPasses + "/" + numAsserts);
