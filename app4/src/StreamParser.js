export class StreamParser {
  constructor(generatorFunction) {
    this._chunkConsumer = makeChunkConsumer(generatorFunction);
    this._chunkConsumer.next();
    this.done = false;
    this.result = null;
  }

  addChunk(buffer) {
    if (! Buffer.isBuffer(buffer)) {
      throw new Error("Chunk must be a Buffer in StreamParser");
    }

    if (this.done) {
      return this.result;
    } else {
      const {value, done} = this._chunkConsumer.next(buffer);
      if (done) {
        this.done = true;
        this.result = value;
        return this.result;
      } else {
        return null;
      }
    }
  }
}

// An extractor is a function that takes:
//
// * `chunks` - non-empty array of non-empty Buffers
// * `c` - index into `chunks`
// * `offset` - byte index into `chunks[c]`
// * `available` - total number of available bytes,
//     including remaining bytes in `chunks[c]` starting at `offset`,
//     and bytes in subsequent chunks
//
// An extractor returns one of the following:
// * `null` - the extractor will be called again when more bytes are available
// * `{result: any, totalBytesConsumed: int}` - the extractor returns a result
//   and consumes some number of bytes, which may be 0, or may span multiple
//   chunks.
//
// When an extractor is called:
// * `available > 0`
// * `chunks[c]` exists and `offset < chunks[c].length`
//
// When an extractor is called multiple times as a result of returning `null`,
// the `c` and `offset` arguments will be the same each time; the `available`
// argument will be a greater number each time; and the `chunks` array will
// contain the same chunks plus at least one new chunk each time.
export const extractors = {
  byte: (chunks, c, offset, available) => {
    return { result: chunks[c].readUInt8(offset),
             totalBytesConsumed: 1 };
  },
  bytes(n) {
    if (! (n >= 1)) {
      throw new Error("Positive number of bytes required");
    }
    return (chunks, c, offset, available) => {
      if (available < n) {
        // call us back when there are more bytes available
        return null;
      } else {
        const curChunk = chunks[c];
        const curChunkAvailable = curChunk.length - offset;
        if (curChunkAvailable >= n) {
          // bytes are available in the current chunk
          return { result: curChunk.slice(offset, offset+n),
                   totalBytesConsumed: n };
        } else {
          if (c === (chunks.length - 1)) {
            throw new Error("assertion fail: more bytes should be available");
          }
          // bytes are at a chunk boundary; allocate new Buffer
          const result = new Buffer(n);
          // copy the rest of this chunk into the buffer
          let bytesNeeded = n - curChunkAvailable; // > 0
          curChunk.copy(result, 0, offset, curChunk.length);
          // copy data from more chunks
          let j = c+1;
          while (bytesNeeded > 0 && j < chunks.length) {
            const newChunk = chunks[j];
            const bytesToTake = Math.min(newChunk.length, bytesNeeded);
            newChunk.copy(result, n-bytesNeeded, 0, bytesToTake);
            bytesNeeded -= bytesToTake;
            j++;
          }
          if (bytesNeeded) {
            throw new Error("assertion fail: more bytes should be available");
          }
          return { result: result, totalBytesConsumed: n };
        }
      }
    };
  }
};

const bytes4 = extractors.bytes(4);

Object.assign(extractors, {
  uint32: (chunks, c, offset, available) => {
    if (available < 4) {
      return null;
    } else if (chunks[c].length - offset >= 4) {
      // fast path for performance; bytes are in same chunk
      return { result: chunks[c].readUInt32BE(offset),
               totalBytesConsumed: 4 };
    } else {
      // bytes are split across chunks
      const ret = bytes4(chunks, c, offset, available);
      ret.result = ret.result.readUInt32BE(0);
      return ret;
    }
  }
});


export class TestParser extends StreamParser {
  constructor() {
    super(function* () {
      const {byte, uint32} = extractors;
      return [(yield uint32).toString(16),
              (yield byte).toString(16),
              (yield uint32).toString(16)];
    });
  }
}

function* makeChunkConsumer(parser) {
  const chunks = []; // Buffers of non-zero length
  let available = 0;
  let c = 0; // which chunk we're on
  let offset = 0; // current offset into `chunks[c]`

  function appendChunk(newChunk) {
    if (newChunk.length) {
      chunks.push(newChunk);
      available += newChunk.length;
    }
  }

  const generator = parser();
  let info = generator.next();

  let i = 0;
  while (! info.done) {
    i++;
    const extractor = info.value;

    // make sure we have at least one byte available,
    // which means we have at least one chunk, and a byte
    // to point to in that chunk, when we invoke an extractor.
    while (available === 0) {
      appendChunk((yield));
    }
    // Invariant: `available > 0`
    // Invariant: `chunks[c]` exists and `offset < chunks[c].length`.

    let result, bytesConsumed;
    if (extractor === extractors.byte) {
      // this case is purely a performance optimization, to avoid an
      // extra function call and object allocation.
      result = chunks[c].readUInt8(offset);
      bytesConsumed = 1;
    } else {
      let extracted = extractor(chunks, c, offset, available);
      while (! extracted) {
        const availableNow = available;
        while (available === availableNow) {
          appendChunk((yield));
        }
        extracted = extractor(chunks, c, offset, available);
      }
      result = extracted.result;
      bytesConsumed = extracted.totalBytesConsumed;
      if (typeof bytesConsumed !== 'number') {
        throw new Error("extractor must return totalBytesConsumed");
      }
      if (bytesConsumed > available) {
        throw new Error("Parser tried to consume more bytes than available");
      }
    }

    available -= bytesConsumed;
    offset += bytesConsumed;
    while (c < chunks.length && offset >= chunks[c].length) {
      offset -= chunks[c].length;
      c++;
    }
    // Invariant: Either `offset < chunks[c].length`, meaning there
    // is another byte in the current chunk ready to be read, or we are
    // out of bytes but ready for the next chunk when it arrives, i.e.
    // `c === chunks.length` and `offset === 0` and `available === 0`.

    info = generator.next(result);
  }

  return info.value;
}