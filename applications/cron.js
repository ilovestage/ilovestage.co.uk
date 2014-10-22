'use strict';

var packageJson = require(__dirname + '/../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var _ = require('lodash');
var argv = require('yargs').argv;
var co = require('co');
var database = require(__dirname + '/database');
var koa = require('koa');
var ua = require('universal-analytics');

var db = new database(config.server.database);

var bookings = db.collection('bookings');
var events = db.collection('events');
var moment = require('moment');
var payments = db.collection('payments');
var shows = db.collection('shows');
var users = db.collection('users');

var app = koa();

var visitor = ua('UA-55818646-3');

var result = null;
var searchParameters = {};

var ticketBookingThreshold = 10;
// var ticketBookingThreshold = 2; //test

var currentDate = new Date();

app.use(function* (next) {
  var job = argv.job.split('-');

  visitor.event(job[0], job[1], function (err) {
    console.log('err', err);
  });
  yield next;
});

switch(argv.job) {
  case 'bookings-finalise':
    searchParameters.status = 'pending';

    searchParameters.tickets = {
      $gte: ticketBookingThreshold
    };

    co(function *() {
      var fields = {
        $set: {
          status: 'closed'
        }
      };

      // result = yield bookings.find(searchParameters);
      result = yield bookings.findAndModify(searchParameters, fields);

      console.log('result', result);
      _(result).forEach(function(doc) {
        co(function *() {
          var rangeStart = moment(currentDate).add(7, 'days').toDate();

          searchParameters = {}; //reset variable;
          searchParameters._id = doc.eventid.toString();

          searchParameters.starttime = {};
          searchParameters.starttime.$gte = currentDate;
          // searchParameters.starttime.$lt = rangeStart;

          console.log('searchParameters', searchParameters);

          var event = yield events.find(searchParameters, {
            fields: {
              '_id': 1,
              'starttime': 1
            }
          });

          //payment
          var fields = {
            $set: {
              status: 'paid'
            }
          };

          var payment = yield payments.findAndModify(searchParameters, {
            '_id': 1,
            'starttime': 1
          });

          // email = sendEmail('admin-booking', {
          //   subject: 'Booking target reached', // Subject line
          //   email: emailSender.address
          // });

          console.log('event', event);

          if (event && event.length > 0) {
            doc.event = event;
          }

          console.log('doc', doc);
          return false;
        })();
      });
    })();
  break;
}
