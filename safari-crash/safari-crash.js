if (Meteor.isClient) {

Template.groupNav.events({
  'click .group': function () {},
  'click .rerun': function () {}
});


var myDep = new Deps.Dependency;
var firstTime = true;

UI.body.helpers({
  testdata: function () {
    myDep.depend();
    if (firstTime) {
      firstTime = false;
      myDep.changed();
      return [];
    }
    return { groups: [
        { tests: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
           10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
           20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
        ] }
      ] };
  }
});

Template.test.events({
  'click .testname': function () {}
});

}
