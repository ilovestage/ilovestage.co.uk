'use strict';

var argv = require('yargs').argv;
var path = require('path');

var application = argv.application;

var directory = {};

directory.source = path.resolve(__dirname + '/../../source/' + application);
directory.destination = path.resolve(__dirname + '/../../build/' + application);

module.exports = directory;
