'use strict';

var countryData = require('country-data');
var formats = require('tv4-formats');
var moment = require('moment');
var tv4 = require('tv4');
var validator = require('validator');

var mongo = require('_utilities/mongo');

var tv4 = tv4.freshApi();

tv4.addFormat(formats);

// http://json-schema.org/
// http://schema.rdfs.org/

// tv4.getSchema('http://schema.rdfs.org/all.json');

tv4.addFormat('currency-code', function(data, schema) {
//   console.log(countryData.lookup.countries({
//     currencies: data
//   }));
  if (countryData.lookup.countries({
    currencies: data
  }).length > 0) {
    return null;
  }
  return 'Must be a valid currency code';
});

tv4.addFormat('country-code-alpha2', function(data, schema) {
  //   console.log(countryData.lookup.countries({
  //     currencies: data
  //   }));
  if (countryData.lookup.countries({
    alpha2: data
  }).length > 0) {
    return null;
  }
  return 'Must be a valid ISO 3166-1 alpha-2 country code';
});

tv4.addFormat('country-code-alpha3', function(data, schema) {
  //   console.log(countryData.lookup.countries({
  //     currencies: data
  //   }));
  if (countryData.lookup.countries({
    alpha3: data
  }).length > 0) {
    return null;
  }
  return 'Must be a valid ISO 3166-1 alpha-3 country code';
});

tv4.addFormat('country-calling-code', function(data, schema) {
  // console.log('countryData.countries.all', countryData.countries.all);
  //   console.log(countryData.lookup.countries({
  //     currencies: data
  //   }));
  if (countryData.lookup.countries({
    countryCallingCodes: data
  }).length > 0) {
    return null;
  }
  return 'Must be a valid calling code';
});

tv4.addFormat('language-code-alpha2', function(data, schema) {
  // console.log('countryData.languages.all', countryData.languages.all);
  //   console.log(countryData.lookup.countries({
  //     languages: data
  //   }));
  if (countryData.lookup.languages({
    alpha2: data
  }).length > 0) {
    return null;
  }
  return 'Must be a valid ISO 3166-1 alpha-2 language code';
});

tv4.addFormat('language-code-alpha3', function(data, schema) {
  // console.log('countryData.languages.all', countryData.languages.all);
  //   console.log(countryData.lookup.countries({
  //     languages: data
  //   }));
  if (countryData.lookup.languages({
    alpha3: data
  }).length > 0) {
    return null;
  }
  return 'Must be a valid ISO 3166-1 alpha-3 language code';
});

tv4.addFormat('object-id', function(data, schema) {
  if (mongo.validateObjectId(data)) {
    return null;
  }
  return 'Must be a valid objectId';
});

tv4.addFormat('time', function(data, schema) {
  if (moment(data).isValid()) {
    return null;
  }
  return 'Must be a time in 24 hour format';
});

module.exports = tv4;
