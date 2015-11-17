const binding = process.binding('zlib');
const zlib = require('zlib');

// Given:
// - a series of Buffers ("chunks") of data,
// - which may arrive asynchronously over time,
// - representing a continuous stream of bytes,
// - consisting of deflated content possibly followed by other data,
// - where the size of the inflated data is known,
// - but not the size of the deflated data (i.e. the number of bytes to read)...
//
// Inflate the content, and return the inflated content along with number of
// bytes read.  This is a useful operation for streaming parsing of git pack
// files.  The built-in zlib module does not support "inflating a prefix"
// of a buffer (with a way to find out how long the prefix was, i.e. how many
// bytes were consumed), and coupled with the streaming requirement, this
// is the simplest approach.
export class ChunkedPrefixInflater {

  constructor(inflatedSize) {
    if (typeof inflatedSize !== 'number') {
      throw new Error("inflatedSize is required");
    }
    this.inflatedSize = inflatedSize;
    this.result = new Buffer(inflatedSize);
    this._offset = 0;
    this._handle = new binding.Zlib(binding.INFLATE);
    this._error = null;

    this._handle.onerror = (message, errno) => {
      this._handle = null;
      const e = new Error(message);
      e.errno = errno;
      e.code = zlib.codes[errno];
      this._error = e;
    };

    this._handle.init(binding.Z_DEFAULT_WINDOWBITS,
                      binding.Z_DEFAULT_COMPRESSION,
                      binding.Z_DEFAULT_MEMLEVEL,
                      binding.Z_DEFAULT_STRATEGY,
                      null);

    this.totalBytesConsumed = 0;
  }

  // Takes `chunk`, a Buffer.
  //
  // Returns `null` if more deflated input is required.  If `inflatedSize`
  // is reached, returns an object of the form `{ result: Buffer,
  // chunkBytesConsumed, totalBytesConsumed}`.  Throws an error if a prefix
  // of the input data does not inflate to a series of `inflatedSize` bytes,
  // in which case you should stop using the instance.
  addChunk(chunk) {
    const oldRemainingOut = this.inflatedSize - this._offset;

    const ret = this._handle.writeSync(
      binding.Z_SYNC_FLUSH, // doesn't matter for INFLATE
      chunk, 0, chunk.length,
      this.result, this._offset, oldRemainingOut);

    if (this._error) {
      throw this._error;
    }

    const [remainingIn, remainingOut] = ret;
    const bytesEmitted = oldRemainingOut - remainingOut;
    const bytesConsumed = chunk.length - remainingIn;
    this._offset += bytesEmitted;
    this.totalBytesConsumed += bytesConsumed;

    if (remainingOut === 0) {
      this._handle.close();
      return {
        result: this.result,
        chunkBytesConsumed: bytesConsumed,
        totalBytesConsumed: this.totalBytesConsumed
      };
    } else if (remainingIn === 0) {
      return null;
    } else {
      throw new Error(`Didn't inflate to ${this.inflatedSize} bytes after ` +
                      `consuming ${this.totalBytesConsumed}, ` +
                      `emitting ${this._offset}`);
    }
  }

}

export {ChunkedPrefixInflater as default};
