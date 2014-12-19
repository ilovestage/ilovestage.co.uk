'use strict';

// var packageJson = require('package.json');
// var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var moment = require('moment');
var Qs = require('qs');

function dateQuery(searchFields, querystring, field) {
  var dateParameters = {};
  var query;

  searchFields = searchFields || {};

  query = Qs.parse(querystring);

  // console.log('querystring', querystring);
  // console.log('query', query);

  if (query.start || query.end) {
    console.log('in start query');

    searchFields[field] = {};

    if (query.start) {
      var dateStart = null;

      // console.log('typeof query.start', typeof query.start);

      if (typeof query.start === 'object') {
        dateParameters.start = {
          years: parseInt(query.start.years),
          months: parseInt(query.start.months - 1),
          days: parseInt(query.start.days),
          hours: parseInt(query.start.hours) ? parseInt(query.start.hours) : 0,
          minutes: parseInt(query.start.minutes) ? parseInt(query.start.minutes) : 0,
          seconds: parseInt(query.start.seconds) ? parseInt(query.start.seconds) : 0
        };

        // console.log('dateParameters.start', dateParameters.start);

        dateStart = moment.utc([dateParameters.start.years, dateParameters.start.months, dateParameters.start.days, dateParameters.start.hours, dateParameters.start.minutes, dateParameters.start.seconds]);
      } else if (typeof query.start === 'string') {
        dateStart = moment.utc(query.start);
      }

      // console.log('dateStart', dateStart);

      searchFields[field].$gte = dateStart.toDate();
    }

    if (query.end) {
      var dateEnd = null;

      // console.log('typeof query.end', typeof query.end);

      if (typeof query.end === 'object') {
        dateParameters.end = {
          years: parseInt(query.end.years),
          months: parseInt(query.end.months - 1),
          days: parseInt(query.end.days),
          hours: parseInt(query.end.hours) ? parseInt(query.end.hours) : 0,
          minutes: parseInt(query.end.minutes) ? parseInt(query.end.minutes) : 0,
          seconds: parseInt(query.end.seconds) ? parseInt(query.end.seconds) : 0
        };

        dateEnd = moment.utc([dateParameters.end.years, dateParameters.end.months, dateParameters.end.days, dateParameters.end.hours, dateParameters.end.minutes, dateParameters.end.seconds]);
      } else if (typeof query.end === 'string') {
        dateEnd = moment.utc(query.end);
      }

      // console.log('dateEnd', dateEnd);

      searchFields[field].$lt = dateEnd.toDate();
    }
  } else if (query.range && query.units && query.timeframe) {
    console.log('in range query');

    searchFields[field] = {};

    var rangeStart = moment().subtract(query.range, query.units); // e.g. (3, 'months') gives "3 months before currentDate"
    var rangeEnd = moment().add(query.range, query.units); // e.g. (3, 'months') gives "3 months after currentDate"

    if (query.timeframe === 'past') {
      searchFields[field].$gte = rangeStart.toDate();
      searchFields[field].$lt = moment().toDate();
    } else if (query.timeframe === 'future') {
      searchFields[field].$gte = moment().toDate();
      searchFields[field].$lt = rangeEnd.toDate();
    }

  }

  // console.log('searchFields', searchFields);

  return searchFields;
}

module.exports = dateQuery;
