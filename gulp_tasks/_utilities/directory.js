'use strict';

var argv = require('yargs').argv;
var path = require('path');

var application = argv.application;

var directory = {};

directory.source = path.resolve(__dirname + '/../../source/' + application);
directory.destination = path.resolve(__dirname + '/../../build/' + application);
directory.utilities = path.resolve(__dirname + '/../../source/_utilities');
directory.bower_components = path.resolve(__dirname + '/../../bower_components');
directory.node_modules = path.resolve(__dirname + '/../../node_modules');

module.exports = directory;
