'use strict';

require('app-module-path').addPath(__dirname + '/custom_modules');
require('app-module-path').addPath(__dirname);

var argv = require('yargs').argv;
var debug = require('debug');

var manifest = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var configuration = {
  name: manifest.name,
  environment: environment,
  global: manifest.config,
  application: argv.application,
  version: argv.version,
  database: manifest.config.environment[environment].server.database,
  port: {
    http: (process.env.PORT ? process.env.PORT : manifest.config.applications[argv.application].http.port),
    https: (process.env.PORT ? process.env.PORT : manifest.config.applications[argv.application].https.port)
  }
};

var applicationPath = 'application/application.';

if (configuration.application) {
  console.log('Running ' + configuration.application + ' application.');

  if (configuration.version) {
    applicationPath += configuration.application + '.' + configuration.version;
    console.log('Running version ' + configuration.version + ' of application.');
  } else {
    applicationPath += configuration.application;
    console.log('No version of application defined.');
  }

  var Application = require(applicationPath);
  var application = new Application(configuration);

  debug('booting %s', configuration.application);
} else {
  console.log('No application defined');
}
