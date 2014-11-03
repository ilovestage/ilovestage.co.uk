'use strict';

var changed = require('gulp-changed');
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
// var notify = require('gulp-notify');
// var pngcrush = require('imagemin-pngcrush');
// var sync = require('browser-sync');

var directory = require('../_utilities/directory');

gulp.task('images', function() {
  return gulp.src(directory.source + '/images/**/*.{gif,jpg,png}')
  .pipe(changed(directory.destination + '/images'))
  .pipe(
    imagemin({
      progressive: true,
      svgoPlugins: [{
        removeViewBox: false
      }],
      use: [
        // pngcrush() //broken
      ]
    })
  )
  .pipe(gulp.dest(directory.destination + '/images'));
  // .pipe(
  //   sync.reload({
  //     stream: true,
  //     once: true
  //   })
  // );
  // .pipe(
  //   notify({
  //     message: 'images task completed on <%= options.date %>',
  //     templateOptions: {
  //       date: new Date()
  //     }
  //   })
  // );
});
