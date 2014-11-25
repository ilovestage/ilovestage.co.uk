'use strict';

var countryData = require('country-data');
var tv4 = require('tv4');
var formats = require('tv4-formats');

var mongo = require(__dirname + '/mongo');

var validator = tv4.freshApi();

validator.addFormat(formats);

// http://json-schema.org/
// http://schema.rdfs.org/

// validator.getSchema('http://schema.rdfs.org/all.json');

validator.addFormat('object-id', function (data, schema) {
  if(mongo.validateObjectId(data)) {
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

validator.addFormat('country-code', function (data, schema) {
  //   console.log(countryData.lookup.countries({
  //     currencies: data
  //   }));
  if(countryData.lookup.countries({
    alpha3: data
  }).length > 0) {
    return null;
  }
  return 'Must be a valid country code';
});

validator.addFormat('country-calling-code', function (data, schema) {
  // console.log('countryData.countries.all', countryData.countries.all);
  //   console.log(countryData.lookup.countries({
  //     currencies: data
  //   }));
  if(countryData.lookup.countries({
    countryCallingCodes: data
  }).length > 0) {
    return null;
  }
  return 'Must be a valid calling code';
});

module.exports = validator;
