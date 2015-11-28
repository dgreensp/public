import {StreamParser, extractors, parse} from './StreamParser';
import {deflatedBytes} from './StreamParser-zip';
import {sha1} from './sha1';
import {Multibuffer} from "./Multibuffer";
import {SlowBuffer} from 'buffer';
import {Stopwatch} from './stopwatch';

export class PackParser extends StreamParser {
  constructor() {
    super(readPack);
  }
}

const {byte, bytes, uint32, EOF} = extractors;

function error(msg) {
  throw new Error(`Error parsing PACK file: ${msg}`);
}

const OBJECT_TYPE_COMMIT = 1;
const OBJECT_TYPE_TREE = 2;
const OBJECT_TYPE_BLOB = 3;
const OBJECT_TYPE_TAG = 4;
// these two are not really object types so much as "packed object" types
const OBJECT_TYPE_OFFSET_DELTA = 6;
const OBJECT_TYPE_REF_DELTA = 7;

function getObjectTypeString(typeNum) {
  // These type strings aren't just for us; they are used by git.
  switch (typeNum) {
  case OBJECT_TYPE_COMMIT: return 'commit';
  case OBJECT_TYPE_TREE: return 'tree';
  case OBJECT_TYPE_BLOB: return 'blob';
  case OBJECT_TYPE_TAG: return 'tag';
  default: throw new Error(`${typeNum} is not a major object type`);
  }
}

const bytes20 = bytes(20);

export function parsePack(buffer) {
  return parse(buffer, readPack);
}

export function* readPack() {
  if ((yield bytes(4)).toString() !== 'PACK') {
    error("Expected pack file to start with PACK");
  }
  if ((yield uint32) !== 2) {
    error("Expected pack file to be version 2");
  }

  const numObjects = yield uint32;
  const objectsBySha = {}; // sha -> object (map by .sha)
  // objects have:
  // - type: String
  // - sha: String
  // - content: Multibuffer

  function calculateContent(obj) {
    if (obj.content) {
      return obj.content;
    } else {
      const baseObj = objectsBySha[obj.ref];
      return applyDelta(obj.delta, calculateContent(baseObj));
    }
  }

  for (let i = 0; i < numObjects; i++) {
    const objectOffset = yield 'offset';
    const {objectType, objectSize} = yield* readObjectTypeAndSize();
    let type;
    let ref;
    let body;
    switch (objectType) {
    case OBJECT_TYPE_COMMIT:
    case OBJECT_TYPE_TREE:
    case OBJECT_TYPE_BLOB:
    case OBJECT_TYPE_TAG:
      type = getObjectTypeString(objectType);
      break;
    case OBJECT_TYPE_OFFSET_DELTA:
      throw new Error("Object offsets in pack file not supported");
    case OBJECT_TYPE_REF_DELTA:
      ref = (yield bytes20).toString('hex');
      break;
    default:
      throw new Error(`Unknown object type: ${objectType}`);
    }

    body = yield deflatedBytes(objectSize);

    let sha, obj;
    if (ref) {
      const baseObj = objectsBySha[ref];
      if (! baseObj) {
        // While the pack file format doesn't require that delta-encoded
        // objects come after their base, I believe that git guarantees it
        // in practice.
        throw new Error("Unexpected forward reference");
      }
      type = baseObj.type;
      ref = baseObj.sha; // intern the string
      const delta = body;
      const content = applyDelta(delta, calculateContent(baseObj));
      sha = objectSha(type, content);
      if (type === 'commit') {
        obj = {type, sha, content, offset: objectOffset};
      } else {
        // leave as a ref, but we need to calculate the SHA
        const deltaDepth = (baseObj.deltaDepth || 0) + 1;
        obj = {type, sha, ref, delta, deltaDepth, offset: objectOffset};
      }
      objectsBySha[sha] = obj;
    } else {
      sha = objectSha(type, body);
      obj = {type, sha, content: body, offset: objectOffset};
      objectsBySha[sha] = obj;
    }

    //if (type !== 'commit') break;
  }

  return objectsBySha;
}

