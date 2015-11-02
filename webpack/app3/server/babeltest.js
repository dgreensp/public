var babel = require('babel-core');

//var code = 'import "blah";\nclass Example { foo() { console.log("foo"); } };\n(new Example).foo()';
var code = "class Foo extends Bar {}";
//var code = "export default 3;";

var result = babel.transform(code, {
  plugins: [
    "transform-runtime",
    // ES2015, with selected modules in "loose" mode
    "transform-es2015-template-literals",
    "transform-es2015-literals",
    "transform-es2015-function-name",
    "transform-es2015-arrow-functions",
    "transform-es2015-block-scoped-functions",
    "transform-es2015-classes",
    "transform-es2015-object-super",
    "transform-es2015-shorthand-properties",
    "transform-es2015-computed-properties",
    ["transform-es2015-for-of", { loose: true }],
    "transform-es2015-sticky-regex",
    "transform-es2015-unicode-regex",
    "transform-es2015-constants",
    "transform-es2015-spread",
    "transform-es2015-parameters",
    "transform-es2015-destructuring",
    "transform-es2015-block-scoping",
//    "transform-es2015-typeof-symbol",
    "transform-es2015-modules-commonjs",
    ["transform-regenerator", { async: false, asyncGenerators: false }],
    // React
    "transform-react-jsx",
    "transform-flow-strip-types",
    "syntax-flow",
    "syntax-jsx",
    // ES2016 (selected conservatively)
    "syntax-object-rest-spread",
    "syntax-trailing-function-commas"
    // Use external runtime, not inline helpers,
    //"external-helpers-2",
  ],

  babelrc: false // don't pay attention to babelrc
});

var vm = require('vm');

console.log(result.map);

//vm.runInThisContext(require('babel-core/lib/api/node').buildExternalHelpers());

//vm.runInThisContext('(function (require) {\n' + result.code + '\n})(function () {})');
