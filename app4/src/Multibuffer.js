// A Multibuffer is a wrapper around an Array of Buffers that acts
// like a single Buffer in certain ways.  For example, it can be
// sliced to yield another Multibuffer.
export class Multibuffer {
  constructor(chunks, _totalLength = calcTotalLength(chunks)) {
    this.chunks = chunks;
    this.length = _totalLength;

    let count = 0;
    this.chunkStarts = this.chunks.map(ch => {
      const start = count;
      count += ch.length;
      return start;
    });
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
    // `firstChunk` is index of first chunk whose end is past `start`
    const firstChunk = binarySearch(this.chunks.length, k => {
      return this.chunkStarts[k] + this.chunks[k].length > start;
    });
    if (firstChunk < this.chunks.length) {
      let offset = this.chunkStarts[firstChunk];
      for (let i = firstChunk; i < this.chunks.length; i++) {
        if (offset >= end) {
          break;
        }
        const ch = this.chunks[i];
        if (ch.length) {
          const startInChunk = Math.max(start - offset, 0);
          const endInChunk = Math.min(end - offset, ch.length);
          if (startInChunk === 0 && endInChunk === ch.length) {
            newChunks.push(ch);
          } else if (endInChunk > startInChunk) {
            newChunks.push(ch.slice(startInChunk, endInChunk));
          }
          offset += ch.length;
        }
      }
    }
    return new Multibuffer(newChunks, end - start);
  }
}

// requires N > 0
function binarySearch(N, func) {
  let a = 0;
  let b = N-1;
  if (func(a)) return 0;
  if (!func(b)) return N;
  while (b-a > 1) {
    const c = Math.floor((a+b)/2);
    if (func(c)) b = c;
    else a = c;
  }
  return b;
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
