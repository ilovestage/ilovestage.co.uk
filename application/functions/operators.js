'use strict';

/*
/api/endpoint?comparison[age]=21
/api/endpoint?comparison[age][$gt]=21
/api/endpoint?comparison[age][$gte]=21
/api/endpoint?comparison[age][$in]=21,22,23,30
/api/endpoint?comparison[age][$lt]=21
/api/endpoint?comparison[age][$lte]=21
/api/endpoint?comparison[age][$ne]=21
/api/endpoint?comparison[age][$nin]=21,22,23,30
/api/endpoint?comparison[age][$gt]=21&comparison[age][lt]=79
/api/endpoint?comparison[age][$gt]=21&comparison[age][lt]=79&comparison[name]=Bob

/api/endpoint?date[starttime]=2015-01-01
/api/endpoint?date[starttime][$gt]=2015-01-01
/api/endpoint?date[starttime][$gte]=2015-01-01
/api/endpoint?date[starttime][$lt]=2015-01-01
/api/endpoint?date[starttime][$lte]=2015-01-01
/api/endpoint?date[starttime][$gt]=2015-01-01&date[starttime][$lt]=2015-12-31
/api/endpoint?date[starttime][$gt]=2015-01-01&date[endtime][$lt]=2015-12-31

/api/endpoint?element[name][$exists]=true
/api/endpoint?element[name][$exists]=false

/api/endpoint?element[name][$type]=1
/api/endpoint?element[name][$type]=2

/api/endpoint?logical=$and&comparison[0][age][$gt]=21&comparison[0][name]=Bob&comparison[1][age][$gt]=34&comparison[1][name]=Sue
/api/endpoint?logical=$nor&comparison[0][age][$gt]=21&comparison[0][name]=Bob&comparison[1][age][$gt]=34&comparison[1][name]=Sue
/api/endpoint?logical=$not&comparison[0][age][$gt]=21&comparison[0][name]=Bob&comparison[1][age][$gt]=34&comparison[1][name]=Sue
/api/endpoint?logical=$or&comparison[0][age][$gt]=21&comparison[0][name]=Bob&comparison[1][age][$gt]=34&comparison[1][name]=Sue

/api/endpoint?$orderby[age]=1
/api/endpoint?$orderby[age]=-1
/api/endpoint?$orderby[age]=1&$orderby[gender]=1
/api/endpoint?$orderby[age]=1&$orderby[gender]=-1

/api/endpoint?timeframe[starttime][before][months]=3
/api/endpoint?timeframe[starttime][after][months]=3
/api/endpoint?timeframe[starttime][before][months]=3&timeframe[starttime][after][months]=3
*/

var _ = require('lodash');
var moment = require('moment');

module.exports = function Operators(query) {
  var operators = {};

  var comparison = {};
  var comparisons = [];

  if (query.hasOwnProperty('comparison')) {
    if (Array.isArray(query.comparison)) {
      comparisons = query.comparison;
    } else if (query.comparison instanceof Object) {
      _.merge(comparison, query.comparison);
    }
  }

  if (query.hasOwnProperty('date')) {
    var mappedDate = _.transform(query.date, function(result, time, key) {
      // console.log('time', time);
      // console.log('key', key);

      var date = {};

      _.forEach(time, function(value, operator) {
        // console.log('value', value, 'operator', operator);

        date[operator] = moment.utc(value);
      });

      result[key] = date;
    });

    comparison = mappedDate;
  }

  if (query.hasOwnProperty('element')) {
    _.merge(comparison, query.element);
  }

  if (query.hasOwnProperty('orderby')) {
    operators.$orderby = query.$orderby;
  }

  if (query.hasOwnProperty('timeframe')) {
    var mappedTimeframe = _.transform(query.timeframe, function(result, time, key) {
      // console.log('time', time);
      // console.log('key', key);

      var timeframe = {};

      _.forEach(time, function(value, direction) {
        // console.log('value', value, 'direction', direction);

        _.forEach(value, function(units, measurement) {
          // console.log('units', units, 'measurement', measurement);

          var from;
          var to;

          if (direction === 'before') {
            from = moment().subtract(units, measurement);
            to = moment();

            timeframe.$gte = from.toDate();
            timeframe.$lte = to.toDate();
          } else if (direction === 'after') {
            from = moment();
            to = moment().add(units, measurement);

            timeframe.$gte = from.toDate();
            timeframe.$lte = to.toDate();
          }

          // console.log('value', value, 'direction', direction);
        });
      });

      result[key] = timeframe;
    });

    comparison = mappedTimeframe;
  }

  if (query.hasOwnProperty('logical')) {
    operators[query.logical] = comparisons;
    _.merge(operators, comparison);
  } else {
    operators = comparison;
  }

  // console.log('query', query);
  // console.log('operators', operators);

  return operators;
};
