'use strict';

var browserSync = require('browser-sync');
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('nodemon', function (cb) {
  var called = false;

  return nodemon(
    {
      script: 'app.js',
      app: '',
      ignore: [
        'gulpfile.js',
        'node_modules/'
      ]
    }
  )
  .on(
    'start',
    function () {
      if (!called) {
        called = true;
        cb();
      }
    }
  )
  .on(
    'restart',
    function () {
      setTimeout(
        function () {
          browserSync.reload(
            {
              stream: false
            }
          );
        },
        1000
      );
    }
  );
});
