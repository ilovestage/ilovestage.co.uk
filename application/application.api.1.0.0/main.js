'use strict';

var _ = require('lodash');
var mount = require('koa-mount');
var requiredir = require('requiredir');
var router = require('koa-router');

var ApplicationApi = require('application/application.api');
var ApplicationWeb = require('application/application.web');

var Database = require('application/functions/database');

module.exports = function ApiVersion(configuration) {
  var db = new Database(configuration.database);

  var configurationMain = {};
  var configurationVersion = {};

  _.merge(configurationMain, configuration, {
    type: 'main'
  });

  _.merge(configurationVersion, configuration, {
    type: 'version'
  });

  var models = requiredir(__dirname + '/../models');
  var routes = requiredir(__dirname + '/routes');

  var appMain = new ApplicationWeb(configuration);
  var appVersion = new ApplicationWeb(configuration);

  var apiMain = new ApplicationApi(configurationMain, appMain, router, db, models);
  var apiVersion = new ApplicationApi(configurationVersion, appVersion, router, db, models, routes);

  var route = '/' + configuration.version;

  apiMain.use(mount(route, apiVersion));

  // apiMain.use(function* (next) {
  //   console.log('application.api.1.0.0: ', this.request.originalUrl);
  //   yield next;
  // });

  apiMain.listen(configuration.port.http);
  console.log('Application listening on port:', configuration.port.http);

  return apiMain;
};
