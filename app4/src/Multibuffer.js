export class Multibuffer {
  constructor(chunks, _totalLength = calcTotalLength(chunks)) {
    this.chunks = chunks;
    this.length = _totalLength;
  }

  toBuffer() {
    return Buffer.concat(this.chunks, this.length);
  }

  slice(start = 0, end = this.length) {
    if (start < 0) {
      start += this.length;
    }
    if (end < 0) {
      end += this.length;
    }
    if (end < start) {
      end = start;
    }
    const newChunks = [];
    let offset = 0;
    for (let ch of this.chunks) {
      const startInChunk = Math.max(start - offset, 0);
      const endInChunk = Math.min(end - offset, ch.length);
      if (startInChunk === 0 && endInChunk === ch.length) {
        newChunks.push(ch);
      } else if (endInChunk > startInChunk) {
        newChunks.push(ch.slice(startInChunk, endInChunk));
      }
      offset += ch.length;
    }
    return new Multibuffer(newChunks, end - start);
  }
}

function calcTotalLength(chunks) {
  if (!Array.isArray(chunks)) {
    throw new Error("Array of Buffers required");
  }
  let total = 0;
  for (let chunk of chunks) {
    if (! Buffer.isBuffer(chunk)) {
      throw new Error("Array of Buffers required");
    }
    total += chunk.length;
  }
  return total;
}
