// A Chunk represents a range of one or more consecutive sibling
// nodes in the DOM by keeping pointers to the first and last node.
// Trees of nested Chunks can be formed where the subchunks represent
// non-overlapping ranges within the superchunk.  To facilitate this
// use, the endpoints of a Chunk may be defined by reference to
// subchunks.
//
// `new Chunk(start, [end])`
//
// `start` and `end` are each either a Chunk or a DOM Node.
// If omitted, `end` defaults to `start`.
//
// The *first node* of a chunk is defined recursively as the
// first node of `start`, if `start` is a Chunk, or else `start`
// itself.  Likewise for the *last node* and `end`.
//
// The first node and last node of a Chunk must be siblings (or the
// same node), meaning they share the same non-null parent node.  The
// siblings must be in order, that is, the last node must be the same
// as, or after, the first node.
//
// Conceptually, a Chunk points to the range of the DOM containing
// the first node, the last node, the siblings in between them,
// and all the descendents of those nodes.
//
// Chunks are mutable, and firstNode() and lastNode() are calculated
// when accessed based on the state of the Chunk and the Chunks it
// refers to.  The main reason to mutate a Chunk is after changing
// its contents, upon which the Chunk may start or end with a
// different Chunk or Node than before.
//
// Chunk pointers are unidirectional; there are no pointers back
// from the DOM.  Chunks do not exist "in" the DOM, and multiple
// Chunk objects wrapped around each other are distinct only in
// their potential to mutate.  For example, given a Chunk `c`,
// if you create a new Chunk(c, c) and never mutate it, you
// could equivalently use `c` instead.

Chunk = function (start, end) {
  this.set(start, end);
};

_.extend(Chunk.prototype, {
  firstNode: function () {
    return this.start instanceof Chunk ?
      this.start.firstNode() : this.start;
  },
  lastNode: function () {
    return this.end instanceof Chunk ?
      this.end.lastNode() : this.end;
  },
  set: function (start, end) {
    end = end || start;
    if (! (start instanceof Chunk || (start && start.nodeType)))
      throw new Error("start must be a Chunk or a Node");
    if (! (end instanceof Chunk || (end && end.nodeType)))
      throw new Error("end must be a Chunk or a Node");

    this.start = start;
    this.end = end;

    // this check involves a little calculation but it catches
    // too many errors to leave out.
    var firstNodeParent = this.firstNode().parentNode;
    var lastNodeParent = this.lastNode().parentNode;
    if (! firstNodeParent || ! lastNodeParent)
      throw new Error("start and end must have parents");
    if (firstNodeParent !== lastNodeParent)
      throw new Error("start and end must have same parent");
  },
  parentNode: function () {
    return this.firstNode().parentNode;
  }
});

_.extend(Chunk.prototype, {
  findOne: function (selector) {
    return DomUtils.findClipped(
      this.parentNode(), selector, this.firstNode(), this.lastNode());
  },
  findAll: function (selector) {
    return DomUtils.findAllClipped(
      this.parentNode(), selector, this.firstNode(), this.lastNode());
  }
});

Component = function (args) {
  this.parent = null;
  this.nameInParent = '';
  this.children = {};
  this.isInited = false;
  this.isBuilt = false;
  this.isAttached = false;
  this.isDestroyed = false;

  this.dom = null; // if built
  this._fragment = null; // if built; empty when attached
  this._uniqueIdCounter = 1;

  this.args = args;
};

