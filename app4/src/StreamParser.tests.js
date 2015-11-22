import jasmine from './testspec/jasmine';
import {StreamParser, extractors} from "./StreamParser";

const {byte} = extractors;

function addChunks(streamParser, chunks) {
  return chunks.map(chunk => streamParser.addChunk(chunk));
}

jasmine(expect => ["StreamParser", {
  "can parse a series of bytes": {
    args() {
      const sp = new StreamParser(function* () {
        const result = [];
        const outerLen = yield byte;
        for (let n = 0; n < outerLen; n++) {
          const len = yield byte;
          const buf = new Buffer(len);
          // this is inefficient of course; normally we'd read
          // an entire buffer at once if we know the length
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
    "given all at once"({sp, input, expected}) {
      expect(sp.addChunk(input)).toEqual(expected);
    },
    "given one at a time"({sp, input, expected}) {
      for (var i = 0; i < input.length; i++) {
        const ret = sp.addChunk(input.slice(i, i+1));
        if (i+1 === input.length) {
          expect(ret).toEqual(expected);
          expect(sp.done).toBe(true);
          expect(sp.result).toEqual(expected);
        } else {
          expect(ret).toBe(null);
          expect(sp.done).toBe(false);
          expect(sp.result).toBe(null);
        }
      }
    }
  }
}]);
