'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var _ = require('lodash');
var auth = require('koa-basic-auth');
var bodyParser = require('koa-bodyparser');
var bson = require('bson');
var crypto = require('crypto');
var co = require('co');
var DJ = require('dot-object');
var Kaiseki = require('kaiseki');
var koa = require('koa');
var qs = require('koa-qs');
var router = require('koa-router');
var session = require('koa-generic-session');
var stripe = require('stripe')(packageJson.config.environment[environment].api.stripe.key);
var thunkify = require('thunkify');

var database = require(__dirname + '/../database');
var utilities = require(__dirname + '/../modules/utilities');

var db = new database(packageJson.config.environment[environment].server.database);
var dj = new DJ();
var kaiseki = new Kaiseki(packageJson.config.api.parse.appid, packageJson.config.api.parse.key);

var createCardThunk = thunkify(stripe.customers.create);
var createCardBoundThunk = createCardThunk.bind(stripe.customers);

var createChargeThunk = thunkify(stripe.charges.create);
var createChargeBoundThunk = createChargeThunk.bind(stripe.charges);

var objectid = bson.BSONPure.ObjectID;

var key = packageJson.config.database.key;

var httpBasicAuthCredentials = {
  name: 'Administrator',
  pass: '1c2c4ed06609421ae8a928c80069b87ba85fc14f'
};

var body;
var document;
var errorMessage;
var hash;
var limit;
var notification;
var orParameters;
var result;
var searchParameters;
var status;

var booking;
var bookings;
var event;
var events;
var payment;
var payments;
var show;
var shows;
var user;
var users;

var mailFields;
var returnFields;
var updateFields;

var card;
var charge;
var chargeInfo;
var password;

var app = koa();

app.version = 1.0;

qs(app);

app.use(bodyParser());
app.use(session());

app.use(function *(next) {
  body = {};
  document = {};
  errorMessage = null;
  hash = null;
  limit = 50;
  notification = {};
  orParameters = [];
  result = null;
  searchParameters = {};
  status = null;

  booking = null;
  bookings = null;
  event = null;
  events = null;
  payment = null;
  payments = null;
  show = null;
  shows = null;
  user = null;
  users = null;

  mailFields = {};
  returnFields = {};
  updateFields = {};

  card = null;
  charge = null;
  chargeInfo = null;
  password = null;

  searchParameters = utilities.handleDateQuery(this.query).searchParameters;
  status = utilities.handleDateQuery(this.query).status;

  document = this.request.body;

  if(document) {
    dj.object(document);
    delete document.format;
  }

  try {
    yield next;
  } catch (error) {
    if (401 === error.status) {
      errorMessage = 'You are not authorised to access this resource.';
      status = error.status;

      this.set('WWW-Authenticate', 'Basic');
    } else {
      throw error;
    }
  }
});

app.use(router(app));

// app.use(httpBasicAuthCredentials);

function *isAuthenticated(next) {
  // console.log('isAuthenticated', this.request);

  returnFields = {
    _id: 1
  };

  console.log('isValid', objectid.isValid(this.request.header.uid));

  if(objectid.isValid(this.request.header.uid)) {
    user = yield db.collection('users').findById(this.request.header.uid.toString(), {
      fields: returnFields
    });

    if (!user || user.length < 1) {
      errorMessage = 'Invalid uid provided.';
      status = 401;
    } else {
      status = 200;

      yield next;
    }
  } else {
    errorMessage = 'Invalid uid provided.';
    status = 401;
  }

  body.error = errorMessage;
  body.originalUrl = this.request.originalUrl;
  body.result = result;
  body.status = status; // use HTTP status code

  this.body = body;
  this.status = status;
  this.type = 'application/json';
}

app.get('/', function* (next) {
  result = packageJson.name + ' API version ' + app.version.toFixed(1);
  status = 200;

  yield next;
});

// Routes: Events

