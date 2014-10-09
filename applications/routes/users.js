var packageJson = require(__dirname + '/../../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var _ = require('lodash');
var koa = require('koa');
var router = require('koa-router');
var views = require('co-views');

var app = koa();

// use koa-router
app.use(router(app));

// logger
app.use(function *(next) {
  // var start = new Date;
  yield next;
  // var ms = new Date - start;
  // console.log('%s %s - %s', this.method, this.url, ms);
});

var render = views('source/views', {
  cache: true,

  map: {
    html: 'ejs'
  }
});

var defaults = {
  lang: 'en',
  // packageJson: packageJson,
  config: config,
  ngApp: 'users'

  // bodyClass: 'users test clear-header' //fucking doesn't get overridden
};

// use koa-router
app.use(router(app));

function *index(next) {
  var settings = {
    bodyClass: 'users index clear-header'
  };

  _.merge(settings, defaults);

  this.body = yield render('users-index', settings);
}

function *create(next) {
  var settings = {
    bodyClass: 'users edit create clear-header'
  };

  _.merge(settings, defaults);

  this.body = yield render('users-edit', settings);
}

function *read(next) {
  var settings = {
    bodyClass: 'users read',
    originalUrl: this.originalUrl
  };

  var title = this.params.title;

  _.merge(settings, defaults);
  // console.log('settings', settings);
  // console.log('defaults', defaults);

  this.body = yield render('users-read', settings);
}

function *update(next) {
  var settings = {
    bodyClass: 'users edit update clear-header'
  };

  _.merge(settings, defaults);

  this.body = yield render('users-edit', settings);
}

function *remove(next) {

}

app.get('/', index);
app.get('/:title', read);
app.get('/create', create);
app.get('/edit', update);
// app.post('/create', edit);
// app.get(/^([^.]+)$/, index); //matches everything without an extension

module.exports = app;
