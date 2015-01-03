'use strict';

var mount = require('koa-mount');
var requiredir = require('requiredir');
var router = require('koa-router');

var Api = require('application/application.api');
var Web = require('application/application.web');

var Database = require('application/functions/database');

module.exports = function ApiVersion(configuration) {
  var db = new Database(configuration.database);

  var models = requiredir(__dirname + '/models');
  var routes = requiredir(__dirname + '/routes');

  var appMain = new Web(configuration);
  var appApi = new Web(configuration);

  var apiMain = new Api(configuration, appMain, router);
  var apiVersion = new Api(configuration, appApi, router, db, routes, models);

  var route = '/' + configuration.version;

  apiMain.use(mount(route, apiVersion));

  apiMain.use(function* (next) {
    console.log(this.request.originalUrl);
    yield next;
  });

  apiMain.listen(configuration.port.http);

  return apiMain;
};
