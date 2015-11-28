// WIP

class TreeBuffer {
  constructor(chunks, start = 0, end = chunks.length) {
    this.left = null;
    this.right = null;
    const numChunks = end - start;

    if (numChunks === 1) {
      this.left = chunks[start];
    } else if (numChunks === 2) {
      this.left = chunks[start];
      this.right = chunks[start + 1];
    } else if (numChunks > 2) {
      const leftLen = Math.ceil(numChunks / 2);
      this.left = new TreeBuffer(chunks, start, start + leftLen);
      this.right = new TreeBuffer(chunks, start + leftLen, end);
    }

    this.length = (this.left ? this.left.length : 0) +
      (this.right ? this.right.length : 0);
  }

  eachBuffer(func) {
    const {left, right} = this;

    if (left) {
      if (Buffer.isBuffer(left)) {
        func(left);
      } else {
        left.eachBuffer(func);
      }
    }

    if (right) {
      if (Buffer.isBuffer(right)) {
        func(right);
      } else {
        right.eachBuffer(func);
      }
    }
  }

  getAllChunks() {
    const chunks = [];
    this.eachBuffer(ch => chunks.push(ch));
    return chunks;
  }

  toBuffer() {
    return Buffer.concat(this.getAllChunks(), this.length);
  }

  slice(start = 0, end = this.length) {
    const length = this.length;
    if (start < 0) start += length;
    if (end < 0) end += length;
    if (start > length) start = length;
    if (end > length) end = length;
    if (start < 0) start = 0;
    if (end < 0) end = 0;

    if (start === 0 && end === this.length) {
      return this;
    }
    if (end <= start) {
      return new TreeBuffer([]);
    }

    const leftLen = this.left.length;
    let leftResult = null;
    if (start < leftLen) {
      leftResult = this.left.slice(start, end);
    }
    let rightResult = null;
    if (end > leftLen) {
      rightResult = this.right.slice(start - leftLen, end - leftLen);
    }

    if (leftResult && rightResult) {
      return new TreeBuffer([leftResult, rightResult]);
    }

    const result = (leftResult || rightResult);
    if (Buffer.isBuffer(result)) {
      return new TreeBuffer([result]);
    } else {
      return result;
    }
  }
}
