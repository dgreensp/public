import {ChunkedPrefixInflater} from './ChunkedPrefixInflater';

// Note that the consumed bytes can't run to the end of the stream.
// There must be additional available bytes to cause the result to
// be emitted.  This is a quirk of the underlying zlib implementation,
// and we'd have to be explicitly told about the EOF to work around it.
export function deflatedBytes(inflatedSize) {
  const cpi = new ChunkedPrefixInflater(inflatedSize);
  let nextChunkIndex = 0; // index of chunk we haven't added to CPI

  return (chunks, c, offset, available, isEOF) => {
    // read data starting at `offset` of `chunks[c]` -- but skipping
    // chunks we've already read (indexes less than `nextChunkIndex` --
    // and continuing until we get a result from the ChunkedPrefixInflater
    if (nextChunkIndex < c) {
      nextChunkIndex = c;
    }
    while (nextChunkIndex < chunks.length) {
      let nextChunk;
      if (nextChunkIndex === c) {
        nextChunk = chunks[c].slice(offset);
      } else {
        nextChunk = chunks[nextChunkIndex];
      }
      nextChunkIndex++;

      const result = cpi.addChunk(nextChunk);
      if (result) {
        return result;
      }
    }

    if (isEOF) {
      return cpi.addEOF();
    }

    return null;
  };
}
