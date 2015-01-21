'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var mongo = require('_utilities/mongo');
var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

// var _ = require('lodash');
var co = require('co');
var db = require('monk')(connectionString);
var moment = require('moment');
var stripe = require('stripe')(packageJson.config.environment[environment].api.stripe.key);
var thunkify = require('thunkify');

var email = require('_utilities/email');

var Bookings = db.get('bookings');
var Events = db.get('events');
var Payments = db.get('payments');
// var Shows = db.get('shows');
var Users = db.get('users');

var createChargeThunk = thunkify(stripe.charges.create);
var createChargeBoundThunk = createChargeThunk.bind(stripe.charges);

// var result = null;
var searchFields = {};
var returnFields = {};
var updateFields = {};
var insertFields = {};

var ticketBookingThreshold = 10;

var currentDate = new Date();
var rangeStart = moment(currentDate).add(7, 'days').toDate();

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

function processBooking(booking) {
  co(function* () {
    // console.log('booking', booking);
    searchFields.Events._id = booking.eventid.toString(); //reset variable;

    var event = yield Events.findOne(searchFields.events, {
      fields: returnFields.events
    });

    if (event) {
      searchFields.Payments.eventid = booking.eventid.toString(); //reset variable;
      searchFields.Users._id = booking.userid.toString(); //reset variable;

      // var payment = yield Payments.findOne(searchFields.payments, {
      //   fields: returnFields.payments
      // });

      var user = yield Users.findOne(searchFields.users, {
        fields: returnFields.users
      });

      console.log('booking', booking);
      console.log('event', event);
      console.log('user', user);

      if (user) {
        var chargeInfo = {
          amount: (event.discountprice * 100),
          currency: 'gbp',
          customer: user.stripeid,
          // card: user.stripetoken,
          metadata: {
            bookingid: booking._id.toString()
          },
          capture: 'true'
          // description: booking.description
        };

        console.log('chargeInfo', chargeInfo);

        insertFields.Payments.bookingid = booking._id.toString();
        insertFields.Payments.token = user.stripeid;
        insertFields.Payments.time = currentDate;

        try {
          var charge = yield createChargeBoundThunk(chargeInfo);

          if (charge) {
            console.log('charge', charge);

            insertFields.Payments.status = 'success';
            insertFields.Payments.response = charge;

            updateFields.Bookings.$set.status = 'success';

            var payment = yield Payments.insert(insertFields.payments);
            console.log('payment', payment);

            var updatedBooking = yield Bookings.findAndModify(searchFields.bookings, updateFields.bookings);
            console.log('updatedBooking', updatedBooking);

            email.send('user-booking', {
              subject: 'Booking target reached', // Subject line
              email: user.strategies.local.email
            });
          }
        } catch (error) {
          console.log('error', error); // ENOTFOUND

          insertFields.Payments.status = 'failure';
          insertFields.Payments.error = error;

          updateFields.Bookings.$set.status = 'failure';

          var payment = yield Payments.insert(insertFields.payments);
          console.log('payment', payment);

          var updatedBooking = yield Bookings.findAndModify(searchFields.bookings, updateFields.bookings);
          console.log('updatedBooking', updatedBooking);

          email.send('admin-booking', {
            subject: 'Booking payment failed', // Subject line
            email: email.sender.address,
            message: error.message
          });
        }

      }
    }

    // console.log('booking', booking);
    return false;
  })();
}

co(function* () {
  var bookings = yield Bookings.find(searchFields.bookings, {
    fields: returnFields.bookings
  });

  return bookings;
}).then(function(bookings) {
  console.log('Bookings to process: ' + bookings.length);

  var bookingIterator;

  for (bookingIterator = 0; bookingIterator < bookings.length; bookingIterator++) {
    processBooking(bookings[bookingIterator]);
  }

  process.exit();
}, function(err) {
  console.error(err.stack);
});
