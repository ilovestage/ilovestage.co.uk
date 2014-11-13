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
  url: {
    assets: packageJson.config.environment[environment].url.assets
  },
  lang: 'en',
  title: 'I Love Stage',
  description: 'I Love Stage'
};

app.use(serve('build/www'));

app.use(router(app));

if (environment === 'development') {
  // No options or {init: false}
  // The snippet must be provide by BROWSERSYNC_SNIPPET environment variable
  app.use(require('koa-browser-sync')());
}

function *renderEach(name, objs) {
  var res = yield objs.map(function(obj){
    var opts = {};
    opts[name] = obj;
    return render(name, opts);
  });

  return res.join('\n');
}

function *error404(next) {
  var settings = {
    bodyClass: 'error error-404'
  };

  _.merge(settings, defaults);

  this.body = yield render('error-404', settings);
  this.status = 404;
}

function *home() {
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

app.get('/', home);

app.get(/^([^.]+)$/, error404); //matches everything without an extension

module.exports = app;
