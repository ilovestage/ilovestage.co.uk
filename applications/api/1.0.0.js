'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var _ = require('lodash');
var auth = require('koa-basic-auth');
var bodyParser = require('koa-bodyparser');
var co = require('co');
var conditional = require('koa-conditional-get');
var DJ = require('dot-object');
var etag = require('koa-etag');
var fresh = require('koa-fresh');
var gzip = require('koa-gzip');
var health = require('koa-ping');
var helmet = require('koa-helmet');
var js2xmlparser = require('js2xmlparser');
var koa = require('koa');
// var mongodb = require('mongodb');
var qs = require('koa-qs');
var responseTime = require('koa-response-time');
var router = require('koa-router');
var session = require('koa-generic-session');
var stripe = require('stripe')(packageJson.config.environment[environment].api.stripe.key);
var thunkify = require('thunkify');
var util = require('util');

var cryptography = require(__dirname + '/../_utilities/cryptography');
var date = require(__dirname + '/../_utilities/date');
var email = require(__dirname + '/../_utilities/email');
var internationalization = require(__dirname + '/../_utilities/internationalization');
var mongo = require(__dirname + '/../_utilities/mongo');
var utility = require(__dirname + '/../_utilities/utility');

var dj = new DJ();

// var Booking = require(__dirname + '/../_models/booking');
// var Event = require(__dirname + '/../_models/event');
var Payment = require(__dirname + '/../_models/payment');
// var Show = require(__dirname + '/../_models/show');
var User = require(__dirname + '/../_models/user');

var createCardThunk = thunkify(stripe.customers.create);
var createCardBoundThunk = createCardThunk.bind(stripe.customers);

var createChargeThunk = thunkify(stripe.charges.create);
var createChargeBoundThunk = createChargeThunk.bind(stripe.charges);

var httpBasicAuthCredentials = packageJson.config.http.auth;

var messages = {};

messages.badRequest = 'The request cannot be fulfilled due to bad syntax.';
messages.forbidden = 'Operation forbidden.  Supplied uid not authenticated to access this resource or perform this operation.';
messages.invalidUid = 'Invalid uid format.  Please provide a uid as a 24 character hexadecimal string.';
messages.noUid = 'Please provide a uid as a 24 character hexadecimal string.';
messages.noUserForUid = 'No user found for uid provided in header data.';
messages.requestEntityTooLarge = 'The request is larger than the server is willing or able to process.';
messages.requiresAdminPrivilege = 'Operation requires administrator-level privileges.';
messages.requiresAgentPrivilege = 'Operation requires agent-level privileges.';
messages.resourceNotFound = 'Resource not found.';
// messages.resourceNotAuthorised = 'Operation requires authorisation.';
messages.specifyContentType = 'Unsupported media type';
messages.unauthorised = 'Authorisation required.';
messages.unprocessableEntity = 'The request was well-formed but was unable to be followed due to semantic errors.';
messages.unknownError = 'An unknown error occurred.';

function* isAuthenticated(next) {
  var self = this;

  if(self.request.header.uid) {
    if (self.locals.currentUser) {
      self.locals.status = 200;
      // yield next;
    } else {
      self.locals.message = messages.noUserForUid;
      self.locals.status = 401;
    }
  } else {
    if(!self.request.header.uid) {
      self.locals.message = messages.noUid;
    } else {
      self.locals.message = messages.invalidUid;
    }

    self.locals.status = 401;
  }

  self.locals.body.status = self.locals.status; // use HTTP status code
  self.locals.body.error = self.locals.message;
  self.locals.body.result = self.locals.result;

  yield next;
}

