import crypto from 'crypto';

// Takes a Buffer or Multibuffer and returns a Buffer.  To get hex,
// use `.toString('hex')` on the resulting Buffer.
export function sha1(buffer) {
  const hash = crypto.createHash("sha1");
  if (Buffer.isBuffer(buffer)) {
    hash.update(buffer);
  } else {
    // Multibuffer
    for (let chunk of buffer.chunks) {
      hash.update(chunk);
    }
  }
  return hash.digest();
}
