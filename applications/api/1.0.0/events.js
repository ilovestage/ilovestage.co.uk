'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var _ = require('lodash');
var co = require('co');
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

app.use(router(app));

// Routes: Events
app.get('/', function* (next) {
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

  events = yield Event.find(searchFields, returnFields, {
    limit: limit
  });

  _(events).forEach(function (document) { //TODO: use mongo foreach?
    co(function* () {
      document.bookings = yield Booking.count({
        eventid: document._id.toString()
      });

      Booking.collection.aggregate([
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

      return document;
    }).then(function (document) {
      console.log(document);
      return document;
    }, function (err) {
      console.error(err.stack);
    });
  });

  if (!events) {
    this.locals.status = 404;
  } else {
    this.locals.result = events;
    this.locals.status = 200;
  }

  yield next;
});

app.del('/:id', authenticationCheck, function* (next) {
  var event;

  event = yield Event.remove({
    _id: this.params.id
  });

  if (!event) {
    this.locals.message = this.locals.messages.resourceNotFound;
    this.locals.status = 404;
  } else {
    this.locals.result = event;
    this.locals.status = 204;
  }

  yield next;
});

app.get('/:id', function* (next) {
  var event;
  var returnFields;
  var searchFields;
  var show;

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

      searchFields._id = mongo.toObjectId(event.showid);

      show = yield Show.findOne(searchFields, returnFields);

      event.show = show;
    }

    this.locals.result = event;
    this.locals.status = 200;
  }

  yield next;
});

app.post('/', authenticationCheck, function* (next) {
  var event;

  this.locals.document.starttime = new Date(this.locals.document.starttime);
  this.locals.document.endtime = new Date(this.locals.document.endtime);

  if(!this.locals.document.status) {
    this.locals.document.status = 'pending';
  }

  if(authorizationCheck.apply(this, ['admin']) === true) {
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

app.put('/:id', authenticationCheck, function* (next) {
  var event;
  var searchFields = {};
  var updateFields = {};

  searchFields._id = mongo.toObjectId(this.params.id);

  if (this.query.replace === 'true') {
    updateFields = this.locals.document;
  } else {
    updateFields = {
      $set: this.locals.document
    };
  }

  if(authorizationCheck.apply(this, ['admin']) === true) {
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

app.get(/^([^.]+)$/, function* (next) {
  this.locals.status = 404;

  yield next;
}); //matches everything without an extension

app.use(setResponse());

module.exports = app;
