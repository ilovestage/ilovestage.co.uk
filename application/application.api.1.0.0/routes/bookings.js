'use strict';

// var moment = require('moment');

var authentication = require('application/generators/authentication');

var authorization = require('application/functions/authorization');

// var dateQuery = require('application/utilities/dateQuery');
var mongo = require('application/utilities/mongo');
var email = require('application/utilities/email');

module.exports = function Routes(configuration, router, db, models) {
  var routes = new router();

  routes.name = 'bookings';

  routes.del('/:id', authentication, function* (next) {
    var booking;
    var searchFields = {};

    if (authorization.apply(this, ['admin']) === true) {
      searchFields._id = mongo.toObjectId(this.params.id);

      booking = yield Booking.findOne(searchFields);

      if (booking instanceof Object) {
        if (authorization.apply(this, [booking.userid]) === true) {
          booking = null;

          booking = yield Booking.remove({
            _id: this.params.id
          });

          this.locals.result = booking;
          this.locals.status = 204;
        }
      }
    }

    yield next;
  });

  routes.get('/', function* (next) {
    var bookings;
    var limit = 50;
    var options;
    var returnFields = {};
    var searchFields = {};
    var sortParameters = [];

    if (authorization.apply(this, [this.query.userid])) {
      searchFields = dateQuery(searchFields, this.query, 'createtime');

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
      }

      if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
        limit = parseInt(this.query.limit);

        if (limit > 50) {
          limit = 50;
        }
      }

      options = {
        sort: sortParameters,
        limit: limit
      };

      bookings = yield Booking.find(searchFields, returnFields, options);

      if (bookings.length > 0) {
        this.locals.result = bookings;
        this.locals.status = 200;
      }

      console.log('I don\'t believe it!!!');
    }

    yield next;
  });

  routes.get('/schema', authentication, function* (next) {
    if (authorization.apply(this, ['admin']) === true) {
      var schema = Booking.schema;

      this.locals.result = schema;
      this.locals.status = 200;
    }

    yield next;
  });

  routes.get('/:id', authentication, function* (next) {
    var booking;
    var event;
    var returnFields = {};
    var searchFields = {};

    var id = mongo.toObjectId(this.params.id);

    if (id) {
      searchFields._id = id;

      booking = yield Booking.findOne(searchFields);

      if (booking instanceof Object) {
        if (authorization.apply(this, [booking.userid]) === true) {
          // if (this.query.view === 'detailed') {
          //   returnFields = {
          //     '_id': 1,
          //     'starttime': 1,
          //     'endtime': 1,
          //     'priceband': 1,
          //     'facevalue': 1,
          //     'discount_price': 1
          //   };
          // }

          searchFields = {
            _id: booking.eventid
          };

          event = yield Event.findOne(searchFields, returnFields);

          if (event instanceof Object) {
            booking.event = event;

            this.locals.result = booking;
            this.locals.status = 200;
          }
        }
      }
    }

    yield next;
  });

  routes.post('/', function* (next) {
    var booking;
    var event;
    // var returnFields;
    // var searchFields;
    var show;
    var user;
    var validator;

    // returnFields = {
    //   _id: 1,
    //   firstname: 1,
    //   lastname: 1,
    //   'strategies.local.email': 1
    // };

    if (authorization.apply(this, [this.locals.document.userid]) === true) {
      this.locals.document.status = 'pending';

      validator = Booking.validate(this.locals.document, 'create');

      if (validator.valid === true) {
        event = yield Event.findOne({
          _id: mongo.toObjectId(this.locals.document.eventid),
        }, {});

        user = yield User.findOne({
          _id: mongo.toObjectId(this.locals.document.userid)
        }, {});

        if (!user) {
          this.locals.message = 'User referenced by booking could not be found.';
          this.locals.status = 409;
        } else if (!event) {
          this.locals.message = 'Event referenced by booking could not be found.';
          this.locals.status = 409;
        } else {
          booking = yield Booking.createOne(this.locals.document);

          console.log('booking', booking);
          console.log('event', event);
          console.log('typeof event.showid', typeof event.showid);
          console.log('mongo.toObjectId(event.showid)', mongo.toObjectId(event.showid));

          if (booking instanceof Object) {
            var test123 = {
              _id: mongo.toObjectId(event.showid)
            };

            console.log('test123', test123);

            show = yield Show.findOne(test123, {});

            console.log('show', show);

            if (show instanceof Object) {
              email.send({
                subject: 'Booking confirmed',
                email: user.strategies.local.email,
                user: user,
                show: show,
                date: moment(event.starttime).format('dddd, MMMM Do YYYY, h:mm:ss a')
              }, 'user-booking');

              this.locals.result = booking;
              this.locals.status = 201;
            }

          }

        }

      } else {
        this.locals.error = validator;
        this.locals.status = 400;
      }

    }

    yield next;
  });

  routes.put('/:id', function* (next) {
    var booking;
    var updateFields = {};
    // var returnFields = {};
    var searchFields = {};

    searchFields._id = mongo.toObjectId(this.params.id);

    this.locals.document.updatetime = moment().toDate();

    if (this.query.replace === 'true') {
      updateFields = this.locals.document;
    } else {
      updateFields = {
        $set: this.locals.document
      };
    }

    if (authorization.apply(this, [this.locals.document.userid]) === true) {
      booking = yield Booking.update(searchFields, updateFields);

      // if (booking && this.locals.document.tickets >= 8) {
      //   returnFields = {
      //     _id: 1,
      //     firstname: 1,
      //     lastname: 1,
      //     'strategies.local.email': 1
      //   };
      //
      //   user = yield User.findById(booking.userid, returnFields);
      //
      //   if (user && user.length > 0) {
      //     email.send({
      //       subject: 'Booking confirmed',
      //       email: user.strategies.local.email,
      //       user: user
      //     }, 'user-booking');
      //
      //     email.send({
      //       subject: 'Booking target reached',
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

      if (booking instanceof Object) {
        this.locals.result = booking;
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
