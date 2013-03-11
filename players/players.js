Players = new Meteor.Collection("players");

if (Meteor.isClient) {
  Meteor.subscribe('players');

  Meteor.startup(function () {
    var player_id = Players.insert({name: name});
  });

  Template.hello.playerCount = function () {
    var count = Players.find().count();
    console.log(count);
    return count;
  };
}


if (Meteor.isServer) {
  Meteor.publish('players', function () {
    return Players.find();
  });
}