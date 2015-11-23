import jasmine from './testspec/jasmine';
import CPI from "./ChunkedPrefixInflater";

jasmine(expect => ["ChunkPrefixInflater", {
  args() {
    const inflated = new Buffer('HELLO WORLD'); // length = 11
    // equal to zlib.deflateSync(inflated) ; length = 19
    // (Note that the compressed Buffer is actually longer here.)
    const deflated = new Buffer([0x78, 0x9c, 0xf3, 0x70, 0xf5,
                                 0xf1, 0xf1, 0x57, 0x08, 0xf7,
                                 0x0f, 0xf2, 0x71, 0x01, 0x00,
                                 0x12, 0x8b, 0x03, 0x1d]);
    const buffer = makeGarbageBuffer(100);
    deflated.copy(buffer);
    return { inflated, deflated, buffer };
  },

  "inflates a buffer"({deflated}) {
    const cpi = new CPI(11);
    expect(cpi.addChunk(deflated)).toBe(null);
    expect(cpi.addEOF()).toEqual(
      { result: new Buffer('HELLO WORLD'),
        chunkBytesConsumed: 0,
        totalBytesConsumed: 19
      });
  },

  "inflates a prefix of a buffer"({buffer}) {
    const cpi = new CPI(11);
    expect(cpi.addChunk(buffer)).toEqual(
      { result: new Buffer('HELLO WORLD'),
        chunkBytesConsumed: 19,
        totalBytesConsumed: 19
      });
  },

  "inflates across multiple chunks"({buffer}) {
    const cpi = new CPI(11);
    expect(cpi.addChunk(buffer.slice(0, 1))).toBe(null);
    expect(cpi.addChunk(buffer.slice(1, 10))).toBe(null);
    expect(cpi.addChunk(buffer.slice(10,20))).toEqual(
      { result: new Buffer('HELLO WORLD'),
        chunkBytesConsumed: 9,
        totalBytesConsumed: 19
      });
  },

  "throws error on bad data"({buffer}) {
    const cpi = new CPI(11);
    expect(cpi.addChunk(buffer.slice(0, 10))).toBe(null);
    expect(() => cpi.addChunk(buffer.slice(11))).toThrowError();
  }
}]);

function makeGarbageBuffer(length) {
  // create a deterministic Buffer of arbitrary stuff
  const buf = new Buffer(length);
  for (let i = 0; i < length; i++) {
    buf.writeUInt8(((i+1)*37)&0xff, i);
  }
  return buf;
}
