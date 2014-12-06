'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var deleteKey = require('key-del');
var koa = require('koa');
// var moment = require('moment');
var router = require('koa-router');
var stripe = require('stripe')(packageJson.config.environment[environment].api.stripe.key);
var thunkify = require('thunkify');

var setResponse = require('_middleware/setResponse');

var authentication = require('_utilities/authentication');
var authorization = require('_utilities/authorization');
var mongo = require('_utilities/mongo');

var Booking = require('_models/booking');
// var Event = require('_models/event');
var Payment = require('_models/payment');
// var Show = require('_models/show');
var User = require('_models/user');

var createChargeThunk = thunkify(stripe.charges.create);
var createChargeBoundThunk = createChargeThunk.bind(stripe.charges);

var app = koa();

app.use(router(app));

// Routes: Payments
app.del('/:id', function* (next) {
  var payment;
  var searchFields = {};

  searchFields._id = mongo.toObjectId(this.params.id);

  if (authorization.apply(this, ['admin']) === true) {
    payment = yield Payment.remove(searchFields);

    if (payment instanceof Object) {
      this.locals.result = payment;
      this.locals.status = 204;
    }
  }

  yield next;
});

app.get('/', authentication, function* (next) {
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

  if (authorization.apply(this, ['admin']) === true) {
    payment = yield Payment.find(searchFields, {
      limit: limit
    });

    if (payment instanceof Object) {
      this.locals.result = payment;
      this.locals.status = 200;
    }
  }

  yield next;
});

app.get('/schema', authentication, function* (next) {
  if (authorization.apply(this, ['admin']) === true) {
    var schema = Payment.schema;

    this.locals.result = schema;
    this.locals.status = 200;
  }

  yield next;
});

app.get('/:id', authentication, function* (next) {
  var booking;
  var payment;
  var returnFields = {};
  var searchFields = {};

  var id = mongo.toObjectId(this.params.id);

  if (id) {
    searchFields._id = id;

    payment = yield Payment.findOne(searchFields, returnFields);

    if (payment instanceof Object) {
      booking = yield Booking.findOne({
        _id: payment.bookingid
      });

      if (booking instanceof Object) {
        if (authorization.apply(this, [booking.userid]) === true) {
          this.locals.result = payment;
          this.locals.status = 200;
        }
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
  // var returnFields = {};
  var user;
  var searchFields = {};
  var validator;

  // console.log('this.locals.document', this.locals.document);
  // console.log('Valid: ' + validator.validate(this.locals.document, schema.payment, false, true)); // true

  validator = Payment.validate(this.locals.document);

  if (validator.valid === true) {
    searchFields._id = mongo.toObjectId(this.locals.document.bookingid);

    booking = yield Booking.findOne(searchFields, {});

    if (booking instanceof Object) {
      this.locals.status = 201;

      searchFields = {
        _id: booking.userid
      };

      user = yield User.findOne(searchFields, {});

      if (user instanceof Object) {
        if (authorization.apply(this, [user._id]) === true) {
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

          if (payment instanceof Object) {
            this.locals.result = payment;
            this.locals.status = 201;
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
