'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var stylish = require('jshint-stylish');

var directory = require(__dirname + '/_utilities/directory');
var handleErrors = require(__dirname + '/_utilities/handleErrors');

var config = require(__dirname + '/_utilities/config').js;

gulp.task('js', function() {
  console.log('js started', config);
  return gulp.src(config.src)
  .pipe(jshint('.jshintrc'))
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jscs('.jscsrc'));
});
