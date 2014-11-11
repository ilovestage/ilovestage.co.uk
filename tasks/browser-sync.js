'use strict';

var packageJson = require(__dirname + '/../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var argv = require('yargs').argv;
var browserSync = require('browser-sync');
var gulp = require('gulp');

var portStart = packageJson.config.applications[argv.application].port.start;
var portEnd = packageJson.config.applications[argv.application].port.end;

var portBrowserSync = packageJson.config.applications[argv.application].browsersync.port;

var config = require(__dirname + '/_utilities/config').browserSync;

config.proxy = 'http://localhost:' + portStart;

config.port = portBrowserSync;

gulp.task(
  'browser-sync',
  [
    'build',
    'nodemon'
  ],
  function() {
    browserSync.init(config);
  }
);
