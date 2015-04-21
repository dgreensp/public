if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);

  Template.hello.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    }
  });
}

if (Meteor.isServer) {
  var fs = Npm.require('fs');

  Meteor.startup(function () {
    // code to run on server at startup
  });

  HTTP.methods({
    'saveFile': function (data) {
      var path = ('/Users/dgreenspan/Downloads/saved-files/' +
                  data.name);
      fs.writeFileSync(path, data.contents, 'utf8');
      console.log('Wrote ' + path);
      return 'SAVED';
    }
  });
}
