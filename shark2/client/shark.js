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
  add: function (name, childComponent) {
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
  remove: function (name) {
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
    this.add(1, new LI({text: 'One'}));
    this.add(2, new LI({text: 'Two'}));
    this.add(3, new LI({text: 'Three'}));
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
      self.add(++self.numItems, newItem);
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

Meteor.startup(function () {
//  a = new Chunk($("li").get(0));
//  b = new Chunk($("li").get(1));
//  c = new Chunk($("li").get(2));
//  d = new Chunk(a, c);

  L = new UL().attach(document.body);
});




Model = function (obj) {
  this._data = obj;
  this._vars = {};
  this._submodels = {};
};
