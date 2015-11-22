export default function jasmine(func) {
  const [groupName, decl] = func(expect);
  describe(groupName, () => {
    let args = {};

    if (decl.args) {
      beforeEach(() => {
        args = decl.args.call(null);
      });
    }

    for (var key in decl) {
      if (key !== 'args') {
        const spec = decl[key];
        if (typeof spec === 'object') {
          // nested spec
          jasmine(expect => [key, spec]);
        } else {
          // XXX async
          it(key, () => {
            spec(args);
          });
        }
      }
    }
  });
}
