import crypto from 'crypto';
import {Stopwatch} from './stopwatch';

export const stopwatch = new Stopwatch;

// Takes a Buffer or Multibuffer and returns a Buffer.  To get hex,
// use `.toString('hex')` on the resulting Buffer.
export function sha1(buffer) {
  stopwatch.start();
  const hash = crypto.createHash("sha1");
  if (Buffer.isBuffer(buffer)) {
    hash.update(buffer);
  } else {
    // Multibuffer
    for (let chunk of buffer.chunks) {
      hash.update(chunk);
    }
  }
  const digest = hash.digest();
  stopwatch.stop();
  return digest;
}
