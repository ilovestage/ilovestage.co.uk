'use strict';

var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var gulp = require('gulp');
// var sass = require('gulp-ruby-sass');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

var directory = require(__dirname + '/_utilities/directory');
var handleErrors = require(__dirname + '/_utilities/handleErrors');

var config = require(__dirname + '/_utilities/config').sass;

// gulp.task('sass', ['images'], function() {
gulp.task('sass', function() {
  // console.log('sass started', config);
  return gulp.src(config.src)
  // gulp.src(config.src)
  // .on('error', handleErrors)
  .pipe(sourcemaps.init())
  .pipe(
    sass(
      {
        bundleExec: true,
        compass: true,
        includePaths: [
          directory.bower_components,
          directory.node_modules,
          directory.utilities
        ]
      },
      {
        errLogToConsole: true
      }
    )
  )
  .pipe(autoprefixer())
  // .pipe(sourcemaps.write())
  .pipe(sourcemaps.write('./maps'))
  .pipe(gulp.dest(config.dest));
  // .pipe(gulp.dest(directory.destination + '/styles'));
  // .pipe(config.dest)
  // .pipe(
  //   browserSync.reload({
  //     stream: true
  //   })
  // );
});
