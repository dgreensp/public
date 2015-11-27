import jasmine from './testspec/jasmine';
import {crc32} from "./crc32";

jasmine(expect => ["crc32", {
  "works"() {
    expect(crc32(new Buffer('plumless'))).toBe(0x4ddb0c25);
    expect(crc32(new Buffer('buckeroo'))).toBe(0x4ddb0c25);
    expect(crc32(new Buffer('spaceship'))).toBe(0xaa708c8e);
    expect(crc32(new Buffer('banana'))).toBe(0x038b67cf);
    expect(crc32(new Buffer(' banana '))).not.toBe(0x038b67cf);
    expect(crc32(new Buffer('banana', 1, 7))).toBe(0x038b67cf);
  }
}]);
