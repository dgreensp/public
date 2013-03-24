Tinytest.add("js-analyze - basic", function (test) {

  var R = JSAnalyze.READ;
  var RW = JSAnalyze.READWRITE;
  var run = function (source) {
    return JSAnalyze.findGlobalDottedRefs(source);
  };

  test.equal(run('x'), {x: R});
});