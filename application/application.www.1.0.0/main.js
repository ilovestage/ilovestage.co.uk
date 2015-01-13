'use strict';

var _ = require('lodash');
// var _.str = require('underscore.string');
// var argv = require('yargs').argv;
// var bodyParser = require('koa-bodyparser');
// var email = require('_utilities/email');
// var mount = require('koa-mount');
// var passport = require('koa-passport');
// var qs = require('koa-qs');
var requiredir = require('requiredir');
var router = require('koa-router');
// var session = require('koa-generic-session');
// var redisStore = require('koa-redis');
var views = require('co-views');

var Www = require('application/application.www');
var Web = require('application/application.web');

var Database = require('application/functions/database');

// var passsport = require('application/utilities/passport');

module.exports = function WwwVersion(configuration) {
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

  var viewPath = __dirname + '/source/views';

  console.log(viewPath);

  var render = views(viewPath, {
    cache: true,

    map: {
      html: 'ejs'
    }
  });

  var appMain = new Web(configuration);
  // var appVersion = new Web(configuration);

  var wwwMain = new Www(configurationMain, appMain, router, db, models, routes, render);
  // var wwwVersion = new Www(configurationVersion, appVersion, router, render, db, models, routes);

  // var route = '/' + configuration.version;

  // wwwMain.use(mount(route, wwwVersion));
  // wwwMain.use(mount(route, wwwMain));

  // wwwMain.use(function* (next) {
  //   console.log('application.www.1.0.0: ', this.request.originalUrl);
  //   yield next;
  // });

  wwwMain.listen(configuration.port.http);
  console.log('Application listening on port:', configuration.port.http);

  return wwwMain;
};
