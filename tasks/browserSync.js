'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');

var config = require(__dirname + '/_utilities/config').browserSync;

gulp.task(
  'browserSync',
  [
    'build',
    'nodemon'
  ],
  function() {
  browserSync(config);
});
