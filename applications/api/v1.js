var packageJson = require(__dirname + '/../../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var version = 1.0;

var _ = require('lodash');
var co = require('co');
var parse = require('co-body');
var koa = require('koa');
var logger = require('koa-logger');
var qs = require('qs');
var request = require('koa-request');
var router = require('koa-router');
var should = require('should');
var database = require(__dirname + '/../database');

var app = koa();
// var app = qs(koa());
var db = new database(config.server.database);
var users = db.collection('users');
var events = db.collection('events');

// require('koa-qs')(app);

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
  var dateParameters = {};
  var errorMessage = null;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = {};
  var result = null;
  var status = null;

  // var mydate1 = new Date('Jun 07, 1954');
  // var mydate2 = new Date(2014,9,7);
  // var mydate3 = new Date('2013-12-12T16:00:00.000Z');

  // console.log('mydate1', mydate1.getDate(), mydate1.getMonth(), mydate1.getFullYear());
  // console.log('mydate2', mydate2.getDate(), mydate2.getMonth(), mydate2.getFullYear());
  // console.log('mydate3', mydate3.getDate(), mydate3.getMonth(), mydate3.getFullYear());
  //
  // console.log('this.request', this.request);
  // console.log('this._querycache', this._querycache);
  //
  // console.log('this.querystring', this.querystring);
  // console.log('this.querystring.start', this.querystring.start);
  // console.log('this.query', this.query);
  // console.log('this.query.start', this.query.start);
  //
  // console.log('qs', qs.parse(this.querystring));
  // console.log('typeof nestedQuery.end', typeof nestedQuery.end);

  // if(((typeof nestedQuery.start !== 'undefined') && ((typeof nestedQuery.start.year !== 'undefined') || (typeof nestedQuery.start.month !== 'undefined') || (typeof nestedQuery.start.day !== 'undefined') || (typeof nestedQuery.start.hour !== 'undefined') || (typeof nestedQuery.start.minute !== 'undefined') || (typeof nestedQuery.start.second !== 'undefined'))) || ((typeof nestedQuery.end !== 'undefined') && ((typeof nestedQuery.end.year !== 'undefined') || (typeof nestedQuery.end.month !== 'undefined') || (typeof nestedQuery.end.day !== 'undefined') || (typeof nestedQuery.end.hour !== 'undefined') || (typeof nestedQuery.end.minute !== 'undefined') || (typeof nestedQuery.end.second !== 'undefined')))) {
    // console.log('select event by parameters');

  if(nestedQuery.start || nestedQuery.end) {
      searchParameters.starttime = {};

    if(nestedQuery.start) {
      var dateStart = null;

      if(typeof nestedQuery.start === 'object') {
        dateParameters.start = {
          year: nestedQuery.start.year,
          month: nestedQuery.start.month,
          day: nestedQuery.start.day,
          hour: nestedQuery.start.hour ? nestedQuery.start.hour : 0,
          minute: nestedQuery.start.minute ? nestedQuery.start.minute : 0,
          second: nestedQuery.start.second ? nestedQuery.start.second : 0
        };

        dateParameters.start.month -= 1;

        dateStart = new Date(dateParameters.start.year, dateParameters.start.month, dateParameters.start.day);
      } else if(typeof nestedQuery.start === 'string') {
        dateStart = new Date(nestedQuery.start);
      }

      // check if dateStart is valid

      searchParameters.starttime.$gte = dateStart;
    }

    if(nestedQuery.end) {
      var dateEnd = null;

      if(typeof nestedQuery.end === 'object') {
        dateParameters.end = {
          year: nestedQuery.end.year,
          month: nestedQuery.end.month,
          day: nestedQuery.end.day,
          hour: nestedQuery.end.hour ? nestedQuery.end.hour : 0,
          minute: nestedQuery.end.minute ? nestedQuery.end.minute : 0,
          second: nestedQuery.end.second ? nestedQuery.end.second : 0
        };

        dateParameters.end.month -= 1;

        dateEnd = new Date(dateParameters.end.year, dateParameters.end.month, dateParameters.end.day);
      } else if(typeof nestedQuery.end === 'string') {
        dateEnd = new Date(nestedQuery.end);
      }

      // check if dateEnd is valid

      searchParameters.starttime.$lt = dateEnd;
    }

  // } else if(typeof this.query !== 'undefined') {
  //   console.log('select all events');
  //   searchParameters = {};
  } else {
    searchParameters = {};
    status = 400;
  }

  // console.log('searchParameters', searchParameters);

  if(searchParameters) {
    result = yield events.find(searchParameters);
    // result = yield events.find(searchParameters).limit(20);
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
  var document = yield parse.json(this);

  // var document = {
  //   "id": 2,
  //   "total": 20,
  //   "availability": 2,
  //   "show": "Wicked",
  //   "date": "18 Sep, 19:30",
  //   "theatre": "Drury Lane Theatre",
  //   "priceband": "Best Available",
  //   "starttime": "Sat Sep 13 2014 19:00:00 GMT+0100 (BST)",
  //   "endtime": "Sat Sep 13 2014 21:30:00 GMT+0100 (BST)",
  //   "facevalue": 45,
  //   "discount_price": 34.5,
  //   "location": "Victoria Street, London, SW1E5EA",
  //   "longitude": 51.496522,
  //   "latitude": -0.142543,
  //   "metadata": "GRpWkWY5W0c",
  //   "synopsis": "synopsis",
  //   "reviews": [
  //     {
  //       "name": "The Daily Telegraph",
  //       "comments": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin feugiat, lectus vel pharetra sodales, turpis felis mollis sapien, faucibus porta lorem mauris id augue."
  //     },
  //     {
  //       "name": "The Daily Mail",
  //       "comments": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin feugiat, lectus vel pharetra sodales, turpis felis mollis sapien, faucibus porta lorem mauris id augue."
  //     },
  //     {
  //       "name": "The Daily Beagle",
  //       "comments": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin feugiat, lectus vel pharetra sodales, turpis felis mollis sapien, faucibus porta lorem mauris id augue."
  //     }
  //   ],
  //   "images": {
  //     "featured": [
  //       {
  //         "size": "thumbnail",
  //         "url": "http://placehold.it/320x180"
  //       },
  //       {
  //         "size": "small",
  //         "url": "http://placehold.it/640x320"
  //       },
  //       {
  //         "size": "medium",
  //         "url": "http://placehold.it/1280x640"
  //       },
  //       {
  //         "size": "large",
  //         "url": "http://placehold.it/1920x1080"
  //       }
  //     ],
  //     "standard": [
  //       {
  //         "thumbnail": {
  //           "url": "http://placehold.it/320x180"
  //         },
  //         "small": {
  //           "url": "http://placehold.it/640x320"
  //         },
  //         "medium": {
  //           "url": "http://placehold.it/1280x640"
  //         },
  //         "large": {
  //           "url": "http://placehold.it/1920x1080"
  //         }
  //       },
  //       {
  //         "thumbnail": {
  //           "url": "http://placehold.it/320x180"
  //         },
  //         "small": {
  //           "url": "http://placehold.it/640x320"
  //         },
  //         "medium": {
  //           "url": "http://placehold.it/1280x640"
  //         },
  //         "large": {
  //           "url": "http://placehold.it/1920x1080"
  //         }
  //       },
  //       {
  //         "thumbnail": {
  //           "url": "http://placehold.it/320x180"
  //         },
  //         "small": {
  //           "url": "http://placehold.it/640x320"
  //         },
  //         "medium": {
  //           "url": "http://placehold.it/1280x640"
  //         },
  //         "large": {
  //           "url": "http://placehold.it/1920x1080"
  //         }
  //       }
  //     ]
  //   }
  // };

  document.starttime = new Date(document.starttime);
  document.endtime = new Date(document.endtime);

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

  var body = yield parse.json(this);

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
  var searchParameters = null;
  var result = null;

  console.log(this.query.email, this.query.password);

  if( (typeof this.query.provider !== 'undefined') && (typeof this.query.provider_uid !== 'undefined') ) {
    console.log('social');
    searchParameters = {
      provider: this.query.provider,
      provider_uid: this.query.provider_uid
    }
  } else if( (typeof this.query.email !== 'undefined') && (typeof this.query.password !== 'undefined') ) {
    console.log('email');
    searchParameters = {
      email: this.query.email,
      password: this.query.password
    }
  } else if(typeof this.query !== 'undefined') {
    console.log('select all users');
    searchParameters = {};
  } else {
    status = 400;
  }

  if(searchParameters) {
    result = yield users.find(searchParameters);
    // result = yield users.find(searchParameters).limit(20);
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
  var document = yield parse.json(this);

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
  //       "total": "2",
  //       "booking_status": "booked"
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
  //       "total":"2",
  //       "booking_status": "waiting"
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
