'use strict';

var packageJson = require(__dirname + '/../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var _ = require('lodash');
var argv = require('yargs').argv;
var co = require('co');
var koa = require('koa');
var moment = require('moment');
var stripe = require('stripe')(config.api.stripe.key);
var thunkify = require('thunkify');
var ua = require('universal-analytics');

var database = require(__dirname + '/database');
var utilities = require(__dirname + '/_utilities/utilities');

var db = new database(config.server.database);

var createChargeThunk = thunkify(stripe.charges.create);
var createChargeBoundThunk = createChargeThunk.bind(stripe.charges);

var app = koa();

var visitor = ua(packageJson.config.applications.cron.googleanalytics.key);

// var result = null;
var searchFields = {};
var returnFields = {};
var updateFields = {};
var insertFields = {};

var ticketBookingThreshold = 10;

var currentDate = new Date();
var rangeStart = moment(currentDate).add(7, 'days').toDate();

app.use(function* (next) {
  var job = argv.job.split('-');

  visitor.event(job[0], job[1], function (err) {
    console.log('err', err);
  });
  yield next;
});

switch(argv.job) {
  case 'bookings-finalise':
    searchFields.bookings = {
      status: 'pending',
      tickets: {
        $gte: ticketBookingThreshold
      }
    };

    searchFields.events = {
      starttime: {
        $gte: currentDate,
        $lt: rangeStart
      }
    };

    searchFields.payments = {};

    searchFields.users = {};

    returnFields.bookings = {
      '_id': 1,
      'eventid': 1,
      'userid': 1
    };

    returnFields.events = {
      '_id': 1,
      'starttime': 1,
      'discount_price': 1
    };

    returnFields.payments = {};

    returnFields.users = {};

    updateFields.bookings = {
      $set: {}
    };

    updateFields.events = {};

    updateFields.payments = {};

    updateFields.users = {};

    insertFields.payments = {
      processor: 'stripe'
    };

    co(function *() {
      var booking = yield db.collection('bookings').find(searchFields.bookings, {
        fields: returnFields.bookings
      });

      console.log('bookings: ' + booking.length, booking);

      _(booking).forEach(function(doc) {
        co(function *() {
          // console.log('doc', doc);
          searchFields.db.collection('events')._id = doc.eventid.toString(); //reset variable;

          var event = yield db.collection('events').findOne(searchFields.events, {
            fields: returnFields.events
          });

          if (event) {
            searchFields.db.collection('payments').eventid = doc.eventid.toString(); //reset variable;
            searchFields.db.collection('users')._id = doc.userid.toString(); //reset variable;

            // var payment = yield db.collection('payments').findOne(searchFields.payments, {
            //   fields: returnFields.payments
            // });

            var user = yield db.collection('users').findOne(searchFields.users, {
              fields: returnFields.users
            });

            console.log('booking', booking);
            console.log('event', event);
            console.log('user', user);

            if (user) {
              var chargeInfo = {
                amount: (event.discount_price * 100),
                currency: 'gbp',
                customer: user.stripeid,
                // card: user.stripetoken,
                metadata: {
                  bookingid: doc._id.toString()
                },
                capture: 'true'
                // description: booking.description
              };

              console.log('chargeInfo', chargeInfo);

              insertFields.db.collection('payments').bookingid = doc._id.toString();
              insertFields.db.collection('payments').token = user.stripeid;
              insertFields.db.collection('payments').time = currentDate;

              try {
                var charge = yield createChargeBoundThunk(chargeInfo);

                if (charge) {
                  console.log('charge', charge);

                  insertFields.db.collection('payments').status = 'success';
                  insertFields.db.collection('payments').response = charge;

                  updateFields.db.collection('bookings').$set.status = 'success';

                  var payment = yield db.collection('payments').insert(insertFields.payments);
                  console.log('payment', payment);

                  var updatedBooking = yield db.collection('bookings').findAndModify(searchFields.bookings, updateFields.bookings);
                  console.log('updatedBooking', updatedBooking);

                  utilities.sendEmail('user-booking', {
                    subject: 'Booking target reached', // Subject line
                    email: user.strategies.local.email
                  });
                }
              } catch(error) {
                console.log('error', error); // ENOTFOUND

                insertFields.db.collection('payments').status = 'failure';
                insertFields.db.collection('payments').error = error;

                updateFields.db.collection('bookings').$set.status = 'failure';

                var payment = yield db.collection('payments').insert(insertFields.payments);
                console.log('payment', payment);

                var updatedBooking = yield db.collection('bookings').findAndModify(searchFields.bookings, updateFields.bookings);
                console.log('updatedBooking', updatedBooking);

                utilities.sendEmail('admin-booking', {
                  subject: 'Booking payment failed', // Subject line
                  email: utilities.emailSender.address,
                  message: error.message
                });
              }

            }
          }

          // console.log('doc', doc);
          return false;
        })();
      });
    })();
  break;
}
