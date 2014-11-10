'use strict';

/* Notes:
  - gulp/tasks/browserify.js handles js recompiling with watchify
  - gulp/tasks/browserSync.js watches and reloads compiled files
*/

var gulp = require('gulp');

var directory = require(__dirname + '/_utilities/directory');

gulp.task(
  'watch',
  [
    'browser-sync'
  ],
  function() {
    global.isWatching = true;

    gulp.watch(directory.source + '/styles', ['sass']);
    gulp.watch(directory.source + '/images', ['images']);
    gulp.watch(directory.source + '/views', ['markup']);
    gulp.watch(directory.source + '/scripts', ['scripts']);
    gulp.watch(directory.source + '/sprites', ['sprites']);
  }
);
