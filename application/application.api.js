'use strict';

var auth = require('koa-basic-auth');
var bodyParser = require('koa-bodyparser');
var conditional = require('koa-conditional-get');
var etag = require('koa-etag');
var fresh = require('koa-fresh');
var gzip = require('koa-gzip');
var health = require('koa-ping');
var helmet = require('koa-helmet');
var mount = require('koa-mount');
var Qs = require('qs');
var responseTime = require('koa-response-time');
// var session = require('koa-generic-session');

// var authorization = require('application/functions/authorization');
// var Logger = require('application/functions/logger');
var Messages = require('application/functions/messages');

// var authentication = require('application/generators/authentication');

var body = require('application/middleware/body');
var authSetup = require('application/middleware/authSetup');
var response = require('application/middleware/response');

module.exports = function Api(configuration, app, router, db, models, routes) {
  // var logger = new Logger(configuration, app);

  app.version = configuration.version;

  app.use(responseTime());
  app.use(helmet.defaults());
  app.use(health());
  app.use(bodyParser());
  // app.use(session());

  app.use(function* (next) {
    this.locals = this.locals || {};
    this.locals.db = db;
    this.locals.models = models;
    this.locals.body = {};
    this.locals.lang = (typeof this.query.lang !== 'undefined') ? this.query.lang : 'en';
    this.locals.messages = new Messages(this.locals.lang);
    this.locals.querystringParameters = Qs.parse(this.querystring);

    yield next;
  });

  app.use(auth(configuration.global.http.auth));
  app.use(authSetup());

  app.use(body());
  app.use(router(app));

  app.get('/', function* (next) {
    if (this.request.originalUrl === '/') {
      this.locals.message = configuration.name + ' API';
    } else {
      this.locals.message = configuration.name + ' API version ' + app.version;
    }

    this.locals.status = 200;
    yield next;
  });

  if (routes) {
    var routesArray = routes.toArray();
    for (var i = 0; i < routesArray.length; i++) {
      try {
        // throw 'thrown message';
        var noun = new routesArray[i](configuration, router, db, models);
        app.use(mount('/' + noun.name, noun.middleware()));
      } catch (error) {
        console.log(error, routesArray[i]);
      }
    }
  }

  app.use(response());
  app.use(conditional());
  app.use(gzip());
  app.use(fresh());
  app.use(etag());

  return app;
};
