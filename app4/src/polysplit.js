const P = 199;
const A = P*P*P;
const B = P*P;
const C = P;

global.HITS = 0;
global.MISSES = 0;
global.CHAIN_ADVANCES = 0;

export function polysplit(data, N, maxLen=N*2, minLen=4) {
  if (data.length <= 4) {
    return [data];
  }
  const chunks = [];
  let a = data.readUInt8(0);
  let b = data.readUInt8(1);
  let c = data.readUInt8(2);
  let d = data.readUInt8(3);
  let h = (A*a + B*b + C*c + d) >>> 0;
  let chunkStart = 0;
  let chunkSize = 1; // (i - chunkStart)
  for (let i = 1; i+4 <= data.length; i++,chunkSize++) {
    let oldA = a;
    a = b;
    b = c;
    c = d;
    d = data.readUInt8(i+3);
    h = ((h - A * oldA) * P + d) >>> 0;
    if (chunkSize >= minLen &&
        ((h % N === 1) || chunkSize >= maxLen)) {
      chunks.push(data.slice(chunkStart, i));
      chunkStart = i;
      chunkSize = 0;
    }
  }
  chunks.push(data.slice(chunkStart));
  return chunks;
}

// Idea taken from https://github.com/darkskyapp/string-hash
export function fasthash(buffer) {
  // the constants here are chosen totally at random
  let hash = 0x72677172;
  let i = buffer.length;
  while (i) {
    hash = (hash * 0x3c03e4d1) ^ buffer.readUInt8(--i);
  }

  return (hash << 7) >>> 0;
}

export class BufferInterner {
  constructor() {
    this.hashmap = {};
  }

  intern(buffer) {
    let h = fasthash(buffer);
    while (this.hashmap[h] && ! this.hashmap[h].equals(buffer)) {
      global.CHAIN_ADVANCES++;
      h = (h + 1) >>> 0;
    }
    if (! this.hashmap[h]) {
      global.MISSES++;
      // copy, so we aren't storing slices of larger Buffers!
      this.hashmap[h] = new Buffer(buffer);
    } else global.HITS++;
    return this.hashmap[h];
  }
}

export class PolysplitInterner {
  constructor(N, maxLen=undefined, minLen=undefined) {
    this.N = N;
    this.maxLen = maxLen;
    this.minLen = minLen;
    this.interner = new BufferInterner();
  }

  intern(buffer) {
    const {interner, N, maxLen, minLen} = this;
    return polysplit(buffer, N, maxLen, minLen).map(
      chunk => interner.intern(chunk));
  }
}
