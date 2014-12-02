'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var bodyParser = require('koa-bodyparser');
var koa = require('koa');

var router = require('koa-router');

var authenticationCheck = require('_middleware/authenticationCheck');
var authorizationCheck = require('_middleware/authorizationCheck');
var setResponse = require('_middleware/setResponse');

var Booking = require('_models/booking');
var Event = require('_models/event');
var Payment = require('_models/payment');
var Show = require('_models/show');
var User = require('_models/user');

var app = koa();

app.use(bodyParser());

app.use(router(app));

app.get('/', function* (next) {
  this.locals.result = 'Oh hai!';
  this.locals.status = 200;

  yield next;
});

app.post('/', function* (next) {
  this.locals.result = 'Oh hai postman!';
  this.locals.status = 200;

  yield next;
});

app.get(/^([^.]+)$/, function* (next) {
  this.locals.status = 404;

  yield next;
}); //matches everything without an extension

app.use(setResponse());

module.exports = app;