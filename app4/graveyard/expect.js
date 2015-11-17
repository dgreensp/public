export class Expect {
  constructor(actual) {
    this.actual = actual;
    this.ok = false; // whether we're OK (passing)
    this.not = false; // whether we've been notted
    this.whatWeExpect = null; // must be set by some method
  }

  not() {
    this.not = !this.not;
    return this;
  }

  toBe(expected) {
    this.ok = ((this.actual === expected) !== this.not);
    this.whatWeExpect =
      `${this.actual} (actual) ${this.not ? '!==' : '==='} ${expected}`;
  }
}
