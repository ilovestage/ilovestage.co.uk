'use strict';

var browserSync = require('browser-sync');
// var changed = require('gulp-changed');
var gulp = require('gulp');
var htmlhint = require('gulp-htmlhint');
var w3cjs = require('gulp-w3cjs');

var config = require(__dirname + '/_utilities/config').markup;

gulp.task('markup', function() {
  return gulp.src(config.src)
  // .pipe(changed(config.dest))
  // .pipe(htmlhint())
  // .pipe(htmlhint.reporter())
  // .pipe(w3cjs());
  // .pipe(gulp.dest(config.dest))
});
