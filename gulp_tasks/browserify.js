'use strict';

/* browserify task
   ---------------
   Bundle javascripty things with browserify!

   This task is set up to generate multiple separate bundles, from
   different sources, and to use Watchify when run from the default task.

   See browserify.bundleConfigs in gulp/config.js
*/

var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var browserify = require('browserify');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

var bundleLogger = require(__dirname + '/_utilities/bundleLogger');
var handleErrors = require(__dirname + '/_utilities/handleErrors');

var config = require(__dirname + '/_utilities/config').browserify;

var browserifyTransform = [
  'jadeify',
  'debowerify',
  'decomponentify',
  // this transform is not working right now, something is breaking the process (a semicolon somewhere...)
  // 'deamdify',
  'deglobalify',
  'es6ify'
];

if (environment === 'production') {
  browserifyTransform.push('uglifyify');
}

gulp.task('browserify', function(callback) {

  var bundleQueue = config.bundleConfigs.length;

  var browserifyThis = function(bundleConfig) {

    var bundler = browserify({
      // Required watchify args
      cache: {},
      packageCache: {},
      fullPaths: true,
      // Specify the entry point of your app
      entries: bundleConfig.entries,
      // Add file extentions to make optional in your requires
      extensions: config.extensions,
      // Enable source maps!
      debug: config.debug
    });

    bundler.transform = browserifyTransform;

    var bundle = function() {
      bundleLogger.start(bundleConfig.outputName);

      return bundler
        .bundle()
        .on('error', handleErrors)
        .pipe(source(bundleConfig.outputName))
        .pipe(jshint())
        .pipe(gulp.dest(bundleConfig.dest))
        .on('end', reportFinished);
    };

    if(global.isWatching) {
      bundler = watchify(bundler);
      bundler.on('update', bundle);
    }

    var reportFinished = function() {
      bundleLogger.end(bundleConfig.outputName);

      if(bundleQueue) {
        bundleQueue--;
        if(bundleQueue === 0) {
          // If queue is empty, tell gulp the task is complete.
          // https://github.com/gulpjs/gulp/blob/master/docs/API.md#accept-a-callback
          callback();
        }
      }
    };

    return bundle();
  };

  config.bundleConfigs.forEach(browserifyThis);
});
