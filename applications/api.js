'use strict';

var packageJson = require(__dirname + '/../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var koa = require('koa');
var mount = require('koa-mount');
var router = require('koa-router');
var ua = require('universal-analytics');

var visitor = ua(packageJson.config.applications.api.googleanalytics.key);

var app = koa();

app.use(router(app));

app.use(function* (next) {
  if(environment !== 'development') {
    visitor.pageview(this.request.originalUrl, function (err) {
      console.log('err', err);
    });
  }

  yield next;
});

app.use(mount('/v1', require(__dirname + '/api/v1')));
// app.use(mount('/v2', require(__dirname + '/api/v2')));

app.redirect('/', '/v1');

module.exports = app;
