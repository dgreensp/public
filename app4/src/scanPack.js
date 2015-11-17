import zlib from "zlib";

export function scanPack(buffer) {
  const len = buffer.length;
  let i = 0;

  if (len - i < 4) rangeError(i, 4);
  if (buffer.readUInt32BE(i) !== 0x5041434b) {
    error("Expected pack file to start with PACK");
  }
  i += 4;

  if (len - i < 4) rangeError(i, 4);
  if (buffer.readUInt32BE(i) !== 2) {
    error("Expected pack file to be version 2");
  }
  i += 4;

  if (len - i < 4) rangeError(i, 4);
  const headerNumObjects = buffer.readUInt32BE(i);
  i += 4;

  const typeAndSize = { type: 0, size: 0 };
  for (let j = 0; j < headerNumObjects; j++) {
    i = readTypeAndSize(buffer, i, typeAndSize);
    const {type, size} = typeAndSize;
    if (len - i < size) rangeError(i, size);
    const compressedData = buffer.slice(i, size);
    const data = zlib.inflateSync(compressedData);
    if (j < 10) console.log(j, type, i, data.toString());
    else console.log(j, type, i, size);
    i += size;
  }
}

function error(msg) {
  throw new Error(`Error parsing PACK file: ${msg}`);
}

function rangeError(i, n) {
  error(`Unexpected EOF reading ${n} bytes at byte ${i}`);
}

// Sets `out.type`, `out.size`; returns a new value of `i`.
function readTypeAndSize(buffer, i, out) {
  const len = buffer.length;
  if (len - i < 1) rangeError(i, 1);
  let b = buffer.readUInt8(i);
  out.type = (b >> 4) & 0x7;
  let size = b & 0xf;
  let lenBits = 4;
  while (b & 0x80) {
    i++;
    if (len - i < 1) rangeError(i, 1);
    b = buffer.readUInt8(i);
    size |= ((b & 0x7f) << lenBits);
    lenBits += 7;
  }
  out.size = size;
  i++;
  return i;
}
