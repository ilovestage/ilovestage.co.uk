'use strict';

var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var changed = require('gulp-changed');
var gulp = require('gulp');
var path = require('path');
var sass = require('gulp-ruby-sass');

var reload = browserSync.reload;

var directory = {};
directory.source = path.resolve(__dirname + '/../../source/www');
directory.destination = path.resolve(__dirname + '/../../build/www');

gulp.task('styles', function() {
  return gulp.src(directory.source + '/styles.scss')
  .pipe(changed(directory.source))
  .pipe(sass())
  .pipe(autoprefixer())
  .pipe(gulp.dest(directory.destination))
  .pipe(
    reload({
      stream:true
    })
  );
});
