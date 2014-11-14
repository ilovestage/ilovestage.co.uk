var gulp = require('gulp');

var buildTasks = [];

if(global.applicationType === 'website') {
  buildTasks.push(
    'sass',
    'browserify',
    'images'
  );
}

gulp.task(
  'build',
  buildTasks
);
