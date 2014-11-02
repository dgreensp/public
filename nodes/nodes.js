Nodes = new Mongo.Collection('nodes');

if (Meteor.isClient) {
  Template.nodeTree.helpers({
    rootNode: function () {
      return Nodes.findOne({root: true});
    }
  });

  Template.nodeTree.events({
    'click .add-child': function () {
      var curId = this._id;
      var newId = Nodes.insert({ childIds: [], parentId: curId });
      Nodes.update(curId, { $push: { childIds: newId } });
    },
    'click .remove-node': function () {
      var curId = this._id;
      Nodes.update(this.parentId, { $pull: { childIds: curId } });
      Nodes.remove(curId);
    }
  });

  Template.node.helpers({
    isRemovable: function () {
      return (! this.root) && (! this.childIds.length);
    },
    children: function () {
      // Allow for not-found nodes (deleted or not loaded)
      return _.compact(_.map(this.childIds, function (id) {
        return Nodes.findOne(id);
      }));;
    },
    childCount: function () {
      return this.childIds.length;
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Nodes.find().count() === 0) {
      Nodes.insert({ childIds: [], root: true });
    }
  });
}
