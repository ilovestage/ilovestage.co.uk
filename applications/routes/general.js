'use strict';

var packageJson = require(__dirname + '/../../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var _ = require('lodash');
var koa = require('koa');
var router = require('koa-router');
var views = require('co-views');

var app = koa();

// logger
app.use(function *(next) {
  // var start = new Date;
  yield next;
  // var ms = new Date - start;
  // console.log('%s %s - %s', this.method, this.url, ms);
});

// use koa-router
app.use(router(app));

var render = views('source/views', {
  cache: true,
  map: {
    html: 'ejs'
  }
});

var defaults = {
  lang: 'en',
  // packageJson: packageJson,
  config: config,
  ngApp: 'general'
};

module.exports = app;
