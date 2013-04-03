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
  this.start = start;
  this.end = end || start;
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
    this.start = start;
    this.end = end || start;
  }
});

var Component = function (options) {
  this.options = options || {};
  this.isBuilt = false;
  this.isAttached = false;
  this.dom = null; // if built

  this._fragment = null; // if built; empty when attached
};

_.extend(Component.prototype, {
  build: function () {
    if (this.isBuilt)
      throw new Error("Component already built");

    var frag = this._fragment = document.createDocumentFragment();

    // put stuff in fragment...
    frag.appendChild(document.createComment('empty'));

    this.dom = new Chunk(frag.firstChild);
    this.isBuilt = true;
  },
  attach: function (parent, before) {
    if (this.isAttached)
      throw new Error("Component already attached");

    if (! this.isBuilt)
      this.build();

    parent.insertBefore(this._fragment, before);
    
    this.isAttached = true;
  },
  detach: function () {
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
  }
});


Meteor.startup(function () {
  a = new Chunk($("li").get(0));
  b = new Chunk($("li").get(1));
  c = new Chunk($("li").get(2));
  d = new Chunk(a, c);
});