app.get('/events', isAuthenticated, function* (next) {
  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if (typeof this.query.showname !== 'undefined') {
    returnFields = {
      '_id': 1
    };

    show = yield db.collection('shows').findOne({
      name: this.query.showname
    }, {
      fields: returnFields
    });

    if (!show || show.length < 1) {
      errorMessage = 'No results found for show with name \'' + this.query.showname + '\'.';
      status = 404;
    } else {
      searchParameters.showid = show._id.toString();
    }
  } else if (typeof this.query.showid !== 'undefined') {
    searchParameters.showid = this.query.showid;
  }

  if (typeof this.query.eventid !== 'undefined') {
    searchParameters.eventid = this.query.eventid;
  }

  events = yield db.collection('events').find(searchParameters, {
    limit: limit
  });

  _(events).forEach(function (doc) {
		co(function *() {
      doc.bookings = yield db.collection('bookings').count({
        eventid: doc._id
      });
		})(next);
  });

  if (!events || events.length < 1) {
    status = 404;
  } else {
    result = events;
    status = 200;
  }

  yield next;
});

app.del('/events/:id', function* (next) {
  event = yield db.collection('events').remove({
    _id: this.params.id
  });

  if (!event || event.length < 1) {
    status = 404;
  } else {
    result = event;
    status = 200;
  }

  yield next;
});

app.get('/events/:id', function* (next) {
  event = yield db.collection('events').findById(this.params.id);

  if (!event || event.length < 1) {
    status = 404;
  } else {
    event.bookings = yield db.collection('bookings').count({
      eventid: this.params.id
    });

    if (this.query.view === 'detailed') {
      returnFields = {
        '-_id': 1,
        'name': 1,
        'theatre': 1,
        'location': 1,
        'synopsis': 1,
        'images': 1
      };

      show = yield db.collection('shows').findById(event.showid, {
        fields: returnFields
      });

      event.show = show;
    }

    result = event;
    status = 200;
  }

  yield next;
});

app.post('/events', function* (next) {
  document.starttime = new Date(document.starttime);
  document.endtime = new Date(document.endtime);

  events = yield db.collection('events').insert(document);

  if (!events || db.collection('events').length < 1) {
    status = 404;
  } else {
    result = events;
    status = 201;
  }

  yield next;
});

app.put('/events/:id', function* (next) {
  if (this.query.replace === 'true') {
    updateFields = document;
  } else {
    updateFields = {
      $set: document
    };
  }

  event = yield db.collection('events').findAndModify({
    _id: this.params.id
  }, updateFields);

  if (!event || event.length < 1) {
    status = 404;
  } else {
    result = event;
    status = 200;
  }

  yield next;
});

// Routes: Users
app.del('/users/:id', function* (next) {
  user = yield db.collection('users').remove({
    _id: this.params.id
  });

  if (!user || user.length < 1) {
    status = 404;
  } else {
    result = user;
    status = 200;
  }

  yield next;
});

app.get('/users', function* (next) {
  returnFields = {
    _id: 1,
    firstname: 1,
    lastname: 1,
    'strategies.local.email': 1,
    'strategies.oauth2.uid': 1,
    'strategies.facebook.uid': 1,
    'strategies.twitter.uid': 1
  };

  if (this.query.view === 'detailed') {
    returnFields = {};
  }

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if ((typeof this.query.provider !== 'undefined') && (typeof this.query.uid !== 'undefined')) {
    searchParameters['strategies.' + this.query.provider + '.uid'] = this.query.uid;

    returnFields['strategies.' + this.query.provider + '.token'] = 1;

    user = yield db.collection('users').findOne(searchParameters, {
      fields: returnFields
    });

    if (!user || user.length < 1) {
      errorMessage = 'A user with those credentials does not exist.';
      status = 404;
    } else {
      if ((typeof user.strategies !== 'undefined') && (typeof user.strategies[this.query.provider] !== 'undefined') && (typeof user.strategies[this.query.provider].uid !== 'undefined')) {
        if (this.query.token === user.strategies[this.query.provider].token) {
          status = 200;
        } else {
          user = {};

          errorMessage = 'A user with those credentials exists but the supplied token was incorrect.';
          status = 401;
        }
      } else {
        user = {};

        errorMessage = 'A user with those credentials exists but the user has no token set.';
        status = 401;
      }

      if ((typeof user !== 'undefined') && (typeof user.strategies !== 'undefined') && (typeof user.strategies[this.query.provider] !== 'undefined') && (typeof user.strategies[this.query.provider].token !== 'undefined')) {
        delete user.strategies[this.query.provider].token;
      }

      result = user;
    }
  } else if ((typeof this.query.email !== 'undefined') && (typeof this.query.password !== 'undefined')) {
    searchParameters['strategies.local.email'] = this.query.email;

    returnFields['strategies.local.password'] = 1;

    user = yield db.collection('users').findOne(searchParameters, {
      fields: returnFields
    });

    if (!user || user.length < 1) {
      errorMessage = 'A user with those credentials does not exist.';
      status = 404;
    } else {
      if ((typeof user.strategies !== 'undefined') && (typeof user.strategies.local !== 'undefined') && (typeof user.strategies.local.password !== 'undefined')) {
        hash = crypto.createHmac('sha512', packageJson.config.database.key);
        hash.update(this.query.password);
        password = hash.digest('hex');

        if (password === user.strategies.local.password) {
          status = 200;
        } else {
          user = {};

          errorMessage = 'A user with those credentials exists but the supplied password was incorrect.';
          status = 401;
        }
      } else {
        user = {};

        errorMessage = 'A user with those credentials exists but the user has no password set.';
        status = 401;
      }

      if ((typeof user !== 'undefined') && (typeof user.strategies !== 'undefined') && (typeof user.strategies.local !== 'undefined') && (typeof user.strategies.local.password !== 'undefined')) {
        delete user.strategies.local.password;
      }

      result = user;
    }
  } else {
    users = yield db.collection('users').find(searchParameters, {
      fields: returnFields,
      limit: limit
    });

    if (!users || users.length < 1) {
      errorMessage = 'No users found.';
      status = 404;
    } else {
      result = users;
      status = 200;
    }
  }

  yield next;
});

