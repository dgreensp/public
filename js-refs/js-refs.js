
// PLAN OF ATTACK
// =====
//
// Build a traverse function based on https://github.com/Constellation/estraverse/blob/master/estraverse.js .
//
// Take the VisitorKeys and annotate them with annotations like:
// - this is an expression (e.g. if found to be of type Identifier)
// - this is a left-hand-side
// - this starts a new scope
//
// Left-hand-sides in:
// - AssignmentExpression.left
// - UpdateExpression.argument (increment/decrement)
// - ForInStatement.left
//
// Eh, just make it AssignmentExpression!
//
// Annotate the tree with vars somehow.  Annotate it with parent pointers?
// Whatever other annotations we need.
//
// Find the non-var Identifier expressions, then find their dotted expressions
// somehow.
//
// Write unit test cases right in the app.


if (Meteor.isClient) {

  Session.setDefault(
    "input",
    ['var x = 12',
     'var y = {z: 13};',
     'Foo.Bar.Baz = Kitten.Puppy + Shark["banana"].teeth + x + y.z + Kitten["cat"];',
     ''].join('\n'));

  Meteor.startup(function () {
    DomUtils.find(document, '#input').focus();
  });

  Template.main.input = function () {
    return Session.get("input");
  };

  Template.main.events({
    'keyup textarea': function (event) {
      var input = event.currentTarget.value;
      Session.set("input", input);
    }
  });

  var escape = Handlebars._escape;

  Template.main.output = function () {
    var input = Session.get("input") || '';

    var tree;
    try {
      tree = esprima.parse(input);
    } catch (e) {
      return '<span class="parseError">' + escape(e.message) + '</span>';
    }

    return escape(JSON.stringify(esprima.parse(input)));
  };

  eachDottedExpression = function (node, f, isExpression, isLeft) {
    // XXXXXXXX
  };

}
