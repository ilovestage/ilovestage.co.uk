'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require(__dirname + '/../_utilities/mongo');
var validator = require(__dirname + '/../_utilities/validator');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var User = model('users', connectionString);

User.schema = {
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

User.validate = function *(document) {
	return validator.validate(documentument, User.schema, false, true);
};

module.exports = User;