// `buffer` can be a Buffer or Multibuffer
export function objectSha(type, buffer) {
  const chunks = [new Buffer(type + ' ' + buffer.length + '\0')];
  if (Buffer.isBuffer(buffer)) {
    chunks.push(buffer);
  } else {
    // Multibuffer
    for (let ch of buffer.chunks) {
      chunks.push(ch);
    }
  }
  return sha1(new Multibuffer(chunks)).toString('hex');
}

function* readObjectTypeAndSize() {
  let b = yield byte;
  const objectType = (b >> 4) & 0x7;
  let objectSize = b & 0xf;
  let lenBits = 4;
  while (b & 0x80) {
    b = yield byte;
    objectSize |= ((b & 0x7f) << lenBits);
    lenBits += 7;
  }
  return {objectType, objectSize};
}

export function parseDelta(buffer) {
  const result = parseDeltaInner(buffer);
  if (! result) {
    throw new Error("Error parsing delta");
  }
  return result;
}

function parseDeltaInner(buffer) {
  let i = 0;
  let len = buffer.length;

  let baseLength, resultLength;
  for (let n = 0; n < 2; n++) {
    // read a LEBase128Int
    if (i >= len) return null;
    let b = buffer.readUInt8(i);
    i++;
    let x = b & 0x7f;
    let bits = 7;
    while (b & 0x80) {
      if (i >= len) return null;
      b = buffer.readUInt8(i);
      i++;
      x |= (b & 0x7f) << bits;
      bits += 7;
    }
    if (n === 0) {
      baseLength = x;
    } else {
      resultLength = x;
    }
  }

  const ops = [];
  while (i < len) {
    const headByte = buffer.readUInt8(i);
    i++;
    if (headByte & 0x80) {
      // copy op; represent as an [offset, length] pair
      let offset = 0;
      let length = 0;
      if (headByte & 0x01) {
        if (i >= len) return null;
        offset |= buffer.readUInt8(i) << 0;
        i++;
      }
      if (headByte & 0x02) {
        if (i >= len) return null;
        offset |= buffer.readUInt8(i) << 8;
        i++;
      }
      if (headByte & 0x04) {
        if (i >= len) return null;
        offset |= buffer.readUInt8(i) << 16;
        i++;
      }
      if (headByte & 0x08) {
        if (i >= len) return null;
        offset |= buffer.readUInt8(i) << 24;
        i++;
      }
      if (headByte & 0x10) {
        if (i >= len) return null;
        length |= buffer.readUInt8(i) << 0;
        i++;
      }
      if (headByte & 0x20) {
        if (i >= len) return null;
        length |= buffer.readUInt8(i) << 8;
        i++;
      }
      if (headByte & 0x40) {
        if (i >= len) return null;
        length |= buffer.readUInt8(i) << 16;
        i++;
      }
      if (length === 0) length = 0x10000;
      ops.push([offset, length]);
    } else {
      // insert op; represent as a Buffer
      const insertSize = headByte;
      if (i + insertSize > len) return null;
      ops.push(buffer.slice(i, i + insertSize));
      i += insertSize;
    }
  }

  return { baseLength, resultLength, ops };
}

export function applyDeltaAsChunks(delta, baseBuffer) {
  if (! Buffer.isBuffer(baseBuffer)) {
    throw new Error("applyDelta requires a Buffer as base");
  }
  if (! delta.ops) {
    throw new Error("applyDelta requires a parsed delta object");
  }
  if (baseBuffer.length !== delta.baseLength) {
    throw new Error("Mismatched base length applying delta");
  }

  return delta.ops.map(op => {
    if (Buffer.isBuffer(op)) {
      return op;
    } else {
      const [offset, length] = op;
      if (offset < 0 || (offset + length) > baseBuffer.length) {
        throw new Error("Bad (offset,length) in delta");
      }
      return baseBuffer.slice(offset, offset + length);
    }
  });
}

