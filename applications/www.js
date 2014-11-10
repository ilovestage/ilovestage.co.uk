'use strict';

var packageJson = require(__dirname + '/../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

require('./_utilities/auth');

var _ = require('lodash');
var argv = require('yargs').argv;
var koa = require('koa');
var router = require('koa-router');
var serve = require('koa-static');
var views = require('co-views');

var app = koa();

var render = views('source/www/views', {
  cache: true,

  map: {
    html: 'ejs'
  }
});

var defaults = {
  application: packageJson.config.applications[argv.application],
  lang: 'en',
  ngApp: 'general'
};

// use koa-router
app.use(router(app));

app.use(serve('build/www'));

if (environment === 'development') {
  // No options or {init: false}
  // The snippet must be provide by BROWSERSYNC_SNIPPET environment variable
  app.use(require('koa-browser-sync')());
}

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

function *index() {
  var settings = {
    bodyClass: 'home full-viewport-sections'
  };

  _.merge(settings, defaults);

  this.body = yield render('home', settings);
}

app.get('/', index);

app.get(/^([^.]+)$/, error404); //matches everything without an extension

module.exports = app;