app.get('/users/:id', function* (next) {
  searchParameters._id = this.params.id;

  returnFields = {
    _id: 1,
    firstname: 1,
    lastname: 1,
    'strategies.local.email': 1
  };

  if (this.query.view === 'detailed') {
    returnFields = {};
  }

  user = yield db.collection('users').find(searchParameters, {
    fields: returnFields
  });

  if (!user || user.length < 1) {
    status = 404;
  } else {
    result = user;
    status = 200;
  }

  yield next;
});

app.post('/users', function* (next) {
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

  // searchParameters['strategies.local.email'] = document.strategies.local.email;

  user = yield db.collection('users').find(searchParameters);

  if (user && user.length > 0) {
    user = {};

    errorMessage = 'A user with those credentials already exists.';
    status = 409;
  } else {
    hash = crypto.createHmac('sha512', key);
    hash.update(document.strategies.local.password);
    document.strategies.local.password = hash.digest('hex');

    dj.object(document);
    delete document.format;

    user = yield db.collection('users').insert(document);

    if (!user || user.length < 1) {
      status = 404;
    } else {
      card = yield createCardBoundThunk({
        metadata: {
          userid: user._id
        },
        email: user.strategies.local.email
      });

      updateFields = {
        $set: {
          stripeid: card.id
        }
      };

      user = yield db.collection('users').findAndModify({
        _id: user._id
      }, updateFields);

      if(user && user.stripeid) {
        mailFields = {
          subject: 'Welcome to I Love Stage', // Subject line
          email: user.strategies.local.email,
          name: {
            first: user.firstname,
            last: user.lastname
          }
        };

        // utilities.sendEmail(mailFields, 'user-signup');
        utilities.addUserToMailingList(mailFields);
      }

      if ((typeof user !== 'undefined') && (typeof user.strategies !== 'undefined') && (typeof user.strategies.local !== 'undefined') && (typeof user.strategies.local.password !== 'undefined')) {
        delete user.strategies.local.password;
      }

      result = user;
      status = 201;
    }
  }

  yield next;
});

app.put('/users/:id', function* (next) {
  if (this.query.replace === 'true') {
    updateFields = document;
  } else {
    updateFields = {
      $set: document
    };
  }

  user = yield db.collection('users').findAndModify({
    _id: this.params.id
  }, updateFields);

  if (!user || user.length < 1) {
    status = 404;
  } else {
    result = user;
    status = 200;
  }

  yield next;
});

// Routes: Bookings
app.del('/bookings/:id', function* (next) {
  booking = yield db.collection('bookings').remove({
    _id: this.params.id
  });

  if (!booking || booking.length < 1) {
    status = 404;
  } else {
    result = booking;
    status = 200;
  }

  yield next;
});

