'use strict';

var model = require('mongel');

var validator = require('application/utilities/validator');

var Model = model();

var schema = {};

schema.update = {
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
    'phone': {
      'type': 'object',
      'properties': {
        'number': {
          'type': 'integer',
          'minLength': 3,
          'maxLength': 16
        },
        'countrycallingcode': {
          'type': 'string',
          'format': 'country-calling-code'
        }
      }
    },
    'dateofbirth': {
      'type': 'string',
      'format': 'date'
    },
    'address': {
      'type': 'string',
      'minLength': 2,
      'maxLength': 255
    },
    'countrycodealpha2': {
      'type': 'string',
      'format': 'country-code-alpha2'
    },
    'countrycodealpha3': {
      'type': 'string',
      'format': 'country-code-alpha3'
    },
    'agencyname': {
      'type': 'string',
      'minLength': 2,
      'maxLength': 255
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
              'minLength': 0,
              'maxLength': 255
            }
          },
          'required': [
            'email'
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
      'required': [
        'local'
      ]
      // 'anyOf': [
      //   {
      //     'required': ['oauth2']
      //   },
      //   {
      //     'required': ['facebook']
      //   },
      //   {
      //     'required': ['twitter']
      //   },
      //   {
      //     'required': ['googleplus']
      //   }
      // ]
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
          // 'minItems': 1,
          'uniqueItems': true
        },
        'marketing': {
          'type': 'array',
          'items': {
            '$ref': '#/definitions/communicationsTypes'
          },
          'additionalItems': false,
          // 'minItems': 1,
          'uniqueItems': true
        }
      }
    },
    'createtime': {
      'format': 'date-time'
    },
    'updatetime': {
      'format': 'date-time'
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
        'uid'
        // ,
        // 'token'
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
  }
};

schema.create = JSON.parse(JSON.stringify(schema.update));

schema.create.required = [
  'firstname',
  'lastname',
  'strategies',
  'createtime',
  'updatetime'
];

Model.describe = function() {
  return schema;
};

Model.validate = function(document, method) {
  var currentSchema;

  document.phone.countrycallingcode = '+' + document.phone.countrycallingcode;

  if (method === 'create') {
    currentSchema = schema.create;
  } else if (method === 'update') {
    currentSchema = schema.update;
  }

  return validator.check(document, currentSchema);
};

Model.prototype.getFullName = function() {
  return this.firstname + ' ' + this.lastname;
};

module.exports = Model;
