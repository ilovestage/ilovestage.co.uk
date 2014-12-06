'use strict';

var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');

var config = require(__dirname + '/_utilities/config').application;

gulp.task('test', function(cb) {
  return gulp.src(config.src)
  .pipe(istanbul()) // Covering files
  .pipe(istanbul.hookRequire()) // Force `require` to return covered files
  .on('finish', function() {
    gulp.src(['test/*.js'])
    .pipe(mocha())
    .pipe(istanbul.writeReports()) // Creating the reports after tests runned
    .on('end', cb);
  });
});
