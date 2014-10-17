'use strict';

var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var changed = require('gulp-changed');
var gulp = require('gulp');
var path = require('path');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var directory = {};
directory.source = path.resolve(__dirname + '/../../source/www');
directory.destination = path.resolve(__dirname + '/../../build/www');

gulp.task('scripts', function() {
  // return browserify({
  //   entries: [directory.source + '/scripts/script.js']
  // })
  // .pipe(buffer())
  // .pipe(changed(directory.source))
  // .bundle()
  // .pipe(
  //   sourcemaps.init({
  //     loadMaps: true
  //   })
  // )
  // .pipe(uglify())
  // .pipe(sourcemaps.write(directory.source + '/scripts'))
  // .pipe(source('script.js'))
  // .pipe(gulp.dest(directory.destination + '/scripts'));
});
