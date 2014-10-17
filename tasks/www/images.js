'use strict';

var browserSync = require('browser-sync');
var changed = require('gulp-changed');
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
// var notify = require('gulp-notify');
var path = require('path');
// var pngcrush = require('imagemin-pngcrush');

var reload = browserSync.reload;

var directory = {};
directory.source = path.resolve(__dirname + '/../../source/www');
directory.destination = path.resolve(__dirname + '/../../build/www');

gulp.task('images', function() {
  return gulp.src(directory.source + '/images/**/*.{gif,jpg,png}')
  .pipe(changed(directory.source))
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
  .pipe(gulp.dest(directory.destination + '/images'))
  .pipe(
    reload({
      stream:true
    })
  );
  // .pipe(
  //   notify({
  //     message: 'images task completed on <%= options.date %>',
  //     templateOptions: {
  //       date: new Date()
  //     }
  //   })
  // );
});
