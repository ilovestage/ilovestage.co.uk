'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var mongo = require(__dirname + '/../_utilities/mongo');
var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var _ = require('lodash');
var co = require('co');
var db = require('monk')(connectionString);
var moment = require('moment');

require('moment-recur');

// var Bookings = db.get('bookings');
// var Events = db.get('events');
// var Payments = db.get('payments');
// var Shows = db.get('shows');
// var Users = db.get('users');

// var Booking = require(__dirname + '/../_models/booking');
var Event = require(__dirname + '/../_models/event');
// var Payment = require(__dirname + '/../_models/payment');
var Show = require(__dirname + '/../_models/show');
// var User = require(__dirname + '/../_models/user');

// var result = null;

var publicHolidays = [
  moment({
    year: null, //current year
    month: 11,
    day: 25
  })
];

var dateToday = moment();
var dateNextYear = moment().add(1, 'y');
// console.log('dateToday', dateToday);
// console.log('dateNextYear', dateNextYear);

// console.log('publicHolidays', publicHolidays);

function processPerformance(show, day, time) {
  // console.log('show, day, time', show.translations[0].name, day, time);
  var dayOfWeek = 'Monday';
  var details;
  var nextDates;
  var recurrence;

  recurrence = moment()
  .recur() // Create a recurrence using today as the start date.
  .endDate(dateNextYear) // Set
  .every(dayOfWeek)
  .daysOfWeek() // set these days
  .except(publicHolidays); //don't set for these dates
  // console.log('recurrence', recurrence);

  // nextDates = recurrence.next(52); // return dates for next 52 weeks
  nextDates = recurrence.next(1); // return dates for next 1 weeks
  // console.log('nextDates', nextDates);

  nextDates.forEach(function(date) {
    var insertFields = {};
    var searchFields = {};
    // var updateFields = {};

    var starttime = moment(date._d).utc().add({
      hours: time[0],
      minutes: time[1]
    });

    var endtime = moment(date._d).add({
      hours: (parseInt(time[0]) + 3),
      minutes: time[1]
    });

    // console.log('time', (parseInt(time[0]) + 3));

    searchFields = {
      'showid': show._id,
      'starttime': starttime.toDate()
    };

    insertFields = {
      'showid': show._id,
      'starttime': starttime.toDate(),
      'endtime': endtime.toDate(),
      'priceband': show.priceband,
      'groupdiscountprice': show.groupdiscountprice,
      'groupfacevalue': show.groupfacevalue,
      'singlediscountprice': show.singlediscountprice,
      'singlefacevalue': show.singlefacevalue
    };

    // console.log('searchFields', searchFields);
    console.log('insertFields', insertFields);

    // var event = Event.update(searchFields, insertFields, {
    //   upsert: true
    // });

    co(function* () {
      var event = yield Event.create(insertFields);

      return event;
    }).then(function (event) {
      console.log('Event added: ' + event);
    }, function (err) {
      console.error(err.stack);
    });

  });

}

function processShow(show) {
  // console.log('show.performances', show.performances);
  show.performances.forEach(function(day) {
    // console.log('day', day);
    if(Array.isArray(day.times)) {
      day.times.forEach(function(time) {
        // console.log('time', time);
        // console.log('show, day, time', show, day.day, time);
        processPerformance(show, day.day, time.split(':'));
      });
    }
  });
}

co(function* () {
  var returnFields = {};
  var searchFields = {};

  var shows = yield Show.find(searchFields, returnFields);

  return shows;
}).then(function (shows) {
  console.log('Shows to process: ' + shows.length);

  _(shows).forEach(function(show) {
    // console.log(show);
    processShow(show);
  });

  // process.exit();
}, function (err) {
  console.error(err.stack);
});
