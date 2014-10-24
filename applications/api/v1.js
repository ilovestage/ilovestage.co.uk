'use strict';

var packageJson = require(__dirname + '/../../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var version = 1.0;

var _ = require('lodash');
var auth = require('koa-basic-auth');
var bodyParser = require('koa-bodyparser');
var co = require('co');
var DJ = require('dot-object');
var parse = require('co-body');
// var bodyParser = require('koa-bodyparser');
var Kaiseki = require('kaiseki');
var koa = require('koa');
// var logger = require('koa-logger');
var qs = require('qs');
// var request = require('koa-request');
var router = require('koa-router');
var session = require('koa-generic-session');
// var should = require('should');
// var stripe = require('stripe')(config.app.stripe.key);
var stripe = require('stripe')('temp');
var thunkify = require('thunkify');

var database = require(__dirname + '/../database');
var utilities = require(__dirname + '/../modules/utilities');

var app = koa();

// var api = new router();

var db = new database(config.server.database);

var dj = new DJ();

var bookings = db.collection('bookings');
var events = db.collection('events');
var payments = db.collection('payments');
var shows = db.collection('shows');
var users = db.collection('users');

var httpBasicAuthCredentials = {
  name: 'Administrator',
  pass: '1c2c4ed06609421ae8a928c80069b87ba85fc14f'
};

// instantiate kaiseki
var APP_ID = 'mtsgkSQ5au4mNdKOwoVhP7lmAu6pS2qlWsVTLoHL';
var REST_API_KEY = 'CjmGYUFMt0J3wzZGr5xL11FxDIzzS8KlZUzd1GgM';
var kaiseki = new Kaiseki(APP_ID, REST_API_KEY);

var createCardThunk = thunkify(stripe.customers.create);
var createCardBoundThunk = createCardThunk.bind(stripe.customers);

var createChargeThunk = thunkify(stripe.charges.create);
var createChargeBoundThunk = createChargeThunk.bind(stripe.charges);

app.use(function *(next){
  try {
    yield next;
  } catch (error) {
    if (401 === error.status) {
      var errorMessage = 'You are not authorised to access this resource.';
      var status = error.status;

      var body = {
        'status': status, // use HTTP status code
        'error': errorMessage,
        'originalUrl': this.request.originalUrl,
        'result': packageJson.name + ' API version ' + version.toFixed(1)
      };

      this.set('WWW-Authenticate', 'Basic');

      this.body = body;
      this.status = status;
      this.type = 'application/json';
    } else {
      throw error;
    }
  }
});

// app.use(httpBasicAuthCredentials);

// function *isAuthenticated(next) {
//   console.log('isAuthenticated');
//
//   var result = yield users.findById(userId, {
//     fields: {
//       _id: 1
//     }
//   });
//
//   if (!result || result.length < 1) {
//     errorMessage = 'You must sign in to do that.';
//     status = 401;
//   } else {
//     status = 200;
//   }
//
//   if (!this.req.isAuthenticated()) {
//     console.log('Authenticated: false');
//   } else {
//     console.log('Authenticated: true');
//   }
//
//   yield next;
// }

app.use(router(app));
app.use(session());
app.use(bodyParser());

app.get('/', function* (next) {
  var errorMessage = null;
  var status = 200;

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': packageJson.name + ' API version ' + version.toFixed(1)
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
  yield next;
});

// Routes: Events

app.get('/events', function* (next) {
  var errorMessage = null;
  var limit = 50;
  var nestedQuery = qs.parse(this.querystring);
  var result = null;
  var searchParameters = utilities.handleDateQuery(nestedQuery).searchParameters;
  var status = utilities.handleDateQuery(nestedQuery).status;

  if (nestedQuery.limit && (typeof parseInt(nestedQuery.limit) === 'number')) {
    limit = parseInt(nestedQuery.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if (typeof nestedQuery.showname !== 'undefined') {
    var show = yield shows.findOne({
      name: nestedQuery.showname
    }, {
      fields: {
        '_id': 1
      }
    });

    if (!show || show.length < 1) {
      errorMessage = 'No results found for show with name \'' + nestedQuery.showname + '\'.';
      status = 404;
    } else {
      searchParameters.showid = show._id.toString();
    }
  } else if (typeof nestedQuery.showid !== 'undefined') {
    searchParameters.showid = nestedQuery.showid;
  }

  if (typeof nestedQuery.eventid !== 'undefined') {
    searchParameters.eventid = nestedQuery.eventid;
  }

  result = yield events.find(searchParameters, {
    limit: limit
  });

  _(result).forEach(function (doc) {
		co(function *() {
      doc.bookings = yield bookings.count({
        eventid: doc._id
      });
		})(next);
  });

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.del('/events/:id', function* (next) {
  var errorMessage = null;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = utilities.handleDateQuery(nestedQuery).searchParameters;
  var status = utilities.handleDateQuery(nestedQuery).status;
  var eventId = this.params.id;

  var result = yield events.remove({
    _id: eventId
  });

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.get('/events/:id', function* (next) {
  var errorMessage = null;
  var status = null;
  var eventId = this.params.id;

  var nestedQuery = qs.parse(this.querystring);

  var result = yield events.findById(eventId);

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;

    result.bookings = yield bookings.count({
      eventid: eventId
    });

    if (nestedQuery.view === 'detailed') {
      var show = yield shows.findById(result.showid, {
        fields: {
          '-_id': 1,
          'name': 1,
          'theatre': 1,
          'location': 1,
          'synopsis': 1,
          'images': 1
        }
      });

      result.show = show;
    }
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.post('/events', function* (next) {
  var errorMessage = null;
  var status = null;
  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  document.starttime = new Date(document.starttime);
  document.endtime = new Date(document.endtime);

  var result = yield events.insert(document);

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.put('/events/:id', function* (next) {
  var errorMessage = null;
  var status = null;
  var nestedQuery = qs.parse(this.querystring);

  var eventId = this.params.id;

  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  var fields = null;

  if (nestedQuery.replace === 'true') {
    fields = document;
  } else {
    fields = {
      $set: document
    };
  }

  // var result = yield events.updateById(eventId, fields);
  var result = yield events.findAndModify({
    _id: eventId
  }, fields);

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

// Routes: Users

app.del('/users/:id', function* (next) {
  var errorMessage = null;
  var status = null;
  var userId = this.params.id;

  var result = yield users.remove({
    _id: userId
  });

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.get('/users', function* (next) {
  var errorMessage = null;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = utilities.handleDateQuery(nestedQuery).searchParameters;
  var status = utilities.handleDateQuery(nestedQuery).status;
  var limit = 50;

  var result = null;

  var fields = {
    _id: 1,
    firstname: 1,
    lastname: 1,
    'strategies.local.email': 1,
    'strategies.oauth2.uid': 1,
    'strategies.facebook.uid': 1,
    'strategies.twitter.uid': 1
  };

  if (nestedQuery.view === 'detailed') {
    fields = {};
  }

  if (nestedQuery.limit && (typeof parseInt(nestedQuery.limit) === 'number')) {
    limit = parseInt(nestedQuery.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if ((typeof nestedQuery.provider !== 'undefined') && (typeof nestedQuery.uid !== 'undefined')) {
    searchParameters['strategies.' + nestedQuery.provider + '.uid'] = nestedQuery.uid;

    fields['strategies.' + nestedQuery.provider + '.token'] = 1;

    result = yield users.findOne(searchParameters, {
      fields: fields
    });

    if (!result || result.length < 1) {
      errorMessage = 'A user with those credentials does not exist.';
      status = 404;
    } else {
      if ((typeof result.strategies !== 'undefined') && (typeof result.strategies[nestedQuery.provider] !== 'undefined') && (typeof result.strategies[nestedQuery.provider].uid !== 'undefined')) {
        if (nestedQuery.token === result.strategies[nestedQuery.provider].token) {
          status = 200;
        } else {
          result = {};

          errorMessage = 'A user with those credentials exists but the supplied token was incorrect.';
          status = 401;
        }
      } else {
        result = {};

        errorMessage = 'A user with those credentials exists but the user has no token set.';
        status = 401;
      }

      if ((typeof result !== 'undefined') && (typeof result.strategies !== 'undefined') && (typeof result.strategies[nestedQuery.provider] !== 'undefined') && (typeof result.strategies[nestedQuery.provider].token !== 'undefined')) {
        delete result.strategies[nestedQuery.provider].token;
      }

    }
  } else if ((typeof nestedQuery.email !== 'undefined') && (typeof nestedQuery.password !== 'undefined')) {
    searchParameters['strategies.local.email'] = nestedQuery.email;

    fields['strategies.local.password'] = 1;

    result = yield users.findOne(searchParameters, {
      fields: fields
    });

    if (!result || result.length < 1) {
      errorMessage = 'A user with those credentials does not exist.';
      status = 404;
    } else {
      if ((typeof result.strategies !== 'undefined') && (typeof result.strategies.local !== 'undefined') && (typeof result.strategies.local.password !== 'undefined')) {
        if (nestedQuery.password === result.strategies.local.password) {
          status = 200;
        } else {
          result = {};

          errorMessage = 'A user with those credentials exists but the supplied password was incorrect.';
          status = 401;
        }
      } else {
        result = {};

        errorMessage = 'A user with those credentials exists but the user has no password set.';
        status = 401;
      }

      if ((typeof result !== 'undefined') && (typeof result.strategies !== 'undefined') && (typeof result.strategies.local !== 'undefined') && (typeof result.strategies.local.password !== 'undefined')) {
        delete result.strategies.local.password;
      }
    }
  } else {
    result = yield users.find(searchParameters, {
      fields: fields,
      limit: limit
    });

    if (!result || result.length < 1) {
      errorMessage = 'No users found.';
      status = 404;
    } else {
      status = 200;
    }
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.get('/users/:id', function* (next) {
  var errorMessage = null;
  var status = null;

  var userId = this.params.id;

  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = utilities.handleDateQuery(nestedQuery).searchParameters;

  searchParameters._id = userId;

  var fields = {
    _id: 1,
    firstname: 1,
    lastname: 1,
    'strategies.local.email': 1
  };

  if (nestedQuery.view === 'detailed') {
    fields = {};
  }

  // var result = yield users.findById(userId);
  // var result = yield users.findById(userId, fields);
  var result = yield users.find(searchParameters, {
    fields: fields
  });

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.post('/users', function* (next) {
  var errorMessage = null;
  var status = null;

  var document = yield parse.json(this);
  dj.object(document);
  delete document.format;

  var searchParameters = {};

  var orParameters = [];

  if (typeof document.strategies !== 'undefined') {
    if((typeof document.strategies.local !== 'undefined') && (typeof document.strategies.local.email !== 'undefined')) {
      orParameters.push({
        'strategies.local.email': document.strategies.local.email
      });
    }

    if((typeof document.strategies.oauth2 !== 'undefined') && (typeof document.strategies.oauth2.uid !== 'undefined')) {
      orParameters.push({
        'strategies.oauth2.uid': document.strategies.oauth2.uid
      });
    }

    if((typeof document.strategies.facebook !== 'undefined') && (typeof document.strategies.facebook.uid !== 'undefined')) {
      orParameters.push({
        'strategies.facebook.uid': document.strategies.facebook.uid
      });
    }

    if((typeof document.strategies.twitter !== 'undefined') && (typeof document.strategies.twitter.uid !== 'undefined')) {
      orParameters.push({
        'strategies.twitter.uid': document.strategies.twitter.uid
      });
    }
  }

  if(orParameters.length > 0) {
    searchParameters.$or = orParameters;
  }

  var result = null;

  // searchParameters['strategies.local.email'] = document.strategies.local.email;

  result = yield users.find(searchParameters);

  if (result && result.length > 0) {
    result = {};

    errorMessage = 'A user with those credentials already exists.';
    status = 409;
  } else {
    dj.object(document);
    delete document.format;

    result = yield users.insert(document);

    if (!result || result.length < 1) {
      status = 404;
    } else {
      status = 200;

      var originalResult = result;

      var customer = yield createCardBoundThunk({
        metadata: {
          userid: originalResult._id
        },
        email: originalResult.strategies.local.email
      });

      var fields = {
        $set: {
          stripeid: customer.id
        }
      };

      var mailFields = {
        subject: 'Welcome to I Love Stage', // Subject line
        email: result.strategies.local.email,
        name: {
          first: result.firstname,
          last: result.lastname
        }
      };

      result = yield users.findAndModify({
        _id: originalResult._id
      }, fields);

      // var email = utilities.sendEmail(mailFields, 'user-signup');
      var email = utilities.addUserToMailingList(mailFields);

      console.log('email', email);
    }
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.put('/users/:id', function* (next) {
  var errorMessage = null;
  var status = null;

  var nestedQuery = qs.parse(this.querystring);

  var userId = this.params.id;

  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  var fields = null;

  if (nestedQuery.replace === 'true') {
    fields = document;
  } else {
    fields = {
      $set: document
    };
  }

  // var result = yield users.updateById(userId, fields);
  var result = yield users.findAndModify({
    _id: userId
  }, fields);

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

// Routes: Bookings

app.del('/bookings/:id', function* (next) {
  var errorMessage = null;
  var status = null;

  var bookingId = this.params.id;

  var result = yield bookings.remove({
    _id: bookingId
  });

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.get('/bookings', auth(httpBasicAuthCredentials), function* (next) {
  var errorMessage = null;
  var limit = 50;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = utilities.handleDateQuery(nestedQuery).searchParameters;
  var status = utilities.handleDateQuery(nestedQuery).status;

  if (typeof nestedQuery.userid !== 'undefined') {
    searchParameters.userid = nestedQuery.userid;
  }

  if (typeof nestedQuery.eventid !== 'undefined') {
    searchParameters.eventid = nestedQuery.eventid;
  }

  if (typeof nestedQuery.status !== 'undefined') {
    searchParameters.status = nestedQuery.status;
  }

  if (nestedQuery.limit && (typeof parseInt(nestedQuery.limit) === 'number')) {
    limit = parseInt(nestedQuery.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  var result = yield bookings.find(searchParameters, {
    limit: limit
  });

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.get('/bookings/:id', function* (next) {
  var errorMessage = null;
  var status = null;

  var nestedQuery = qs.parse(this.querystring);

  var bookingId = this.params.id;

  var result = null;

  var booking = yield bookings.findById(bookingId);

  if (nestedQuery.view === 'detailed') {
    var event = yield events.findById(booking.eventid, {
      fields: {
        '_id': 1,
        'starttime': 1,
        'endtime': 1,
        'priceband': 1,
        'facevalue': 1,
        'discount_price': 1
      }
    });

    booking.event = event;
  }

  result = booking;

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.post('/bookings', function* (next) {
  var errorMessage = null;
  var status = null;

  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  var result = yield bookings.insert(document);

  var email = null;

  if(result.tickets >= 8) {
    email = utilities.sendEmail({
      subject: 'Booking target reached', // Subject line
      email: utilities.emailSender.address
    }, 'admin-booking');

    status = email.status;
    errorMessage = email.errorMessage;
  }

  var user = yield users.findById(result.userid, {
    fields: {
      _id: 1,
      firstname: 1,
      lastname: 1,
      'strategies.local.email': 1
    }
  });

  utilities.sendEmail({
    subject: 'Booking confirmed', // Subject line
    email: user.strategies.local.email,
    name: {
      first: user.firstname,
      last: user.lastname
    }
  }, 'user-booking');

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.put('/bookings/:id', function* (next) {
  var errorMessage = null;
  var status = null;

  var nestedQuery = qs.parse(this.querystring);

  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  var fields = null;

  if (nestedQuery.replace === 'true') {
    fields = document;
  } else {
    fields = {
      $set: document
    };
  }

  var result = yield bookings.findAndModify({
    _id: this.params.id
  }, fields);

  if(result && document.tickets >= 8) {
    // var user = yield users.findById(result.userid);
    var user = yield users.findById(result.userid, {
      fields: {
        _id: 1,
        firstname: 1,
        lastname: 1,
        'strategies.local.email': 1
      }
    });
    // console.log('user', user);

    if(user && user.length > 0) {
      utilities.sendEmail({
        subject: 'Booking confirmed', // Subject line
        email: user.strategies.local.email,
        name: {
          first: user.firstname,
          last: user.lastname
        }
      }, 'user-booking');

      utilities.sendEmail({
        subject: 'Booking target reached', // Subject line
        email: utilities.emailSender.address
      }, 'admin-booking');

      var notification = {
        channels: [''],
        data: {
          alert: 'Booking target reached for booking reference #' + result._id
        }
      };

      kaiseki.sendPushNotification(notification, function(err, res, contents, success) {
        if (success) {
          console.log('Push notification successfully sent:', contents);
        } else {
          console.log('Could not send push notification:', err);
        }
      });
    }
  }

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

// Routes: Payments

app.del('/payments/:id', function* (next) {
  var errorMessage = null;
  var status = null;

  var paymentId = this.params.id;

  var result = yield payments.remove({
    _id: paymentId
  });

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.get('/payments', function* (next) {
  var errorMessage = null;
  var limit = 50;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = utilities.handleDateQuery(nestedQuery).searchParameters;
  var status = utilities.handleDateQuery(nestedQuery).status;

  if (typeof nestedQuery.processor !== 'undefined') {
    searchParameters.processor = nestedQuery.processor;
  } else if (typeof nestedQuery.token !== 'undefined') {
    searchParameters.token = nestedQuery.token;
  } else if (typeof this.query !== 'undefined') {
    status = 400;
  }

  if (nestedQuery.limit && (typeof parseInt(nestedQuery.limit) === 'number')) {
    limit = parseInt(nestedQuery.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  var result = (searchParameters !== null) ? yield payments.find(searchParameters, {
    limit: limit
  }) : null;

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.get('/payments/:id', function* (next) {
  var status = null;
  var errorMessage = null;

  var paymentId = this.params.id;

  var result = yield payments.findById(paymentId);

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.post('/payments', function* (next) {
  var status = null;
  var errorMessage = null;

  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  var result = null;

  document.time = new Date();

  if(!document.hasOwnProperty('bookingid') || !document.hasOwnProperty('processor') || !document.hasOwnProperty('currency') || !document.hasOwnProperty('amount')) {
    status = 400;
  } else {
    var booking = yield bookings.findById(document.bookingid, {});
    // console.log('booking', booking);
    if (!booking || booking.length < 1) {
      status = 404;
    } else {
      status = 200;

      var user = yield users.findById(booking.userid, {});
      // console.log('user', user);
      if (!user || user.length < 1) {
        status = 404;
      } else {
        status = 200;

        var chargeInfo = {
          amount: document.amount,
          currency: document.currency,
          customer: user.stripeid,
          card: user.stripetoken,
          metadata: {
            bookingid: document.bookingid
          },
          capture: 'true',
          description: document.description
        };

        var charge = yield createChargeBoundThunk(chargeInfo);

        result = yield payments.insert(charge);

        if (!result || result.length < 1) {
          status = 404;
        } else {
          status = 200;
        }
      }
    }
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

// app.put('/payments/:id', function* (next) {
//   var nestedQuery = qs.parse(this.querystring);
//
//   var paymentId = this.params.id;
//
//   var body = yield parse.json(this);
//
//   var fields = null;
//
//   if (nestedQuery.replace === 'true') {
//     fields = body;
//   } else {
//     fields = {
//       $set: body
//     };
//   }
//
//   var result = yield payments.findAndModify({
//     _id: paymentId
//   }, fields);
//
//   this.body = result;
//   this.type = 'application/json';
// });

// Routes: Shows

app.del('/shows/:id', function* (next) {
  var status = null;
  var errorMessage = null;

  var showId = this.params.id;

  var result = yield shows.remove({
    _id: showId
  });

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.get('/shows', function* (next) {
  var errorMessage = null;
  var limit = 50;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = utilities.handleDateQuery(nestedQuery).searchParameters;
  var status = utilities.handleDateQuery(nestedQuery).status;

  if (typeof nestedQuery.name !== 'undefined') {
    searchParameters.name = nestedQuery.name;
  } else if (typeof nestedQuery.theatre !== 'undefined') {
    searchParameters.theatre = nestedQuery.theatre;
  } else if (typeof nestedQuery !== 'undefined') {
    status = 400;
  }

  if (nestedQuery.limit && (typeof parseInt(nestedQuery.limit) === 'number')) {
    limit = parseInt(nestedQuery.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  var result = (searchParameters !== null) ? yield shows.find(searchParameters, {
    limit: limit
  }) : null;

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;

    if (typeof nestedQuery.lang !== 'undefined') {
      result = utilities.handleInternationalization(
        result,
        [
          'name',
          'synopsis'
        ],
        nestedQuery.lang
      );
    }
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.get('/shows/:id', function* (next) {
  var errorMessage = null;
  var status = null;

  var nestedQuery = qs.parse(this.querystring);
  var showId = this.params.id;

  var result = yield shows.findById(showId);

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;

    if (typeof nestedQuery.lang !== 'undefined') {
      result = utilities.handleInternationalization(
        result,
        [
          'name',
          'synopsis'
        ],
        nestedQuery.lang
      );
    }
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.post('/shows', function* (next) {
  var errorMessage = null;
  var status = null;

  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  var result = yield shows.insert(document);

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.put('/shows/:id', function* (next) {
  var errorMessage = null;
  var status = null;

  var nestedQuery = qs.parse(this.querystring);
  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  var showId = this.params.id;
  var fields = null;

  if (nestedQuery.replace === 'true') {
    fields = document;
  } else {
    fields = {
      $set: document
    };
  }

  // var result = yield shows.updateById(showId, fields);
  var result = yield shows.findAndModify({
    _id: showId
  }, fields);

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.post('/shows/:id/reviews', function* (next) {
  var errorMessage = null;
  var status = null;

  var nestedQuery = qs.parse(this.querystring);
  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  var showId = this.params.id;
  var fields = null;

  if (nestedQuery.replace === 'true') {
    fields = {
      reviews: document
    };
  } else {
    fields = {
      $push: {
        reviews: document
      }
    };
  }

  // var result = yield shows.updateById(showId, fields);
  var result = yield shows.findAndModify({
    _id: showId
  }, fields);

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

app.put('/shows/:id/reviews', function* (next) {
  var errorMessage = null;
  var status = null;

  var nestedQuery = qs.parse(this.querystring);
  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  var showId = this.params.id;
  var fields = null;

  if (nestedQuery.replace === 'true') {
    fields = {
      reviews: document
    };
  } else {
    fields = {
      $set: {
        reviews: document
      }
    };
  }

  var result = yield shows.findAndModify({
    _id: showId
  }, fields);

  if (!result || result.length < 1) {
    status = 404;
  } else {
    status = 200;
  }

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': result
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
});

// Routes: Catch-all

app.get(/^([^.]+)$/, function* (next) {
  var errorMessage = null;
  var status = 404;

  var body = {
    'status': status, // use HTTP status code
    'error': errorMessage,
    'originalUrl': this.request.originalUrl,
    'result': packageJson.name + ' API version ' + version.toFixed(1)
  };

  this.body = body;
  this.status = status;
  this.type = 'application/json';
  yield next;
}); //matches everything without an extension

module.exports = app;
