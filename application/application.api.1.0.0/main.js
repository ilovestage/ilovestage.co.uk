'use strict';

var _ = require('lodash');
var mount = require('koa-mount');
var requiredir = require('requiredir');
var router = require('koa-router');

var Api = require('application/application.api');
var Web = require('application/application.web');

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

  var models = requiredir(__dirname + '/models');
  var routes = requiredir(__dirname + '/routes');

  var appMain = new Web(configuration);
  var appVersion = new Web(configuration);

  var apiMain = new Api(configurationMain, appMain, router, db, models);
  var apiVersion = new Api(configurationVersion, appVersion, router, db, models, routes);

  var route = '/' + configuration.version;

  apiMain.use(mount(route, apiVersion));

  // apiMain.use(function* (next) {
  //   console.log('application.api.1.0.0: ', this.request.originalUrl);
  //   yield next;
  // });

  apiMain.listen(configuration.port.http);

  return apiMain;
};
