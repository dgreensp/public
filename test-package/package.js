Package.describe({
  name: 'david:test-package',
  version: '0.0.3',
  // Brief, one-line summary of the package.
  summary: 'Just to test package versions',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: null
});

Package.onUse(function(api) {
//  api.versionsFrom('1.0.3.1');
  api.addFiles('test-package.js');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('david:test-package');
  api.addFiles('test-package-tests.js');
});
