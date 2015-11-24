import jasmine from './testspec/jasmine';
import {parseDelta, applyDelta} from "./PackParser";
import * as pp from "./PackParser";

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
    "works"() {
      const base = new Buffer('tree e7dd93ed2f90ba6efb69069010659e99d2edb75c\nparent 9f1dfaa5b60fd97b285e7403ff3867223d8fc6d3\nparent d0535fa8221558f5f816a6f73c90b03e305b338f\nauthor Avital Oliver <avital@thewe.net> 1444170260 -0700\ncommitter Avital Oliver <avital@thewe.net> 1444170260 -0700\n\nMerge branch \'pr/5298\' into devel\n');
      const rawDelta = new Buffer('a602e801905e31617574686f72204465616e2042726574746c65203c6465616e4062726574746c652e636f6d3e203134343333333537303891c03a1f3533202d303730300a0a466978207479706f20696e20636f6d6d656e742e0a', 'hex');
      const result = new Buffer('tree e7dd93ed2f90ba6efb69069010659e99d2edb75c\nparent 9f1dfaa5b60fd97b285e7403ff3867223d8fc6d3\nauthor Dean Brettle <dean@brettle.com> 1443335708 -0700\ncommitter Avital Oliver <avital@thewe.net> 1444170253 -0700\n\nFix typo in comment.\n');

      const delta = parseDelta(rawDelta);

      expect(applyDelta(delta, base)).toEqual(result);

      // test objectSha on chunks returned from `applyDeltaAsChunks`
      expect(pp.objectSha('commit',
                       ...pp.applyDeltaAsChunks(delta, base))).toBe(
                         'd0535fa8221558f5f816a6f73c90b03e305b338f');
    }
  }
}]);
