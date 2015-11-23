var gulp = require("gulp");
var watch = require("gulp-watch");
var jasmine = require("gulp-jasmine");

const testsFiles = "lib/**/*.tests.js";

gulp.task('tests.run', function () {
  return gulp.src(testsFiles)
    .pipe(jasmine({verbose: true, includeStackTrace: true}));
});

gulp.task('tests.watch', function () {
  gulp.watch('lib/**/*.js', ['tests.run']);
});
