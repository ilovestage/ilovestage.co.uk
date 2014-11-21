'use strict';

// var packageJson = require(__dirname + '/../../package.json');
// var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var moment = require('moment');

var date = {

  handleDateQuery: function(nestedQuery) {
    // var mydate1 = new Date('Jun 07, 1954');
    // var mydate2 = new Date(2014,9,7);
    // var mydate3 = new Date('2013-12-12T16:00:00.000Z');

    // console.log('mydate1', mydate1.getDate(), mydate1.getMonth(), mydate1.getFullYear());
    // console.log('mydate2', mydate2.getDate(), mydate2.getMonth(), mydate2.getFullYear());
    // console.log('mydate3', mydate3.getDate(), mydate3.getMonth(), mydate3.getFullYear());

    // console.log('this.querystring', this.querystring);
    // console.log('this.query', this.query);
    // console.log('qs', qs.parse(this.querystring));
    var currentDate = new Date();
    var dateParameters = {};
    var searchFields = {};
    var status = null;

    if (nestedQuery.start || nestedQuery.end) {
      searchFields.starttime = {};

      if (nestedQuery.start) {
        var dateStart = null;

        if (typeof nestedQuery.start === 'object') {
          dateParameters.start = {
            year: parseInt(nestedQuery.start.year),
            month: parseInt(nestedQuery.start.month),
            date: parseInt(nestedQuery.start.date),
            hours: parseInt(nestedQuery.start.hours) ? parseInt(nestedQuery.start.hours) : 0,
            minutes: parseInt(nestedQuery.start.minutes) ? parseInt(nestedQuery.start.minutes) : 0,
            seconds: parseInt(nestedQuery.start.seconds) ? parseInt(nestedQuery.start.seconds) : 0
          };

          // console.log('dateParameters.start', dateParameters.start);

          dateParameters.start.month -= 1;

          dateStart = new Date(dateParameters.start.year, dateParameters.start.month, dateParameters.start.date, dateParameters.start.hours, dateParameters.start.minutes, dateParameters.start.seconds);
        } else if (typeof nestedQuery.start === 'string') {
          dateStart = new Date(nestedQuery.start);
        }

        // console.log('dateStart', dateStart);

        if (!isNaN(dateStart.getTime())) {
          searchFields.starttime.$gte = dateStart;
        } else {
          status = 400;
        }

      }

      if (nestedQuery.end) {
        var dateEnd = null;

        if (typeof nestedQuery.end === 'object') {
          dateParameters.end = {
            year: parseInt(nestedQuery.end.year),
            month: parseInt(nestedQuery.end.month),
            date: parseInt(nestedQuery.end.date),
            hours: parseInt(nestedQuery.end.hours) ? parseInt(nestedQuery.end.hours) : 0,
            minutes: parseInt(nestedQuery.end.minutes) ? parseInt(nestedQuery.end.minutes) : 0,
            seconds: parseInt(nestedQuery.end.seconds) ? parseInt(nestedQuery.end.seconds) : 0
          };

          // console.log('dateParameters.end', dateParameters.end);

          dateParameters.end.month -= 1;

          dateEnd = new Date(dateParameters.end.year, dateParameters.end.month, dateParameters.end.date, dateParameters.end.hours, dateParameters.end.minutes, dateParameters.end.seconds);
        } else if (typeof nestedQuery.end === 'string') {
          dateEnd = new Date(nestedQuery.end);
        }

        // console.log('dateEnd', dateEnd);

        if (!isNaN(dateEnd.getTime())) {
          searchFields.starttime.$lt = dateEnd;
        } else {
          status = 400;
        }

      }
    } else if (nestedQuery.range && nestedQuery.units && nestedQuery.timeframe) {
      // console.log('in ranged query');
      searchFields.starttime = {};

      if(nestedQuery.timeframe === 'past') {
        var rangeStart = moment(currentDate).subtract(nestedQuery.range, nestedQuery.units).toDate(); // e.g. (3, 'months') gives "3 months before currentDate"

        searchFields.starttime.$gte = rangeStart;
        searchFields.starttime.$lt = currentDate;
      } else if(nestedQuery.timeframe === 'future') {
        var rangeEnd = moment(currentDate).add(nestedQuery.range, nestedQuery.units).toDate(); // e.g. (3, 'months') gives "3 months after currentDate"

        searchFields.starttime.$gte = currentDate;
        searchFields.starttime.$lt = rangeEnd;
      }

      // console.log('searchFields', searchFields);
    }

    return {
      status: status,
      dateParameters: dateParameters,
      searchFields: searchFields
    };

  }

};

module.exports = date;
