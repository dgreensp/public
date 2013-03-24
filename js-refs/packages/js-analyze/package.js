Package.describe({
  summary: "JavaScript code analysis for Meteor"
});

Package.on_use(function (api, where) {
  where = where || ['client', 'server'];

  api.use('estools', where);
  api.add_files(['js_analyze.js'], where);
});

Package.on_test(function (api) {
  api.use('tinytest');
  api.use('js-analyze');
  api.add_files('js_analyze_tests.js', ['client', 'server']);
});