export const applyDeltaTime = new Stopwatch();

export function applyDelta(delta, baseBuffer) {
  //return Buffer.concat(applyDeltaAsChunks(delta, baseBuffer));
  applyDeltaTime.start();
  const resultBuffer = applyDeltaInner(delta, baseBuffer);
  if (! resultBuffer) {
    throw new Error("Error applying delta");
  }
  applyDeltaTime.stop();
  return resultBuffer;
}

function applyDeltaInner(delta, baseBuffer) {
  let i = 0;
  let len = delta.length;

  let baseLength, resultLength;
  for (let n = 0; n < 2; n++) {
    // read a LEBase128Int
    if (i >= len) return null;
    let b = delta.readUInt8(i);
    i++;
    let x = b & 0x7f;
    let bits = 7;
    while (b & 0x80) {
      if (i >= len) return null;
      b = delta.readUInt8(i);
      i++;
      x |= (b & 0x7f) << bits;
      bits += 7;
    }
    if (n === 0) {
      baseLength = x;
    } else {
      resultLength = x;
    }
  }

  if (baseBuffer.length !== baseLength) {
    throw new Error("Mismatched base length applying delta");
  }
  const resultBuffer = new SlowBuffer(resultLength);
  let resultOffset = 0;

  const ops = [];
  while (i < len) {
    const headByte = delta.readUInt8(i);
    i++;
    if (headByte & 0x80) {
      // copy op; read offset and length into baseBuffer to copy
      let offset = 0;
      let length = 0;
      if (headByte & 0x01) {
        if (i >= len) return null;
        offset |= delta.readUInt8(i) << 0;
        i++;
      }
      if (headByte & 0x02) {
        if (i >= len) return null;
        offset |= delta.readUInt8(i) << 8;
        i++;
      }
      if (headByte & 0x04) {
        if (i >= len) return null;
        offset |= delta.readUInt8(i) << 16;
        i++;
      }
      if (headByte & 0x08) {
        if (i >= len) return null;
        offset |= delta.readUInt8(i) << 24;
        i++;
      }
      if (headByte & 0x10) {
        if (i >= len) return null;
        length |= delta.readUInt8(i) << 0;
        i++;
      }
      if (headByte & 0x20) {
        if (i >= len) return null;
        length |= delta.readUInt8(i) << 8;
        i++;
      }
      if (headByte & 0x40) {
        if (i >= len) return null;
        length |= delta.readUInt8(i) << 16;
        i++;
      }
      if (length === 0) length = 0x10000;
      baseBuffer.copy(resultBuffer, resultOffset, offset, offset + length);
      resultOffset += length;
    } else {
      // insert op; insert bytes from delta
      const insertSize = headByte;
      if (i + insertSize > len) return null;
      delta.copy(resultBuffer, resultOffset, i, i + insertSize);
      i += insertSize;
      resultOffset += insertSize;
    }
  }

  return resultBuffer;
}

export function applyDeltaToMultibuffer(delta, baseMulti) {
  if (! delta.ops) {
    throw new Error("applyDelta requires a parsed delta object");
  }
  if (baseMulti.length !== delta.baseLength) {
    throw new Error("Mismatched base length applying delta");
  }

  const chunks = [];
  for (let op of delta.ops) {
    if (Buffer.isBuffer(op)) {
      chunks.push(op);
    } else {
      const [offset, length] = op;
      if (offset < 0 || (offset + length) > baseMulti.length) {
        throw new Error("Bad (offset,length) in delta");
      }
      const slice = baseMulti.slice(offset, offset + length);
      for (let ch of slice.chunks) {
        chunks.push(ch);
      }
    }
  }

  return new Multibuffer(chunks);
}
