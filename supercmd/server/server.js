
Meteor.methods({
  doStuff() {
    return Meteor.users.findOne(this.userId).services["meteor-developer"].accessToken;
  }
});
