'use strict';

var packageJson = require(__dirname + '/package.json');

var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
var config = packageJson.config.environment[environment];

var argv = require('yargs').argv;

var requireDir = require('require-dir');
var dir = null;

// console.log('argv', argv);

switch(argv.application) {
  case 'admin':
    console.log('Building admin application.');
    dir = requireDir('./tasks/admin');
  break;
  case 'api':
    console.log('Building api application.');
    dir = requireDir('./tasks/api');
  break;
  case 'socket':
    console.log('Building socket application.');
    dir = requireDir('./tasks/socket');
  break;
  case 'www':
    console.log('Building www application.');
    dir = requireDir('./tasks/www');
  break;
}
