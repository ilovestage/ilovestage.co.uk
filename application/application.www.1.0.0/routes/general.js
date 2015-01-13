'use strict';

var _ = require('lodash');

module.exports = function GeneralRoutes(configuration, router, db, models, render) {
  var routes = new router();

  var Booking = models.booking;
  var Event = models.event;
  var Note = models.note;
  var Payment = models.payment;
  var Show = models.show;
  var User = models.user;

  routes.name = 'general';

  routes.get('/', function* (next) {
    var settings = {};

    var locals = {
      bodyClass: 'home'
    };

    _.merge(settings, this.locals.defaults, locals);

    // function *renderEach(name, objs) {
    //   var res = yield objs.map(function(obj){
    //     var opts = {};
    //     opts[name] = obj;
    //     return render(name, opts);
    //   });
    //
    //   return res.join('\n');
    // }
    //
    // var body = yield renderEach('user', db.users);

    var body = yield render('home', settings);

    settings.body = body;

    var html = yield render('layouts/default', settings);

    this.body = html;

    yield next;
  });

  routes.get('/account', function* (next) {
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

    yield next;
  });

  routes.get('/privacy-policy', function* (next) {
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

    yield next;
  });

  routes.get('/refund-policy', function* (next) {
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

    yield next;
  });

  routes.get('/terms-of-service', function* (next) {
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

    yield next;
  });

  routes.get('/account/password-reset', function* (next) {
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

    yield next;
  });

  routes.post('/account/password-reset/email-sent', function* (next) {
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

    yield next;
  });

  routes.get('/account/password-reset/verification', function* (next) {
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

    yield next;
  });

  routes.post('/account/password-reset/success', function* (next) {
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

    yield next;
  });

  routes.all(/^([^.]+)$/, function* (next) {
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

    yield next;
  }); //matches everything without an extension

  return routes;
};
