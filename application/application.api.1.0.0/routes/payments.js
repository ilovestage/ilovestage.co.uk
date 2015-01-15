'use strict';

// var _ = require('lodash');
// var co = require('co');
// var moment = require('moment');

var authentication = require('application/generators/authentication');

var authorization = require('application/functions/authorization');

var mongo = require('application/utilities/mongo');
// var operators = require('application/utilities/operators');

module.exports = function PaymentsRoutes(configuration, router, db, models) {
  var stripe = require('stripe')(configuration.local.api.stripe.key);
  var thunkify = require('thunkify');

  var createChargeThunk = thunkify(stripe.charges.create);
  var createChargeBoundThunk = createChargeThunk.bind(stripe.charges);

  var routes = new router();

  var Booking = models.booking;
  var Event = models.event;
  var Note = models.note;
  var Payment = models.payment;
  var Show = models.show;
  var User = models.user;

  routes.name = 'payments';

  routes.del('delete payment', '/:id', function* (next) {
    var payment;
    // var this.locals.queryOperators = {};

    this.locals.queryOperators._id = mongo.toObjectId(this.params.id);

    if (authorization.apply(this, ['admin']) === true) {
      payment = yield db.collection('payments').remove(this.locals.queryOperators).then(Payment);

      if (payment instanceof Object) {
        this.locals.result = payment;
        this.locals.status = 204;
      }
    }

    yield next;
  });

  routes.get('read payments', '/', authentication, function* (next) {
    var limit = this.query.limit ? parseInt(this.query.limit) : 50;
    var payments;
    // var this.locals.queryOperators = {};

    if (typeof this.query.processor !== 'undefined') {
      this.locals.queryOperators.processor = this.query.processor;
    } else if (typeof this.query.token !== 'undefined') {
      this.locals.queryOperators.token = this.query.token;
    } else if (typeof this.query !== 'undefined') {
      this.locals.status = 400;
    }

    if (authorization.apply(this, ['admin']) === true) {
      payments = yield db.collection('payments').find(this.locals.queryOperators, {
        limit: limit
      }).then(Payment);

      if (payments.length > 0) {
        this.locals.result = payments;
        this.locals.status = 200;
      }
    }

    yield next;
  });

  routes.get('describe payment', '/schema', authentication, function* (next) {
    var schema = Payment.describe();

    if (authorization.apply(this, ['admin']) === true) {
      this.locals.result = schema;
      this.locals.status = 200;
    }

    yield next;
  });

  routes.get('read payment', '/:id', authentication, function* (next) {
    var booking;
    var payment;
    var returnFields = {};
    // var this.locals.queryOperators = {};

    var id = mongo.toObjectId(this.params.id);

    if (id) {
      this.locals.queryOperators._id = id;

      payment = yield db.collection('payments').findOne(this.locals.queryOperators, returnFields).then(Payment);

      if (payment instanceof Object) {
        booking = yield db.collection('bookings').findOne({
          _id: payment.bookingid
        }).then(Booking);

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

  routes.post('create payment', '/', function* (next) {
    var booking;
    var charge;
    var chargeInfo;
    var payment;
    // var returnFields = {};
    var user;
    // var this.locals.queryOperators = {};
    var validator;

    // console.log('this.locals.document', this.locals.document);
    // console.log('Valid: ' + validator.validate(this.locals.document, schema.payment, false, true)); // true

    validator = Payment.validate(this.locals.document, 'create');

    if (validator.valid === true) {
      this.locals.queryOperators._id = mongo.toObjectId(this.locals.document.bookingid);

      booking = yield db.collection('bookings').findOne(this.locals.queryOperators, {}).then(Booking);

      if (booking instanceof Object) {
        this.locals.status = 201;

        this.locals.queryOperators = {
          _id: booking.userid
        };

        user = yield db.collection('users').findOne(this.locals.queryOperators, {}).then(User);

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

            payment = yield db.collection('payments').insert(charge).then(Payment);

            if (payment instanceof Object) {
              this.locals.result = payment;
              this.locals.status = 201;
            }
          }

        }
      }
    } else {
      this.locals.error = validator;
      this.locals.status = 400;
    }

    yield next;
  });

  routes.get('payment not found', /^([^.]+)$/, function* (next) {
    this.locals.status = 404;

    yield next;
  }); //matches everything without an extension

  return routes;
};