_.extend(Component.prototype, {
  _requireAlive: function () {
    if (this.isDestroyed)
      throw new Error("Component was destroyed");
  },
  _forceInit: function () {
    this._requireAlive();
    if (! this.isInited) {
      this.init();
      this.isInited = true;
    }
  },
  _build: function () {
    this._forceInit();
    if (this.isBuilt)
      throw new Error("Component already built");

    this._fragment = document.createDocumentFragment();

    this.build(this._fragment);

    if (! this.dom)
      throw new Error("build() must call setBounds()");
    this.isBuilt = true;
    this.built();
  },
  attach: function (parent, before) {
    this._forceInit();
    if (this.isAttached)
      throw new Error("Component already attached");

    if (! this.isBuilt)
      this._build();

    parent.insertBefore(this._fragment, before);

    this.isAttached = true;

    this.attached();

    return this;
  },
  detach: function () {
    this._requireAlive();
    if (! this.isAttached)
      throw new Error("Component not attached");

    var start = this.dom.firstNode();
    var end = this.dom.lastNode();
    var frag = this._fragment;
    // extract start..end into frag
    var parent = start.parentNode;
    var before = start.previousSibling;
    var after = end.nextSibling;
    var n;
    while ((n = (before ? before.nextSibling : parent.firstChild)) &&
           (n !== after))
      frag.appendChild(n);

    this.isAttached = false;

    this.detached();

    return this;
  },
  destroy: function () {
    if (! this.isDestroyed) {
      this.isDestroyed = true;

      // maybe GC the DOM sooner
      this.dom = null;
      this._fragment = null;

      this.destroyed();

      var children = this.children;
      for (var k in children)
        if (children.hasOwnProperty(k))
          children[k].destroy();

      if (this.parent && ! this.parent.isDestroyed)
        delete this.parent.children[this.nameInParent];

      this.children = {};
    }

    return this;
  },
  addChild: function (name, childComponent) {
    if (name instanceof Component) {
      // omitted name, generate unique child ID
      childComponent = name;
      name = "__child#" + (this._uniqueIdCounter++) + "__";
    }
    name = String(name);

    this._requireAlive();
    if (this.children.hasOwnProperty(name))
      throw new Error("Already have a child named: " + name);

    if (childComponent.isDestroyed)
      throw new Error("Can't add a destroyed component");
    if (childComponent.isInited)
      throw new Error("Can't add a previously added or built component");

    this.children[name] = childComponent;

    childComponent._added(name, this);
  },
  _added: function (name, parent) {
    name = String(name);
    this.nameInParent = name;
    this.parent = parent;

    this._forceInit();
  },
  removeChild: function (name) {
    name = String(name);
    this._requireAlive();
    if (! this.children.hasOwnProperty(name))
      throw new Error("No such child component: " + name);

    var childComponent = this.children[name];

    if (childComponent.isDestroyed) {
      // shouldn't be possible, because destroying a component
      // deletes it from the parent's children dictionary,
      // but just in case...
      delete this.children[name];
    } else {

      if (childComponent.isAttached)
        childComponent.detach();

      childComponent.destroy();

    }
  },
  setBounds: function (start, end) {
    end = end || start;
    if (start instanceof Component)
      start = start.dom;
    if (end instanceof Component)
      end = end.dom;

    if (! (start instanceof Chunk || (start && start.nodeType)))
      throw new Error("setBounds: start must be a built Component or a Node");
    if (! (end instanceof Chunk || (end && end.nodeType)))
      throw new Error("setBounds: end must be a built Component or a Node");

    if (! this.dom) {
      this.dom = new Chunk(start, end);
    } else {
      this.dom.set(start, end);
    }
  },
  setStart: function (start) {
    if (start instanceof Component)
      start = start.dom;

    if (! (start instanceof Chunk || (start && start.nodeType)))
      throw new Error("setStart: start must be a built Component or a Node");
    if (! this.dom)
      throw new Error("Can only call setStart after setBounds has been called");

    this.dom.start = start;
  },
  setEnd: function (end) {
    if (end instanceof Component)
      end = end.dom;

    if (! (end instanceof Chunk || (end && end.nodeType)))
      throw new Error("setEnd: end must be a built Component or a Node");
    if (! this.dom)
      throw new Error("Can only call setEnd after setBounds has been called");

    this.dom.end = end;
  },
  update: function (args) {
    var oldArgs = this.args;
    this.args = args;
    this.updated(args, oldArgs);
  },
  findOne: function (selector) { return this.dom.findOne(selector); },
  findAll: function (selector) { return this.dom.findAll(selector); },
  firstNode: function () { return this.dom.firstNode(); },
  lastNode: function () { return this.dom.lastNode(); },
  parentNode: function () { return this.dom.parentNode(); },
  // Above methods are NOT overridable.
  //
  // These are all overridable, with the behavior that all implementations
  // are executed from super to sub.
  init: function () {},
  build: function (frag) {},
  built: function () {},
  attached: function () {},
  detached: function () {},
  destroyed: function () {},
  updated: function (args, oldArgs) {},
  // This is overridable but should probably get normal override behavior;
  // it has a return value and we only run one implementation.
  toHtml: function () {
    return '';
  }
});

Component.extend = function (options) {
  var superClass = this;
  var baseClass = Component;
  // all constructors just call the base constructor
  var newClass = function CustomComponent(/*args*/) {
    baseClass.apply(this, arguments);
  };

  // Establish a prototype link from newClass.prototype to
  // superClass.prototype.  This is similar to making
  // newClass.prototype a `new superClass` but bypasses
  // the constructor.
  var fakeSuperClass = function () {};
  fakeSuperClass.prototype = superClass.prototype;
  newClass.prototype = new fakeSuperClass;

  // Record the superClass for our future use.
  newClass.superClass = superClass;

  // Inherit class (static) properties from parent.
  _.extend(newClass, superClass);

  // For callbacks, call one in turn from super to sub.
  // Or rather, redefine each callback we are given to call
  // super method first.
  // XXX TODO: clean this up.
  // - General combining mechanism?  Filtering mechanism?
  // - Get the lookup hash out of here!
  _.each(options, function (v, k) {
    // important that we have a closure here to capture
    // each old function!
    var oldFunction = v;
    if ({init:1, build:1, built:1, attached:1, detached:1,
         destroyed:1, updated:1}.hasOwnProperty(k)) {
      options[k] = function () {
        superClass.prototype[k].apply(this, arguments);
        oldFunction.apply(this, arguments);
      };
    }
  });

  // Add instance properties and methods.
  if (options)
    _.extend(newClass.prototype, options);

  // For browsers that don't support it, fill in `obj.constructor`.
  newClass.prototype.constructor = newClass;

  return newClass;
};

