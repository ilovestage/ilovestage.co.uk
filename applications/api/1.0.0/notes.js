'use strict';

var koa = require('koa');
var router = require('koa-router');

var app = koa();

app.use(router(app));

// app.use(function* (next) {
//   this.locals = this.locals || {};
//
//   yield next;
// });

app.get('/', function* (next) {
  this.locals.result = 'Oh hai!';
  this.locals.status = 200;

  yield next;
});

module.exports = app;
