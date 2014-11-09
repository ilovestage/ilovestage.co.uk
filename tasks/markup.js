'use strict';

var changed = require('gulp-changed');
var gulp = require('gulp');

var config = require(__dirname + '/_utilities/config').markup;

gulp.task('markup', function() {
  return gulp.src(config.src)
  .pipe(changed(config.dest))
  .pipe(gulp.dest(config.dest));
});
