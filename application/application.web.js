'use strict';

var cors = require('koa-cors');
// var forceSSL = require('koa-force-ssl');
// var http = require('http');
// var https = require('https');
var koa = require('koa');
// var mount = require('koa-mount');
// var router = require('koa-router');
var ua = require('universal-analytics');

module.exports = function Application(configuration, parentApp) {
  // var optionsSSL;

  var app = koa();
  var visitor = ua(configuration.global.applications.api.googleanalytics.key);

  app.keys = [configuration.global.redis.key];
  app.name = configuration.application;
  app.poweredBy = false;

  app.use(function* (next) {
    this.locals = this.locals || {};
    yield next;
  });

  app.use(cors());

  // app.use(router(app));

  // if (environment === 'production') {
  //   optionsSSL = {
  //     key: fs.readFileSync('server.key'),
  //     cert: fs.readFileSync('server.crt')
  //   };
  //
  //   app.use(forceSSL());
  // }

  app.use(function* (next) {
    if (configuration.environment !== 'development') {
      visitor.pageview(this.request.originalUrl, function(err) {
        console.log('err', err);
      });
    }

    yield next;
  });

  // if (parentApp) {
  //   var route = '/' + configuration.version;
  //
  //   parentApp.use(mount(route, app));
  //   console.log('Mounted to parent application');
  // } else {
  //   if (configuration.environment === 'production') {
  //     http.createServer(app.callback()).listen(configuration.port.http);
  //     // https.createServer(optionsSSL, app.callback()).listen(configuration.port.https);
  //     // console.log('Process running on ports ' + configuration.port.http + ' and ' + configuration.port.https +'.');
  //   } else {
  //     console.log('Process running on port ' + configuration.port.http + '.');
  //     app.listen(configuration.port.http);
  //   }
  // }

  // var url = 'http://localhost:' + configuration.port.http + '/' + configuration.version;
  // console.log('Application ' + configuration.application + ' available at ' + url);

  return app;
};
