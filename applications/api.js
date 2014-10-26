'use strict';

var packageJson = require(__dirname + '/../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var koa = require('koa');
var mount = require('koa-mount');
var router = require('koa-router');
var ua = require('universal-analytics');

var visitor = ua(packageJson.config.applications.api.googleanalytics.key);

var api = [];
api.v1 = require(__dirname + '/api/v1');
api.v2 = require(__dirname + '/api/v2');

var app = koa();

app.use(router(app));

if(environment !== 'development') {
  app.use(function* (next) {
    visitor.pageview(this.request.originalUrl, function (err) {
      console.log('err', err);
    });
    yield next;
  });
}

app.use(mount('/v1', api.v1));
// app.use(mount('/v2', api.v2));

app.redirect('/', '/v1');

module.exports = app;
