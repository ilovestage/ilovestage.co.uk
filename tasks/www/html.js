'use strict';

var browserSync = require('browser-sync');
var changed = require('gulp-changed');
var gulp = require('gulp');
var path = require('path');

var reload = browserSync.reload;

var directory = {};
directory.source = path.resolve(__dirname + '/../../source/www');
directory.destination = path.resolve(__dirname + '/../../build/www');

gulp.task('html', function() {
  return gulp.src(directory.source + '/**/*.html')
  .pipe(changed(directory.source))
  .pipe(gulp.dest(directory.destination))
  .pipe(
    reload({
      stream:true
    })
  );
});
