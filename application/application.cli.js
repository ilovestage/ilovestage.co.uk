'use strict';

// var session = require('koa-generic-session');

// var Logger = require('application/functions/logger');

module.exports = function ApplicationCli(configuration, app, db, models) {
  // var logger = new Logger(configuration, app);

  app.version = configuration.version;

  return app;
};
