var gulp = require("gulp");
var watch = require("gulp-watch");
var jasmine = require("gulp-jasmine");

const testsFiles = "lib/**/*.tests.js";

gulp.task('tests.run', function () {
  return gulp.src(testsFiles)
    .pipe(jasmine({verbose:true}));
});

gulp.task('tests.watch', ['tests.run'], function () {
  gulp.watch(testsFiles, ['tests.run']);
});
