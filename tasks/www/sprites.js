'use strict';

var changed = require('gulp-changed');
var gulp = require('gulp');
var path = require('path');
var spritesmith = require('gulp-spritesmith');

var directory = {};
directory.source = path.resolve(__dirname + '/../../source/www');
directory.destination = path.resolve(__dirname + '/../../build/www');

gulp.task('sprites', function() {
  return gulp.src(directory.source + '/images/icons/**/*.png')
  .pipe(changed(directory.source))
  .pipe(
    spritesmith({
      destImg: directory.destination + '/images/icons/sprite.png',
      destCSS: directory.destination + '/styles/sprite.css'
    })
  );
});
