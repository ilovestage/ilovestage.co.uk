'use strict';

function appListen() {
  if(environment !== 'development') {
    console.log('Detected staging or production environment.');
    clusterOnAvailablePort();
  } else {
    console.log('Detected development environment on port ' + portStart + '.');
    app.listen(portStart);
  }
}

function clusterOnAvailablePort() {
  portscanner.findAPortNotInUse(portStart, portEnd, '127.0.0.1', function(error, availabePort) {
    var port = availabePort;
    console.log('Available port at ' + port);
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
        console.log('Worker ' + worker.process.pid + ' responded after it was forked');
      });

      console.info('Main application now running on http://localhost:' + port);
    } else {
      if (!module.parent) {
        // set koa to listen on specified port
        app.listen(port);
      }
    }
  });
}

function serveAssets() {
  // serve static files
  app.use(serve(__dirname + '/' + packageJson.config.path.build), {
    defer: true
  }); // true web root
  app.use(serve(__dirname + '/' + packageJson.config.path.source), {
    defer: true
  }); // to save copying bower_components, SASS files, etc.
}

var packageJson = require(__dirname + '/package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
var config = packageJson.config.environment[environment];

var portStart = process.env.PORT ? process.env.PORT : config.server.koa.port;
var portEnd = null;

var argv = require('yargs').argv;
var cluster = require('cluster');
// var database = require(__dirname + '/applications/database');
// var http = require('http');
var koa = require('koa');
var logger = require('koa-logger');
var mount = require('koa-mount');
// var open = require('open');
var os = require('os');
var portscanner = require('portscanner');
var router = require('koa-router');
// var session = require('koa-session');
var serve = require('koa-static');

var app = koa();

var application = null;

// wrap subsequent middleware in a logger
// app.use(logger()); // very verbose

// use logger
app.use(function *(next) {
  var start = new Date();
  var ms = new Date() - start;
  console.log('%s %s - %s', this.method, this.url, ms);
  // console.log(this, this.request, this.response);
  // console.log(this.request.header);
  yield next;
});

// use koa-router
app.use(router(app));

app.poweredBy = false;

// setup session
// app.keys = ['secrets'];
// app.use(session());

// mount applications

console.log('Requiring ' + argv.application + ' application.');

switch(argv.application) {
  case 'admin':
    application = require(__dirname + '/applications/admin');
    app.use(mount('/', application));

    portStart = 5100;
    portEnd = 5103;

    serveAssets();
    appListen();
  break;
  case 'api':
    application = require(__dirname + '/applications/api');
    app.use(mount('/', application));

    portStart = 5020;
    portEnd = 5023;

    appListen();
  break;
  case 'cron':
    application = require(__dirname + '/applications/cron');
    // app.use(mount('/', application));
  break;
  case 'socket':
    application = require(__dirname + '/applications/socket');
    // app.use(mount('/', application));

    portStart = 5200;
    portEnd = 5203;

    appListen();
  break;
  case 'www':
    application = require(__dirname + '/applications/www');
    app.use(mount('/', application));

    portStart = 5000;
    portEnd = 5003;

    serveAssets();
    appListen();
  break;
}
