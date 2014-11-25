'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require(__dirname + '/../_utilities/mongo');
var validator = require(__dirname + '/../_utilities/validator');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Payment = model('payments', connectionString);

Payment.schema = {
  'title': 'Payment Schema',
  'type': 'object',
  'properties': {
    'bookingid': {
      'type': 'string',
      'format': 'object-id'
    },
    'processor': {
      'type': 'string',
      'enum': [
        'stripe',
        'applepay'
      ]
    },
    'amount': {
      'type': 'integer',
      'minimum': 1,
      'maximum': 5000
    },
    'currency': {
      'type': 'string',
      'format': 'currency-code'
    },
    'description': {
      'type': 'string',
      'maxLength': 100
    }
  },
  'required': [
    'bookingid',
    'processor',
    'amount',
    'currency'
  ]
};

Payment.validate = function(document) {
  var valid = validator.validate(document, Payment.schema, false, true);

  if(valid === true) {
    return valid;
  } else {
    return validator;
  }

};

module.exports = Payment;
