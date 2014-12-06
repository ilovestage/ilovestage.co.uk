var gulp = require('gulp');

var buildTasks = ['application'];

if(global.applicationType === 'website') {
  buildTasks.push(
    'js',
    'sass',
    'browserify',
    'images'
  );
}

gulp.task(
  'build',
  buildTasks
);
