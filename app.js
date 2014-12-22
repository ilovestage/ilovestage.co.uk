'use strict';

function Application(configuration) {
  // var forceSSL = require('koa-force-ssl');
  var http = require('http');
  // var https = require('https');
  var koa = require('koa');

  // var optionsSSL;

  var app = koa();

  app.keys = [configuration.global.redis.key];
  app.name = configuration.application;
  app.poweredBy = false;

  app.use(function* (next) {
    this.locals = this.locals || {};
    yield next;
  });

  // if (environment === 'production') {
  //   optionsSSL = {
  //     key: fs.readFileSync('server.key'),
  //     cert: fs.readFileSync('server.crt')
  //   };
  //
  //   app.use(forceSSL());
  // }

  if (configuration.listen === true) {
    if (environment === 'production') {
      http.createServer(app.callback()).listen(configuration.port.http);
      // https.createServer(optionsSSL, app.callback()).listen(configuration.port.https);
      // console.log('Detected process is running on port ' + configuration.port.http + ' and ' + configuration.port.https +'.');
    } else {
      console.log('Detected process is running on port ' + configuration.port.http + '.');
      app.listen(configuration.port.http);
    }
  }

  return app;
}

function Database(configuration) {
  var mongo = require('_utilities/mongo');

  var DB = require('mongodb-next');
  var db = DB(mongo.connectionString(configuration));

  db.connect.then(function() {
    db.collection('users').find({}).then(function(docs) {
      console.log('docs', docs);
    });
  });

  return db;
}

function Router(configuration, app, db) {
  var mount = require('koa-mount');
  var router = require('koa-router');

  console.log('Requiring ' + configuration.application + ' application routers.');

  app.use(router(app));

  if (configuration.mount === true) {
    app.use(mount('/', require(__dirname + '/applications/' + configuration.application)));
  }

  app.use(function* (next) {
    var docs = yield db.collection('users').find({});
    console.log('docs', docs);

    yield next;
  });

  return router;
}

require('app-module-path').addPath(__dirname + '/applications');
require('app-module-path').addPath(__dirname);

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var argv = require('yargs').argv;
// var debug = require('debug');
// var logger = require('koa-logger');

var configuration = {
  global: packageJson.config,
  application: argv.application,
  database: packageJson.config.environment[environment].server.database,
  port: {
    http: (process.env.PORT ? process.env.PORT : packageJson.config.applications[argv.application].http.port),
    https: (process.env.PORT ? process.env.PORT : packageJson.config.applications[argv.application].https.port)
  }
};

switch (argv.application) {
  case 'admin':
    configuration.mount = true;
    configuration.listen = true;
  break;
  case 'api':
    configuration.mount = true;
    configuration.listen = true;
  break;
  case 'cron':
  break;
  case 'importer':

  break;
  case 'socket':
    configuration.listen = true;
  break;
  case 'www':
    configuration.mount = true;
    configuration.listen = true;
  break;
}

var app = new Application(configuration);
var db = new Database(configuration.database);
var routes = new Router(configuration, app, db);

// app.use(logger()); // very verbose
// app.use(function* (next) {
//   var start = new Date();
//   var ms = new Date() - start;
//   console.log('%s %s - %s', this.method, this.url, ms);
//   console.log(this, this.request, this.response);
//   console.log(this.request.header);
//   yield next;
// });
//
// if (typeof process.env.DEBUG !== 'undefined') {
//   debug('booting %s', app.name);
// }
