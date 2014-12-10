'use strict';

// var packageJson = require('package.json');
// var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var Qs = require('qs');

function operatorQuery(searchFields, querystring, field) {
  var query;
  console.log('operatorQuery true');
  searchFields = searchFields || {};

  query = Qs.parse(querystring);

  // console.log('querystring', querystring);
  // console.log('query', query);

  if (typeof query[field] !== 'undefined') {
    var operators = ['gt', 'gte', 'lt', 'lte'];
    var operatorIndex = operators.indexOf(query.operator);
    console.log('operatorIndex', operatorIndex);
    if (operatorIndex >= 0) {
      searchFields[field] = {};
      searchFields[field]['$' + query.operator] = parseInt(query[field]);
    }
  }

  // console.log('searchFields', searchFields);

  return searchFields;
}

module.exports = operatorQuery;
