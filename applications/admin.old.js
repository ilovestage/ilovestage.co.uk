'use strict';

var packageJson = require(__dirname + '/../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

require('./_utilities/auth');

var _ = require('lodash');
// var _.str = require('underscore.string');
var argv = require('yargs').argv;
var koa = require('koa');
// var mount = require('koa-mount');
var bodyParser = require('koa-bodyparser');
var passport = require('koa-passport');
var router = require('koa-router');
var serve = require('koa-static');
var session = require('koa-generic-session');
var redisStore = require('koa-redis');
var views = require('co-views');

var render = views('source/' + argv.application + '/views', {
  cache: true,

  map: {
    html: 'ejs'
  }
});

var defaults = {
  application: packageJson.config.applications[argv.application],
  url: {
    assets: packageJson.config.environment[environment].url.assets
  },
  lang: 'en',
  title: 'I Love Stage',
  description: 'I Love Stage'
};

var app = koa();

app.name = argv.application;
app.keys = ['keys', packageJson.config.redis.key];

// app.use(session({
//   store: redisStore({
//     host: 'session.7vappv.ng.0001.euw1.cache.amazonaws.com',
//     port: 6379
//   })
// }));
//
// app.use(passport.initialize());
// app.use(passport.session());
//
// app.use(function *(next) {
//   this.session.name = 'koa-redis';
//   yield next;
// });

app.use(bodyParser());

app.use(serve('build/' + argv.application));

app.use(router(app));

if (environment === 'development') {
  // No options or {init: false}
  // The snippet must be provide by BROWSERSYNC_SNIPPET environment variable
  app.use(require('koa-browser-sync')());
}

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

  var html = yield render('layouts/default', settings);

  this.body = html;
}

function *secured(next) {
  console.log('secured');
  var settings = {
    bodyClass: 'users full-viewport-sections secured'
  };

  _.merge(settings, defaults);

  this.body = yield render('users-index', settings);
}

function *isAuthenticated(next) {
  var url = this.path;
  var urlParts = url.split('/');
  var filename = urlParts[urlParts.length - 1];
  var extension = filename.split('.').pop();
  var patternFileWithExtension = /\.[0-9a-z]+$/i;
  // var patternFileWithExtension = /^([^.]+)$/;

  // console.log('∆∆∆∆∆∆∆∆∆∆');
  // console.log('filename', filename);
  // console.log('extension', extension);
  // console.log('regex', filename === patternFileWithExtension);

  // if (!this.req.isAuthenticated() && (this.request.originalUrl !== '/login') && (filename === patternFileWithExtension)) {
  if (!this.req.isAuthenticated() && (this.request.originalUrl !== '/login') && (extension === filename)) {
    // console.log('redirect');
    this.redirect('/login');
  } else {
    // console.log('yield next');
    yield next;
  }

  // console.log('^^^^^^^^^^');
}

function *login(next) {
  var settings = {
    bodyClass: 'login clear-header'
  };

  _.merge(settings, defaults);

  this.body = yield render('login', settings);
}

function *logout(next) {
  this.logout();
  this.redirect('/');
}

// use koa-router
app.use(router(app));
// app.use(securedRouter);

var publicRouter = new router();

publicRouter.get('/', home);
// app.get('/', home);

// app.use(mount('/bookings', routeModules.bookings));
// app.use(mount('/events', routeModules.events));
// app.use(mount('/payments', routeModules.payments));
// app.use(mount('/shows', routeModules.shows));
// app.use(mount('/users', require(__dirname + '/admin/users')));

publicRouter.get('/login', login);

publicRouter.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

publicRouter.get('/logout', logout);

publicRouter.get(/^([^.]+)$/, error404); //matches everything without an extension

app.use(publicRouter.middleware());

app.use(isAuthenticated);

var securedRouter = new router();

// securedRouter.get('/test', isAuthenticated, secured);
securedRouter.get('/test', secured);

// securedRouter.use(mount('/', routeModules.general)); // contains catch-all rule so mount last
// app.use(mount('/users', routeModules.users));
// publicRouter.use(mount('/', routeModules.error));

securedRouter.get(/^([^.]+)$/, error404); //matches everything without an extension

app.use(securedRouter.middleware());

app.get(/^([^.]+)$/, error404); //matches everything without an extension

module.exports = app;
