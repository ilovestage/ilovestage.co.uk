'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

// var _ = require('lodash');
var auth = require('koa-basic-auth');
var bodyParser = require('koa-bodyparser');
// var co = require('co');
var conditional = require('koa-conditional-get');
var deleteKey = require('key-del');
var DJ = require('dot-object');
var etag = require('koa-etag');
var fresh = require('koa-fresh');
var gzip = require('koa-gzip');
var health = require('koa-ping');
var helmet = require('koa-helmet');
var js2xmlparser = require('js2xmlparser');
var koa = require('koa');
var mount = require('koa-mount');
var qs = require('koa-qs');
var responseTime = require('koa-response-time');
var router = require('koa-router');
// var session = require('koa-generic-session');
// var stripe = require('stripe')(packageJson.config.environment[environment].api.stripe.key);
// var thunkify = require('thunkify');

// var cryptography = require('_utilities/cryptography');
// var date = require('_utilities/date');
// var email = require('_utilities/email');
// var internationalization = require('_utilities/internationalization');
// var mongo = require('_utilities/mongo');

var authenticationCheck = require('_middleware/authenticationCheck');
// var authorizationCheck = require('_middleware/authorizationCheck');
var setResponse = require('_middleware/setResponse');

// var Booking = require('_models/booking');
// var Event = require('_models/event');
// var Payment = require('_models/payment');
// var Show = require('_models/show');
var User = require('_models/user');

var dj = new DJ();

// var createCardThunk = thunkify(stripe.customers.create);
// var createCardBoundThunk = createCardThunk.bind(stripe.customers);

// var createChargeThunk = thunkify(stripe.charges.create);
// var createChargeBoundThunk = createChargeThunk.bind(stripe.charges);

var httpBasicAuthCredentials = packageJson.config.http.auth;

var app = koa();

app.version = '1.0.0';

app.use(responseTime());

qs(app);

app.use(bodyParser());
// app.use(session());

app.use(health());

app.use(function* (next) {
  // this.locals = this.locals || {};

  this.locals.messages = this.locals.messages || {};

  this.locals.messages.badRequest = 'The request cannot be fulfilled due to bad syntax.';
  this.locals.messages.forbidden = 'Operation forbidden.  Supplied uid not authenticated to access this resource or perform this operation.';
  this.locals.messages.invalidUid = 'Invalid uid format.  Please provide a uid as a 24 character hexadecimal string.';
  this.locals.messages.noUid = 'Please provide a uid as a 24 character hexadecimal string.';
  this.locals.messages.noUserForUid = 'No user found for uid provided in header data.';
  this.locals.messages.requestEntityTooLarge = 'The request is larger than the server is willing or able to process.';
  this.locals.messages.requiresAdminPrivilege = 'Operation requires administrator-level privileges.';
  this.locals.messages.requiresAgentPrivilege = 'Operation requires agent-level privileges.';
  this.locals.messages.resourceNotFound = 'Resource not found.';
  // this.locals.messages.resourceNotAuthorised = 'Operation requires authorisation.';
  this.locals.messages.specifyContentType = 'Unsupported media type';
  this.locals.messages.unauthorised = 'Authorisation required.';
  this.locals.messages.unprocessableEntity = 'The request was well-formed but was unable to be followed due to semantic errors.';
  this.locals.messages.unknownError = 'An unknown error occurred.';

  this.locals.body = {};
  this.locals.message = null;

  this.locals.bypassAuthentication = false;

  if (typeof this.query.lang !== 'undefined') {
    this.locals.lang = this.query.lang;
  } else {
    this.locals.lang = 'en';
  }

  this.locals.document = this.request.body;

  if(this.locals.document) {
    dj.object(this.locals.document);

    if(this.locals.document.format) {
      this.locals.document = deleteKey(this.locals.document, ['format']);
    }
  }

  var returnFields = {};
  var searchFields = {};

  if(this.query.bypass === 'true') {
    this.locals.bypassAuthentication = true;
    this.locals.currentUser = 'bypassed';

    this.locals.status = 200;
  } else {
    if(this.request.header.uid) {
      returnFields = {
        _id: 1,
        uid: 1,
        role: 1
      };

      // searchFields.uid = mongo.toObjectId(this.request.header.uid);
      searchFields.uid = this.request.header.uid;
      // console.log('searchFields.uid', searchFields.uid);
      this.locals.currentUser = yield User.findOne(searchFields, returnFields);
      // console.log('currentUser', this.locals.currentUser, 'uid', this.request.header.uid);

      if(typeof this.locals.currentUser !== 'undefined') {
        // this.locals.status = 200;
        this.locals.status = 200;
      } else {
        this.locals.status = 403;
      }

    } else {
      this.locals.status = 401;
    }
  }

  if((this.request.header['content-type'] === 'application/vnd.api+xml') || (this.query.format === 'xml')) {
    this.locals.contentType = 'xml';
  } else {
    this.locals.contentType = 'json';
  }

  try {
    yield next;
  } catch (error) {
    if (401 === error.status) {
      this.locals.message = this.locals.messages.unauthorised;
      this.locals.status = error.status;

      this.locals.body.status = this.locals.status; // use HTTP status code
      this.locals.body.error = this.locals.message;
      this.locals.body.result = this.locals.result;

      if(this.locals.contentType === 'xml') {
        this.body = js2xmlparser('response', this.locals.body);
        this.type = 'application/vnd.api+xml';
      } else {
        this.body = this.locals.body;
        this.type = 'application/vnd.api+json';
      }

      this.status = this.locals.status;

      this.set('WWW-Authenticate', 'Basic');
    } else {
      throw error;
    }
  }

  if((environment !== 'development') && (this.locals.bypassAuthentication !== true)) {
    app.use(auth(httpBasicAuthCredentials));
  }
});

app.use(helmet.defaults());

app.use(authenticationCheck());

app.use(mount('/bookings', require(__dirname + '/1.0.0/bookings')));
app.use(mount('/events', require(__dirname + '/1.0.0/events')));
app.use(mount('/notes', require(__dirname + '/1.0.0/notes')));
app.use(mount('/payments', require(__dirname + '/1.0.0/payments')));
app.use(mount('/shows', require(__dirname + '/1.0.0/shows')));
app.use(mount('/users', require(__dirname + '/1.0.0/users')));

app.use(router(app));

app.get('/', function* (next) {
  this.locals.result = packageJson.name + ' API version ' + app.version;
  this.locals.status = 200;

  yield next;
});

app.use(setResponse());

app.use(conditional());
app.use(gzip());
app.use(fresh());
app.use(etag());

module.exports = app;
