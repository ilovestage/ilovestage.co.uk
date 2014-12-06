'use strict';

var autoprefixer = require('gulp-autoprefixer');
var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

var directory = require(__dirname + '/_utilities/directory');

var config = require(__dirname + '/_utilities/config').sass;

gulp.task('sass', function() {
  // console.log('sass started', config);
  return gulp.src(config.src)
  .pipe(sourcemaps.init())
  .pipe(
    sass(
      {
        bundleExec: true,
        compass: true,
        includePaths: [
          directory.bowerCcomponents,
          directory.nodeModules,
          directory.utilities + '/styles'
        ]
      },
      {
        errLogToConsole: true
      }
    )
  )
  .pipe(autoprefixer())
  .pipe(sourcemaps.write('./maps'))
  .pipe(gulp.dest(config.dest));
});
