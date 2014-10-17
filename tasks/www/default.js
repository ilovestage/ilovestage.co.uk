'use strict';

var gulp = require('gulp');

gulp.task(
  'default',
  [
    'html',
    'images',
    'scripts',
    'sprites',
    'styles',
    'serve'
  ]
);
