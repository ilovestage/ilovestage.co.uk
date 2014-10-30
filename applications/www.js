'use strict';

var packageJson = require(__dirname + '/../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

require('./modules/auth');

var _ = require('lodash');
var koa = require('koa');
// var mount = require('koa-mount');
var passport = require('koa-passport');
var router = require('koa-router');
var session = require('koa-generic-session');
var views = require('co-views');

var app = koa();

// logger
app.use(function *(next) {
  // var start = new Date;
  yield next;
  // var ms = new Date - start;
  // console.log('%s %s - %s', this.method, this.url, ms);
});

app.keys = 'andthestageloveme123';

app.use(session());

app.use(passport.initialize());
app.use(passport.session());

var securedRouter = new router();
var publicRouter = new router();

// var routeModules = [];
// routeModules.general = require(__dirname + '/routes/general');
// routeModules.bookings = require(__dirname + '/routes/bookings');
// routeModules.events = require(__dirname + '/routes/events');
// routeModules.payments = require(__dirname + '/routes/payments');
// routeModules.shows = require(__dirname + '/routes/shows');
// routeModules.users = require(__dirname + '/routes/users');

var render = views('source/views', {
  cache: true,

  map: {
    html: 'ejs'
  }
});

var defaults = {
  // packageJson: packageJson,
  config: config,
  lang: 'en',
  ngApp: 'general'
};

// use koa-router
app.use(router(app));

// app.use(function *(next) {
//   if (this.isAuthenticated()) {
//     yield next;
//   } else {
//     if(this.request.originalUrl !== '/login') {
//       this.redirect('/login');
//     } else {
//       yield next;
//     }
//   }
// });

function *error404(next) {
  var settings = {
    bodyClass: 'error error404'
  };

  _.merge(settings, defaults);

  // console.log('app', app, getAllMethods(app));
  // console.log('this.method', this.method, 'this.path', this.path);

  // if (app.match(this.method, this.path)) {
  if ('app.route', app.route) {
    // console.log('app.match true');
    yield next;
  } else {
    // console.log('app.match false');
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

function *isAuthenticated(next) {
  if (!this.isAuthenticated() && (this.request.originalUrl !== '/login')) {
    this.redirect('/login');
  }

  yield next;
}

function *login(next) {
  var settings = {
    bodyClass: 'login clear-header'
  };

  _.merge(settings, defaults);

  this.body = yield render('login', settings);
}

function logout(next) {
  this.logout();
  this.redirect('/');
}

// app.use(function *(next) {
//   if (!this.isAuthenticated() && (this.request.originalUrl !== '/login')) {
//     this.redirect('/login');
//   }
//   yield next;
// });

// use koa-router
app.use(router(app));

publicRouter.get('/', index);

publicRouter.get('/login', login);

publicRouter.post('/login', passport.authenticate('local', {
  successRedirect: '/456',
  failureRedirect: '/login123'
}));

publicRouter.get('/logout', logout);
publicRouter.get(/^([^.]+)$/, error404); //matches everything without an extension

securedRouter.all('/', isAuthenticated);

app.use(publicRouter.middleware());
app.use(securedRouter.middleware());

// securedRouter.use(mount('/', routeModules.general)); // contains catch-all rule so mount last
// securedRouter.use(mount('/users', routeModules.users));
// publicRouter.use(mount('/', routeModules.error));

// app.use(mount('/bookings', routeModules.bookings));
// app.use(mount('/events', routeModules.events));
// app.use(mount('/payments', routeModules.payments));
// app.use(mount('/shows', routeModules.shows));
// app.use(mount('/users', routeModules.users));
// app.use(mount('/', routeModules.general)); // contains catch-all rule so mount last
// app.use(mount('/', routeModules.error));

module.exports = app;
