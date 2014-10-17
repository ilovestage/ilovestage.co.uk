'use strict';

var browserSync = require('browser-sync');
var gulp = require('gulp');
var path = require('path');

var reload = browserSync.reload;

var directory = {};
directory.source = path.resolve(__dirname + '/../../source/www');
directory.destination = path.resolve(__dirname + '/../../build/www');

gulp.task('serve', function() {
  browserSync({
    server: {
      baseDir: directory.destination
    },
    tunnel: true
  });

  // gulp.watch(
  //   [
  //     '**/*.html'
  //   ],
  //   {
  //     cwd: directory.source
  //   },
  //   [
  //     'html',
  //     reload
  //   ]
  // );
  //
  // gulp.watch(
  //   [
  //     'images/**/*',
  //     '!images/icons/**/*',
  //   ],
  //   {
  //     cwd: directory.source
  //   },
  //   [
  //     'images',
  //     reload
  //   ]
  // );
  //
  // gulp.watch(
  //   [
  //     'images/icons/**/*.png',
  //   ],
  //   {
  //     cwd: directory.source
  //   },
  //   [
  //     'sprites',
  //     reload
  //   ]
  // );
  //
  // gulp.watch(
  //   [
  //     'scripts/**/*.js'
  //   ],
  //   {
  //     cwd: directory.source
  //   },
  //   [
  //     'scripts',
  //     reload
  //   ]
  // );
  //
  // gulp.watch(
  //   [
  //     'styles/**/*.scss'
  //   ],
  //   {
  //     cwd: directory.source
  //   },
  //   [
  //     'styles',
  //     reload
  //   ]
  // );

});
