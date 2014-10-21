'use strict';

var packageJson = require(__dirname + '/../../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var version = 1.0;

var _ = require('lodash');
var co = require('co');
var DJ = require('dot-object');
var emailTemplates = require('email-templates');
var parse = require('co-body');
// var bodyParser = require('koa-bodyparser');
// var koa = require('koa');
var Kaiseki = require('kaiseki');
// var logger = require('koa-logger');
var mcapi = require('mailchimp-api/mailchimp');
var moment = require('moment');
var nodemailer = require('nodemailer');
var path = require('path');
var qs = require('qs');
// var request = require('koa-request');
var router = require('koa-router');
// var should = require('should');
var stripe = require('stripe')(config.api.stripe.key);
var thunkify = require('thunkify');

var templatesDir = path.resolve(__dirname, '../..', 'source/emails');

var database = require(__dirname + '/../database');

// var app = koa();
// var app = qs(koa());
var db = new database(config.server.database);

var dj = new DJ();

var bookings = db.collection('bookings');
var events = db.collection('events');
var payments = db.collection('payments');
var shows = db.collection('shows');
var users = db.collection('users');

// instantiate kaiseki
var APP_ID = 'mtsgkSQ5au4mNdKOwoVhP7lmAu6pS2qlWsVTLoHL';
var REST_API_KEY = 'CjmGYUFMt0J3wzZGr5xL11FxDIzzS8KlZUzd1GgM';
var kaiseki = new Kaiseki(APP_ID, REST_API_KEY);

// set MailChimp API key here
var mc = new mcapi.Mailchimp('74bfb172f7512186126ea49928bfb217-us9');

// var emailTemplatesThunk = thunkify(emailTemplates);

var transporter = nodemailer.createTransport({ // Prepare nodemailer transport object
  service: 'Gmail',
  auth: {
    user: 'ilovestageapp@gmail.com',
    pass: 'curtaincall'
  }
});

var emailSender = {
  name: 'I Love Stage UK',
  email: 'ilovestageapp@gmail.com'
};

// require('koa-qs')(app);

// logger
// app.use(function* (next) {
  // var start = new Date;
  // var ms = new Date - start;
  // console.log('%s %s - %s', this.method, this.url, ms);
  // yield next;
// });

// app.use(bodyParser());

function sendEmail(layout, locals) {
  emailTemplates(templatesDir, function (err, template) {
    // Send a single email
    console.log('locals', locals);
    template(layout, locals, function (error, html, text) {
      if (error) {
        console.log(error);
      } else {
        var mailOptions = {
          from: emailSender.name + ' <' + emailSender.address + '>', // sender address
          to: {
            name: locals.name.first,
            address: locals.email
          }, // list of receivers
          subject: locals.subject, // Subject line
          text: text, // plaintext body
          html: html // html body
        };

        transporter.sendMail(mailOptions, function (error, info) {
          var response = {};

          if (error) {
            console.log(error);
            response.status = 400;
            response.error = error;
          } else {
            console.log(info.response);
            response.status = 200;
            response.error = info.response;
          }

          return response;
          // BUG: this belongs in route due to context of 'this'
        });
      }
    });

  });

  mc.helper.ping(function(data) {
    console.log('Mailchimp data', data);
    // res.render('index', { title: 'Home' });
  }, function(err) {
    console.log(err);
    if (err.name === 'Invalid_ApiKey') {
      console.log('Invalid API key. Set it in app.js');
    } else if (err.error) {
      console.log(err.code + ': ' + err.error);
    } else {
      console.log('An unknown error occurred');
    }
    // res.render('index', { title: 'Home' });
    console.log('Mailchimp err', err);
  });

  mc.lists.subscribe(
    {
      id: 'a058aa7aa1',
      email: {
        email: locals.email
      }
    }, function(data) {
      console.log('User subscribed successfully! Look for the confirmation email.', data);
    },
    function(error) {
      if (error.error) {
        console.log(error.code + ': ' + error.error);
      } else {
        console.log('There was an error subscribing that user');
      }
    }
  );
}

function handleInternationalization(data, fields, lang) {

  function filterLanguage(data, field, lang) {
    var newValue = null;

    for(var key in data[field]) {
      if(key.indexOf(lang) === 0) {
        newValue = data[field][key];
      }

      delete data[field][key];
    }

    data[field] = newValue;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (!lang) {
    lang = 'en';
  }

  if(Array.isArray(fields)) {
    _(fields).forEach(function(field) {
      filterLanguage(data, field, lang);
    });
  } else if (typeof fields === 'string') {
    filterLanguage(data, fields, lang);
  }

  // use dot notation like 'reviews[0].name' with dot-object e.g. dj.object(result);

  return data;

  /* USAGE:

    var lang = 'ko';

    var data = {
      'item1': {
        'en': 'value in en',
        'fr': 'value in fr',
        'ko': 'value in ko'
      }
    };

    var fields = ['item1'];

    handleInternationalization(data, fields, lang);
  */
}

function handleDateQuery(nestedQuery) {
  // var mydate1 = new Date('Jun 07, 1954');
  // var mydate2 = new Date(2014,9,7);
  // var mydate3 = new Date('2013-12-12T16:00:00.000Z');

  // console.log('mydate1', mydate1.getDate(), mydate1.getMonth(), mydate1.getFullYear());
  // console.log('mydate2', mydate2.getDate(), mydate2.getMonth(), mydate2.getFullYear());
  // console.log('mydate3', mydate3.getDate(), mydate3.getMonth(), mydate3.getFullYear());

  // console.log('this.querystring', this.querystring);
  // console.log('this.query', this.query);
  // console.log('qs', qs.parse(this.querystring));
  var currentDate = new Date();
  var dateParameters = {};
  var searchParameters = {};
  var status = null;

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
  } else if (nestedQuery.range && nestedQuery.units && nestedQuery.timeframe) {
    // console.log('in ranged query');
    searchParameters.starttime = {};

    if(nestedQuery.timeframe === 'past') {
      var rangeStart = moment(currentDate).subtract(nestedQuery.range, nestedQuery.units).toDate(); // e.g. (3, 'months') gives "3 months before currentDate"

      searchParameters.starttime.$gte = rangeStart;
      searchParameters.starttime.$lt = currentDate;
    } else if(nestedQuery.timeframe === 'future') {
      var rangeEnd = moment(currentDate).add(nestedQuery.range, nestedQuery.units).toDate(); // e.g. (3, 'months') gives "3 months after currentDate"

      searchParameters.starttime.$gte = currentDate;
      searchParameters.starttime.$lt = rangeEnd;
    }

    // console.log('searchParameters', searchParameters);
  }

  return {
    status: status,
    dateParameters: dateParameters,
    searchParameters: searchParameters
  };

}

var api = new router();

api.get('/', function* (next) {
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

api.get('/events', function* (next) {
  var errorMessage = null;
  var limit = 50;
  var nestedQuery = qs.parse(this.querystring);
  var result = null;
  var searchParameters = handleDateQuery(nestedQuery).searchParameters;
  var status = handleDateQuery(nestedQuery).status;

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

api.del('/events/:id', function* (next) {
  var errorMessage = null;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = handleDateQuery(nestedQuery).searchParameters;
  var status = handleDateQuery(nestedQuery).status;
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

api.get('/events/:id', function* (next) {
  var errorMessage = null;
  var status = null;
  var eventId = this.params.id;

  var nestedQuery = qs.parse(this.querystring);

  var result = yield events.findById(eventId);

  result.bookings = yield bookings.count({
    eventid: result._id
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

    result.showdetails = show;
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

api.post('/events', function* (next) {
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

api.put('/events/:id', function* (next) {
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

api.del('/users/:id', function* (next) {
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

api.get('/users', function* (next) {
  var errorMessage = null;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = handleDateQuery(nestedQuery).searchParameters;
  var status = handleDateQuery(nestedQuery).status;
  var limit = 50;

  var fields = {
    '_id': 1,
    'firstname': 1,
    'lastname': 1,
    'strategies.local.email': 1
  };

  // console.log(nestedQuery.email, nestedQuery.password);

  if ((typeof nestedQuery.provider !== 'undefined') && (typeof nestedQuery.uid !== 'undefined')) {
    searchParameters['strategies.' + nestedQuery.provider + '.uid'] = nestedQuery.uid;

    if(typeof nestedQuery.token !== 'undefined') {
      searchParameters['strategies.' + nestedQuery.provider + '.token'] = nestedQuery.token;
    }
  } else if ((typeof nestedQuery.email !== 'undefined') && (typeof nestedQuery.password !== 'undefined')) {
    searchParameters['strategies.local.email'] = nestedQuery.email;
    searchParameters['strategies.local.password'] = nestedQuery.password;
  } else {
    status = 400;
  }

  if (nestedQuery.limit && (typeof parseInt(nestedQuery.limit) === 'number')) {
    limit = parseInt(nestedQuery.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if (nestedQuery.view === 'detailed') {
    fields = {};
  }

  var result = yield users.find(searchParameters, {
    fields: fields,
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

api.get('/users/:id', function* (next) {
  var errorMessage = null;
  var status = null;

  var userId = this.params.id;

  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = handleDateQuery(nestedQuery).searchParameters;

  searchParameters._id = userId;

  var fields = {
    '_id': 1,
    'firstname': 1,
    'lastname': 1,
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

api.post('/users', function* (next) {
  var errorMessage = null;
  var status = null;

  var document = yield parse.json(this);

  var createCardThunk = thunkify(stripe.customers.create);
  var createCardBoundThunk = createCardThunk.bind(stripe.customers);

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

  var searchParameters = {
    $or: orParameters
  };

  var result = null;

  // searchParameters['strategies.local.email'] = document.strategies.local.email;

  result = yield users.find(searchParameters);

  if (result && result.length > 0) {
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

      result = yield users.findAndModify({
        _id: originalResult._id
      }, fields);

      var email = sendEmail('user-signup', {
        subject: 'Welcome to I Love Stage', // Subject line
        email: result.strategies.local.email,
        name: {
          first: result.firstname,
          last: result.lastname
        }
      });

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

api.put('/users/:id', function* (next) {
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

api.del('/bookings/:id', function* (next) {
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

api.get('/bookings', function* (next) {
  var errorMessage = null;
  var limit = 50;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = handleDateQuery(nestedQuery).searchParameters;
  var status = handleDateQuery(nestedQuery).status;

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

api.get('/bookings/:id', function* (next) {
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

    booking.eventdetails = event;
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

api.post('/bookings', function* (next) {
  var errorMessage = null;
  var status = null;

  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  var result = yield bookings.insert(document);

  var email = null;

  if(result.tickets >= 8) {
    email = sendEmail('admin-booking', {
      subject: 'Booking target reached', // Subject line
      email: emailSender.address
    });

    status = email.status;
    errorMessage = email.errorMessage;
  }

  var user = yield users.findById(result.userid, {
    fields: {
      '_id': 1,
      'firstname': 1,
      'lastname': 1,
      'email': 1
    }
  });

  email = sendEmail('user-booking', {
    subject: 'Booking confirmed', // Subject line
    email: user.email,
    name: {
      first: user.firstname,
      last: user.lastname
    }
  });

  status = email.status;
  errorMessage = email.errorMessage;

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

api.put('/bookings/:id', function* (next) {
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
        email: 1
      }
    });

    sendEmail('user-booking', {
      subject: 'Booking confirmed', // Subject line
      email: user.email,
      name: {
        first: user.firstname,
        last: user.lastname
      }
    });

    sendEmail('admin-booking', {
      subject: 'Booking target reached', // Subject line
      email: emailSender.address
    });

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

api.del('/payments/:id', function* (next) {
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

api.get('/payments', function* (next) {
  var errorMessage = null;
  var limit = 50;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = handleDateQuery(nestedQuery).searchParameters;
  var status = handleDateQuery(nestedQuery).status;

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

api.get('/payments/:id', function* (next) {
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

api.post('/payments', function* (next) {
  var status = null;
  var errorMessage = null;

  var document = yield parse.json(this);

  dj.object(document);
  delete document.format;

  var createChargeThunk = thunkify(stripe.charges.create);
  var createChargeBoundThunk = createChargeThunk.bind(stripe.charges);

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

// api.put('/payments/:id', function* (next) {
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

api.del('/shows/:id', function* (next) {
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

api.get('/shows', function* (next) {
  var errorMessage = null;
  var limit = 50;
  var nestedQuery = qs.parse(this.querystring);
  var searchParameters = handleDateQuery(nestedQuery).searchParameters;
  var status = handleDateQuery(nestedQuery).status;

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
      result = handleInternationalization(
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

api.get('/shows/:id', function* (next) {
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
      result = handleInternationalization(
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

api.post('/shows', function* (next) {
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

api.put('/shows/:id', function* (next) {
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

api.post('/shows/:id/reviews', function* (next) {
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

api.put('/shows/:id/reviews', function* (next) {
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

api.get(/^([^.]+)$/, function* (next) {
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

module.exports = api;
