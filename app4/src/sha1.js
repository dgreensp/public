import * as crypto from 'crypto';

// Takes a Buffer and returns a Buffer.  To get hex, use `.toString('hex')`
// on the buffer.
export function sha1(data) {
  if (! Buffer.isBuffer(data)) {
    throw new Error("A Buffer is required as input to sha1");
  }
  const hash = crypto.createHash("sha1");
  hash.update(data);
  return hash.digest();
}
