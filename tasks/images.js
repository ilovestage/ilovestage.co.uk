'use strict';

var changed = require('gulp-changed');
var gulp = require('gulp');
// var imagemin = require('gulp-imagemin');
// var pngcrush = require('imagemin-pngcrush');
// var pngquant = require('imagemin-pngquant');

var config = require(__dirname + '/_utilities/config').images;
// var directory = require(__dirname + '/_utilities/directory');

gulp.task('images', function() {
  return gulp.src(config.src)
  // .pipe(changed(config.dest))
  // .pipe(
  //   imagemin({
      // progressive: true,
      // svgoPlugins: [{
      //   removeViewBox: false
      // }]
      // ,
      // use: [
      //   pngquant()
      // ]
  //   })
  // )
  .pipe(gulp.dest(config.dest));
});
