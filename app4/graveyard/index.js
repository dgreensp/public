export function describe(groupName, declFunc) {
  return function ({expect}) {
    const decl = declFunc(expect);
    const tests = [];
    const groups = [];
    for (let key of Object.keys(decl)) {
      // XXX handle other directives, custom directives
      if (key !== 'args') {
        // XXX handle groups
        tests.push({
          testName: key,
          runFunc: decl[key],
          isAsync: false // only set after runFunc
        });
      }
    }
    return {
      groupName: groupName,
      expect: expect,
      originalDecl: decl,
      makeArgs() {
        const args = decl.args.call(null);
        const ret = makeObjectAllowingGetters();
        Object.assign(ret, args);
        return ret;
      }
    };
  };
}

function returnUndefined() {
  return undefined;
}

const isIE8 = (() => {
  if (typeof document === 'object' &&
      typeof document.createElement === 'function' &&
      typeof Object.defineProperty === 'function') {
    try {
      Object.defineProperty({}, 'foo', { get: returnUndefined });
    } catch (e) {
      return true;
    }
  }
  return false;
})();

export function makeObjectAllowingGetters() {
  let ret = {};

  if (isIE8) {
    // Make a weird DOM object and override all built-in and internal
    // properties to return `undefined`.  Note that they are still
    // enumerable.
    ret = document.createElement('args');
    for (var k in ret) {
      Object.defineProperty(ret, k, { get: returnUndefined });
    }
  }

  // Expose whether we think we're in IE 8.  Assigning an enumerable
  // own property like this also makes the point that you shouldn't be
  // iterating over this object, explicitly or implicitly (e.g. using
  // `...`).
  ret.__isIE8 = isIE8;

  return ret;
}

export {describe as default};
