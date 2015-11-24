import {StreamParser, extractors, parse} from './StreamParser';
import {deflatedBytes} from './StreamParser-zip';
import {sha1} from './sha1';

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
  const objects = [];

  for (let i = 0; i < numObjects; i++) {
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
      type = 'ref-delta'; // XXX
      ref = (yield bytes20).toString('hex');
      break;
    default:
      throw new Error(`Unknown object type: ${objectType}`);
    }

    body = yield deflatedBytes(objectSize);

    let obj;
    if (ref) {
      const delta = parse(body, readDelta);
      obj = {type, ref, delta};
    } else {
      const sha = sha1(Buffer.concat(
        [new Buffer(type + ' ' + body.length + '\0'), body])).toString('hex');
      obj = {type, body, sha};
    }

    objects.push(obj);
  }

  return objects;
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

// Used by git to encode delta base offsets.
function* readBEBase128Int() {
  let b = yield byte;
  let result = b & 0x7f;
  while (b & 0x80) {
    b = yield byte;
    result = ((result + 1) << 7) | (b & 0x7f);
  }
  return result;
}

// Used by git to encode delta base and result lengths.
function* readLEBase128Int() {
  let b = yield byte;
  let result = b & 0x7f;
  let bits = 7;
  while (b & 0x80) {
    b = yield byte;
    result |= (b & 0x7f) << bits;
    bits += 7;
  }
  return result;
}

export function* readDelta() {
  const ops = [];
  const ret = {
    baseLength: (yield* readLEBase128Int()),
    resultLength: (yield* readLEBase128Int()),
    ops: ops
  };

  while (! (yield EOF)) {
    const headByte = yield byte;
    if (headByte & 0x80) {
      // copy op; represent as an [offset, length] pair
      let offset = 0;
      let length = 0;
      if (headByte & 0x01) offset |= (yield byte) << 0;
      if (headByte & 0x02) offset |= (yield byte) << 8;
      if (headByte & 0x04) offset |= (yield byte) << 16;
      if (headByte & 0x08) offset |= (yield byte) << 24;
      if (headByte & 0x10) length |= (yield byte) << 0;
      if (headByte & 0x20) length |= (yield byte) << 8;
      if (headByte & 0x40) length |= (yield byte) << 16;
      if (length === 0) length = 0x10000;
      //ops.push([offset, length]);
    } else {
      // insert op; represent as a Buffer
      const buf = yield bytes(headByte);
      //ops.push(buf);
    }
  }
  return ret;
}
