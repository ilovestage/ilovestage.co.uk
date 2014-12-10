'use strict';

var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
// var mocha = require('gulp-mocha');
var mocha = require('gulp-spawn-mocha');

var config = require(__dirname + '/_utilities/config').application;

gulp.task('test', function(cb) {
  return gulp.src(config.src)
  .pipe(istanbul()) // Covering files
  .pipe(istanbul.hookRequire()) // Force `require` to return covered files
  .on('finish', function() {
    gulp.src(['test/*.js'], {
      read: false
    })
    .pipe(mocha({
      env: {
        'NODE_ENV': 'test'
      },
      debug: true,
      harmony: true,
      istanbul: true
    }))
    .pipe(istanbul.writeReports()) // Creating the reports after tests runned
    .on('end', cb);
  });
});
