'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');

var config = require(__dirname + '/_utilities/config').js;

gulp.task('js', function() {
  // console.log('js started', config);
  return gulp.src(config.src)
  .pipe(jshint('.jshintrc'))
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jscs('.jscsrc'));
});
