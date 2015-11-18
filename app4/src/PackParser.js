export const extractors = {
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
  const {uint32} = extractors;
  return [(yield uint32).toString(16),
          (yield uint32).toString(16)];
}

export function* makeConsumer(parser) {
  const chunks = [new Buffer(0)];
  const generator = parser();
  let info = generator.next();
  let available = 0;
  let c = 0;
  let offset = 0;
  while (! info.done) {
    const parseFunc = info.value;
    let parserRet = parseFunc(chunks, c, offset, available);
    while (! parserRet) {
      const newChunk = yield;
      chunks.push(newChunk);
      available += newChunk.length;
      parserRet = parseFunc(chunks, c, offset, available);
    }
    const {result, totalBytesConsumed} = parserRet;
    available -= totalBytesConsumed;
    if (available < 0) {
      throw new Error("Parser consumed more bytes than available");
    }
    offset += totalBytesConsumed;
    while (offset >= chunks[c].length && (c+1) < chunks.length) {
      offset -= chunks[c].length;
      c++;
    }
    info = generator.next(result);
  }

  return info.value;
}
