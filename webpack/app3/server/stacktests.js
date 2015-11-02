var e = new Error();

Error.prepareStackTrace = function () { return 'foo'; };
var stack = e.stack;
delete Error.prepareStackTrace; // in real impl, would put back old value
console.log(e.stack);
