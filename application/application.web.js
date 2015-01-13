'use strict';

var cors = require('koa-cors');
var etag = require('koa-etag');
// var forceSSL = require('koa-force-ssl');
var fresh = require('koa-fresh');
// var http = require('http');
// var https = require('https');
var gzip = require('koa-gzip');
var koa = require('koa');
// var mount = require('koa-mount');
var Qs = require('qs');
var responseTime = require('koa-response-time');
var router = require('koa-router');
var ua = require('universal-analytics');

// var authentication = require('application/generators/authentication');

// var authorization = require('application/functions/authorization');
// var Logger = require('application/functions/logger');
var Messages = require('application/functions/messages');

module.exports = function Application(configuration) {
  var app = koa();
  var visitor = ua(configuration.global.applications.api.googleanalytics.key);

  app.keys = [configuration.global.redis.key];
  app.name = configuration.application;
  app.poweredBy = false;

  app.use(responseTime());
  app.use(cors());

  // var optionsSSL;
  //
  // if (environment === 'production') {
  //   optionsSSL = {
  //     key: fs.readFileSync('server.key'),
  //     cert: fs.readFileSync('server.crt')
  //   };
  //
  //   app.use(forceSSL());
  // }

  app.use(function* (next) {
    this.locals = this.locals || {};
    this.locals.body = {};
    this.locals.date = new Date();
    this.locals.lang = (typeof this.query.lang !== 'undefined') ? this.query.lang : 'en';
    this.locals.messages = new Messages(this.locals.lang);
    this.locals.querystringParameters = Qs.parse(this.querystring);

    yield next;
  });

  app.use(function* (next) {
    this.locals = this.locals || {};
    yield next;
  });

  app.use(function* (next) {
    if (configuration.environment !== 'development') {
      visitor.pageview(this.request.originalUrl, function(err) {
        console.log('err', err);
      });
    }

    yield next;
  });

  app.use(router(app));

  app.use(gzip());
  app.use(fresh());
  app.use(etag());

  return app;
};
