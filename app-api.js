var packageJson = require(__dirname + '/package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];
var port = process.env.PORT ? process.env.PORT : config.server.koa.port;

// var open = require('open');
// var http = require('http');
var cluster = require('cluster');
var os = require('os');
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
  // console.log('%s %s - %s', this.method, this.url, ms);

  // console.log(this, this.request, this.response);
  // console.log(this.request.header);
});

// use koa-router
app.use(router(app));

// mount applications
app.use(mount('/', applications.api));

// setup session
app.keys = ['secrets'];
app.use(session());

// setup clustering
if (cluster.isMaster) {
  // Fork workers
  for (var i = 0, n = os.cpus().length; i < n; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    // When any of the workers die the cluster module will emit the 'exit' event.
    // This can be used to restart the worker by calling .fork() again.
    console.log('Worker ' + worker.process.pid + ' died');
    cluster.fork();
  });

  cluster.on('fork', function(worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' forked');
  });

  cluster.on('online', function(worker, code, signal) {
    console.log('Worker ' + worker.process.pid + '  responded after it was forked');
  });

  console.info('Main application now running on http://localhost:' + port);
} else {
  if (!module.parent) {
    // set koa to listen on specified port
    app.listen(port);
  }
}
