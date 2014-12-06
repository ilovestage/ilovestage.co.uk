'use strict';

// var packageJson = require('package.json');
// var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var _ = require('lodash');
var co = require('co');
var koa = require('koa');
var moment = require('moment');
var qs = require('koa-qs');
var router = require('koa-router');

var setResponse = require('_middleware/setResponse');

var authentication = require('_utilities/authentication');
var authorization = require('_utilities/authorization');
var dateQuery = require('_utilities/dateQuery');
var mongo = require('_utilities/mongo');

var Booking = require('_models/booking');
var Event = require('_models/event');
// var Payment = require('_models/payment');
var Show = require('_models/show');
// var User = require('_models/user');

var app = koa();

app.use(router(app));

qs(app);

app.del('/:id', authentication, function* (next) {
  var event;

  if(authorization.apply(this, ['admin']) === true) {
    event = yield Event.remove({
      _id: this.params.id
    });

    if (event instanceof Object) {
      this.locals.result = event;
      this.locals.status = 204;
    }
  }

  yield next;
});

app.get('/', function* (next) {
  var events;
  var limit = 50;
  var manipulatedEvents = [];
  var returnFields = {};
  var searchFields = {};
  var show;

  searchFields = dateQuery(this.querystring, 'starttime');

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if (typeof this.query.showid !== 'undefined') {
    searchFields.showid = this.query.showid;
  }
  // else if (typeof this.query.showname !== 'undefined') {
  //   returnFields._id = 1;
  //
  //   searchFields.name = this.query.showname;
  //
  //   show = yield Show.findOne(searchFields, returnFields);
  //
  //   if (show) {
  //     searchFields.showid = show._id.toString();
  //   }
  // }

  if (typeof this.query.eventid !== 'undefined') {
    searchFields.eventid = this.query.eventid;
  }

  events = yield Event.find(searchFields, returnFields, {
    limit: limit
  });

  if (events.length > 0) {
    _(events).forEach(function (document) {
      co(function* () {
        var bookings = yield Booking.count({
          eventid: document._id.toString()
        });

        return bookings;
      }).then(function (bookings) {
        document.bookings = bookings;

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

        manipulatedEvents.push(document);
      }, function (err) {
        console.error(err.stack);
      });
    });

    this.locals.result = manipulatedEvents;
    this.locals.status = 200;
  }

  yield next;
});

app.get('/schema', authentication, function* (next) {
  if(authorization.apply(this, ['admin']) === true) {
    var schema = Event.schema;

    this.locals.result = schema;
    this.locals.status = 200;
  }

  yield next;
});

app.get('/:id', function* (next) {
  var event;
  var returnFields = {};
  var searchFields = {};
  var show;

  var id = mongo.toObjectId(this.params.id);

  if(id) {
    searchFields._id = id;

    event = yield Event.findOne(searchFields, returnFields);

    if (event instanceof Object) {
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
  }

  yield next;
});

app.post('/', authentication, function* (next) {
  var event;

  this.locals.document.starttime = moment(this.locals.document.starttime).toDate();
  this.locals.document.endtime = moment(this.locals.document.endtime).toDate();

  if(!this.locals.document.status) {
    this.locals.document.status = 'pending';
  }

  if(authorization.apply(this, ['admin']) === true) {
    event = yield Event.createOne(this.locals.document);

    if (event instanceof Object) {
      this.locals.result = event;
      this.locals.status = 201;
    }
  }

  yield next;
});

app.put('/:id', authentication, function* (next) {
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

  if(authorization.apply(this, ['admin']) === true) {
    event = yield Event.update(searchFields, updateFields);

    if (event instanceof Object) {
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