var debug = function (method, component) {
  console.log(method, component.nameInParent);
};

// Utility to HTML-escape a string.
var escapeForHtml = (function() {
  var escape_map = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;", /* IE allows backtick-delimited attributes?? */
    "&": "&amp;"
  };
  var escape_one = function(c) {
    return escape_map[c];
  };

  return function (x) {
    return x.replace(/[&<>"'`]/g, escape_one);
  };
})();

DebugComponent = Component.extend({
  init: function () { debug('init', this); },
  build: function (frag) { debug('build', this); },
  built: function () { debug('built', this); },
  attached: function () { debug('attached', this); },
  detached: function () { debug('detached', this); },
  destroyed: function () { debug('destroyed', this); },
  updated: function (args, oldArgs) { debug('updated', this); }
});

LI = DebugComponent.extend({
  build: function (frag) {
    var li = document.createElement('LI');
    li.appendChild(document.createTextNode(this.args.text));
    frag.appendChild(li);
    this.setBounds(li);
    this.textNode = li.firstChild;
  },
  updated: function (args, oldArgs) {
    if (this.isBuilt)
      this.textNode.nodeValue = args.text;
  },
  toHtml: function () {
    return "<li>" + escapeForHtml(this.args.text) + "</li>";
  }
});

UL = DebugComponent.extend({
  init: function () {
    this.addChild(1, new LI({text: 'One'}));
    this.addChild(2, new LI({text: 'Two'}));
    this.addChild(3, new LI({text: 'Three'}));
    this.numItems = 3;
  },
  build: function (frag) {
    var ul = document.createElement('UL');
    this.children[1].attach(ul);
    this.children[2].attach(ul);
    this.children[3].attach(ul);
    frag.appendChild(ul);
    this.setBounds(ul);

    var self = this;
    self.timer = setInterval(function () {
      if (self.isDestroyed || self.numItems >= 10) {
        debug('stopping timer', self);
        clearInterval(self.timer);
        return;
      }
      var newItem = new LI({text: 'Another'});
      self.addChild(++self.numItems, newItem);
      newItem.attach(ul);

      var hr = document.createElement('HR');
      self.parentNode().insertBefore(
        hr, self.lastNode().nextSibling);
      self.setBounds(ul, hr);
    }, 2000);
  },
  toHtml: function () {
    return "<ul>" +
      this.children[1].toHtml() +
      this.children[2].toHtml() +
      this.children[3].toHtml() +
      "</ul>";
  }
});


// Function equal to LocalCollection._idStringify, or the identity
// function if we don't have LiveData.  Converts item keys (i.e. DDP
// keys) to strings for storage in an OrderedDict.
var idStringify;

if (typeof LocalCollection !== 'undefined') {
  idStringify = function (id) {
    if (id === null)
      return id;
    else
      return LocalCollection._idStringify(id);
  };
} else {
  idStringify = function (id) { return id; };
}

// XXX duplicated code from minimongo.js.  It's small though.
var applyChanges = function (doc, changeFields) {
  _.each(changeFields, function (value, key) {
    if (value === undefined)
      delete doc[key];
    else
      doc[key] = value;
  });
};

EmptyComponent = Component.extend({
  build: function (frag) {
    var comment = document.createComment('empty');
    frag.appendChild(comment);
    this.setBounds(comment, comment);
  },
  toHtml: function () {
    return '<!--empty-->';
  }
});

Each = DebugComponent.extend({

  items: new OrderedDict(idStringify),
  init: function () {
    var self = this;
    var cursor = self.args.list; // XXX support arrays too
    var items = self.items;

    // Templates should have access to data and methods added by the
    // transformer, but observeChanges doesn't transform, so we have to do
    // it here.
    //
    // NOTE: this is a little bit of an abstraction violation. Ideally,
    // the only thing Spark should know about Minimongo is the contract of
    // observeChanges. In theory, anything that implements observeChanges
    // could be passed to Spark.list. But meh.
    var transformedDoc = function (doc) {
      if (cursor.getTransform && cursor.getTransform())
        return cursor.getTransform()(EJSON.clone(doc));
      return doc;
    };

    self.cursorHandle = cursor.observeChanges({
      addedBefore: function (id, item, beforeId) {
        var doc = EJSON.clone(item);
        doc._id = id;
        items.putBefore(id, doc, beforeId);
        var tdoc = transformedDoc(doc);

        self.itemAddedBefore(id, tdoc, beforeId);
      },
      removed: function (id) {
        items.remove(id);

        self.itemRemoved(id);
      },
      movedBefore: function (id, beforeId) {
        items.moveBefore(id, beforeId);

        self.itemMovedBefore(id, beforeId);
      },
      changed: function (id, fields) {
        var doc = items.get(id);
        if (! doc)
          throw new Error("Unknown id for changed: " + idStringify(id));
        applyChanges(doc, fields);
        var tdoc = transformedDoc(doc);

        self.itemChanged(id, tdoc);
      }
    });

    if (self.items.empty())
      self.initiallyEmpty();
  },

  destroyed: function () {
    var self = this;
    if (self.cursorHandle) {
      self.cursorHandle.stop();
      self.cursorHandle = null;
    }
  },

  updated: function (args, oldArgs) {
    // XXXX whhaaaaaaa
  },

  _itemChildId: function (id) {
    return 'item:' + idStringify(id);
  },
  addItemChild: function (id, comp) {
    this.addChild(this._itemChildId(id), comp);
  },
  removeItemChild: function (id) {
    this.removeChild(this._itemChildId(id));
  },
  getItemChild: function (id) {
    return this.children[this._itemChildId(id)];
  },
  // Utility to attach a child component for an item in its
  // appropriate position in the DOM, after it is already
  // in the correct position in the items dict.
  // Also adjusts the component's bounds.
  attachItemChild: function (id, comp, beforeId) {
    if (! this.isBuilt)
      throw new Error("Component must be built");

    var isFirst = !this.items.prev(id);
    var isLast = !beforeId;
    var beforeNode =
          (beforeId ? this.getItemChild(beforeId).firstNode() :
           this.lastNode().nextSibling);

    comp.attach(this.parentNode(), beforeNode);

    if (isFirst)
      this.setStart(comp);
    if (isLast)
      this.setEnd(comp);
  },

  itemAddedBefore: function (id, doc, beforeId) {
    var bodyClass = this.args.bodyClass;
    var comp = new bodyClass({data: doc});
    this.addItemChild(id, comp);

    if (this.isBuilt) {
      this.attachItemChild(id, comp, beforeId);

      if (this.items.size() === 1)
        // was empty
        this.removeChild('else');
    }
  },
  itemRemoved: function (id) {
    if (this.items.size() === 1) {
      // making empty
      var elseClass = this.args.elseClass || EmptyComponent;
      var comp = new elseClass({data: this.args.data});
      this.addChild('else', comp);

      if (this.isBuilt) {
        comp.attach(this.parentNode(), this.firstNode());
        this.setBounds(comp);
      }
    }
    this.removeItemChild(id);
  },
  itemMovedBefore: function (id, beforeId) {
    if (this.items.size() === 1)
      return; // move is meaningless anyway

    if (this.isBuilt) {
      var comp = this.getItemChild(id);
      comp.detach();
      this.attachItemChild(id, comp, beforeId);
    }
  },
  itemChanged: function (id, doc) {
    this.getItemChild(id).update({data: doc});
  },
  initiallyEmpty: function () {
    var elseClass = this.args.elseClass || EmptyComponent;
    this.addChild('else', new elseClass({data: this.args.data}));
  },

  build: function (frag) {
    var self = this;
    if (self.items.empty()) {
      var elseChild = self.children['else'];
      elseChild.attach(frag);
      self.setBounds(elseChild);
    } else {
      self.items.forEach(function (doc, id) {
        self.getItemChild(id).attach(frag);
      });
      self.setBounds(self.getItemChild(self.items.first()),
                     self.getItemChild(self.items.last()));
    }
  }
  // XXX toHtml

});

MyLI = DebugComponent.extend({
  init: function () {
    this.addChild('1', new LI({text: this.args.data.text || ''}));
  },
  build: function (frag) {
    var c = this.children['1'];
    c.attach(frag);
    this.setBounds(c);
  },
  updated: function (args, oldArgs) {
    this.children['1'].update({text: this.args.data.text || ''});
  },
  toHtml: function () {
    return this.children['1'].toHtml();
  }
});

Meteor.startup(function () {
//  a = new Chunk($("li").get(0));
//  b = new Chunk($("li").get(1));
//  c = new Chunk($("li").get(2));
//  d = new Chunk(a, c);

//  L = new UL().attach(document.body);

  C = new LocalCollection();
  var ul = document.createElement("UL");
  document.body.appendChild(ul);

  C.insert({text: 'Foo'});
  C.insert({text: 'Bar'});
  C.insert({text: 'Baz'});
  LIST = new Each({list: C.find({}, {sort: {text: 1}}),
                   bodyClass: MyLI});

  LIST.attach(ul);
});
