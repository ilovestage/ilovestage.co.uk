'use strict';

function appListen(port) {
  console.log('Detected process is running on port ' + port + '.');
  app.listen(port);
}

var argv = require('yargs').argv;
var debug = require('debug');
var koa = require('koa');
var logger = require('koa-logger');
var mount = require('koa-mount');
var router = require('koa-router');

var packageJson = require(__dirname + '/package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
var port = process.env.PORT ? process.env.PORT : packageJson.config.applications[argv.application].app.port;

var app = koa();

var application = null;

// wrap subsequent middleware in a logger
// app.use(logger()); // very verbose

debug('booting');

app.keys = [packageJson.config.redis.key];
// app.keys = ['some secret hurr'];

// use logger
app.use(function *(next) {
  var start = new Date();
  var ms = new Date() - start;
  console.log('%s %s - %s', this.method, this.url, ms);
  // console.log(this, this.request, this.response);
  // console.log(this.request.header);
  yield next;
});

if(environment === 'production') {
  app.use(forceSSL());
}

// use koa-router
app.use(router(app));

app.poweredBy = false;

app.name = argv.application;

console.log('Requiring ' + argv.application + ' application.');

application = require(__dirname + '/applications/' + argv.application);

switch(argv.application) {
  case 'admin':
    app.use(mount('/', application));
    appListen(port);
  break;
  case 'api':
    app.use(mount('/', application));
    appListen(port);
  break;
  case 'cron':

  break;
  case 'importer':

  break;
  case 'socket':
    appListen(port);
  break;
  case 'www':
    app.use(mount('/', application));
    appListen(port);
  break;
}