app.get('/bookings', auth(httpBasicAuthCredentials), function* (next) {
  if (typeof this.query.userid !== 'undefined') {
    searchParameters.userid = this.query.userid;
  }

  if (typeof this.query.eventid !== 'undefined') {
    searchParameters.eventid = this.query.eventid;
  }

  if (typeof this.query.status !== 'undefined') {
    searchParameters.status = this.query.status;
  }

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  bookings = yield db.collection('bookings').find(searchParameters, {
    limit: limit
  });

  if (!bookings || bookings.length < 1) {
    status = 404;
  } else {
    result = bookings;
    status = 200;
  }

  yield next;
});

app.get('/bookings/:id', function* (next) {
  booking = yield db.collection('bookings').findById(this.params.id);

  if (this.query.view === 'detailed') {
    returnFields = {
      '_id': 1,
      'starttime': 1,
      'endtime': 1,
      'priceband': 1,
      'facevalue': 1,
      'discount_price': 1
    };

    event = yield db.collection('events').findById(booking.eventid, {
      fields: returnFields
    });

    booking.event = event;
  }

  if (!result || result.length < 1) {
    status = 404;
  } else {
    result = booking;
    status = 200;
  }

  yield next;
});

app.post('/bookings', function* (next) {
  returnFields = {
    _id: 1,
    firstname: 1,
    lastname: 1,
    'strategies.local.email': 1
  };

  user = yield db.collection('users').findById(document.userid, {
    fields: returnFields
  });

  if(!user || user.length < 1) {
    errorMessage = 'User referenced by booking could not be found.';
    status = 409;
  }

  booking = yield db.collection('bookings').insert(this.request.body);

  if(booking.tickets >= 8) {
    utilities.sendEmail({
      subject: 'Booking target reached', // Subject line
      email: utilities.emailSender.address
    }, 'admin-booking');
  }

  if (!booking || booking.length < 1) {
    status = 404;
  } else {
    utilities.sendEmail({
      subject: 'Booking confirmed', // Subject line
      email: user.strategies.local.email,
      name: {
        first: user.firstname,
        last: user.lastname
      }
    }, 'user-booking');

    result = booking;
    status = 201;
  }

  yield next;
});

app.put('/bookings/:id', function* (next) {
  if (this.query.replace === 'true') {
    updateFields = document;
  } else {
    updateFields = {
      $set: document
    };
  }

  booking = yield db.collection('bookings').findAndModify({
    _id: this.params.id
  }, updateFields);

  if(booking && document.tickets >= 8) {
    returnFields = {
      _id: 1,
      firstname: 1,
      lastname: 1,
      'strategies.local.email': 1
    };

    user = yield db.collection('users').findById(booking.userid, {
      fields: returnFields
    });

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

      notification = {
        channels: [''],
        data: {
          alert: 'Booking target reached for booking reference #' + booking._id
        }
      };

      kaiseki.sendPushNotification(notification, function(error, result, contents, success) {
        if (success) {
          console.log('Push notification successfully sent:', contents);
        } else {
          console.log('Could not send push notification:', error);
        }
      });
    }
  }

  if (!booking || booking.length < 1) {
    status = 404;
  } else {
    result = booking;
    status = 200;
  }

  yield next;
});

// Routes: Payments
app.del('/payments/:id', function* (next) {
  payment = yield db.collection('payments').remove({
    _id: this.params.id
  });

  if (!payment || payment.length < 1) {
    status = 404;
  } else {
    result = payment;
    status = 200;
  }

  yield next;
});

app.get('/payments', function* (next) {
  if (typeof this.query.processor !== 'undefined') {
    searchParameters.processor = this.query.processor;
  } else if (typeof this.query.token !== 'undefined') {
    searchParameters.token = this.query.token;
  } else if (typeof this.query !== 'undefined') {
    status = 400;
  }

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  payments = (searchParameters !== null) ? yield db.collection('payments').find(searchParameters, {
    limit: limit
  }) : null;

  if (!payments || payments.length < 1) {
    status = 404;
  } else {
    result = payments;
    status = 200;
  }

  yield next;
});

app.get('/payments/:id', function* (next) {
  payment = yield db.collection('payments').findById(this.params.id);

  if (!payment || payment.length < 1) {
    status = 404;
  } else {
    result = payment;
    status = 200;
  }

  yield next;
});

