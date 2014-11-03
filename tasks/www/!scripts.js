'use strict';

var browserify = require('browserify');
// var buffer = require('vinyl-buffer');
var changed = require('gulp-changed');
var gulp = require('gulp');
// var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var streamify   = require('gulp-streamify');
var sync = require('browser-sync');
var uglify = require('gulp-uglify');
var watchify = require('watchify');

var directory = require('../_utilities/directory');
var handleErrors = require('../_utilities/handleErrors');

var config = require('../config').scripts;

// function handleErrors() {
//   var args = Array.prototype.slice.call(arguments);
//
//   // Send error to notification center with gulp-notify
//   notify.onError({
//     title: 'Compile Error',
//     message: '<%= error.message %>'
//   }).apply(this, args);
//
//   // Keep gulp from hanging on this task
//   this.emit('end');
// }

gulp.task('scripts', function() {
  //attempt 1
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


  //attempt 2
  // var bundler = watchify(directory.source + '/scripts/script.js');
  //
  // bundler.transform('debowerify');
  //
  // function rebundle() {
  //   return bundler.bundle()
  //   .pipe(changed(directory.destination + '/scripts'))
  //   .pipe(source('bundle.js'))
  //   .pipe(streamify(uglify()))
  //   .pipe(gulp.dest('www/scripts'))
  //   .pipe(
  //     sync.reload({
  //       stream: true,
  //       once: true
  //     })
  //   );
  // }
  //
  // bundler.on('update', rebundle);
  //
  // return rebundle();

  //attempt 3
  var bundler = browserify({
    // Required watchify args
    cache: {},
    packageCache: {},
    fullPaths: true,
    // Browserify Options
    entries: [
      // './src/javascript/app.coffee'
      directory.source + '/scripts/script.js'
    ],
    extensions: [
      '.coffee',
      '.hbs'
    ],
    debug: true
  });

  var bundle = function() {
    return bundler
    .bundle()
    .on('error', handleErrors)
    .pipe(source(directory.source + '/scripts/script.js'))
    .pipe(gulp.dest(directory.destination + '/scripts'));
  };

  if(global.isWatching) {
    bundler = watchify(bundler);
    bundler.on('update', bundle);
  }

  return bundle();

});
