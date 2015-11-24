import crypto from 'crypto';

// Takes Buffers and returns a Buffer.  To get hex, use `.toString('hex')`
// on the buffer.
export function sha1(...buffers) {
  const hash = crypto.createHash("sha1");
  for (let data of buffers) {
    if (! Buffer.isBuffer(data)) {
      throw new Error("A Buffer is required as input to sha1");
    }
    hash.update(data);
  }
  return hash.digest();
}
