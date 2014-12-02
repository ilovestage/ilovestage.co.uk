'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

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

// Routes: Payments
app.del('/:id', function* (next) {
  var payment;
  var searchFields = {};

  searchFields._id = mongo.toObjectId(this.params.id);

  if(authorizationCheck.apply(this, ['admin']) === true) {
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

app.get('/', authenticationCheck, function* (next) {
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

  if(authorizationCheck.apply(this, ['admin']) === true) {
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

app.get('/:id', authenticationCheck, function* (next) {
  var booking;
  var payment;
  // var searchFields = {};

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
      if(authorizationCheck.apply(this, [booking.userid]) === true) {
        this.locals.result = payment;
        this.locals.status = 200;
      }
    }
  }

  yield next;
});

app.post('/', function* (next) {
  var booking;
  var charge;
  var chargeInfo;
  var payment;
  var user;
  var searchFields;
  var validator;

  // console.log('this.locals.document', this.locals.document);
  // console.log('Valid: ' + validator.validate(this.locals.document, schema.payment, false, true)); // true

  validator = Payment.validate(this.locals.document);

  if(validator.valid === true) {
    this.locals.document.time = new Date();

    if(!this.locals.document.hasOwnProperty('bookingid') || !this.locals.document.hasOwnProperty('processor') || !this.locals.document.hasOwnProperty('currency') || !this.locals.document.hasOwnProperty('amount')) {
      this.locals.status = 400;
    } else {
      searchFields._id = mongo.toObjectId(this.locals.document.bookingid);

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
          if(authorizationCheck.apply(this, [user._id]) === true) {
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
    this.locals.message = deleteKey(validator, ['stack']);
    this.locals.result = this.locals.document;
    this.locals.status = 400;
  }

  yield next;
});

app.get(/^([^.]+)$/, function* (next) {
  this.locals.status = 404;

  yield next;
}); //matches everything without an extension

app.use(setResponse());

module.exports = app;
