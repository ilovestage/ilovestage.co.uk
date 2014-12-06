'use strict';

var gulp = require('gulp');

var directory = require(__dirname + '/_utilities/directory');

gulp.task(
  'watch',
  [
    'browser-sync'
  ],
  function() {
    if (global.applicationType === 'website') {
      global.isWatching = true;

      // gulp.watch(directory.source + '/views/**/*.html', ['markup']);
      gulp.watch(directory.source + '/scripts/**/*.js', ['browserify']);
      gulp.watch(directory.source + '/styles/**/*.scss', ['sass']);
      gulp.watch(directory.source + '/sprites/**/*', ['sprites']);
      gulp.watch(directory.source + '/images/**/*', ['images']);
    }
  }
);
