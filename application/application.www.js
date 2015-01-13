'use strict';

var auth = require('koa-basic-auth');
var bodyParser = require('koa-bodyparser');
var conditional = require('koa-conditional-get');
var etag = require('koa-etag');
var fresh = require('koa-fresh');
var gzip = require('koa-gzip');
// var health = require('koa-ping');
var helmet = require('koa-helmet');
var mount = require('koa-mount');
var Qs = require('qs');
var QsNumbers = require('qs-numbers')(Qs);
var responseTime = require('koa-response-time');
var serve = require('koa-static');
// var session = require('koa-generic-session');

// var Logger = require('application/functions/logger');
var Messages = require('application/functions/messages');
var Operators = require('application/functions/operators');

var body = require('application/middleware/body');
var authSetup = require('application/middleware/authSetup');

module.exports = function Www(configuration, app, router, db, models, routes, render) {
  // var logger = new Logger(configuration, app);

  app.version = configuration.version;

  app.use(responseTime());
  app.use(helmet.defaults());
  // app.use(health());
  app.use(bodyParser());
  // app.use(session());

  if (configuration.type === 'version') {
    app.use(function* (next) {
      this.locals = this.locals || {};
      this.locals.db = this.locals.db || db;
      this.locals.models = this.locals.models || models;
      this.locals.body = this.locals.body || {};
      this.locals.lang = this.locals.lang || (typeof this.query.lang !== 'undefined') ? this.query.lang : 'en';
      this.locals.messages = this.locals.messages || new Messages(this.locals.lang);
      this.locals.querystringParameters = this.locals.querystringParameters || Qs.parse(this.querystring);
      this.locals.queryOperators = this.locals.queryOperators || new Operators(this.locals.querystringParameters);
      yield next;
    });

    app.use(auth(configuration.global.http.auth));
    app.use(authSetup());
  }

  // app.use(session({
  //   store: redisStore({
  //     host: 'session.7vappv.ng.0001.euw1.cache.amazonaws.com',
  //     port: 6379
  //   })
  // }));
  //
  // app.use(passport.initialize());
  // app.use(passport.session());
  //
  // app.use(function *(next) {
  //   this.session.name = 'koa-redis';
  //   yield next;
  // });

  app.use(serve('build/' + configuration.application));

  app.use(function* (next) {
    this.locals.defaults = {
      application: configuration.global.applications[configuration.application],
      url: {
        assets: configuration.local.url.assets
      },
      lang: 'en',
      year: this.locals.date.getFullYear(),
      title: 'I Love Stage',
      description: 'ILOVESTAGE is a great way to find tickets for the top 10 West End shows at affordable group-rate prices.',
      preview: false
    };

    this.locals.defaults.preview = this.query.preview;

    yield next;
  });

  app.use(body());
  app.use(router(app));

  if (routes) {
    var routesArray = routes.toArray();
    for (var i = 0; i < routesArray.length; i++) {
      try {
        // throw 'thrown message';
        var noun = new routesArray[i](configuration, router, db, models, render);

        if (noun.name === 'general') {
          app.use(mount('/', noun.middleware()));
        } else {
          app.use(mount('/' + noun.name, noun.middleware()));
        }
      } catch (error) {
        console.log(error, routesArray[i]);
      }
    }
  }

  app.use(conditional());
  app.use(gzip());
  app.use(fresh());
  app.use(etag());

  if (configuration.environment === 'development') {
    app.use(require('koa-browser-sync')()); // The snippet must be provide by BROWSERSYNC_SNIPPET environment variable
  }

  return app;
};
