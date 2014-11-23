'use strict';

var argv = require('yargs').argv;
var browserSync = require('browser-sync');
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

var packageJson = require(__dirname + '/../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var portDebug = packageJson.config.applications[argv.application].debug.port;

var BROWSER_SYNC_RELOAD_DELAY = 1500;

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
      env: {
        'DEBUG': 'monk:*'
      },
      ext: 'js html',
      nodeArgs: ['--debug=' + portDebug],
      ignore: [
        '.git/',
        // 'gulpfile.js',
        'node_modules/'
      ]
      // ,
      // watch: [
      //   'app.js',
      //   'applications/' + argv.application + '.js',
      //   'applications/' + argv.application + '/**/*.js',
      //   'applications/_utilities/**/*.js',
      //   'source/' + argv.application + '/views/**/*.html',
      //   'source/_utilities/views/**/*.html'
      // ]
    }
  )
  .on(
    'start',
    function () {
      console.log('nodemon started');
      if (!called) {
        called = true;
        cb();
      }
    }
  )
  .on(
    'change',
    function (files) {
      console.log('Files changed: ', files);
    }
  )
  .on(
    'restart',
    function (files) {
      console.log('App restarted due to: ', files);
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
  )
  .on(
    'quit',
    function () {
      console.log('App has quit');
    }
  );
});
