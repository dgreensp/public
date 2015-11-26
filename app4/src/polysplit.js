const N = 199;
const A = N*N*N;
const B = N*N;
const C = N;

export function polysplit(data, a) {
  if (data.length <= 4) {
    return [data];
  }
  const chunks = [];
  let h = (A * data.readUInt8(0) +
           B * data.readUInt8(1) +
           C * data.readUInt8(2) +
           data.readUInt8(3)) >>> 0;
  let chunkStart = 0;
  for (let i = 1; i+4 <= data.length; i++) {
    h = ((h - A * data.readUInt8(i-1)) * N + data.readUInt8(i+3)) >>> 0;
    if ((i - chunkStart) >= 4 && (h % a === 1)) {
      chunks.push(data.slice(chunkStart, i));
      chunkStart = i;
    }
  }
  chunks.push(data.slice(chunkStart));
  return chunks;
}
