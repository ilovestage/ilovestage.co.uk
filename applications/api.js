'use strict';

var packageJson = require(__dirname + '/../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

// var co = require('co');
var koa = require('koa');
// var logger = require('koa-logger');
var mount = require('koa-mount');
var router = require('koa-router');
// var thunkify = require('thunkify');
var ua = require('universal-analytics');

// var uaThunk = thunkify(ua.middleware);
// var uaBoundThunk = uaThunk.bind(ua);

var api = [];
api.v1 = require(__dirname + '/api/v1');
api.v2 = require(__dirname + '/api/v2');

var app = koa();

var visitor = ua('UA-55818646-2');

// use koa-router
app.use(router(app));


// co(function *() {
//   app.use(yield uaBoundThunk('UA-55818646-2', {cookieName: '_ga'}));
// })();

app.use(function* (next) {
  // ua.middleware('UA-55818646-2', {cookieName: '_ga'});
  visitor.pageview(this.request.originalUrl, function (err) {
    // Handle the error if necessary.
    // In case no error is provided you can be sure the request was successfully sent off to Google.
    console.log('err', err);
  });
  yield next;
});

app.use(mount('/v1', api.v1.middleware()));
// app.use(mount('/v2', api.v2.middleware()));

app.redirect('/', '/v1'); // show info page instead

module.exports = app;