function* setResponse(next) {
  var self = this;

  self.locals.body.status = self.locals.status; // use HTTP status code

  if(!self.locals.message) {
    switch(self.locals.status) {
      case 400:
        self.locals.message = messages.badRequest;
        break;
      case 401:
        self.locals.message = messages.unauthorised;
        break;
      case 403:
        self.locals.message = messages.forbidden;
        break;
      case 404:
        self.locals.message = messages.resourceNotFound;
        break;
      case 413:
        self.locals.message = messages.requestEntityTooLarge;
        break;
      case 415:
        self.locals.message = messages.specifyContentType;
        break;
      case 422:
        self.locals.message = messages.unprocessableEntity;
        break;
      case null:
        self.locals.status = 500;
        self.locals.message = messages.unknownError;
        break;
      default:
        // self.locals.message = 'default response';
        break;
    }
  }

  self.locals.body.error = self.locals.message;
  self.locals.body.result = self.locals.result;
  self.locals.body.originalUrl = self.request.originalUrl;

  if(self.locals.contentType === 'xml') {
    self.body = js2xmlparser('response', self.locals.body);
    self.type = 'application/vnd.api+xml';
  } else {
    self.body = self.locals.body;
    self.type = 'application/vnd.api+json';
  }

  self.status = self.locals.status;

  yield next;
}

function userHasPrivilege(_id) {
  var self = this;
  var uid;

  if(!_id || !self.locals.currentUser) {
    return false;
  }

  if(typeof _id === 'undefined') {
    uid = null;
  } else {
    uid = cryptography.encryptUid(_id.toString()); // to be sent encrypted
  }

  console.log('_id', _id);
  console.log('uid', uid);
  console.log('self.locals.currentUser.uid', self.locals.currentUser.uid);

  if(self.locals.bypassAuthentication === true) {
    console.log('case 1');
    return true;
  } else if(uid === self.locals.currentUser.uid) {
    console.log('case 2');
    return true;
  } else if(self.locals.currentUser.type === 'admin') {
    console.log('case 3');
    return true;
  } else {
    console.log('case 4');
    self.locals.status = 403;
    return false;
  }

}

var app = koa();

app.version = '1.0.0';

app.use(responseTime());

qs(app);

app.use(bodyParser());
// app.use(session());

app.use(health());

