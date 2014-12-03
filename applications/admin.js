'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

// require('./_utilities/auth');

var _ = require('lodash');
// var _.str = require('underscore.string');
var argv = require('yargs').argv;
var bodyParser = require('koa-bodyparser');
var koa = require('koa');
var mount = require('koa-mount');
var passport = require('koa-passport');
var router = require('koa-router');
var serve = require('koa-static');
// var session = require('koa-generic-session');
var session = require('koa-session-redis');
// var redisStore = require('koa-redis');
var views = require('co-views');

var defaults;
var redisConfiguration;

var api = {};

api.version = 1.0;

var app = koa();

app.name = argv.application;

if (environment === 'development') {
  // No options or {init: false}
  // The snippet must be provide by BROWSERSYNC_SNIPPET environment variable
  app.use(require('koa-browser-sync')());
}

app.use(function *(next) {
  var apiUrl = (environment === 'production') ? packageJson.config.environment[environment].url.api : this.request.hostname + ':' + packageJson.config.applications.api.app.port;
  var redisHost = (environment === 'production') ? packageJson.config.environment[environment].server.redis.host : this.request.hostname;

  api.url = apiUrl + '/v' + api.version.toFixed(1);

  redisConfiguration = {
    host: redisHost,
    port: packageJson.config.environment[environment].server.redis.port,
    ttl: 3600
  }

  defaults = {
    application: packageJson.config.applications[argv.application],
    url: {
      api: api,
      assets: packageJson.config.environment[environment].url.assets
    },
    lang: 'en',
    title: 'I Love Stage',
    description: 'I Love Stage'
  };

  yield next;
});

var render = views('source/' + argv.application + '/views', {
  cache: true,

  map: {
    html: 'ejs'
  }
});

app.use(bodyParser());

// app.use(session({
//   store: redisStore(redisConfiguration)
// }));

app.use(session({
    store: redisConfiguration
  }
));

// app.use(passport.initialize());
// app.use(passport.session());

app.use(function *(next) {
  this.session.name = 'koa-redis';
  yield next;
});

app.use(serve('build/' + argv.application));

app.use(mount('/bower_components', app.use(serve('bower_components'))));
app.use(mount('/custom_components', app.use(serve('custom_components'))));

app.use(router(app));

// function *renderEach(name, objs) {
//   var res = yield objs.map(function(obj){
//     var opts = {};
//     opts[name] = obj;
//     return render(name, opts);
//   });
//
//   return res.join('\n');
// }

function *error404(next) {
  var settings = {
    bodyClass: 'error error-404'
  };

  _.merge(settings, defaults);

  this.body = yield render('error-404', settings);
  this.status = 404;
}

function *home(next) {
  var settings = {
    bodyClass: 'home'
  };

  _.merge(settings, defaults);

  // var body = yield renderEach('user', db.users);
  var body = yield render('home', settings);

  settings.body = body;

  // var html = yield render('layouts/default', settings);
  var html = yield render('layouts/core-scaffold', settings);

  this.body = html;
}

app.get('/', home);

app.get(/^([^.]+)$/, error404); //matches everything without an extension

module.exports = app;
