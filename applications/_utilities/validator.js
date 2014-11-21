'use strict';

var countryData = require('country-data');
var tv4 = require('tv4');
var formats = require('tv4-formats');

var utility = require(__dirname + '/utility');

var validator = tv4.freshApi();

validator.addFormat(formats);

// http://json-schema.org/
// http://schema.rdfs.org/

// validator.getSchema('http://schema.rdfs.org/all.json');

validator.addFormat('object-id', function (data, schema) {
  if(utility.validateObjectId(data)) {
    return null;
  }
  return 'Must be a valid objectId';
});

validator.addFormat('currency-code', function (data, schema) {
//   console.log(countryData.lookup.countries({
//     currencies: data
//   }));
  if(countryData.lookup.countries({
    currencies: data
  }).length > 0) {
    return null;
  }
  return 'Must be a valid currency code';
});

module.exports = validator;
