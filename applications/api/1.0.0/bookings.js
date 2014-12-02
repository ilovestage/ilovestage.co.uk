'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var koa = require('koa');
var moment = require('moment');
var router = require('koa-router');

var authenticationCheck = require('_middleware/authenticationCheck');
var authorizationCheck = require('_middleware/authorizationCheck');
var setResponse = require('_middleware/setResponse');

var mongo = require('_utilities/mongo');
var email = require('_utilities/email');

var Booking = require('_models/booking');
var Event = require('_models/event');
var Show = require('_models/show');
var User = require('_models/user');

var app = koa();

app.use(router(app));

app.del('/:id', authenticationCheck, function* (next) {
  var booking;
  var searchFields = {};

  searchFields._id = mongo.toObjectId(this.params.id);

  booking = yield Booking.findOne(searchFields);

  if (!booking) {
    this.locals.status = 404;
  } else {
    if(authorizationCheck.apply(this, [booking.userid]) === true) {
      booking = yield Booking.remove({
        _id: this.params.id
      });

      this.locals.result = booking;
      this.locals.status = 204;
    }
  }

  yield next;
});

app.get('/', function* (next) {
  var bookings;
  var limit = 50;
  var returnFields = {};
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

  bookings = yield Booking.find(searchFields, returnFields, {
    sort: sortParameters,
    limit: limit
  });

  if(bookings) {
    if(authorizationCheck.apply(this, [this.query.userid])) {
      this.locals.result = bookings;
      this.locals.status = 200;
    }
  }
  //  else {
  //   this.locals.status = 404;
  // }

  yield next;
});

app.get('/:id', authenticationCheck, function* (next) {
  console.log('id');
  var booking;
  var event;
  var returnFields = {};
  var searchFields = {};

  searchFields._id = mongo.toObjectId(this.params.id);

  booking = yield Booking.findOne(searchFields);
  console.log('booking', booking);

  if(booking) {
    console.log('booking', booking);

    if(authorizationCheck.apply(this, [booking.userid]) === true) {
      if (this.query.view === 'detailed') {
        returnFields = {
          '_id': 1,
          'starttime': 1,
          'endtime': 1,
          'priceband': 1,
          'facevalue': 1,
          'discount_price': 1
        };
      }

      searchFields = {
        _id: booking.eventid
      };

      event = yield Event.findOne(searchFields, returnFields);

      booking.event = event;

      this.locals.result = booking;
      this.locals.status = 200;
    }
  }
  //  else {
  //   this.locals.status = 404;
  // }

  yield next;
});

app.post('/', function* (next) {
  var booking;
  var event;
  var returnFields;
  // var searchFields;
  var show;
  var user;

  // returnFields = {
  //   _id: 1,
  //   firstname: 1,
  //   lastname: 1,
  //   'strategies.local.email': 1
  // };

  if(authorizationCheck.apply(this, [this.locals.document.userid]) === true) {
    event = yield Event.findOne({
      _id: mongo.toObjectId(this.locals.document.eventid),
    }, {});

    user = yield User.findOne({
      _id: mongo.toObjectId(this.locals.document.userid)
    }, {});

    if(!user) {
      this.locals.message = 'User referenced by booking could not be found.';
      this.locals.status = 409;
    } else if(!event) {
      this.locals.message = 'Event referenced by booking could not be found.';
      this.locals.status = 409;
    } else {
        booking = yield Booking.createOne(this.request.body);

        if (!booking) {
          this.locals.status = 404;
        } else {
          show = yield Show.findOne({
            _id: mongo.toObjectId(event.showid)
          }, {});

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

  yield next;
});

app.put('/:id', function* (next) {
  var booking;
  var updateFields = {};
  // var returnFields = {};
  var searchFields = {};

  searchFields._id = mongo.toObjectId(this.params.id);

  if (this.query.replace === 'true') {
    updateFields = this.locals.document;
  } else {
    updateFields = {
      $set: this.locals.document
    };
  }

  if(authorizationCheck.apply(this, [this.locals.document.userid]) === true) {
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

    if (!booking) {
      this.locals.status = 404;
    } else {
      this.locals.result = booking;
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
