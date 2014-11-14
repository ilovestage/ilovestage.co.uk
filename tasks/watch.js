'use strict';

/* Notes:
  - gulp/tasks/browserify.js handles js recompiling with watchify
  - gulp/tasks/browserSync.js watches and reloads compiled files
*/

var browserSync = require('browser-sync');
var gulp = require('gulp');

var directory = require(__dirname + '/_utilities/directory');

gulp.task(
  'watch',
  [
    'browser-sync'
  ],
  function() {
    global.isWatching = true;

    // gulp.watch(directory.source + '/views/**/*.html', ['markup']);
    gulp.watch(directory.source + '/scripts/**/*.js', ['browserify']);
    gulp.watch(directory.source + '/styles/**/*.scss', ['sass']);
    gulp.watch(directory.source + '/sprites/**/*', ['sprites']);
    gulp.watch(directory.source + '/images/**/*', ['images']);
  }
);
