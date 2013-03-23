Package.describe({
  summary: "Fast JavaScript parser for code analysis"
});

Package.on_use(function (api, where) {
  where = where || ['client', 'server'];

  api.add_files('esprima.js', where);
});

Package.on_test(function (api) {
  api.use('tinytest');
  api.use('esprima');
  api.add_files('esprima_tests.js', ['client', 'server']);
});
