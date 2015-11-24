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
      ops.push([offset, length]);
    } else {
      // insert op; represent as a Buffer
      const buf = yield bytes(headByte);
      ops.push(buf);
    }
  }
  return ret;
}
