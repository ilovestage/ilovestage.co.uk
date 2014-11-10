'use strict';

var packageJson = require(__dirname + '/../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

require('./_utilities/auth');

var koa = require('koa');

var app = koa();

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

if (app.env == 'development') {
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

function *index(next) {
  var settings = {
    bodyClass: 'home full-viewport-sections'
  };

  _.merge(settings, defaults);

  this.body = yield render('home', settings);
}

app.get('/', index);

app.get(/^([^.]+)$/, error404); //matches everything without an extension

module.exports = app;
