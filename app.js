'use strict';

// require('app-module-path').addPath(__dirname + '/application');
require('app-module-path').addPath(__dirname);

var argv = require('yargs').argv;
var debug = require('debug');
var fs = require('fs');

var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var manifest = require('package.json');

var configuration = {
  name: manifest.name,
  environment: environment,
  global: manifest.config,
  local: manifest.config.environment[environment],
  application: argv.application,
  procedure: argv.procedure,
  version: argv.version,
  database: manifest.config.environment[environment].server.database,
  port: {}
};

if ((argv.application === 'api') || (argv.application === 'web') || (argv.application === 'www')) {
  if (manifest.config.applications[argv.application].http) {
    configuration.port.http = process.env.PORT ? process.env.PORT : manifest.config.applications[argv.application].http.port;
  }

  if (manifest.config.applications[argv.application].https) {
    configuration.port.https = process.env.PORT ? process.env.PORT : manifest.config.applications[argv.application].https.port;
  }
}

// console.log('configuration', configuration);

if (configuration.application) {
  var applicationPath = 'application/application.';

  if (configuration.procedure && configuration.version) {
    applicationPath += configuration.application + '.' + configuration.procedure + '.' + configuration.version;
    console.log('Running version ' + configuration.version + ' of ' + configuration.procedure + ' procedure for ' + configuration.application + ' application.');
  } else if (configuration.version) {
    applicationPath += configuration.application + '.' + configuration.version;
    console.log('Running version ' + configuration.version + ' of ' + configuration.application + ' application.');
  } else {
    applicationPath += configuration.application;
    console.log('Running ' + configuration.application + ' application.  No version defined.');
  }

  if (fs.existsSync(applicationPath + '.js')) {
    console.log('Searching for module:' + applicationPath + '.js');
  } else if (fs.existsSync(applicationPath + '/main.js')) {
    console.log('Searching for module:' + applicationPath + '/main.js');
    applicationPath += '/main.js';
  } else {
    console.log('Cannot find module for version ' + configuration.version + ' of ' + configuration.application + ' application.');
    process.exit();
  }

  var Application = require(applicationPath);

  var application = new Application(configuration);

  console.log('Application environment:', application.env);

  debug('booting %s', configuration.application);
} else {
  console.log('No application defined by command line parameter.');
}
