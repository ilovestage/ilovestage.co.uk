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

  var schema = Event.describe();

  routes.name = 'events';

  routes.del('/:id', authentication, function* (next) {
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

  routes.get('/', function* (next) {
    var events;
    var limit = this.query.limit ? parseInt(this.query.limit) : 50;
    var manipulatedEvents = [];
    // var operators = ['gt', 'gte', 'lt', 'lte'];
    // var operatorIndex = operators.indexOf(this.query.operator);
    var returnFields = {};
    var searchFields = {};
    // var show;

    searchFields = operators.date(searchFields, this.querystring, 'starttime');
    // searchFields = operatorQuery(searchFields, this.querystring, 'bookings');

    if (typeof this.query.showid !== 'undefined') {
      searchFields.showid = this.query.showid;
    }

    if (typeof this.query.eventid !== 'undefined') {
      searchFields.eventid = this.query.eventid;
    }

    events = yield db.collection('events').find(searchFields, returnFields, {
      limit: limit
    }).then(Event);

    if (events.length > 0) {
      _(events).forEach(function(document) {

        co(function* () {
          var bookings = yield Booking.count({
            eventid: document._id.toString()
          });

          return bookings;
        }).then(function(bookings) {
          document.bookings = bookings;

          if (bookings > 0) {
            Booking.collection.aggregate(
            [
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
              },
              {
                $sort: {
                  total: -1
                }
              }
            ],
            function(err, result) {
              if (result && result[0] && result[0].total) {
                document.ticketsBooked = result[0].total;
              } else {
                document.ticketsBooked = 0;
              }

              // if (typeof this.query.bookings !== 'undefined') {
              //   if (operatorIndex >= 0) {
              //     searchFields.bookings = {};
              //     searchFields.bookings['$' + this.query.operator] = parseInt(this.query.bookings);
              //   }
              //   console.log('searchFields', searchFields);
              // }

              manipulatedEvents.push(document);
            });
          } else {
            document.ticketsBooked = 0;

            manipulatedEvents.push(document);
          }

        }, function(err) {
          console.error(err.stack);
        });
      });

      this.locals.result = manipulatedEvents;
      this.locals.status = 200;
    }

    yield next;
  });

  routes.get('/schema', authentication, function* (next) {
    var schema = Event.schema;

    if (authorization.apply(this, ['admin']) === true) {
      this.locals.result = schema;
      this.locals.status = 200;
    }

    yield next;
  });

  routes.get('/:id', function* (next) {
    var event;
    var returnFields = {};
    var searchFields = {};
    var show;

    var id = mongo.toObjectId(this.params.id);

    if (id) {
      searchFields._id = id;

      event = yield db.collection('events').findOne(searchFields, returnFields).then(Event);

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

          show = yield db.collection('shows').findOne(searchFields, returnFields).then(Show);

          event.show = show;
        }

        this.locals.result = event;
        this.locals.status = 200;
      }
    }

    yield next;
  });

  routes.post('/', authentication, function* (next) {
    var event;
    var validator;

    this.locals.document.starttime = moment(this.locals.document.starttime).toDate();
    this.locals.document.endtime = moment(this.locals.document.endtime).toDate();

    if (!this.locals.document.status) {
      this.locals.document.status = 'pending';
    }

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

  routes.put('/:id', authentication, function* (next) {
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

    if (authorization.apply(this, ['admin']) === true) {
      event = yield db.collection('events').update(searchFields, updateFields).then(Event);

      if (event instanceof Object) {
        this.locals.result = event;
        this.locals.status = 200;
      }
    }

    yield next;
  });

  routes.get(/^([^.]+)$/, function* (next) {
    this.locals.status = 404;

    yield next;
  }); //matches everything without an extension

  return routes;
};
