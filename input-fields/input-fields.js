Things = new Meteor.Collection("things");

if (Meteor.isServer) {
  if (Things.find().count() < 1)
    Things.insert({});
}

if (Meteor.isClient) {

  var coercions = {
    'text': function (x) { return String(x || ''); },
    'boolean': function (x) { return !! x; },
    'select': function (x, fld) {
      return _.contains(fld.choices, x) ? x : fld.defaultChoice;
    }
  };

  var setUpEditableField = function (field) {
    var fieldName = field.fieldName;
    var fieldType = field.fieldType;
    var tmpl = Template.fields;
    var oldCreated = tmpl.created || function () {};
    var oldRendered = tmpl.rendered || function () {};
    var oldDestroyed = tmpl.destroyed || function () {};

    if (! coercions[fieldType])
      throw new Error("Unknown fieldType " + fieldType);
    var coerce = function (x) {
      return coercions[fieldType](x, field);
    };

    tmpl.created = function () {
      oldCreated.call(this);

      var self = this;
      // XXX "typed" is kind of a misnomer for non-text fields
      Session.set('field-'+fieldName+'-typed',
                  coerce(self.data[fieldName]));
      Session.set('field-'+fieldName+'-error', false);
      self[fieldName+'Updater'] = Deps.autorun(function () {
        var typed = Session.get('field-'+fieldName+'-typed');
        Deps.nonreactive(function () {
          var remote = coerce(self.data[fieldName]);

          if (typed !== remote &&
              ! Session.get('field-'+fieldName+'-pending')) {
            //console.log('update', typed);
            var $set = {};
            $set[fieldName] = typed;
            Session.set('field-'+fieldName+'-pending', true);
            Things.update(self.data._id, {$set: $set},
                          function (error) {
                            //console.log('landed', typed);
                            if (error) {
                              console.log(error);
                              Session.set('field-'+fieldName+'-error', true);
                            } else {
                              Session.set('field-'+fieldName+'-error', false);
                            }
                            Session.set('field-'+fieldName+'-pending',
                                        false);
                            // If we now see different typed data in the field,
                            // invalidate the updater the same way we do
                            // on key-press.
                            if (Session.get('field-'+fieldName+'-typed') !==
                                typed)
                              self[fieldName+'Updater'].invalidate();
                          });
          }
        });
      });
      self[fieldName+'FocusUpdater'] = Deps.autorun(function () {
        var elem = DomUtils.find(document, '.'+fieldName+'Field .control');
        Session.set('field-'+fieldName+'-focused',
                    elem ? elem === document.activeElement : false);
      });
    };

    tmpl.destroyed = function () {
      oldDestroyed.call(this);

      this[fieldName+'Updater'].stop();
      this[fieldName+'FocusUpdater'].stop();
    };

    var events = {};
    if (fieldType === 'text') {
      events['keyup .'+fieldName+'Field input, blur .'+
             fieldName+'Field input'] =
        function (evt) {
          // (we do this on blur too because it seems like
          // if you type and then TAB quickly, the last
          // character typed may not fire a keyup)
          Session.set('field-'+fieldName+'-typed',
                      evt.target.value);
          //console.log('typed value: ', evt.target.value);
        };
    } else if (fieldType === 'boolean') {
      events['change .'+fieldName+'Field input'] =
        function (evt) {
          // Old IE doesn't fire "change" until you blur the
          // checkbox, but Spark fixes this.
          Session.set('field-'+fieldName+'-typed',
                      coerce(evt.target.checked));
        };
    } else if (fieldType === 'select') {
      events['change .'+fieldName+'Field select'] =
        function (evt) {
          Session.set('field-'+fieldName+'-typed',
                      coerce(evt.target.value));
        };
    }
    events['focus .'+fieldName+'Field .control, blur .'+
           fieldName+'Field .control'] =
      function (evt, tmpl) {
        tmpl[fieldName+'FocusUpdater'].invalidate();
      };
    tmpl.events(events);

    tmpl[fieldName+'ErrorClass'] = function () {
      return Session.get('field-'+fieldName+'-error') ? 'error' : '';
    };

    // Create dependency here in order to trigger a redraw
    // on focus or blur.  This is what reverts the control
    // to the remote value if someone else was editing it
    // while you had it focused.
    tmpl[fieldName] = function () {
      Session.get('field-'+fieldName+'-focused');
      return this[fieldName];
    };
  };

  setUpEditableField({fieldName: "foo", fieldType: "text"});
  setUpEditableField({fieldName: "bar", fieldType: "text"});

  Template.main.thing = function () {
    return Things.findOne({}) || {};
  };
}