app.post('/payments', function* (next) {
  document.time = new Date();

  if(!document.hasOwnProperty('bookingid') || !document.hasOwnProperty('processor') || !document.hasOwnProperty('currency') || !document.hasOwnProperty('amount')) {
    status = 400;
  } else {
    booking = yield db.collection('bookings').findById(document.bookingid, {});
    // console.log('booking', booking);
    if (!booking || booking.length < 1) {
      status = 404;
    } else {
      status = 201;

      user = yield db.collection('users').findById(booking.userid, {});
      // console.log('user', user);
      if (!user || user.length < 1) {
        status = 404;
      } else {
        chargeInfo = {
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

        charge = yield createChargeBoundThunk(chargeInfo);

        payment = yield db.collection('payments').insert(charge);

        if (!payment || payment.length < 1) {
          status = 404;
        } else {
          result = payment;
          status = 201;
        }
      }
    }
  }

  yield next;
});

// Routes: Shows
app.del('/shows/:id', function* (next) {
  show = yield db.collection('shows').remove({
    _id: this.params.id
  });

  if (!show || show.length < 1) {
    status = 404;
  } else {
    result = show;
    status = 200;
  }

  yield next;
});

app.get('/shows', function* (next) {
  if (typeof this.query.name !== 'undefined') {
    searchParameters.name = this.query.name;
  } else if (typeof this.query.theatre !== 'undefined') {
    searchParameters.theatre = this.query.theatre;
  } else if (typeof this.query !== 'undefined') {
    status = 400;
  }

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  shows = (searchParameters !== null) ? yield db.collection('shows').find(searchParameters, {
    limit: limit
  }) : null;

  if (!shows || shows.length < 1) {
    status = 404;
  } else {
    if (typeof this.query.lang !== 'undefined') {
      shows = utilities.handleInternationalization(
        shows,
        [
          'name',
          'synopsis'
        ],
        this.query.lang
      );
    }

    result = shows;
    status = 200;
  }

  yield next;
});

app.get('/shows/:id', function* (next) {
  show = yield db.collection('shows').findById(this.params.id);

  if (!show || show.length < 1) {
    status = 404;
  } else {
    if (typeof this.query.lang !== 'undefined') {
      show = utilities.handleInternationalization(
        show,
        [
          'name',
          'synopsis'
        ],
        this.query.lang
      );
    }

    result = show;
    status = 200;
  }

  yield next;
});

app.post('/shows', function* (next) {
  show = yield db.collection('shows').insert(document);

  if (!show || show.length < 1) {
    status = 404;
  } else {
    result = show;
    status = 201;
  }

  yield next;
});

app.put('/shows/:id', function* (next) {
  if (this.query.replace === 'true') {
    updateFields = document;
  } else {
    updateFields = {
      $set: document
    };
  }

  show = yield db.collection('shows').findAndModify({
    _id: this.params.id
  }, updateFields);

  if (!show || show.length < 1) {
    status = 404;
  } else {
    result = show;
    status = 200;
  }

  yield next;
});

app.post('/shows/:id/reviews', function* (next) {
  // KJP: Add comment, not update
  // if (this.query.replace === 'true') {
  //   fields = {
  //     reviews: document
  //   };
  // } else {
  //   fields = {
  //     $push: {
  //       reviews: document
  //     }
  //   };
  // }

  show = yield db.collection('shows').findAndModify({
    _id: this.params.id
  }, updateFields);

  if (!show || show.length < 1) {
    status = 404;
  } else {
    result = show;
    status = 201;
  }

  yield next;
});

app.put('/shows/:id/reviews', function* () {
  if (this.query.replace === 'true') {
    updateFields = {
      reviews: document
    };
  } else {
    updateFields = {
      $set: {
        reviews: document
      }
    };
  }

  show = yield db.collection('shows').findAndModify({
    _id: this.params.id
  }, updateFields);

  if (!show || show.length < 1) {
    status = 404;
  } else {
    result = show;
    status = 200;
  }

  yield next;
});

// Routes: Catch-all
app.get(/^([^.]+)$/, function* (next) {
  status = 404;

  yield next;
}); //matches everything without an extension

app.use(function *(next) {
  body.error = errorMessage;
  body.originalUrl = this.request.originalUrl;
  body.result = result;
  body.status = status; // use HTTP status code

  this.body = body;
  this.status = status;
  this.type = 'application/json';

  yield next;
});

module.exports = app;
