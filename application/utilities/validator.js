'use strict';

var _ = require('lodash');
var countryData = require('country-data');
var deleteKey = require('key-del');
var formats = require('tv4-formats');
// var moment = require('moment');
var tv4 = require('tv4');
// var validator = require('validator');

var mongo = require('application/utilities/mongo');

var validator = tv4.freshApi();

validator.addFormat(formats);

// http://json-schema.org/
// http://schema.rdfs.org/

// validator.getSchema('http://schema.rdfs.org/all.json');

validator.addFormat('currency-code', function(data, schema) {
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

validator.addFormat('country-code-alpha2', function(data, schema) {
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

validator.addFormat('country-code-alpha3', function(data, schema) {
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

validator.addFormat('country-calling-code', function(data, schema) {
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

validator.addFormat('language-code-alpha2', function(data, schema) {
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

validator.addFormat('language-code-alpha3', function(data, schema) {
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

validator.addFormat('object-id', function(data, schema) {
  if (mongo.validateObjectId(data)) {
    return null;
  }
  return 'Must be a valid objectId';
});

validator.addFormat('time', function(data, schema) {
  // if (moment(data).isValid()) {
  //   return null;
  // }

  if (data.length === 5) {
    data += ':00';
  }

  var valid = (data.search(/^\d{2}:\d{2}:\d{2}$/) !== -1) &&
    (data.substr(0, 2) >= 0 && data.substr(0, 2) <= 24) &&
    (data.substr(3, 2) >= 0 && data.substr(3, 2) <= 59) &&
    (data.substr(6, 2) >= 0 && data.substr(6, 2) <= 59);

  // console.log('time', data);
  // console.log('valid', valid);

  if (valid === true) {
    return null;
  }

  return 'Must be a time in 24 hour format';
});

validator.check = function(document, schema) { //sanitise response to remove 'stack' key
  var errors = [];
  var validateResult = validator.validateMultiple(document, schema, false, true);

  if (validateResult.errors.length > 0) {
    _(validateResult.errors).forEach(function(error) {
      var sanitised = deleteKey(error, ['stack']);
      errors.push(sanitised);
    });

    validateResult.errors = errors; //overwrite original array
  }

  return validateResult;
};

module.exports = validator;
