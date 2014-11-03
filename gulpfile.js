'use strict';

var argv = require('yargs').argv;
var requireDir = require('require-dir');

console.log('Building ' + argv.application + ' application.');

requireDir(
  './tasks/' + argv.application,
  {
    recurse: true
  }
);
