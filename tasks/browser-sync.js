'use strict';

var argv = require('yargs').argv;
var browserSync = require('browser-sync');
var gulp = require('gulp');

var packageJson = require(__dirname + '/../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
var port = process.env.PORT ? process.env.PORT : packageJson.config.applications[argv.application].app.port;

var port = packageJson.config.applications[argv.application].app.port;

var portBrowserSync = packageJson.config.applications[argv.application].browsersync.port;

var config = require(__dirname + '/_utilities/config').browserSync;

config.proxy = 'http://localhost:' + port;

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
