'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');

var config = require(__dirname + '/_utilities/config').application;

gulp.task('application', function() {
  // console.log('application started', config);
  return gulp.src(config.src)
  .pipe(jshint('.jshintrc'))
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jscs('.jscsrc'));
});
