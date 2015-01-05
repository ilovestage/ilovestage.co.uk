var packageJson = require(__dirname + '/../../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var _ = require('lodash');
var router = require('koa-router');
var views = require('co-views');

var render = views('source/views', {
  cache: true,

  map: {
    html: 'ejs'
  }
});

var securedRouter = new router();

var defaults = {
  lang: 'en',
  config: config,
  ngApp: 'users'
};

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

securedRouter.get('/', index);
securedRouter.get('/:title', read);
securedRouter.get('/create', create);
securedRouter.get('/delete', remove);
securedRouter.get('/edit', update);
// securedRouter.post('/create', edit);
securedRouter.get(/^([^.]+)$/, index); //matches everything without an extension

module.exports = securedRouter;
