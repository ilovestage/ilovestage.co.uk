'use strict';

var packageJson = require(__dirname + '/../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
var config = packageJson.config.environment[environment];

require('./modules/auth');

var _ = require('lodash');
// var _.str = require('underscore.string');
var koa = require('koa');
// var mount = require('koa-mount');
// var bodyParser = require('koa-bodyparser');
var passport = require('koa-passport');
var router = require('koa-router');
var session = require('koa-generic-session');
var views = require('co-views');

var app = koa();

app.use(session());

// app.use(bodyParser());

app.use(passport.initialize());
app.use(passport.session());

var render = views('source/views', {
  cache: true,

  map: {
    html: 'ejs'
  }
});

var publicRouter = new router();

var defaults = {
  config: config,
  lang: 'en',
  ngApp: 'general'
};

function *error404(next) {
  console.log('in error404');
  var settings = {
    bodyClass: 'error error404'
  };

  _.merge(settings, defaults);

  if ('app.route', app.route) {
    yield next;
  } else {
    // this.throw('404 / Not Found', 404)
    this.body = yield render('error-404', settings);
    this.status = 404;
  }
}

function getAllMethods(object) {
  // console.log('in getAllMethods');
  return Object.getOwnPropertyNames(object).filter(function(property) {
    return typeof object[property] === 'function';
  });
}

function *index(next) {
  var settings = {
    bodyClass: 'home full-viewport-sections'
  };

  _.merge(settings, defaults);

  this.body = yield render('home', settings);
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

publicRouter.get('/', index);
// app.get('/', index);

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

// app.get(/^([^.]+)$/, error404); //matches everything without an extension

module.exports = app;
