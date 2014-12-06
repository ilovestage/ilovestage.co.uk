'use strict';

var argv = require('yargs').argv;
var browserSync = require('browser-sync');
var gulp = require('gulp');

var packageJson = require(__dirname + '/../package.json');

var port = {};
port.http = process.env.PORT ? process.env.PORT : packageJson.config.applications[argv.application].http.port;
port.browserSync = packageJson.config.applications[argv.application].browsersync.port;

var config = require(__dirname + '/_utilities/config').browserSync;

config.proxy = 'http://localhost:' + port.http;

config.port = port.browserSync;

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
