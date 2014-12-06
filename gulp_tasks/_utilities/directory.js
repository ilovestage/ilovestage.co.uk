'use strict';

var argv = require('yargs').argv;
var path = require('path');

var application = argv.application;

var directory = {};

directory.application = path.resolve(__dirname + '/../../applications/' + application);
directory.root = path.resolve(__dirname + '/../../');
directory.source = path.resolve(__dirname + '/../../source/' + application);
directory.destination = path.resolve(__dirname + '/../../build/' + application);
directory.utilities = path.resolve(__dirname + '/../../source/_utilities');
directory.bowerComponents = path.resolve(__dirname + '/../../bower_components');
directory.nodeModules = path.resolve(__dirname + '/../../node_modules');

// console.log('directory', directory);

module.exports = directory;
