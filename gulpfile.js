'use strict';

var argv = require('yargs').argv;
var requireDir = require('require-dir');

if(argv.application) {
  console.log('Building ' + argv.application + ' application.');

  requireDir(
    './tasks',
    {
      recurse: true
    }
  );
} else {
  console.log('No application defined.');
  process.exit();
}
