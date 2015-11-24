import {StreamParser, extractors} from './StreamParser';
import {deflatedBytes} from './StreamParser-zip';

export class PackParser extends StreamParser {
  constructor() {
    super(parsePack);
  }
}

const {byte, bytes, uint32} = extractors;

function error(msg) {
  throw new Error(`Error parsing PACK file: ${msg}`);
}

const OBJECT_TYPE_COMMIT = 1;
const OBJECT_TYPE_TREE = 2;
const OBJECT_TYPE_BLOB = 3;
const OBJECT_TYPE_TAG = 4;
const OBJECT_TYPE_OFFSET_DELTA = 6;
const OBJECT_TYPE_REF_DELTA = 7;

const bytes20 = bytes(20);

function* parsePack() {
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
    let type, ref, body;
    switch (objectType) {
    case OBJECT_TYPE_COMMIT:
      type = 'commit';
      break;
    case OBJECT_TYPE_TREE:
      type = 'tree';
      break;
    case OBJECT_TYPE_BLOB:
      type = 'blob';
      break;
    case OBJECT_TYPE_TAG:
      type = 'tag';
      break;
    case OBJECT_TYPE_OFFSET_DELTA:
      type = 'offset-delta'; // XXX
      ref = yield* readVariableLengthInt();
      break;
    case OBJECT_TYPE_REF_DELTA:
      type = 'ref-delta'; // XXX
      ref = yield bytes20;
      break;
    default:
      throw new Error(`Unknown object type: ${objectType}`);
    }

    body = yield deflatedBytes(objectSize);

    let obj = (ref ? {type, ref, body} : {type, body});
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

function* readVariableLengthInt() {
  let b = yield byte;
  let result = b & 0x7f;
  while (b & 0x80) {
    b = yield byte;
    result = ((result + 1) << 7) | (b & 0x7f);
  }
  return result;
}
