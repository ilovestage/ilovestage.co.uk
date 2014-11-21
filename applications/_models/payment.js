'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('monk-model');

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

Payment.validate = function *(document) {
	return validator.validate(documentument, Payment.schema, false, true);
};

// Payment.findOrCreate = function *(document) {
//   var query = { title: document.title };
//   var payment = yield Payment.findOne(query);
//   if (!payment) payment = yield Payment.create(document);
//   return payment;
// };

module.exports = Payment;

// var payment = new Payment({ title: 'My test payment' });