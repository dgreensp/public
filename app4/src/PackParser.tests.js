import jasmine from './testspec/jasmine';
import {parseDelta} from "./PackParser";

jasmine(expect => ["PackParser", {
  "parseDelta": {
    "works on some examples"() {
      expect(parseDelta(
        new Buffer('77489048', 'hex'))).toEqual({
          baseLength: 119,
          resultLength: 72,
          ops: [ [ 0, 72 ] ] });

      expect(parseDelta(
        new Buffer('9507920790800136918115034d4954b19cf902', 'hex'))).toEqual({
          baseLength: 917,
          resultLength: 914,
          ops:
          [ [ 0, 128 ],
            new Buffer('36', 'hex'),
            [ 129, 21 ],
            new Buffer('4d4954', 'hex'),
            [ 156, 761 ] ]
        });
    },

    "throws properly on incomplete input"() {
      expect(() => parseDelta(
        new Buffer('9507920790800136918115034d4954b19c', 'hex'))).toThrowError(
            /parsing delta/);

      expect(() => parseDelta(
        new Buffer('950792079080013691', 'hex'))).toThrowError(
            /parsing delta/);

      expect(() => parseDelta(
        new Buffer('95', 'hex'))).toThrowError(
            /parsing delta/);
    }
  }
}]);
