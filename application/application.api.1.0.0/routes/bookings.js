'use strict';

var moment = require('moment');

var authentication = require('application/generators/authentication');

var authorization = require('application/functions/authorization');

var mongo = require('application/utilities/mongo');
var email = require('application/utilities/email');
// var operators = require('application/utilities/operators');

module.exports = function BookingsRoutes(configuration, router, db, models) {
  var routes = new router();

  var Booking = models.booking;
  var Event = models.event;
  var Note = models.note;
  var Payment = models.payment;
  var Show = models.show;
  var User = models.user;

  routes.name = 'bookings';

  routes.del('delete booking', '/:id', authentication, function* (next) {
    var booking;
    // var this.locals.queryOperators = {};

    if (authorization.apply(this, ['admin']) === true) {
      this.locals.queryOperators._id = mongo.toObjectId(this.params.id);

      booking = yield db.collection('bookings').findOne(this.locals.queryOperators).then(Booking);

      if (booking instanceof Object) {
        if (authorization.apply(this, [booking.userid]) === true) {
          booking = null;

          booking = yield db.collection('bookings').remove({
            _id: this.params.id
          });

          this.locals.result = booking;
          this.locals.status = 204;
        }
      }
    }

    yield next;
  });

  routes.get('read bookings', '/', function* (next) {
    var bookings;
    var limit = this.query.limit ? parseInt(this.query.limit) : 50;
    var options;
    var returnFields = {};
    // var this.locals.queryOperators = {};
    var sortParameters = [];

    if (authorization.apply(this, [this.query.userid])) {
      // this.locals.queryOperators = this.locals.queryOperators.date(this.locals.queryOperators, this.query, 'createtime');

      // if (typeof this.query.userid !== 'undefined') {
      //   this.locals.queryOperators.userid = this.query.userid;
      // }
      //
      // if (typeof this.query.eventid !== 'undefined') {
      //   this.locals.queryOperators.eventid = this.query.eventid;
      // }
      //
      // if (typeof this.query.status !== 'undefined') {
      //   this.locals.queryOperators.status = this.query.status;
      // }
      //
      // if (typeof this.query.sort !== 'undefined') {
      //   sortParameters[this.query.sort] = (this.query.order !== 'ascending') ? -1 : 1;
      // }

      options = {
        sort: sortParameters,
        limit: limit
      };

      bookings = yield db.collection('bookings').find(this.locals.queryOperators, returnFields, options).then(Booking);

      if (bookings.length > 0) {
        this.locals.result = bookings;
        this.locals.status = 200;
      }

    }

    yield next;
  });

  routes.get('describe booking', '/schema', authentication, function* (next) {
    var schema = Booking.describe();

    if (authorization.apply(this, ['admin']) === true) {
      this.locals.result = schema;
      this.locals.status = 200;
    }

    yield next;
  });

  routes.get('read booking', '/:id', authentication, function* (next) {
    var booking;
    var event;
    var returnFields = {};
    // var this.locals.queryOperators = {};

    var id = mongo.toObjectId(this.params.id);

    if (id) {
      this.locals.queryOperators._id = id;

      booking = yield db.collection('bookings').findOne(this.locals.queryOperators).then(Booking);

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

          this.locals.queryOperators = {
            _id: booking.eventid
          };

          event = yield db.collection('events').findOne(this.locals.queryOperators, returnFields).then(Event);

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

  routes.post('create booking', '/', function* (next) {
    var booking;
    var event;
    // var returnFields;
    // var this.locals.queryOperators;
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
        event = yield db.collection('events').findOne({
          _id: mongo.toObjectId(this.locals.document.eventid),
        }, {}).then(Event);

        user = yield db.collection('users').findOne({
          _id: mongo.toObjectId(this.locals.document.userid)
        }, {}).then(User);

        if (!user) {
          this.locals.message = 'User referenced by booking could not be found.';
          this.locals.status = 409;
        } else if (!event) {
          this.locals.message = 'Event referenced by booking could not be found.';
          this.locals.status = 409;
        } else {
          booking = yield db.collection('bookings').insert(this.locals.document).then(Booking);

          console.log('booking', booking);
          console.log('event', event);
          console.log('typeof event.showid', typeof event.showid);
          console.log('mongo.toObjectId(event.showid)', mongo.toObjectId(event.showid));

          if (booking instanceof Object) {
            show = yield db.collection('shows').findOne({
              _id: mongo.toObjectId(event.showid)
            }, {}).then(Show);

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

  routes.put('update booking', '/:id', function* (next) {
    var booking;
    var updateFields = {};
    // var returnFields = {};
    // var this.locals.queryOperators = {};

    this.locals.queryOperators._id = mongo.toObjectId(this.params.id);

    // this.locals.document.updatetime = moment().toDate();

    if (this.query.replace === 'true') {
      updateFields = this.locals.document;
    } else {
      updateFields = {
        $set: this.locals.document
      };
    }

    if (authorization.apply(this, [this.locals.document.userid]) === true) {
      booking = yield db.collection('bookings').update(this.locals.queryOperators, updateFields);

      // if (booking && this.locals.document.tickets >= 8) {
      //   returnFields = {
      //     _id: 1,
      //     firstname: 1,
      //     lastname: 1,
      //     'strategies.local.email': 1
      //   };
      //
      //   user = yield db.collection('users').findById(booking.userid, returnFields).then(User);
      //
      //   if (user && user.length > 0) {
      //     email.send({
      //       subject: 'db.collection('bookings') confirmed',
      //       email: user.strategies.local.email,
      //       user: user
      //     }, 'user-booking');
      //
      //     email.send({
      //       subject: 'db.collection('bookings') target reached',
      //       email: email.sender.address
      //     }, 'admin-booking');
      //
      //     notification = {
      //       channels: [''],
      //       data: {
      //         alert: 'db.collection('bookings') target reached for booking reference #' + booking._id
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

  routes.get('booking not found', /^([^.]+)$/, function* (next) {
    this.locals.status = 404;

    yield next;
  }); //matches everything without an extension

  return routes;
};
