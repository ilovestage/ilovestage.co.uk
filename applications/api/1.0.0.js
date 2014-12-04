'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var auth = require('koa-basic-auth');
var bodyParser = require('koa-bodyparser');
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
var moment = require('moment');
var mount = require('koa-mount');
// var qs = require('koa-qs');
var Qs = require('qs');
var responseTime = require('koa-response-time');
var router = require('koa-router');
// var session = require('koa-generic-session');

var setResponse = require('_middleware/setResponse');

var messages = require('_data/messages');

var User = require('_models/user');

var dj = new DJ();

var app = koa();

app.version = '1.0.0';

app.use(responseTime());
app.use(helmet.defaults());
app.use(health());
app.use(bodyParser());
// app.use(session());
// qs(app);

app.use(function* (next) {
  this.locals.body = {};
  this.locals.lang = (typeof this.query.lang !== 'undefined') ? this.query.lang : 'en';
  this.locals.message = null;
  this.locals.messages = this.locals.messages || messages;
  this.locals.querystringParameters = Qs.parse(this.querystring);

  if(this.request.body) {
    this.locals.document = this.request.body;
    this.locals.document.createtime = moment().toDate();
    this.locals.document.updatetime = moment().toDate();
    this.locals.document = deleteKey(this.locals.document, ['format']);
    dj.object(this.locals.document);
  }

  yield next;
});

app.use(function* (next) {
  try {
    yield next;
  } catch (error) {
    if (401 === error.status) {
      this.locals.error = this.locals.messages.unauthorised;
      this.locals.status = error.status; // use HTTP status code

      this.locals.body.originalUrl = this.request.originalUrl;
      this.locals.body.status = this.locals.status; // use HTTP status code
      this.locals.body.message = this.locals.message;
      this.locals.body.error = this.locals.error;
      this.locals.body.result = this.locals.result;

      if((this.request.header['content-type'] === 'application/vnd.api+xml') || (this.query.format === 'xml')) {
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

});

app.use(function* (next) {
  if((environment !== 'development') && (this.locals.bypassAuthentication !== true)) {
    app.use(auth(packageJson.config.http.auth));
  }

  yield next;
});

app.use(function* (next) {
  var returnFields = {};
  var searchFields = {};

  if(this.query.bypass === 'true') {
    this.locals.bypassAuthentication = true;
    this.locals.currentUser = 'bypassed';
  } else {
    this.locals.bypassAuthentication = false;

    if(this.request.header.uid) {
      returnFields = {
        _id: 1,
        uid: 1,
        role: 1
      };

      searchFields.uid = this.request.header.uid;
      // searchFields.uid = mongo.toObjectId(this.request.header.uid);

      this.locals.currentUser = yield User.findOne(searchFields, returnFields);
      this.locals.status = (typeof this.locals.currentUser !== 'undefined') ? 404 : 403;

      // console.log('this.locals.currentUser', this.locals.currentUser);
      // console.log('this.request.header.uid', this.request.header.uid);
      // console.log('searchFields.uid', searchFields.uid);
    } else {
      this.locals.status = 401;
    }
  }

  yield next;
});

app.use(function* (next) {
  if(this.request.body) {
    dj.object(this.locals.document);

    if(this.locals.document.format) {
      this.locals.document = deleteKey(this.locals.document, ['format']);
    }
  }

  yield next;
});

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
