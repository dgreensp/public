
Package.describe({
  summary: "Full-featured HTML5 parser (server only)"
});

Npm.depends({'html5': "0.3.10"});

Package.on_use(function (api) {

  api.add_files(['html5.js'], 'server');
});

Package.on_test(function (api) {
  api.use('html5');
  api.use('tinytest');
  api.add_files('html5_tests.js', 'server');
});
