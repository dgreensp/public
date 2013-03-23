
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
