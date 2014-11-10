'use strict';

var packageJson = require(__dirname + '/../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var argv = require('yargs').argv;
var gulp = require('gulp');
var browserSync = require('browser-sync');

var portStart = packageJson.config.applications[argv.application].port.start;
var portEnd = packageJson.config.applications[argv.application].port.end;

var portBrowserSync = packageJson.config.applications[argv.application].browsersync.port;

var config = require(__dirname + '/_utilities/config').browserSync;

config.proxy = 'http://localhost:' + portStart;

// config.proxy = {
//   host: 'http://localhost',
//   port: portStart
// }

config.port = portBrowserSync;

// config.files.push(
//   'applications/' + argv.application + '.js',
//   'applications/' + argv.application + '/**/*.js',
//   'source/' + argv.application + '/views/**/*.html'
// );

gulp.task(
  'browser-sync',
  [
    'build',
    'nodemon'
  ],
  function() {
    // browserSync(config);
    browserSync.init(config);
  }
);
