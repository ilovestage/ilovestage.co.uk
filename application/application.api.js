'use strict';

var auth = require('koa-basic-auth');
var bodyParser = require('koa-bodyparser');
var conditional = require('koa-conditional-get');
// var deleteKey = require('key-del');
// var DJ = require('dot-object');
var etag = require('koa-etag');
var fresh = require('koa-fresh');
var gzip = require('koa-gzip');
var health = require('koa-ping');
var helmet = require('koa-helmet');
// var js2xmlparser = require('js2xmlparser');
// var koa = require('koa');
// var moment = require('moment');
var mount = require('koa-mount');
// var qs = require('koa-qs');
var Qs = require('qs');
var responseTime = require('koa-response-time');
// var router = require('koa-router');
// var session = require('koa-generic-session');

// var ApplicationGeneral = require('application/application.general');
// var ApplicationWeb = require('application/application.web');

// var mongo = require('application/utilities/mongo');

var authentication = require('application/generators/authentication');

var authorization = require('application/functions/authorization');
// var Database = require('application/functions/database');
// var Logger = require('application/functions/logger');
var Messages = require('application/functions/messages');
// var Router = require('application/functions/router');

var body = require('application/middleware/body');
var response = require('application/middleware/response');

// var dj = new DJ();

module.exports = function Api(configuration, app, router, db, routes, models) {
  // configuration.mount = true;
  // configuration.listen = true;

  // var appGeneral = new ApplicationGeneral(configuration);
  // var app = new ApplicationWeb(configuration, appBasic);
  // var db = new Database(configuration.database);
  // var logger = new Logger(configuration, app);
  // var messages = new Messages(language);
  // var routes = new Router(configuration, app, db, routes, messages);

  app.version = configuration.version;

  app.use(responseTime());
  app.use(helmet.defaults());
  app.use(health());
  app.use(bodyParser());
  // app.use(session());
  // qs(app);

  app.use(function* (next) {
    this.locals.body = {};
    this.locals.lang = (typeof this.query.lang !== 'undefined') ? this.query.lang : 'en';
    // this.locals.message = null;
    this.locals.messages = new Messages(this.locals.lang);
    this.locals.querystringParameters = Qs.parse(this.querystring);

    yield next;
  });

  if ((configuration.environment !== 'development') && (this.locals.bypassAuthentication !== true)) {
    app.use(auth(configuration.http.auth));
    app.use(authentication());
    app.use(authorization());
  }

  app.use(body());
  app.use(router(app));

  app.get('/', function* (next) {
    this.locals.message = configuration.name + ' API version ' + app.version;
    this.locals.status = 200;
    yield next;
  });

  if (routes) {
    var routesArray = routes.toArray();
    for (var i = 0; i < routesArray.length; i++) {
      var noun = new routesArray[i](configuration, router, db, models);
      app.use(mount('/' + noun.name, noun.middleware()));
    }
  }

  app.use(response());
  app.use(conditional());
  app.use(gzip());
  app.use(fresh());
  app.use(etag());

  return app;
};
