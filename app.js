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
  version: argv.version,
  database: manifest.config.environment[environment].server.database,
  port: {
    http: (process.env.PORT ? process.env.PORT : manifest.config.applications[argv.application].http.port),
    https: (process.env.PORT ? process.env.PORT : manifest.config.applications[argv.application].https.port)
  }
};

// console.log('configuration', configuration);

if (configuration.application) {
  var applicationPath = 'application/application.';

  if (configuration.version) {
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

  console.log('Application environment: ', application.env);

  debug('booting %s', configuration.application);
} else {
  console.log('No application defined by command line parameter.');
}
