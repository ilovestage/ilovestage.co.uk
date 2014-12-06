'use strict';

var argv = require('yargs').argv;
var requireDir = require('require-dir');

if (argv.application) {
  console.log('Building ' + argv.application + ' application.');

  switch (argv.application) {
    case 'admin':
      global.applicationType = 'website';
    break;
    case 'api':
      global.applicationType = 'service';
    break;
    case 'cron':
      global.applicationType = 'job';
    break;
    case 'importer':
      global.applicationType = 'job';
    break;
    case 'socket':
      global.applicationType = 'socket';
    break;
    case 'www':
      global.applicationType = 'website';
    break;
  }

  requireDir(
    './gulp_tasks',
    {
      recurse: true
    }
  );
} else {
  console.log('No application defined.');
  process.exit();
}
