'use strict';

var argv = require('yargs').argv;
var browserSync = require('browser-sync');
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

var BROWSER_SYNC_RELOAD_DELAY = 500;

gulp.task('nodemon', function (cb) {
  var called = false;

  return nodemon(
    {
      // exec: 'node',
      script: 'app.js',
      // execArgs: ['--application ' + argv.application],
      // args: ['-exec', '-- --application ' + argv.application],
      // args: ['--application', argv.application, '--debug'],
      args: ['--application', argv.application],
      // args: '--application www',
      // args: argv,
      // application: argv.application,
      nodeArgs: ['--debug=9999'],
      ignore: [
        '.get/',
        'gulpfile.js',
        'node_modules/'
      ],
      watch: [
        'app.js',
        'applications/' + argv.application + '.js',
        'applications/' + argv.application + '/',
        'applications/_utilities/'
      ]
    }
  )
  .on(
    'start',
    function () {
      // console.log('nodemon started', argv);
      if (!called) {
        called = true;
        cb();
      }
    }
  )
  .on(
    'restart',
    function () {
      // console.log('nodemon restarted', argv);
      setTimeout(
        function () {
          browserSync.reload(
            {
              stream: false
            }
          );
        },
        BROWSER_SYNC_RELOAD_DELAY
      );
    }
  );
});
