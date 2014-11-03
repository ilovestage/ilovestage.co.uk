'use strict';

var changed = require('gulp-changed');
var gulp = require('gulp');
var spritesmith = require('gulp-spritesmith');
var sync = require('browser-sync');

var directory = require('../_utilities/directory');

gulp.task('sprites', function() {
  return gulp.src(directory.source + '/images/icons/**/*.png')
  .pipe(changed(directory.destination + '/images/sprites'))
  .pipe(
    spritesmith({
      destImg: directory.destination + '/images/sprites/sprite.png',
      destCSS: directory.destination + '/styles/sprite.css'
    })
  )
  .pipe(
    sync.reload({
      stream: true,
      once: true
    })
  );
});
