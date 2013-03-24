Package.describe({
  summary: "JavaScript parser and analysis toolchain"
});

Package.on_use(function (api, where) {
  where = where || ['client', 'server'];

  api.add_files(['esprima.js', 'estraverse.js', 'escope.js'], where);
});

Package.on_test(function (api) {
  api.use('tinytest');
  api.use('estools');
  api.add_files('estools_tests.js', ['client', 'server']);
});
