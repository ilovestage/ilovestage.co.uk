'use strict';

var schemas = {};

schemas.user = {
  'title': 'User Schema',
  'type': 'object',
  'properties': {
    'firstname': {
      'type': 'string',
      'minLength': 2,
      'maxLength': 255
    },
    'lastname': {
      'type': 'string',
      'minLength': 2,
      'maxLength': 255
    },
    'role': {
      'enum': [
        'admin',
        'agent',
        'standard'
      ]
    },
    'dateofbirth': {
      'type': 'string',
      'format': 'date'
    },
    'strategies': {
      'type': 'object',
      'properties': {
        'local': {
          'type': 'object',
          'properties': {
            'email': {
              'type': 'string',
              'format': 'email'
            },
            'password': {
              'type': 'string',
              'minLength': 2,
              'maxLength': 255
            }
          },
          'required': [
            'email',
            'password'
          ]
        },
        'oauth2': {
          '$ref': '#/definitions/oauth',
        },
        'facebook': {
          '$ref': '#/definitions/oauth',
        },
        'twitter': {
          '$ref': '#/definitions/oauth',
        },
        'googleplus': {
          '$ref': '#/definitions/oauth',
        }
      },
      'anyOf': [
        {
          'required': ['oauth2']
        },
        {
          'required': ['facebook']
        },
        {
          'required': ['twitter']
        },
        {
          'required': ['googleplus']
        }
      ]
    },
    'communications': {
      'type': 'object',
      'properties': {
        'notifications': {
          'type': 'array',
          'items': {
            '$ref': '#/definitions/communicationsTypes'
          },
          'additionalItems': false,
          'minItems': 1,
          'uniqueItems': true
        },
        'marketing': {
          'type': 'array',
          'items': {
            '$ref': '#/definitions/communicationsTypes'
          },
          'additionalItems': false,
          'minItems': 1,
          'uniqueItems': true
        }
      }
    }
  },
  'definitions': {
    'oauth': {
      'type': 'object',
      'properties': {
        'uid': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 255
        },
        'token': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 255
        }
      },
      'required': [
        'uid',
        'token'
      ]
    },
    'communicationsTypes': {
      'type': 'string',
      'enum': [
        'email',
        'push',
        'sms'
      ]
    }
  },
  'required': [
    'firstname',
    'lastname',
    'role',
    'dateofbirth',
    'strategies',
    'communications'
  ]
};

schemas.payment = {
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

module.exports = schemas;
