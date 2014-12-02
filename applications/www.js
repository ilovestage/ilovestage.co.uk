'use strict';

var packageJson = require(__dirname + '/../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

require('./_utilities/auth');

var _ = require('lodash');
// var _.str = require('underscore.string');
var argv = require('yargs').argv;
// var email = require('_utilities/email');
var koa = require('koa');
// var mount = require('koa-mount');
// var bodyParser = require('koa-bodyparser');
// var passport = require('koa-passport');
var qs = require('koa-qs');
var router = require('koa-router');
var serve = require('koa-static');
// var session = require('koa-generic-session');
// var redisStore = require('koa-redis');
var views = require('co-views');

var currentDate = new Date();

var render = views('source/' + argv.application + '/views', {
  cache: true,

  map: {
    html: 'ejs'
  }
});

var app = koa();

app.name = argv.application;
app.keys = ['keys', packageJson.config.redis.key];

qs(app);

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

app.use(function* (next) {
  this.locals = this.locals || {};

  this.locals.defaults = {
    application: packageJson.config.applications[argv.application],
    url: {
      assets: packageJson.config.environment[environment].url.assets
    },
    lang: 'en',
    year: currentDate.getFullYear(),
    title: 'I Love Stage',
    description: 'ILOVESTAGE is a great way to find tickets for the top 10 West End shows at affordable group-rate prices.',
    preview: false
  };

  this.locals.defaults.preview = this.query.preview;

  console.log('this.locals.defaults', this.locals.defaults);

  yield next;
});

function *error404(next) {
  var settings = {};

  var locals = {
    bodyClass: 'error error-404',
    title: 'Page not found'
  };

  _.merge(settings, this.locals.defaults, locals);

  var body = yield render('error-404', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
  this.status = 404;
}

function *home(next) {
  var settings = {};

  var locals = {
    bodyClass: 'home'
  };

  _.merge(settings, this.locals.defaults, locals);

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

  _.merge(settings, this.locals.defaults, locals);

  var body = yield render('account', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
}

function *passwordReset(next) {
  var settings = {};

  var locals = {
    bodyClass: 'privacy password-reset',
    title: 'Reset Password'
  };

  _.merge(settings, this.locals.defaults, locals);

  var body = yield render('password-reset', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
}

function *passwordResetEmailSent(next) {
  var settings = {};

  var locals = {
    bodyClass: 'privacy password-reset password-reset-email-sent',
    title: 'Password Reset Email Sent'
  };

  _.merge(settings, this.locals.defaults, locals);

  var body = yield render('password-reset-email-sent', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
}

function *passwordResetSuccess(next) {
  var settings = {};

  var locals = {
    bodyClass: 'privacy password-reset password-reset-success',
    title: 'Password Has Been Successfully Reset'
  };

  _.merge(settings, this.locals.defaults, locals);

  var body = yield render('password-reset-success', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
}

function *passwordResetVerification(next) {
  var settings = {};

  var locals = {
    bodyClass: 'privacy password-reset password-reset-verification',
    title: 'Verify Password Reset Request',
    token: this.query.token
  };

  _.merge(settings, this.locals.defaults, locals);

  var body = yield render('password-reset-verification', settings);

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

  _.merge(settings, this.locals.defaults, locals);

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

  _.merge(settings, this.locals.defaults, locals);

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

  _.merge(settings, this.locals.defaults, locals);

  var body = yield render('terms-of-service', settings);

  settings.body = body;

  var html = yield render('layouts/default', settings);

  this.body = html;
}

app.use(router(app));

app.get('/', home);
app.get('/account', error404);
app.get('/privacy-policy', privacyPolicy);
app.get('/refund-policy', refundPolicy);
app.get('/terms-of-service', termsOfService);
app.get('/account/password-reset', passwordReset);
app.post('/account/password-reset/email-sent', passwordResetEmailSent);
app.get('/account/password-reset/verification', passwordResetVerification);
app.post('/account/password-reset/success', passwordResetSuccess);

app.all(/^([^.]+)$/, error404); //matches everything without an extension

module.exports = app;
