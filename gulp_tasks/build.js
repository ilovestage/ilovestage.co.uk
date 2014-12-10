var gulp = require('gulp');

var buildTasks = ['application'];

if (global.applicationType === 'website') {
  buildTasks.push(
    'js',
    'sass',
    'browserify',
    'images'
  );
}
//  else if (global.applicationType === 'test') {
//   buildTasks.push(
//     'test'
//   );
// }

// buildTasks.push('test');

gulp.task(
  'build',
  buildTasks
);
