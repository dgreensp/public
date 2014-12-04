Compositions = new Mongo.Collection('compositions');

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (! Compositions.findOne('Untitled')) {
      Compositions.insert({_id: 'Untitled', patches: []});
    }
  });

  Meteor.publish('compositions', function () {
    return Compositions.find();
  });
}

if (Meteor.isClient) {
  CurrentComposition = new ReactiveDict('CurrentComposition');
  CurrentComposition.set('_id', null);
  CurrentComposition.set('patches', []);
  CurrentComposition.save = function () {
    if (this.get('_id')) {
      Compositions.update(this.get('_id'), { $set: {
        patches: this.get('patches')
      }});
    }
  };

  Meteor.subscribe('compositions', {
    onReady: function () {
      var comp = Compositions.findOne('Untitled');
      CurrentComposition.set('_id', comp._id);
      CurrentComposition.set('patches', comp.patches);
    }
  });

  Template.composer.created = function () {
    this.patchesDuringDrag = new ReactiveVar(null);
  };

  Template.composer.helpers({
    id: function () {
      return CurrentComposition.get('_id');
    },
    patches: function () {
      return Template.instance().patchesDuringDrag.get() ||
        CurrentComposition.get('patches');
    },
    draggingClass: function () {
      return Template.instance().patchesDuringDrag.get() ?
        'dragging' : '';
    }
  });

  Template.composer.events({
    'click .addpatch': function () {
      var newPatch = {
        _id: Random.id(),
        type: 'Foo'
      };
      var patches = CurrentComposition.get('patches');
      patches.push(newPatch);
      CurrentComposition.set('patches', patches);
      CurrentComposition.save();
      return false;
    },
    'click .patch .removepatch': function () {
      var id = this._id;
      var patches = CurrentComposition.get('patches');
      patches = _.filter(patches, function (p) {
        return p._id !== id;
      });
      CurrentComposition.set('patches', patches);
      CurrentComposition.save();
      return false;
    },
    'mousedown .patch .draghandle': function (downEvent) {
      var id = this._id;
      var oldPatches = CurrentComposition.get('patches');
      var template = Template.instance();
      var patchpane = template.$(".patchpane");

      var setPatchesFromEventCoords = function (event, usePlaceholder) {
        var topLeft = patchpane.offset();
        var x = event.pageX - topLeft.left;
        var y = event.pageY - topLeft.top;

        var newIndex = Math.floor(y / 30); // XXX hardcoded patch height

        var oldPatch = _.findWhere(oldPatches, { _id: id });
        // clone oldPatches and oldPatch; leave other patches intact
        var newPatches = _.clone(oldPatches);
        var newPatch = _.clone(oldPatch);
        var k = _.indexOf(oldPatches, oldPatch);
        newPatches.splice(k, 1); // delete oldPatch
        newPatches.splice(newIndex, 0, newPatch); // insert newPatch
        if (usePlaceholder) {
          newPatch._placeholder = true;
        }
        template.patchesDuringDrag.set(newPatches);
      };

      setPatchesFromEventCoords(downEvent, true);
      var isMouseDown = true;
      var moveListener = _.throttle(function (moveEvent) {
        if (! isMouseDown) {
          return;
        }
        setPatchesFromEventCoords(moveEvent, true);
      }, 100);
      var upListener = function (upEvent) {
        isMouseDown = false;
        window.removeEventListener("mouseup", upListener, true);
        window.removeEventListener("mousemove", moveListener, true);
        setPatchesFromEventCoords(upEvent);


        CurrentComposition.set(
          'patches', template.patchesDuringDrag.get());
        CurrentComposition.save();
        template.patchesDuringDrag.set(null);
      };
      window.addEventListener("mouseup", upListener, true);
      window.addEventListener("mousemove", moveListener, true);
      return false;
    }
  });

  Template.patch.created = function () {
    this.isNew = new ReactiveVar(true);
  };

  Template.patch.rendered = function () {
    var self = this;
    setTimeout(function () {
      self.isNew.set(false);
    }, 100);
  };

  Template.patch.helpers({
    newpatchClass: function () {
      return Template.instance().isNew.get() ? 'newpatch' : '';
    },
    placeholderClass: function () {
      return this._placeholder ? 'placeholder' : '';
    }
  });

  Template.icon.helpers({
    // turn "foo bar" into "fa-foo fa-bar"
    faClasses: function (str) {
      return _.map(_.compact(str.split(' ')), function (word) {
        return 'fa-' + word;
      }).join(' ');
    }
  });

}
