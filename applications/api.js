'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var cors = require('koa-cors');
var koa = require('koa');
var mount = require('koa-mount');
var router = require('koa-router');
var ua = require('universal-analytics');

var visitor = ua(packageJson.config.applications.api.googleanalytics.key);

var versions = [
  '1.0.0'
  // ,
  // '1.0.1',
  // '2.0.0'
];

var app = koa();

app.use(cors());

app.use(router(app));

app.use(function* (next) {
  if (environment !== 'development') {
    visitor.pageview(this.request.originalUrl, function(err) {
      console.log('err', err);
    });
  }

  yield next;
});

for (var i = 0; i < versions.length; i++) {
  app.use(mount('/' + versions[i], require(__dirname + '/api/' + versions[i])));
}

app.redirect('/', '/' + versions[versions.length - 1]);

module.exports = app;
