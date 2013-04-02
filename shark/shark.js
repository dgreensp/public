// XXX separate built state from virtual state?

if (Meteor.isClient) {

ChunkState = {
  Virtual: ['Virtual'],
  Detached: ['Detached'],
  Attached: ['Attached']
};

var Chunk = function () {};

TreeChunk = function (tree) {
  this._tree = tree;
  this._holes = {}; // id -> node or Chunk
  this.state = ChunkState.Virtual;

  // for non-Virtual state
  this._start = null; // node or Chunk
  this._end = null; // node or Chunk

  // for Detached state
  this._fragment = null;
};

TreeChunk.prototype = new Chunk();

TreeChunk.prototype.firstNode = function () {
  if (this.state === ChunkState.Virtual)
    throw new Error("can't get firstNode of a Virtual Chunk");

  var start = this._start;
  if (start instanceof Chunk)
    start = start.firstNode();
  return start;
};

TreeChunk.prototype.lastNode = function () {
  if (this.state === ChunkState.Virtual)
    throw new Error("can't get firstNode of a Virtual Chunk");

  var end = this._end;
  if (end instanceof Chunk)
    end = end.lastNode();
  return end;
};

TreeChunk._buildNode = function (node, into, holeCallback) {
  if (! into)
    into = document.createDocumentFragment();

  if (typeof node === 'string') {
    into.appendChild(document.createTextNode(node));
  } else {
    var nodeName = node[0];
    if (nodeName === "#comment") {
      into.appendChild(document.createCommment(node[1] || ''));
    } else if (nodeName === '#hole') {
      var id = node[1].id;
      if (! id)
        throw new Error("#hole must have id");
      var comment = document.createComment('empty');
      holeCallback && holeCallback(node[1], comment);
      into.appendChild(comment);
    } else if (nodeName === '#seq') {
      for(var i = 1, N = node.length; i < N; i++) {
        TreeChunk._buildNode(node[i], into, holeCallback);
      }
    } else {
      var elem = document.createElement(nodeName);
      var i = 1;
      var attrs = node[i];
      if (attrs && typeof attrs === 'object' &&
          ! ('0' in attrs)) {
        for (var k in attrs)
          if (attrs.hasOwnProperty(k) && k.charAt(0) !== '>')
            elem.setAttribute(k, attrs[k]);
        i = 2;
      }
      for (var N = node.length; i < N; i++) {
        TreeChunk._buildNode(node[i], elem, holeCallback);
      }
      into.appendChild(elem);
    }
  }

  return into;
};

TreeChunk.prototype._attach = function (nodeToReplace) {
  if (this.state !== ChunkState.Detached)
    throw new Error("Chunk must be in Detached state");

  nodeToReplace.parentNode.replaceChild(this._fragment, nodeToReplace);
  this._fragment = null;
  this.state = ChunkState.Attached;
};

TreeChunk.prototype._detach = function () {
  if (this.state !== ChunkState.Attached)
    throw new Error("Chunk must be in Attached state");

  var frag = document.createDocumentFragment();
  this._fragment = frag;
  // extract start..end into frag
  var start = this.firstNode();
  var end = this.lastNode();
  var parent = start.parentNode;
  var before = start.previousSibling;
  var after = end.nextSibling;
  var n;
  while ((n = (before ? before.nextSibling : parent.firstChild)) &&
         (n !== after))
    frag.appendChild(n);

  var commentNode = document.createComment('empty');
  parent.insertBefore(commentNode, after);

  this.state = ChunkState.Detached;

  return commentNode;
};

TreeChunk.prototype.appendTo = function (node) {
  var comment = document.createComment('empty');
  node.appendChild(comment);
  this._attach(comment);
};

TreeChunk.prototype.build = function () {
  var self = this;

  if (self.state !== ChunkState.Virtual)
    throw new Error("Can only build a Virtual Chunk");

  var frag = TreeChunk._buildNode(
    self._tree, null,
    function (attrs, commentNode) {
      self._holes[attrs.id] = commentNode;
    });

  if (! frag.firstChild)
    frag.appendChild(document.createComment('empty'));

  self._fragment = frag;
  self._start = frag.firstChild;
  self._end = frag.lastChild;

  self.state = ChunkState.Detached;

  return self;
};

TreeChunk.prototype.setHole = function (holeId, chunk) {
  if (this.state === ChunkState.Virtual)
    throw new Error("Can't set a hole on a Virtual Chunk");
  if (! this._holes.hasOwnProperty(holeId))
    throw new Error('no such hole: ' + holeId);

  var oldChunk = this._holes[holeId];
  if (oldChunk === chunk)
    return;

  var commentNode = ((oldChunk instanceof Chunk) ?
                     oldChunk._detach() : oldChunk);

  if (chunk) {
    if (! (chunk instanceof Chunk))
      throw new Error('not a chunk: ' + chunk);
    if (chunk.state !== ChunkState.Detached)
      throw new Error('setHole requires a Detached Chunk');

    chunk._attach(commentNode);
  }

  if (this._start === oldChunk)
    this._start = (chunk || commentNode);
  if (this._end === oldChunk)
    this._end = (chunk || commentNode);

  this._holes[holeId] = (chunk || null);
};

TreeChunk.prototype.getHole = function (holeId) {
  if (this.state === ChunkState.Virtual)
    throw new Error("Can't get a hole on a Virtual Chunk");
  if (! this._holes.hasOwnProperty(holeId))
    throw new Error('no such hole: ' + holeId);

  var chunk = this._holes[holeId];
  return (chunk instanceof Chunk ? chunk : null);
};

Meteor.startup(function () {
  var c1 = (new TreeChunk(['#seq',
                           ['#hole', {id: '1'}],
                           '--',
                           ['#hole', {id: '2'}]])).build();
  c1.appendTo(document.body);

  var c2 = (new TreeChunk('foo')).build();
  var c3 = (new TreeChunk('bar')).build();
  c1.setHole('1', c2);
  c1.setHole('2', c3);

  CHUNKS = [c1, c2, c3];
});

}