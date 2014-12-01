'use strict';

var packageJson = require(__dirname + '/../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

require('./_utilities/auth');

var _ = require('lodash');
// var _.str = require('underscore.string');
var argv = require('yargs').argv;
var email = require('_utilities/email');
var koa = require('koa');
// var mount = require('koa-mount');
// var bodyParser = require('koa-bodyparser');
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
//
// app.use(bodyParser());

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
  var settings;

  var locals = {
    bodyClass: 'error error-404',
    title: 'Page not found'
  };

  _.merge(settings, [defaults, locals]);

  this.body = yield render('error-404', settings);
  this.status = 404;
}

function *home(next) {
  var settings = {};

  var locals = {
    bodyClass: 'home'
  };

  _.merge(settings, defaults, locals);

  // var body = yield renderEach('user', db.users);
  var body = yield render('home', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
}

function *account(next) {
  var settings = {};

  var locals = {
    bodyClass: 'account',
    title: 'Account settings'
  };

  _.merge(settings, defaults, locals);

  var body = yield render('account', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
}

function *passwordReset(next) {
  var settings = {};

  var locals = {
    bodyClass: 'privacy',
    title: 'Password Reset'
  };

  _.merge(settings, defaults, locals);

  var body = yield render('password-reset', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
}

function *privacyPolicy(next) {
  var settings = {};

  var locals = {
    bodyClass: 'legal privacy-policy',
    title: 'Privacy Policy'
  };

  _.merge(settings, defaults, locals);

  console.log('settings', settings);

  var body = yield render('privacy-policy', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
}

function *refundPolicy(next) {
  var settings = {};

  var locals = {
    bodyClass: 'legal refund-policy',
    title: 'Refund Policy'
  };

  _.merge(settings, defaults, locals);

  var body = yield render('refund-policy', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
}

function *termsOfService(next) {
  var settings = {};

  var locals = {
    bodyClass: 'legal terms-of-service',
    title: 'Terms of Service'
  };

  _.merge(settings, defaults, locals);

  var body = yield render('terms-of-service', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
}

app.get('/', home);
app.get('/account', account);
app.get('/privacy-policy', privacyPolicy);
app.get('/refund-policy', refundPolicy);
app.get('/terms-of-service', termsOfService);
app.get('/account/password-reset/', error404);
app.get('/account/password-reset/:token', passwordReset);

app.get(/^([^.]+)$/, error404); //matches everything without an extension

module.exports = app;
