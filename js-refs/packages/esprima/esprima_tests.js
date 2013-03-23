
Tinytest.add("esprima - basic", function (test) {
  var tree = esprima.parse('1+1');
  test.equal(tree, {
    "type": "Program",
    "body": [{
      "type": "ExpressionStatement",
      "expression": {
        "type": "BinaryExpression",
        "operator": "+",
        "left": {
          "type": "Literal",
          "value": 1,
          "raw": "1"
        },
        "right": {
          "type": "Literal",
          "value": 1,
          "raw": "1"}}}]
  });
});
