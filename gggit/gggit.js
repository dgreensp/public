if (Meteor.isClient) {
  Template.userinfo.onCreated(function () {
//    this.user = new ReactiveVar();
//    this.autorun(() => {
//      this.user.set(Meteor.user());
//    });
  });
  Template.userinfo.helpers({
//    clientUser() { return JSON.stringify(Template.instance().user.get()); }
  });
}

if (Meteor.isServer) {
  Accounts.removeDefaultRateLimit();
}
