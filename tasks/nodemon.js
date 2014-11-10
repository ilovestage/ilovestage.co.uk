'use strict';

var argv = require('yargs').argv;
var browserSync = require('browser-sync');
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('nodemon', function (cb) {
  var called = false;

  return nodemon(
    {
      // exec: 'node',
      script: 'app.js',
      // execArgs: ['--application ' + argv.application],
      // args: ['-exec', '-- --application ' + argv.application],
      args: ['--application', argv.application, '--debug'],
      // args: '--application www',
      // args: argv,
      // application: argv.application,
      ignore: [
        'gulpfile.js',
        'node_modules/'
      ]
    }
  )
  .on(
    'start',
    function () {
      console.log('nodemon started', argv);
      // if (!called) {
      //   called = true;
      //   cb();
      // }
    }
  )
  .on(
    'restart',
    function () {
      console.log('nodemon restarted', argv);
      // setTimeout(
      //   function () {
      //     browserSync.reload(
      //       {
      //         stream: false
      //       }
      //     );
      //   },
      //   1000
      // );
    }
  );
});
