var packageJson = require(__dirname + '/package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

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
  // Fork workers.
  for (var i = 0, n = os.cpus().length; i &lt; n; i += 1)
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    // When any of the workers die the cluster module will emit the 'exit' event.
    // This can be used to restart the worker by calling .fork() again.
    console.log('worker ' + worker.process.pid + ' died');
    cluster.fork();
  });
} else {
  // set koa to listen on specified port
  if (!module.parent) {
    // app.listen(config.server.koa.port);
    app.listen(process.env.PORT);

    // console.info('main Koa application now running on http://localhost:' + config.server.koa.port);
    console.info('main Koa application now running on http://localhost:' + process.env.PORT);
  }
}
