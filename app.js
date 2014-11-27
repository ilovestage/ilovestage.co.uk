'use strict';

function appListen(port) {
  if(environment === 'production') {
    http.createServer(app.callback()).listen(port.http);
    // https.createServer(optionsSSL, app.callback()).listen(port.https);
    // console.log('Detected process is running on port ' + port.http + ' and ' + port.https +'.');
  } else {
    console.log('Detected process is running on port ' + port.http + '.');
    app.listen(port.http);
  }
}

var argv = require('yargs').argv;
var debug = require('debug');
var forceSSL = require('koa-force-ssl');
var fs = require('fs');
var http = require('http');
var https = require('https');
var koa = require('koa');
var logger = require('koa-logger');
var mount = require('koa-mount');
var router = require('koa-router');

var packageJson = require(__dirname + '/package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var port = {};
port.http = process.env.PORT ? process.env.PORT : packageJson.config.applications[argv.application].http.port;
port.https = process.env.PORT ? process.env.PORT : packageJson.config.applications[argv.application].https.port;

var optionsSSL;

// if(environment === 'production') {
//   optionsSSL = {
//     key: fs.readFileSync('server.key'),
//     cert: fs.readFileSync('server.crt')
//   };
// }

var app = koa();

console.log('Requiring ' + argv.application + ' application.');

var application = require(__dirname + '/applications/' + argv.application);

// wrap subsequent middleware in a logger
// app.use(logger()); // very verbose

if(typeof process.env.DEBUG !== 'undefined') {
  console.log('process.env.DEBUG', process.env.DEBUG);
}

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

// if(environment === 'production') {
//   app.use(forceSSL());
// }

// use koa-router
app.use(router(app));

app.poweredBy = false;

app.name = argv.application;

debug('booting %s', app.name);

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
