'use strict';

var _ = require('lodash');
var co = require('co');
var moment = require('moment');
var momentRecur = require('moment-recur');
var requiredir = require('requiredir');

var ApplicationCli = require('application/application.cli');
var ApplicationWeb = require('application/application.web');

var Database = require('application/functions/database');

module.exports = function CliVersion(configuration) {
  var db = new Database(configuration.database);

  var configurationMain = {};
  var configurationVersion = {};

  _.merge(configurationMain, configuration, {
    type: 'main'
  });

  _.merge(configurationVersion, configuration, {
    type: 'version'
  });

  var models = requiredir(__dirname + '/../models');

  var Booking = models.booking;
  var Event = models.event;
  var Note = models.note;
  var Payment = models.payment;
  var Show = models.show;
  var User = models.user;

  var appMain = new ApplicationWeb(configuration);
  var cliMain = new ApplicationCli(configurationMain, appMain);

  var done;

  var publicHolidays = [
  moment({
    year: null, //current year
    month: 11,
    day: 25
  })
  ];

  var dateNextYear = moment().add(1, 'y');

  function processEvent(show, day, time) {
    var dayOfWeek = day;
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
        'showid': show._id.toString(),
        'starttime': moment(starttime).toDate()
      };

      insertFields = {
        'showid': show._id.toString(),
        'starttime': moment(starttime).toDate(),
        'endtime': moment(endtime).toDate(),
        'priceband': show.priceband,
        'groupdiscountprice': show.groupdiscountprice,
        'groupfacevalue': show.groupfacevalue,
        'singlediscountprice': show.singlediscountprice,
        'singlefacevalue': show.singlefacevalue,
        'totalbookingsmade': 0,
        'totalticketsbooked': 0
      };

      // console.log('searchFields', searchFields);
      // console.log('insertFields', insertFields);

      co(function* () {
        // var event = yield Event.create(insertFields);
        var event = yield db.collection('events').findOne(searchFields).then(Event);

        return event;
      }).then(function(existing) {
        if (existing) {
          console.log('Event already exists:', existing);
        } else {
          co(function* () {
            var event = yield db.collection('events').insert(insertFields).then(Event);

            return event;
          }).then(function(inserted) {
            console.log('Added event:', inserted);
          }, function(err) {
            console.error(err.stack);
          });
        }
      }, function(err) {
        console.error(err.stack);
      });

    });

  }

  function processShow(show) {
    // console.log('show', show);
    // console.log('show.performances', show.performances);
    show.performances.forEach(function(day) {
      // console.log('day', day);
      if (Array.isArray(day.times)) {
        day.times.forEach(function(time) {
          // console.log('time', time);
          // console.log('show, day, time', show, day.day, time);
          processEvent(show, day.day, time.split(':'));
          setTimeout(done, 3000);
        });
      }
    });
  }

  function beginProcessing() {
    co(function* () {
      var returnFields = {};
      var searchFields = {};

      // var shows = yield Show.find(searchFields, returnFields);
      var shows = yield db.collection('shows').find(searchFields, returnFields).then(Show);

      return shows;
    }).then(function(shows) {
      console.log('Shows to process: ' + shows.length);

      done = _.after(shows.length, function() {
        console.log('Application finished');
        process.exit();
      });

      _(shows).forEach(function(show) {
        // console.log('show', show);
        processShow(show);
      });
    }, function(err) {
      console.error(err.stack);
    });
  }

  setTimeout(beginProcessing, 5000);

  console.log('Application running');

  return cliMain;
};
