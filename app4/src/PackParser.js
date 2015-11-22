// An extractor takes:
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
export const extractors = {
  byte: (chunks, c, offset, available) => {
    // this function is never called, because `extractors.byte` is
    // inlined in the code that calls extractors for performance reasons.
    // it would look like:
    // ```
    // return { result: chunks[c].readUInt8(offset),
    //          totalBytesConsumed: 1 };
    // ```
  },
  bytes(n) {
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
          const numChunks = chunks.length;
          if (c === numChunks-1) {
            return null;
          }
          // bytes are at a chunk boundary; allocate new Buffer
          const result = new Buffer(n);
          // copy the rest of this chunk into the buffer
          let bytesNeeded = n - curChunkAvailable; // > 0
          curChunk.copy(result, 0, offset, curChunk.length);
          // copy data from more chunks
          let j = c+1;
          while (bytesNeeded > 0 && j < numChunks) {
            const newChunk = chunks[j];
            const bytesToTake = Math.min(newChunk.length, bytesNeeded);
            newChunk.copy(result, n-bytesNeeded, 0, bytesToTake);
            bytesNeeded -= bytesToTake;
          }
          if (bytesNeeded) {
            return null;
          } else {
            return { result: result, totalBytesConsumed: n };
          }
        }
      }
    };
  },
  uint32: (chunks, c, offset, available) => {
    const ret = bytes4(chunks, c, offset, available);
    if (ret) {
      ret.result = ret.result.readUInt32BE(0);
    }
    return ret;
  }
};

const bytes4 = extractors.bytes(4);
extractors.bytes4 = bytes4;

export function* fooBar() {
  const {byte, uint32} = extractors;
  return [(yield uint32).toString(16),
          (yield byte).toString(16),
          (yield uint32).toString(16)];
}

export function* makeConsumer(parser) {
  const chunks = []; // Buffers of non-zero length
  let available = 0;
  let c = 0; // which chunk we're on
  let offset = 0; // current offset into `chunks[c]`

  function addChunk(newChunk) {
    if (newChunk.length) {
      chunks.push(newChunk);
      available += newChunk.length;
    }
  }

  const generator = parser();
  let info = generator.next();

  while (! info.done) {
    const extractor = info.value;

    // make sure we have at least one byte available,
    // which means we have at least one chunk, and a byte
    // to point to in that chunk, when we invoke an extractor.
    while (available === 0) {
      addChunk((yield));
    }
    // Invariant: `available > 0`
    // Invariant: `chunks[c]` exists and `offset < chunks[c].length`.

    let result, bytesConsumed;
    if (extractor === extractors.byte) {
      result = chunks[c].readUInt8(offset);
      bytesConsumed = 1;
    } else {
      let extracted = extractor(chunks, c, offset, available);
      while (! extracted) {
        const availableNow = available;
        while (available === availableNow) {
          addChunk((yield));
        }
        extracted = extractor(chunks, c, offset, available);
      }
      result = extracted.result;
      bytesConsumed = extracted.totalBytesConsumed;
      if (bytesConsumed > available) {
        throw new Error("Parser tried to consume more bytes than available");
      }
    }

    available -= bytesConsumed;
    offset += bytesConsumed;
    while (offset >= chunks[c].length && (c+1) < chunks.length) {
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
