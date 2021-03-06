import jasmine from './testspec/jasmine';
import {sha1} from './sha1';
import {Multibuffer} from './Multibuffer';

jasmine(expect => ["sha1", {
  "requires a buffer"() {
    expect(() => { sha1("hello"); }).toThrowError();
  },
  "works on a simple example"() {
    const digest = sha1(new Buffer("The quick brown fox jumps over the lazy dog"));
    expect(Buffer.isBuffer(digest)).toBe(true);
    expect(digest.toString('hex')).toBe('2fd4e1c67a2d28fced849ee1bb76e7391b93eb12');
  },
  "works on a Multibuffer"() {
    const digest = sha1(new Multibuffer([
      new Buffer("The quick brown fox "),
      new Buffer("jumps over the lazy dog")]));
    expect(Buffer.isBuffer(digest)).toBe(true);
    expect(digest.toString('hex')).toBe('2fd4e1c67a2d28fced849ee1bb76e7391b93eb12');
  }
}]);
