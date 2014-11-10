'use strict';

var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var gulp = require('gulp');
var sass = require('gulp-ruby-sass');

var handleErrors = require(__dirname + '/_utilities/handleErrors');

var config = require(__dirname + '/_utilities/config').sass;

gulp.task('sass', ['images'], function() {
  return gulp.src(config.src)
  .pipe(
    sass({
      compass: true,
      bundleExec: true,
      sourcemap: true,
      sourcemapPath: '../sass'
    })
  )
  .pipe(autoprefixer())
  .on('error', handleErrors)
  .pipe(gulp.dest(config.dest))
  .pipe(
    browserSync.reload({
      stream: true
    })
  );
});
