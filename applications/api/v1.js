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

var bookings = db.collection('bookings');
var events = db.collection('events');
var shows = db.collection('shows');
var users = db.collection('users');

// require('koa-qs')(app);

// logger
app.use(function * (next) {
  // var start = new Date;
  yield next;
  // var ms = new Date - start;
  // console.log('%s %s - %s', this.method, this.url, ms);
});

var api = new router();

api.get('/', function * (next) {
  yield next;
  this.body = packageJson.name + ' API version ' + version.toFixed(1);
  this.type = 'application/json';
});

// Routes: Events

api.get('/events', function * (next) {
  var dateParameters = {};
  var errorMessage = null;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = {};
  var result = null;
  var status = null;
  var limit = 20;

  // var mydate1 = new Date('Jun 07, 1954');
  // var mydate2 = new Date(2014,9,7);
  // var mydate3 = new Date('2013-12-12T16:00:00.000Z');

  // console.log('mydate1', mydate1.getDate(), mydate1.getMonth(), mydate1.getFullYear());
  // console.log('mydate2', mydate2.getDate(), mydate2.getMonth(), mydate2.getFullYear());
  // console.log('mydate3', mydate3.getDate(), mydate3.getMonth(), mydate3.getFullYear());

  // console.log('this.querystring', this.querystring);
  // console.log('this.query', this.query);
  // console.log('qs', qs.parse(this.querystring));

  if (nestedQuery.start || nestedQuery.end) {
    searchParameters.starttime = {};

    if (nestedQuery.start) {
      var dateStart = null;

      if (typeof nestedQuery.start === 'object') {
        dateParameters.start = {
          year: parseInt(nestedQuery.start.year),
          month: parseInt(nestedQuery.start.month),
          date: parseInt(nestedQuery.start.date),
          hours: parseInt(nestedQuery.start.hours) ? parseInt(nestedQuery.start.hours) : 0,
          minutes: parseInt(nestedQuery.start.minutes) ? parseInt(nestedQuery.start.minutes) : 0,
          seconds: parseInt(nestedQuery.start.seconds) ? parseInt(nestedQuery.start.seconds) : 0
        };

        // console.log('dateParameters.start', dateParameters.start);

        dateParameters.start.month -= 1;

        dateStart = new Date(dateParameters.start.year, dateParameters.start.month, dateParameters.start.date, dateParameters.start.hours, dateParameters.start.minutes, dateParameters.start.seconds);
      } else if (typeof nestedQuery.start === 'string') {
        dateStart = new Date(nestedQuery.start);
      }

      // console.log('dateStart', dateStart);

      if (!isNaN(dateStart.getTime())) {
        searchParameters.starttime.$gte = dateStart;
      } else {
        status = 400;
      }

    }

    if (nestedQuery.end) {
      var dateEnd = null;

      if (typeof nestedQuery.end === 'object') {
        dateParameters.end = {
          year: parseInt(nestedQuery.end.year),
          month: parseInt(nestedQuery.end.month),
          date: parseInt(nestedQuery.end.date),
          hours: parseInt(nestedQuery.end.hours) ? parseInt(nestedQuery.end.hours) : 0,
          minutes: parseInt(nestedQuery.end.minutes) ? parseInt(nestedQuery.end.minutes) : 0,
          seconds: parseInt(nestedQuery.end.seconds) ? parseInt(nestedQuery.end.seconds) : 0
        };

        // console.log('dateParameters.end', dateParameters.end);

        dateParameters.end.month -= 1;

        dateEnd = new Date(dateParameters.end.year, dateParameters.end.month, dateParameters.end.date, dateParameters.end.hours, dateParameters.end.minutes, dateParameters.end.seconds);
      } else if (typeof nestedQuery.end === 'string') {
        dateEnd = new Date(nestedQuery.end);
      }

      // console.log('dateEnd', dateEnd);

      if (!isNaN(dateEnd.getTime())) {
        searchParameters.starttime.$lt = dateEnd;
      } else {
        status = 400;
      }

    }
  } else {
    searchParameters = {};
  }

  // console.log('nestedQuery.limit', nestedQuery.limit);

  if (nestedQuery.limit && (typeof parseInt(nestedQuery.limit) === 'number')) {
    limit = parseInt(nestedQuery.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if (searchParameters) {
    result = yield events.find(searchParameters, {
      limit: limit
    });

    if (!result || result.length < 1) {
      status = 404;
    } else {
      status = 200;
    }

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

api.del('/events/:id', function * (next) {
  var eventId = this.params.id;

  var result = yield events.remove({
    _id: eventId
  });

  this.body = result;
  this.type = 'application/json';
});

api.get('/events/:id', function * (next) {
  var eventId = this.params.id;

  var result = yield events.findOne({
    _id: eventId
  });

  this.body = result;
  this.type = 'application/json';
});

api.post('/events', function * (next) {
  var document = yield parse.json(this);

  // var document = {
  //   "showid": 1234,
  //   "availability": 100,
  //   "priceband": "Best Available",
  //   "starttime": "Sat Sep 13 2014 19:00:00 GMT+0100 (BST)",
  //   "endtime": "Sat Sep 13 2014 21:30:00 GMT+0100 (BST)",
  //   "facevalue": 45.00,
  //   "discountprice": 34.50
  //   }
  // };

  document.starttime = new Date(document.starttime);
  document.endtime = new Date(document.endtime);

  var result = yield events.insert(document);

  this.body = result;
  this.type = 'application/json';
});

api.put('/events/:id', function * (next) {
  var nestedQuery = qs.parse(this.querystring);

  var eventId = this.params.id;

  var body = yield parse.json(this);

  var fields = null;

  if (nestedQuery.replace === 'true') {
    fields = body;
  } else {
    fields = {
      $set: body
    };
  }

  var result = yield events.updateById(eventId, fields);

  this.body = result;
  this.type = 'application/json';
});

// Routes: Users

api.del('/users/:id', function * (next) {
  var userId = this.params.id;

  var result = yield users.remove({
    _id: userId
  });

  this.body = result;
  this.type = 'application/json';
});

api.get('/users', function * (next) {
    var nestedQuery = qs.parse(this.querystring);
    var status = null;
    var errorMessage = null;
    var searchParameters = null;
    var result = null;
    var limit = 20;

    console.log(this.query.email, this.query.password);

    if ((typeof this.query.provider !== 'undefined') && (typeof this.query.provider_uid !== 'undefined')) {
      searchParameters = {
        provider: this.query.provider,
        provider_uid: this.query.provider_uid
      }
    } else if ((typeof this.query.email !== 'undefined') && (typeof this.query.password !== 'undefined')) {
      searchParameters = {
        email: this.query.email,
        password: this.query.password
      }
    } else if (typeof this.query !== 'undefined') {
      searchParameters = {};
    } else {
      status = 400;
    }

    if (nestedQuery.limit && (typeof parseInt(nestedQuery.limit) === 'number')) {
      limit = parseInt(nestedQuery.limit);

      if (limit > 50) {
        limit = 50;
      }
    }

    if (searchParameters) {
      result = yield users.find(searchParameters, {
        limit: limit
      });
    }

    if (!result || result.length < 1) {
      status = 404;
    } else {
      status = 200;
    }

    //handle error messages from monk and pass into response below

    var body = {
      "status": status, // use HTTP status code
      "error": errorMessage,
      "result": result
    };

    this.body = body;
    this.status = status;
    this.type = 'application/json';
});

api.get('/users/:id', function * (next) {
  var userId = this.params.id;

  var result = yield users.findById(userId);

  this.body = result;
  this.type = 'application/json';
});

api.post('/users', function * (next) {
  var document = yield parse.json(this);

  // var document = {
  //   "firstname": "mijin",
  //   "lastname": "cho",
  //   "email": "developer.cho@gmail.com",
  //   "password": "mypass1234",
  //   "provider": "twitter",
  //   "provider_uid": "uid123"
  // };

  var result = yield users.insert(document);

  this.body = result;
  this.type = 'application/json';
});

api.put('/users/:id', function * (next) {
  var nestedQuery = qs.parse(this.querystring);

  var userId = this.params.id;

  var body = yield parse.json(this);

  var fields = null;

  if (nestedQuery.replace === 'true') {
    fields = body;
  } else {
    fields = {
      $set: body
    };
  }

  var result = yield users.updateById(userId, fields);

  this.body = result;
  this.type = 'application/json';
});

// Routes: Bookings

api.del('/bookings/:id', function * (next) {
  var bookingId = this.params.id;

  var result = yield bookings.remove({
    _id: bookingId
  });

  this.body = result;
  this.type = 'application/json';
});

api.get('/bookings', function * (next) {
  var nestedQuery = qs.parse(this.querystring);
  var status = null;
  var errorMessage = null;
  var searchParameters = null;
  var result = null;
  var limit = 20;

  console.log(this.query.email, this.query.password);

  if ((typeof this.query.provider !== 'undefined') && (typeof this.query.provider_uid !== 'undefined')) {
    console.log('social');
    searchParameters = {
      provider: this.query.provider,
      provider_uid: this.query.provider_uid
    }
  } else if ((typeof this.query.email !== 'undefined') && (typeof this.query.password !== 'undefined')) {
    console.log('email');
    searchParameters = {
      email: this.query.email,
      password: this.query.password
    }
  } else if (typeof this.query !== 'undefined') {
    console.log('select all bookings');
    searchParameters = {};
  } else {
    status = 400;
  }

  if (nestedQuery.limit && (typeof parseInt(nestedQuery.limit) === 'number')) {
    limit = parseInt(nestedQuery.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if (searchParameters) {
    result = yield bookings.find(searchParameters, {
      limit: limit
    });
  }

  if (!result || result.length < 1) {
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

api.get('/bookings/:id', function * (next) {
  var bookingId = this.params.id;

  var result = yield bookings.findById(bookingId);

  this.body = result;
  this.type = 'application/json';
});

api.post('/bookings', function * (next) {
  var document = yield parse.json(this);

  // var document = {
  //   "userid": "541c5a29bdab5600004fd5fb",
  //   "eventid": "5419ac3d8c387e0000907779",
  //   "tickets": 8
  // };

  var result = yield bookings.insert(document);

  this.body = result;
  this.type = 'application/json';
});

api.put('/bookings/:id', function * (next) {
  var nestedQuery = qs.parse(this.querystring);

  var bookingId = this.params.id;

  var body = yield parse.json(this);

  var fields = null;

  if (nestedQuery.replace === 'true') {
    fields = body;
  } else {
    fields = {
      $set: body
    };
  }

  var result = yield bookings.updateById(bookingId, fields);

  this.body = result;
  this.type = 'application/json';
});

// Routes: Shows

// Routes: Shows

api.del('/shows/:id', function * (next) {
  var showId = this.params.id;

  var result = yield shows.remove({
    _id: showId
  });

  this.body = result;
  this.type = 'application/json';
});

api.get('/shows', function * (next) {
  var nestedQuery = qs.parse(this.querystring);
  var status = null;
  var errorMessage = null;
  var searchParameters = null;
  var result = null;
  var limit = 20;

  if (typeof this.query.show !== 'undefined') {
    searchParameters = {
      show: this.query.show
    }
  } else if (typeof this.query.theatre !== 'undefined') {
    searchParameters = {
      theatre: this.query.theatre
    }
  } else if (typeof this.query !== 'undefined') {
    searchParameters = {};
  } else {
    status = 400;
  }

  if (nestedQuery.limit && (typeof parseInt(nestedQuery.limit) === 'number')) {
    limit = parseInt(nestedQuery.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if (searchParameters) {
    result = yield shows.find(searchParameters, {
      limit: limit
    });
  }

  if (!result || result.length < 1) {
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

api.get('/shows/:id', function * (next) {
  var showId = this.params.id;

  var result = yield shows.findById(showId);

  this.body = result;
  this.type = 'application/json';
});

api.post('/shows', function * (next) {
  var document = yield parse.json(this);

  // var document = {
  //   "show": "Wicked",
  //   "theatre": "Drury Lane Theatre",
  //   "location": "Victoria Street, London, SW1E5EA",
  //   "longitude": 51.496522,
  //   "latitude": -0.142543,
  //   "synopsis": "When Dorothy famously triumphed over the Wicked Witch, we only ever heard one side of the story. Gregory Maguire's acclaimed 1995 novel, 'Wicked: The Life and Times of the Wicked Witch of the West', re-imagined the Land of Oz, creating a parallel universe to the familiar story written by L. Frank Baum and first published as 'The Wonderful Wizard of Oz' in 1900.",
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

  var result = yield shows.insert(document);

  this.body = result;
  this.type = 'application/json';
});

api.put('/shows/:id', function * (next) {
  var nestedQuery = qs.parse(this.querystring);

  var showId = this.params.id;

  var body = yield parse.json(this);

  var fields = null;

  if (nestedQuery.replace === 'true') {
    fields = body;
  } else {
    fields = {
      $set: body
    };
  }

  var result = yield shows.updateById(showId, fields);

  this.body = result;
  this.type = 'application/json';
});

api.post('/shows/:id/reviews', function * (next) {
  var body = yield parse.json(this);
  var nestedQuery = qs.parse(this.querystring);

  var showId = this.params.id;

  var fields = null;

  if (nestedQuery.replace === 'true') {
    fields = {
      reviews: body
    };
  } else {
    fields = {
      $push: {
        reviews: body
      }
    };
  }

  var result = yield shows.updateById(showId, fields);

  this.body = result;
  this.type = 'application/json';
});

// Routes: Catch-all

api.get(/^([^.]+)$/, function * (next) {
  yield next;

  this.body = {
    status: 404,
    error: 'Not found'
  };

  this.status = 404;
  this.type = 'application/json';
}); //matches everything without an extension

module.exports = api;