app.use(function* (next) {
  var returnFields = {};
  var searchFields = {};

  this.locals = this.locals || {};

  this.locals.body = {};
  this.locals.message = null;

  this.locals.bypassAuthentication = false;

  this.locals.document = this.request.body;
  console.log('this.locals.document 1', this.locals.document);
  if(this.locals.document) {
    dj.object(this.locals.document);
    delete this.locals.document.format;
  }

 if(this.query.bypass === 'true') {
   this.locals.bypassAuthentication = true;
   this.locals.currentUser = 'bypassed';
 } else {
   if(this.request.header.uid) {
     returnFields = {
       _id: 1,
       uid: 1,
       type: 1
     };

     searchFields.uid = utility.toObjectId(this.request.header.uid);

     this.locals.currentUser = yield User.findOne(searchFields, returnFields);
    //  console.log('currentUser', this.locals.currentUser, 'uid', this.request.header.uid);
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
      this.locals.message = messages.unauthorised;
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
});

// if(this.locals.bypassAuthentication !== true) {
  app.use(auth(httpBasicAuthCredentials));
// }

app.use(helmet.defaults());

app.use(router(app));

app.get('/', function* (next) {
  this.locals.result = packageJson.name + ' API version ' + app.version;
  this.locals.status = 200;

  yield next;
});

// Routes: Events
app.get('/events', function* (next) {
  var events;
  var limit = 50;
  var returnFields = {};
  var searchFields = {};
  var show;

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if (typeof this.query.showname !== 'undefined') {
    returnFields._id = 1;

    searchFields = {
      name: this.query.showname
    };

    show = yield Show.findOne(searchFields, returnFields);

    if (!show) {
      this.locals.status = 404;
    } else {
      searchFields.showid = show._id.toString();
    }
  } else if (typeof this.query.showid !== 'undefined') {
    searchFields.showid = this.query.showid;
  }

  if (typeof this.query.eventid !== 'undefined') {
    searchFields.eventid = this.query.eventid;
  }

  events = yield Event.find(searchFields, {
    limit: limit
  });

  _(events).forEach(function (document) {
    co(function* () {
      document.bookings = yield Booking.count({
        eventid: document._id.toString()
      });

      Booking.col.aggregate([
        {
          $match: {
            eventid: document._id.toString()
          }
        },
        {
          $group: {
            _id: '$eventid',
            total: {
              $sum: '$tickets'
            }
          }
        }
      ],
      function (err, result) {
        if(result && result[0] && result[0].total) {
          document.ticketsBooked = result[0].total;
        } else {
          document.ticketsBooked = 0;
        }
      });
    })(next);
  });

  if (!events) {
    this.locals.status = 404;
  } else {
    this.locals.result = events;
    this.locals.status = 200;
  }

  yield next;
});

app.del('/events/:id', isAuthenticated, function* (next) {
  var event;

  event = yield Event.remove({
    _id: this.params.id
  });

  if (!event) {
    this.locals.message = messages.resourceNotFound;
    this.locals.status = 404;
  } else {
    this.locals.result = event;
    this.locals.status = 204;
  }

  yield next;
});

app.get('/events/:id', function* (next) {
  var event;
  var returnFields;
  var searchFields;

  event = yield Event.findOne({
    _id: this.params.id
  });

  if (!event) {
    this.locals.status = 404;
  } else {
    event.bookings = yield Booking.count({
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

      searchFields._id = utility.toObjectId(event.showid);

      show = yield Show.findOne(searchFields, returnFields);

      event.show = show;
    }

    this.locals.result = event;
    this.locals.status = 200;
  }

  yield next;
});

app.post('/events', isAuthenticated, function* (next) {
  var event;

  this.locals.document.starttime = new Date(this.locals.document.starttime);
  this.locals.document.endtime = new Date(this.locals.document.endtime);

  if(!this.locals.document.status) {
    this.locals.document.status = 'pending';
  }

  if(userHasPrivilege.apply(this, ['admin']) === true) {
    event = yield Event.createOne(this.locals.document);

    if (!event) {
      this.locals.status = 404;
    } else {
      this.locals.result = event;
      this.locals.status = 201;
    }
  }

  yield next;
});

app.put('/events/:id', isAuthenticated, function* (next) {
  var event;
  var searchFields = {};
  var updateFields = {};

  searchFields._id = utility.toObjectId(this.params.id);

  if (this.query.replace === 'true') {
    updateFields = this.locals.document;
  } else {
    updateFields = {
      $set: this.locals.document
    };
  }

  if(userHasPrivilege.apply(this, ['admin']) === true) {
    event = yield Event.update(searchFields, updateFields);

    if (!event) {
      this.locals.status = 404;
    } else {
      this.locals.result = event;
      this.locals.status = 200;
    }
  }

  yield next;
});

// Routes: Users
app.del('/users/:id', isAuthenticated, function* (next) {
  var searchFields = {};
  var user;

  searchFields._id = utility.toObjectId(this.params.id);

  user = yield User.remove(searchFields);

  if (!user) {
    this.locals.status = 404;
  } else {
    if(userHasPrivilege.apply(this, [user._id]) === true) {
      this.locals.result = user;
    }

    this.locals.status = 204;
  }

  yield next;
});

app.get('/users', function* (next) {
  var limit = 50;
  var password;
  var returnFields;
  var searchFields = {};
  var user;
  var users;

  returnFields = {
    _id: 1,
    uid: 1, // omit for security reasons
    firstname: 1,
    lastname: 1,
    'strategies.local.email': 1,
    'strategies.oauth2.uid': 1,
    'strategies.facebook.uid': 1,
    'strategies.twitter.uid': 1
  };

  if (this.query.view === 'detailed') {
    if(userHasPrivilege.apply(this, ['admin']) === true) {
      returnFields = {};
    }
  }

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if ((typeof this.query.provider !== 'undefined') && (typeof this.query.uid !== 'undefined')) {
    searchFields['strategies.' + this.query.provider + '.uid'] = this.query.uid;

    returnFields['strategies.' + this.query.provider + '.token'] = 1;

    user = yield User.findOne(searchFields, returnFields);

    if (!user) {
      this.locals.message = 'A user with those credentials does not exist.';
      this.locals.status = 404;
    } else {
      if ((typeof user.strategies !== 'undefined') && (typeof user.strategies[this.query.provider] !== 'undefined') && (typeof user.strategies[this.query.provider].uid !== 'undefined')) {
        if (this.query.token === user.strategies[this.query.provider].token) {
          this.locals.status = 200;
        } else {
          user = {};

          this.locals.message = 'A user with those credentials exists but the supplied token was incorrect.';
          this.locals.status = 401;
        }
      } else {
        user = {};

        this.locals.message = 'A user with those credentials exists but the user has no token set.';
        this.locals.status = 401;
      }

      if ((typeof user !== 'undefined') && (typeof user.strategies !== 'undefined') && (typeof user.strategies[this.query.provider] !== 'undefined') && (typeof user.strategies[this.query.provider].token !== 'undefined')) {
        delete user.strategies[this.query.provider].token;
      }

      this.locals.result = user;
    }
  } else if ((typeof this.query.email !== 'undefined') && (typeof this.query.password !== 'undefined')) {
    searchFields['strategies.local.email'] = this.query.email;

    returnFields['strategies.local.password'] = 1;

    user = yield User.findOne(searchFields, returnFields);

    if (!user) {
      this.locals.message = 'A user with those credentials does not exist.';
      this.locals.status = 404;
    } else {
      if ((typeof user.strategies !== 'undefined') && (typeof user.strategies.local !== 'undefined') && (typeof user.strategies.local.password !== 'undefined')) {
        password = cryptography.encryptPassword(this.query.password);

        if (password === user.strategies.local.password) {
          this.locals.status = 200;
        } else {
          user = {};

          this.locals.message = 'A user with those credentials exists but the supplied password was incorrect.';
          this.locals.status = 401;
        }
      } else {
        user = {};

        this.locals.message = 'A user with those credentials exists but the user has no password set.';
        this.locals.status = 401;
      }

      if ((typeof user !== 'undefined') && (typeof user.strategies !== 'undefined') && (typeof user.strategies.local !== 'undefined') && (typeof user.strategies.local.password !== 'undefined')) {
        delete user.strategies.local.password;
      }

      this.locals.result = user;
    }
  } else {
    if(userHasPrivilege.apply(this, ['admin']) === true) {
      users = yield User.find(searchFields, returnFields, {
        limit: limit
      });

      if (!users) {
        this.locals.message = messages.resourceNotFound;
        this.locals.status = 404;
      } else {
        this.locals.result = users;
        this.locals.status = 200;
      }
    }

  }

  yield next;
});

app.get('/users/:id', isAuthenticated, function* (next) {
  var returnFields;
  var searchFields = {};
  var user;

  searchFields._id = utility.toObjectId(this.params.id);

  returnFields = {
    _id: 1,
    firstname: 1,
    lastname: 1,
    'strategies.local.email': 1
  };

  if (this.query.view === 'detailed') {
    if(userHasPrivilege.apply(this, ['admin']) === true) {
      returnFields = {};
    }
  }

  user = yield User.findOne(searchFields, returnFields);

  if (!user) {
    this.locals.status = 404;
  } else {
    if(userHasPrivilege.apply(this, [user._id]) === true) {
      this.locals.result = user;
      this.locals.status = 200;
    }
  }

  yield next;
});

app.post('/users', function* (next) {
  var card;
  var mailFields = {};
  var orParameters = [];
  var searchFields = {};
  var updateFields = {};
  var user;

  if(userHasPrivilege.apply(this, ['admin']) !== true) {
    if(this.locals.document.type) {
      this.locals.document.type = 'standard';
    }
  }

  if(User.validate(this.locals.document)) {
    if (typeof this.locals.document.strategies !== 'undefined') {
      if((typeof this.locals.document.strategies.local !== 'undefined') && (typeof this.locals.document.strategies.local.email !== 'undefined')) {
        orParameters.push({
          'strategies.local.email': this.locals.document.strategies.local.email
        });
      }

      if((typeof this.locals.document.strategies.oauth2 !== 'undefined') && (typeof this.locals.document.strategies.oauth2.uid !== 'undefined')) {
        orParameters.push({
          'strategies.oauth2.uid': this.locals.document.strategies.oauth2.uid
        });
      }

      if((typeof this.locals.document.strategies.facebook !== 'undefined') && (typeof this.locals.document.strategies.facebook.uid !== 'undefined')) {
        orParameters.push({
          'strategies.facebook.uid': this.locals.document.strategies.facebook.uid
        });
      }

      if((typeof this.locals.document.strategies.twitter !== 'undefined') && (typeof this.locals.document.strategies.twitter.uid !== 'undefined')) {
        orParameters.push({
          'strategies.twitter.uid': this.locals.document.strategies.twitter.uid
        });
      }
    }

    if(orParameters.length > 0) {
      searchFields.$or = orParameters;
    }

    user = yield User.findOne(searchFields);

    if (user) {
      user = {};

      this.locals.message = 'A user with those credentials already exists.';
      this.locals.status = 409;
    } else {
      dj.object(this.locals.document);
      delete this.locals.document.format;

      this.locals.document.strategies.local.password = cryptography.encryptPassword(this.locals.document.strategies.local.password);

      user = yield User.createOne(this.locals.document);

      if (!user) {
        this.locals.status = 404;
      } else {
        card = yield createCardBoundThunk({
          metadata: {
            userid: user._id.toString()
          },
          email: user.strategies.local.email
        });

        updateFields.$set = {
          uid: cryptography.encryptUid(user._id.toString()),
          stripeid: card.id
        };

        searchFields._id = utility.toObjectId(user._id);

        user = yield User.update(searchFields, updateFields, {
          new: true
        });

        if(user && user.stripeid) {
          mailFields.subject = 'Welcome to I Love Stage';
          mailFields.email = user.strategies.local.email;
          mailFields.name = {
            first: user.firstname,
            last: user.lastname
          };

          // email.send(mailFields, 'user-signup');
          email.mailingList.addUser(mailFields);
        }

        if (user && user.strategies && user.strategies.local && user.strategies.local.password) {
          delete user.strategies.local.password;
        }

        this.locals.result = user;
        this.locals.status = 201;
      }
    }
  } else {
    this.locals.message = User.error.message;
    this.locals.status = 400;
  }

  yield next;
});

app.put('/users/:id', isAuthenticated, function* (next) {
  var searchFields = {};
  var updateFields = {};
  var user;

  if(userHasPrivilege.apply(this, ['admin']) !== true) {
    if(this.locals.document.type) {
      delete this.locals.document.type;
    }
  }

  searchFields._id = utility.toObjectId(this.params.id);

  if (this.query.replace === 'true') {
    updateFields = this.locals.document;
  } else {
    updateFields = {
      $set: this.locals.document
    };
  }

  if(userHasPrivilege.apply(this, [this.params.id]) === true) {
    user = yield User.update(searchFields, updateFields);

    if (!user) {
      this.locals.status = 404;
    } else {
      this.locals.result = user;
      this.locals.status = 200;
    }
  }

  yield next;
});

// Routes: Bookings
app.del('/bookings/:id', isAuthenticated, function* (next) {
  var searchFields = {};

  searchFields._id = utility.toObjectId(this.params.id);

  booking = yield Booking.findOne(searchFields);

  if (!booking) {
    this.locals.status = 404;
  } else {
    if(userHasPrivilege.apply(this, [booking.userid]) === true) {
      booking = yield Booking.remove({
        _id: this.params.id
      });

      this.locals.result = booking;
      this.locals.status = 204;
    }
  }

  yield next;
});

// app.get('/bookings', auth(httpBasicAuthCredentials), function* (next) {
app.get('/bookings', function* (next) {
  var bookings;
  var limit = 50;
  var searchFields = {};
  var sortParameters = [];

  if (typeof this.query.userid !== 'undefined') {
    searchFields.userid = this.query.userid;
  }

  if (typeof this.query.eventid !== 'undefined') {
    searchFields.eventid = this.query.eventid;
  }

  if (typeof this.query.status !== 'undefined') {
    searchFields.status = this.query.status;
  }

  if (typeof this.query.sort !== 'undefined') {
    // searchFields.bookings = this.query.bookings;
    sortParameters[this.query.sort] = (this.query.order !== 'ascending') ? -1 : 1;
    // console.log(this.query.sort, this.query.order, sortParameters);
  }

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  bookings = yield Booking.find(searchFields, {
    sort: sortParameters,
    limit: limit
  });

  if(bookings) {
    if((this.query.userid && (userHasPrivilege.apply(this, [this.query.userid]))) || (userHasPrivilege.apply(this, ['admin']))) {
      this.locals.result = bookings;
      this.locals.status = 200;
    }
  } else {
    this.locals.status = 404;
  }

  yield next;
});

app.get('/bookings/:id', isAuthenticated, function* (next) {
  var booking;
  var event;
  var returnFields = {};
  var searchFields = {};

  searchFields._id = utility.toObjectId(this.params.id);

  booking = yield Booking.findOne(searchFields);

  if(booking) {
    if(userHasPrivilege.apply(this, [booking.userid]) === true) {
      if (this.query.view === 'detailed') {
        returnFields = {
          '_id': 1,
          'starttime': 1,
          'endtime': 1,
          'priceband': 1,
          'facevalue': 1,
          'discount_price': 1
        };

        searchFields = {
          _id: booking.eventid
        };

        event = yield Event.findOne(searchFields, returnFields);

        booking.event = event;
      }

      this.locals.result = booking;
      this.locals.status = 200;
    }
  } else {
    this.locals.status = 404;
  }

  yield next;
});

app.post('/bookings', function* (next) {
  var booking;
  var returnFields;
  var searchFields;

  returnFields = {
    _id: 1,
    firstname: 1,
    lastname: 1,
    'strategies.local.email': 1
  };

  if(userHasPrivilege.apply(this, [this.locals.document.userid]) === true) {
    searchFields = {
      _id: this.locals.document.userid
    };

    user = yield User.findOne(searchFields, returnFields);

    if(!user) {
      this.locals.message = 'User referenced by booking could not be found.';
      this.locals.status = 409;
    }

    booking = yield Booking.createOne(this.request.body);

    if (!booking) {
      this.locals.status = 404;
    } else {
      if(booking.tickets >= 8) {
        email.send({
          subject: 'Booking target reached', // Subject line
          email: email.sender.address
        }, 'admin-booking');
      }

      email.send({
        subject: 'Booking confirmed', // Subject line
        email: user.strategies.local.email,
        name: {
          first: user.firstname,
          last: user.lastname
        }
      }, 'user-booking');

      this.locals.result = booking;
      this.locals.status = 201;
    }
  }

  yield next;
});

app.put('/bookings/:id', function* (next) {
  var booking;
  var updateFields = {};
  var returnFields = {};
  var searchFields = {};

  searchFields._id = utility.toObjectId(this.params.id);

  if (this.query.replace === 'true') {
    updateFields = this.locals.document;
  } else {
    updateFields = {
      $set: this.locals.document
    };
  }

  if(userHasPrivilege.apply(this, [this.locals.document.userid]) === true) {
    booking = yield Booking.update(searchFields, updateFields);

    // if(booking && this.locals.document.tickets >= 8) {
    //   returnFields = {
    //     _id: 1,
    //     firstname: 1,
    //     lastname: 1,
    //     'strategies.local.email': 1
    //   };
    //
    //   user = yield User.findById(booking.userid, returnFields);
    //
    //   if(user && user.length > 0) {
    //     email.send({
    //       subject: 'Booking confirmed', // Subject line
    //       email: user.strategies.local.email,
    //       name: {
    //         first: user.firstname,
    //         last: user.lastname
    //       }
    //     }, 'user-booking');
    //
    //     email.send({
    //       subject: 'Booking target reached', // Subject line
    //       email: email.sender.address
    //     }, 'admin-booking');
    //
    //     notification = {
    //       channels: [''],
    //       data: {
    //         alert: 'Booking target reached for booking reference #' + booking._id
    //       }
    //     };
    //
    //     kaiseki.sendPushNotification(notification, function(error, this.locals.result, contents, success) {
    //       if (success) {
    //         console.log('Push notification successfully sent:', contents);
    //       } else {
    //         console.log('Could not send push notification:', error);
    //       }
    //     });
    //   }
    // }

    if (!booking) {
      this.locals.status = 404;
    } else {
      this.locals.result = booking;
      this.locals.status = 200;
    }
  }

  yield next;
});

// Routes: Payments
app.del('/payments/:id', function* (next) {
  var payment;
  var searchFields = {};

  searchFields._id = utility.toObjectId(this.params.id);

  if(userHasPrivilege.apply(this, ['admin']) === true) {
    payment = yield Payment.remove(searchFields);

    if (payment) {
      this.locals.status = 404;
    } else {
      this.locals.result = payment;
      this.locals.status = 204;
    }
  }

  yield next;
});

app.get('/payments', isAuthenticated, function* (next) {
  var limit = 50;
  var payment;
  var searchFields = {};

  if (typeof this.query.processor !== 'undefined') {
    searchFields.processor = this.query.processor;
  } else if (typeof this.query.token !== 'undefined') {
    searchFields.token = this.query.token;
  } else if (typeof this.query !== 'undefined') {
    this.locals.status = 400;
  }

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      // limit = 50;
      this.locals.status = 413;
      yield* setResponse();
      return;
    }
  }

  if(userHasPrivilege.apply(this, ['admin']) === true) {
    payment = yield Payment.find(searchFields, {
      limit: limit
    });

    if (!payment) {
      this.locals.status = 404;
    } else {
      this.locals.result = payment;
      this.locals.status = 200;
    }
  }

  yield next;
});

app.get('/payments/:id', isAuthenticated, function* (next) {
  var payment;
  var searchFields = {};

  payment = yield Payment.findOne({
    _id: this.params.id
  });

  if (!payment) {
    this.locals.status = 404;
  } else {
    booking = yield Booking.findOne({
      _id: payment.bookingid
    });

    if (!booking) {
      this.locals.status = 422;
    } else {
      if(userHasPrivilege.apply(this, [booking.userid]) === true) {
        this.locals.result = payment;
        this.locals.status = 200;
      }
    }
  }

  yield next;
});

app.post('/payments', function* (next) {
  var booking;
  var charge;
  var chargeInfo;
  var payment;
  var user;
  var searchFields;

  // console.log('this.locals.document', this.locals.document);
  // console.log('Valid: ' + validator.validate(this.locals.document, schema.payment, false, true)); // true

  if(Payment.validate(this.locals.document)) {
    this.locals.document.time = new Date();

    if(!this.locals.document.hasOwnProperty('bookingid') || !this.locals.document.hasOwnProperty('processor') || !this.locals.document.hasOwnProperty('currency') || !this.locals.document.hasOwnProperty('amount')) {
      this.locals.status = 400;
    } else {
      searchFields._id = utility.toObjectId(this.locals.document.bookingid);

      booking = yield Booking.findOne(searchFields, {});

      if (!booking) {
        this.locals.status = 404;
      } else {
        this.locals.status = 201;

        searchFields = {
          _id: booking.userid
        };

        user = yield User.findOne(searchFields, {});

        if (!user) {
          this.locals.status = 404;
        } else {
          if(userHasPrivilege.apply(this, [user._id]) === true) {
            chargeInfo = {
              amount: this.locals.document.amount,
              currency: this.locals.document.currency,
              customer: user.stripeid,
              card: user.stripetoken,
              metadata: {
                bookingid: this.locals.document.bookingid
              },
              capture: 'true',
              description: this.locals.document.description
            };

            charge = yield createChargeBoundThunk(chargeInfo);

            payment = yield Payment.createOne(charge);

            if (!payment) {
              this.locals.status = 404;
            } else {
              this.locals.result = payment;
              this.locals.status = 201;
            }
          }

        }
      }
    }
  } else {
    this.locals.message = Payment.error.message;
    this.locals.status = 400;
  }

  yield next;
});

// Routes: Shows
app.del('/shows/:id', isAuthenticated, function* (next) {
  var searchFields = {};
  var show = {};

  searchFields._id = utility.toObjectId(this.params.id);

  if(userHasPrivilege.apply(this, ['admin']) === true) {
    show = yield Show.remove(searchFields);

    if (!show) {
      this.locals.status = 404;
    } else {
      this.locals.result = show;
      this.locals.status = 204;
    }
  }

  yield next;
});

app.get('/shows', function* (next) {
  var limit = 50;
  var searchFields = {};
  var shows;

  if (typeof this.query.name !== 'undefined') {
    if (typeof this.query.lang !== 'undefined') {
      searchFields.name[this.query.lang] = this.query.name;
    }
  } else if (typeof this.query.theatre !== 'undefined') {
    searchFields.theatre = this.query.theatre;
  } else if (typeof this.query !== 'undefined') {
    this.locals.status = 400;
  }

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  shows = yield Show.find(searchFields, {
    limit: limit
  });

  if (!shows) {
    this.locals.status = 404;
  } else {
    if (typeof this.query.lang !== 'undefined') {
      shows = internationalization.translate(
        shows,
        [
          'name',
          'synopsis'
        ],
        this.query.lang
      );
    }

    this.locals.result = shows;
    this.locals.status = 200;
  }

  yield next;
});

app.get('/shows/:id', function* (next) {
  var searchFields = {};
  var show;

  searchFields._id = utility.toObjectId(this.params.id);

  show = yield Show.findOne(searchFields);

  if (!show) {
    this.locals.status = 404;
  } else {
    if (typeof this.query.lang !== 'undefined') {
      show = internationalization.translate(
        show,
        [
          'name',
          'synopsis'
        ],
        this.query.lang
      );
    }

    this.locals.result = show;
    this.locals.status = 200;
  }

  yield next;
});

app.post('/shows', isAuthenticated, function* (next) {
  var show;

  if(userHasPrivilege.apply(this, ['admin']) === true) {
    show = yield Show.createOne(this.locals.document);

    if (!show) {
      this.locals.status = 404;
    } else {
      this.locals.result = show;
      this.locals.status = 201;
    }
  }

  yield next;
});

app.put('/shows/:id', isAuthenticated, function* (next) {
  var updateFields = {};
  var show;

  if (this.query.replace === 'true') {
    updateFields = this.locals.document;
  } else {
    updateFields = {
      $set: this.locals.document
    };
  }

  if(userHasPrivilege.apply(this, ['admin']) === true) {
    show = yield Show.update({
      _id: this.params.id
    }, updateFields);

    if (!show) {
      this.locals.status = 404;
    } else {
      this.locals.result = show;
      this.locals.status = 200;
    }
  }

  yield next;
});

app.post('/shows/:id/reviews', function* (next) {
  var show;
  var searchFields = {};

  searchFields._id = utility.toObjectId(this.params.id);

  // KJP: Add comment, not update
  // if (this.query.replace === 'true') {
  //   fields = {
  //     reviews: this.locals.document
  //   };
  // } else {
  //   fields = {
  //     $push: {
  //       reviews: this.locals.document
  //     }
  //   };
  // }

  if(userHasPrivilege.apply(this, ['admin']) === true) {
    show = yield Show.update(searchFields, updateFields);

    if (!show) {
      this.locals.status = 404;
    } else {
      this.locals.result = show;
      this.locals.status = 201;
    }
  }

  yield next;
});

app.put('/shows/:id/reviews', function* (next) {
  var updateFields = {};
  var show;
  var searchFields = {};

  searchFields._id = utility.toObjectId(this.params.id);

  if (this.query.replace === 'true') {
    updateFields = {
      reviews: this.locals.document
    };
  } else {
    updateFields = {
      $set: {
        reviews: this.locals.document
      }
    };
  }

  if(userHasPrivilege.apply(this, ['admin']) === true) {
    show = yield Show.update(searchFields, updateFields);

    if (!show) {
      this.locals.status = 404;
    } else {
      this.locals.result = show;
      this.locals.status = 200;
    }
  }

  yield next;
});

// Routes: Catch-all
app.get(/^([^.]+)$/, function* (next) {
  status = 404;

  yield next;
}); //matches everything without an extension

app.use(setResponse);

app.use(conditional());
app.use(gzip());
app.use(fresh());
app.use(etag());

module.exports = app;
