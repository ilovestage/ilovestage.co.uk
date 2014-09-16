var packageJson = require(__dirname + '/../../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var version = 1.0;

var _ = require('lodash');
var co = require('co');
var parse = require('co-body');
var koa = require('koa');
var logger = require('koa-logger');
// var qs = require('qs');
var request = require('koa-request');
var router = require('koa-router');
var should = require('should');
var database = require(__dirname + '/../database');

var app = koa();
var db = new database(config.server.database);
var users = db.collection('users');
var events = db.collection('events');

require('koa-qs')(app)

// logger
app.use(function *(next) {
  // var start = new Date;
  yield next;
  // var ms = new Date - start;
  // console.log('%s %s - %s', this.method, this.url, ms);
});

var api = new router();

api.get('/', function *(next) {
  yield next;
  this.body = packageJson.name + ' API version ' + version.toFixed(1);
  this.type = 'application/json';
});

// Routes: Events

api.get('/events', function *(next) {
  var status = null;
  var errorMessage = null;
  var queryParameters = null;
  var result = null;

  var mydate1 = new Date('Jun 07, 1954');
  var mydate2 = new Date(2014,9,7);
  var mydate3 = new Date('2013-12-12T16:00:00.000Z');

  console.log('mydate1', mydate1.getDate(), mydate1.getMonth(), mydate1.getFullYear());
  console.log('mydate2', mydate2.getDate(), mydate2.getMonth(), mydate2.getFullYear());
  console.log('mydate3', mydate3.getDate(), mydate3.getMonth(), mydate3.getFullYear());

  if((typeof this.query.year !== 'undefined') && (typeof this.query.month !== 'undefined') && (typeof this.query.day !== 'undefined')) {
    console.log('select event by parameters');
    queryParameters = {
      year: this.query.year,
      month: this.query.month,
      day: this.query.day
    }
  } else if(typeof this.query !== 'undefined') {
    console.log('select all events');
    queryParameters = {};
  } else {
    status = 400;
  }

  if(queryParameters) {
    result = yield events.find(queryParameters);
    // result = yield events.find(queryParameters).limit(20);
  }

  if(!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  //handle error messages from monk and pass into response below

  var body = {
    status: status, // use HTTP status code
    error: errorMessage,
    result: result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

api.post('/events', function *(next) {
  var document = yield parse(this);

  // var document = {
  //   id: 2,
  //   total: 20,
  //   availability: 2,
  //   show: "Wicked",
  //   date: "18 Sep, 19:30",
  //   theatre: "Drury Lane Theatre",
  //   priceband: "BestAvailable",
  //   starttime: 1360916300,
  //   endtime: 1360917300,
  //   facevalue: 45,
  //   discount_price: 34.5,
  //   location: "VictoriaStreet, London, SW1E5EA",
  //   longitude: 51.496522,
  //   latitude: -0.142543,
  //   metadata: "GRpWkWY5W0c",
  //   synopsis: "synopsis",
  //   reviews: [
  //     {
  //       review: "review1",
  //       name: "The Daily Telegraph"
  //     },
  //     {
  //       review: "review2",
  //       name: "The Daily Telegraph"
  //     },
  //     {
  //       review: "review3",
  //       name: "The Daily Telegraph"
  //     }
  //   ],
  //   imgurl: [
  //     "imgurl1",
  //     "imgurl2",
  //     "imgurl3",
  //     "imgurl4"
  //   ]
  // };

  var result = yield events.insert(document);

  this.body = result;
  this.type = 'application/json';
});

api.get('/events/:id', function *(next) {
  var eventId = this.params.id;

  var result = yield events.findOne({
    _id: eventId
  });

  this.body = result;
  this.type = 'application/json';
});

api.put('/events/:id', function *(next) {
  var eventId = this.params.id;

  var body = yield parse(this);
  // console.log('body', body);

  var result = yield events.updateById(eventId, body);

  this.body = result;
  this.type = 'application/json';
});

api.del('/events/:id', function *(next) {
  var eventId = this.params.id;

  var lookup = yield events.findOne({
    _id: eventId
  });

  var result = yield events.remove({
    _id: eventId
  });

  this.body = result;
  this.type = 'application/json';
});

api.get('/users', function *(next) {
  var status = null;
  var errorMessage = null;
  var queryParameters = null;
  var result = null;

  console.log(this.query.email, this.query.password);

  if( (typeof this.query.provider !== 'undefined') && (typeof this.query.provider_uid !== 'undefined') ) {
    console.log('social');
    queryParameters = {
      provider: this.query.provider,
      provider_uid: this.query.provider_uid
    }
  } else if( (typeof this.query.email !== 'undefined') && (typeof this.query.password !== 'undefined') ) {
    console.log('email');
    queryParameters = {
      email: this.query.email,
      password: this.query.password
    }
  } else if(typeof this.query !== 'undefined') {
    console.log('select all users');
    queryParameters = {};
  } else {
    status = 400;
  }

  if(queryParameters) {
    result = yield users.find(queryParameters);
    // result = yield users.find(queryParameters).limit(20);
  }

  if(!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  //handle error messages from monk and pass into response below

  var body = {
    status: status, // use HTTP status code
    error: errorMessage,
    result: result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

api.post('/users', function *(next) {
  var document = yield parse(this);

  // var document = {
  //   "firstname": "mijin",
  //   "lastname": "cho",
  //   "uid": "42043",
  //   "email": "developer.cho@gmail.com",
  //   "password": "mypass1234",
  //   "provider": "twitter",
  //   "provider_uid": "uid123",
  //   "tickets": [
  //     {
  //       event: [
  //         {
  //           "eventid": "1",
  //         },
  //         {
  //           "eventid": "2",
  //         }
  //       ],
  //       total:"2",
  //       booking_status: "booked"
  //     },
  //     {
  //       event: [
  //         {
  //           "eventid": "3"
  //         },
  //         {
  //           "eventid": "4"
  //         }
  //       ],
  //       total:"2",
  //       booking_status: "waiting"
  //     }
  //   ],
  // };

  var result = yield users.insert(document);

  this.body = result;
  this.type = 'application/json';
});

// Routes: Catch-all

api.get(/^([^.]+)$/, function *(next) {
  yield next;

  this.body = 'API v1 - 404 not found';
  this.status = 404;
  this.type = 'application/json';
}); //matches everything without an extension

module.exports = api;
