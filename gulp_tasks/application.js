'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
// var stylish = require('jshint-stylish');

// var directory = require(__dirname + '/_utilities/directory');
// var handleErrors = require(__dirname + '/_utilities/handleErrors');

var config = require(__dirname + '/_utilities/config').application;

gulp.task('application', function() {
  // console.log('application started', config);
  return gulp.src(config.src)
  .pipe(jshint('.jshintrc'))
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jscs('.jscsrc'));
  // .pipe(jscs.reporter('checkstyle'))
});
