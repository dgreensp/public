import jasmine from './testspec/jasmine';
import {parseDelta, applyDelta, applyDeltaToMultibuffer} from "./PackParser";
import * as pp from "./PackParser";
import {Multibuffer} from "./Multibuffer";

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
  },

  "applyDelta": {
    args() {
      return {
        example1: {
          base: new Buffer('tree e7dd93ed2f90ba6efb69069010659e99d2edb75c\nparent 9f1dfaa5b60fd97b285e7403ff3867223d8fc6d3\nparent d0535fa8221558f5f816a6f73c90b03e305b338f\nauthor Avital Oliver <avital@thewe.net> 1444170260 -0700\ncommitter Avital Oliver <avital@thewe.net> 1444170260 -0700\n\nMerge branch \'pr/5298\' into devel\n'),
          delta: parseDelta(new Buffer('a602e801905e31617574686f72204465616e2042726574746c65203c6465616e4062726574746c652e636f6d3e203134343333333537303891c03a1f3533202d303730300a0a466978207479706f20696e20636f6d6d656e742e0a', 'hex')),
          result: new Buffer('tree e7dd93ed2f90ba6efb69069010659e99d2edb75c\nparent 9f1dfaa5b60fd97b285e7403ff3867223d8fc6d3\nauthor Dean Brettle <dean@brettle.com> 1443335708 -0700\ncommitter Avital Oliver <avital@thewe.net> 1444170253 -0700\n\nFix typo in comment.\n')
        }
      };
    },

    "works"({example1: {base, delta, result}}) {
      expect(applyDelta(delta, base)).toEqual(result);

      // test objectSha on chunks returned from `applyDeltaAsChunks`
      expect(pp.objectSha('commit',
                          new Multibuffer(pp.applyDeltaAsChunks(delta, base)))).toBe(
                            'd0535fa8221558f5f816a6f73c90b03e305b338f');
    },

    "applyDeltaToMultibuffer"({example1: {base, delta, result}}) {
      const baseMulti = new Multibuffer(sliceUp(base, 8));
      const resultMulti = applyDeltaToMultibuffer(delta, baseMulti);
      expect(resultMulti.toBuffer()).toEqual(result);
      for (let ch of resultMulti.chunks) {
        expect(Buffer.isBuffer(ch)).toBe(true);
      }
      // this is how to take a SHA of a Multibuffer:
      expect(pp.objectSha('commit', resultMulti)).toBe(
        'd0535fa8221558f5f816a6f73c90b03e305b338f');
    }
  }

}]);

function sliceUp(buffer, n) {
  const chunks = [];
  for (var i = 0; i < buffer.length; i += n) {
    chunks.push(buffer.slice(i, i+n));
  }
  return chunks;
}
