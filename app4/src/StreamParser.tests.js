import jasmine from './testspec/jasmine';
import {StreamParser, extractors, parse} from "./StreamParser";
import {deflatedBytes} from "./StreamParser-zip";

const {byte, uint32, bytes, EOF} = extractors;

// Return an array of integers from 0 to (n-1) inclusive.
function range(n) {
  const ret = new Array(n);
  for (var i = 0; i < n; i++) {
    ret[i] = i;
  }
  return ret;
}

// Add `chunks`, one at a time, to `streamParser`, using `expect` to assert
// that the right result is returned at the end, and that `streamParser.result`
// and `streamParser.done` are set correctly.  By default, we verify that
// only upon adding the last chunk is the result returned, but if
// `chunksAfterDone` is greater than 0, then that many additional chunks at
// the end are expected to return a result and leave the StreamParser in a
// "done" state.
function addChunksAndExpect(expect, streamParser, chunks, expected) {
  let isDone = false;
  chunks.forEach((chunk, i) => {
    const ret = streamParser.addChunk(chunk);
    if (streamParser.done) {
      isDone = true;
    }
    if (isDone) {
      expect(ret).toEqual(expected);
      expect(streamParser.done).toBe(true);
      expect(streamParser.result).toEqual(expected);
    } else {
      expect(ret).toBe(null);
      expect(streamParser.done).toBe(false);
      expect(streamParser.result).toBe(null);
    }
  });

  const ret = streamParser.addEOF();
  expect(ret).toEqual(expected);
  expect(streamParser.done).toBe(true);
  expect(streamParser.result).toEqual(expected);
}

const differentChunkSpecs = expect => ({
  "given all at once"({sp, input, expected}) {
    expect(sp.addFinalChunk(input)).toEqual(expected);
  },
  "given one at a time"({sp, input, expected}) {
    const chunks = range(input.length).map(
      i => input.slice(i, i+1));
    addChunksAndExpect(expect, sp, chunks, expected);
  },
  "given extra"({sp, input, expected}) {
    const chunk = Buffer.concat([input, new Buffer('xyz')]);
    expect(sp.addFinalChunk(chunk)).toEqual(expected);
  },
  "given zero-size chunks"({sp, input, expected}) {
    addChunksAndExpect(
      expect, sp,
      [input.slice(0, 3), new Buffer(0), new Buffer(0),
       input.slice(3), new Buffer(0)],
      expected);
  }
});

jasmine(expect => ["StreamParser", {
  "can parse a series of bytes": {
    args() {
      const sp = new StreamParser(function* () {
        const result = [];
        const outerLen = yield byte;
        for (let n = 0; n < outerLen; n++) {
          const len = yield byte;
          const buf = new Buffer(len);
          // reading bytes one at a time into a buffer is inefficient,
          // of course, and is not idiomatic code for a StreamParser
          // generatorFunction; normally we'd read an entire buffer
          // at once using `yield extractor.bytes(n)` if we know the
          // length in advance, and if we don't, we can use a custom
          // extractor so as not to yield per-byte.
          for (let i = 0; i < len; i++) {
            buf.writeUInt8((yield byte), i);
          }
          result.push(buf.toString());
        }
        return result;
      });
      const input = new Buffer('\x02\x03abc\x05hello');
      const expected = ['abc', 'hello'];
      return {sp, input, expected};
    },

    ...differentChunkSpecs(expect)
  },

  "can parse uint32": {
    args() {
      const sp = new StreamParser(function* () {
        return [(yield uint32), (yield uint32), (yield uint32)];
      });
      const input = new Buffer('\0\0\0A\0\0\0B\0\0\0C');
      const expected = [65, 66, 67];
      return {sp, input, expected};
    },

    ...differentChunkSpecs(expect)
  },

  "can parse Buffers": {
    args() {
      const sp = new StreamParser(function* () {
        const result = [];
        const outerLen = yield byte;
        for (let n = 0; n < outerLen; n++) {
          const len = yield byte;
          const buf = yield bytes(len);
          result.push(buf.toString());
        }
        return result;
      });
      const input = new Buffer('\x02\x03abc\x05hello');
      const expected = ['abc', 'hello'];
      return {sp, input, expected};
    },

    ...differentChunkSpecs(expect)
  },

  "can parse deflated bytes": {
    args() {
      const sp = new StreamParser(function* () {
        return (yield deflatedBytes(11)).toString();
      });
      const input = new Buffer([0x78, 0x9c, 0xf3, 0x70, 0xf5,
                                0xf1, 0xf1, 0x57, 0x08, 0xf7,
                                0x0f, 0xf2, 0x71, 0x01, 0x00,
                                0x12, 0x8b, 0x03, 0x1d]);
      const expected = 'HELLO WORLD';
      return {sp, input, expected};
    },

    ...differentChunkSpecs(expect)
  },

  "can parse deflated bytes surrounded by other data": {
    args() {
      const sp = new StreamParser(function* () {
        const inflatedSize = yield uint32;
        const message = (yield deflatedBytes(inflatedSize)).toString();
        const footer = (yield bytes(2)).toString();
        return {message, footer};
      });
      const input = Buffer.concat([
        new Buffer('\0\0\0\x0b'),
        new Buffer([0x78, 0x9c, 0xf3, 0x70, 0xf5,
                    0xf1, 0xf1, 0x57, 0x08, 0xf7,
                    0x0f, 0xf2, 0x71, 0x01, 0x00,
                    0x12, 0x8b, 0x03, 0x1d]),
        new Buffer(':)')]);
      const expected = { message: 'HELLO WORLD', footer: ':)' };
      return {sp, input, expected};
    },

    ...differentChunkSpecs(expect)
  },

  "handles EOF": {
    "detection"() {
      expect(parse(new Buffer([0x01]),
                   function* () {
                     return [(yield EOF), (yield EOF), (yield EOF),
                             (yield byte),
                             (yield EOF), (yield EOF), (yield EOF)];
                   })).toEqual([false, false, false, 1, true, true, true]);
    },
    "looping until"() {
      expect(parse(new Buffer([0x01, 0x02, 0x03]),
                   function* () {
                     const array = [];
                     while (! (yield EOF)) {
                       array.push((yield byte));
                     }
                     return array;
                   })).toEqual([1, 2, 3]);

    }
  }

}]);
