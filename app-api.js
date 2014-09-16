var packageJson = require(__dirname + '/package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

// var open = require('open');
// var http = require('http');
var koa = require('koa');
var logger = require('koa-logger');
var mount = require('koa-mount');
var router = require('koa-router');
var session = require('koa-session');

var app = koa();

var applications = [];
applications.api = require(__dirname + '/applications/api');

// wrap subsequent middleware in a logger
app.use(logger()); // very verbose

// use logger
app.use(function *(next) {
  'use strict';
  var start = new Date();
  yield next;
  var ms = new Date() - start;
  console.log('%s %s - %s', this.method, this.url, ms);

  console.log(this, this.request, this.response);
  console.log(this.request.header);
});

// use koa-router
app.use(router(app));

// mount applications
app.use(mount('/', applications.api));

// setup session
app.keys = ['secrets'];
app.use(session());

// set koa to listen on specified port
if (!module.parent) {
  app.listen(packageJson.config.server.koa.port); // The app.listen(...) method is simply sugar for the following:
}

console.info('main Koa application now running on http://localhost:' + packageJson.config.server.koa.port);
