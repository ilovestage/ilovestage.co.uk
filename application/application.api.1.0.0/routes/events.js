'use strict';

var _ = require('lodash');
var co = require('co');
var moment = require('moment');

var authentication = require('application/generators/authentication');

var authorization = require('application/functions/authorization');

var mongo = require('application/utilities/mongo');
// var operators = require('application/utilities/operators');

module.exports = function EventsRoutes(configuration, router, db, models) {
  var routes = new router();

  var Booking = models.booking;
  var Event = models.event;
  var Note = models.note;
  var Payment = models.payment;
  var Show = models.show;
  var User = models.user;

  routes.name = 'events';

  routes.del('delete event', '/:id', authentication, function* (next) {
    var event;

    if (authorization.apply(this, ['admin']) === true) {
      event = yield db.collection('events').remove({
        _id: this.params.id
      }).then(Event);

      if (event instanceof Object) {
        this.locals.result = event;
        this.locals.status = 204;
      }
    }

    yield next;
  });

  routes.get('read events', '/', function* (next) {
    var events;
    var limit = this.query.limit ? parseInt(this.query.limit) : 50;
    var manipulatedEvents = [];
    // var manipulatedEvents;
    // var operators = ['gt', 'gte', 'lt', 'lte'];
    // var operatorIndex = operators.indexOf(this.query.operator);
    var returnFields = {};
    // var this.locals.queryOperators = {};
    // var show;

    // this.locals.queryOperators = this.locals.queryOperators.date(this.locals.queryOperators, this.querystring, 'starttime');
    // this.locals.queryOperators = operatorQuery(this.locals.queryOperators, this.querystring, 'bookings');

    // if (typeof this.query.showid !== 'undefined') {
    //   this.locals.queryOperators.showid = this.query.showid;
    // }
    //
    // if (typeof this.query.eventid !== 'undefined') {
    //   this.locals.queryOperators.eventid = this.query.eventid;
    // }

    events = yield db.collection('events').find(this.locals.queryOperators, returnFields, {
      limit: limit
    })
    // .map(function(event) {
    //   co(function* () {
    //     var bookings = yield db.collection('bookings').count({
    //       eventid: event._id.toString()
    //     });
    //
    //     return bookings;
    //   }).then(function(bookings) {
    //     console.log(bookings, event._id);
    //
    //     event.bookings = bookings;
    //   }, function(error) {
    //     console.error(error.stack);
    //   });
    //
    //   return event;
    // })
    // .map(function(event) {
    //   co(function* () {
    //     var ticketsBooked = yield db.collection('bookings').aggregate()
    //     .match({
    //       eventid: event._id.toString()
    //     })
    //     .group({
    //       _id: null,
    //       total: {
    //         $sum: '$tickets'
    //       }
    //     });
    //
    //     if (ticketsBooked.length && ticketsBooked[0] && ticketsBooked[0].total) {
    //       return ticketsBooked[0].total;
    //     } else {
    //       return 0;
    //     }
    //   }).then(function(ticketsBooked) {
    //     console.log(ticketsBooked, event._id);
    //
    //     event.ticketsBooked = ticketsBooked;
    //   }, function(error) {
    //     console.error(error.stack);
    //   });
    //
    //   return event;
    // })
    // .end(function(error, doc) {
    //   console.log(error, doc);
    // })
    .then(Event);

    this.locals.result = events;
    this.locals.status = 200;

    yield next;
  });

  routes.get('describe event', '/schema', authentication, function* (next) {
    var schema = Event.describe();

    if (authorization.apply(this, ['admin']) === true) {
      this.locals.result = schema;
      this.locals.status = 200;
    }

    yield next;
  });

  routes.get('read event', '/:id', function* (next) {
    var event;
    var returnFields = {};
    // var this.locals.queryOperators = {};
    var show;

    var id = mongo.toObjectId(this.params.id);

    if (id) {
      this.locals.queryOperators._id = id;

      event = yield db.collection('events').findOne(this.locals.queryOperators, returnFields).then(Event);

      if (event instanceof Object) {
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

          this.locals.queryOperators._id = mongo.toObjectId(event.showid);

          show = yield db.collection('shows').findOne(this.locals.queryOperators, returnFields).then(Show);

          event.show = show;
        }

        this.locals.result = event;
        this.locals.status = 200;
      }
    }

    yield next;
  });

  routes.post('create event', '/', authentication, function* (next) {
    var event;
    var validator;

    this.locals.document.starttime = moment(this.locals.document.starttime).toDate();
    this.locals.document.endtime = moment(this.locals.document.endtime).toDate();

    // if (!this.locals.document.status) {
    //   this.locals.document.status = 'pending';
    // }

    if (authorization.apply(this, ['admin']) === true) {
      validator = Event.validate(this.locals.document, 'create');

      if (validator.valid === true) {
        event = yield db.collection('events').insert(this.locals.document).then(Event);

        if (event instanceof Object) {
          this.locals.result = event;
          this.locals.status = 201;
        }
      } else {
        this.locals.error = validator;
        this.locals.status = 400;
      }
    }

    yield next;
  });

  routes.put('update event', '/:id', authentication, function* (next) {
    var event;
    // var this.locals.queryOperators = {};
    var updateFields = {};

    this.locals.queryOperators._id = mongo.toObjectId(this.params.id);

    if (this.query.replace === 'true') {
      updateFields = this.locals.document;
    } else {
      updateFields = {
        $set: this.locals.document
      };
    }

    if (authorization.apply(this, ['admin']) === true) {
      event = yield db.collection('events').update(this.locals.queryOperators, updateFields).then(Event);

      if (event instanceof Object) {
        this.locals.result = event;
        this.locals.status = 200;
      }
    }

    yield next;
  });

  routes.get('event not found', /^([^.]+)$/, function* (next) {
    this.locals.status = 404;

    yield next;
  }); //matches everything without an extension

  return routes;
};
