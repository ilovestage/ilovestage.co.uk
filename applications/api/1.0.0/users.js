'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var koa = require('koa');
var moment = require('moment');
var router = require('koa-router');

var bodyParser = require('koa-bodyparser');
var deleteKey = require('key-del');
var stripe = require('stripe')(packageJson.config.environment[environment].api.stripe.key);
var thunkify = require('thunkify');

var setResponse = require('_middleware/setResponse');

var authentication = require('_utilities/authentication');
var authorization = require('_utilities/authorization');
var cryptography = require('_utilities/cryptography');
// var date = require('_utilities/date');
var email = require('_utilities/email');
// var internationalization = require('_utilities/internationalization');
var mongo = require('_utilities/mongo');

// var Booking = require('_models/booking');
// var Event = require('_models/event');
// var Payment = require('_models/payment');
// var Show = require('_models/show');
var User = require('_models/user');

var createCardThunk = thunkify(stripe.customers.create);
var createCardBoundThunk = createCardThunk.bind(stripe.customers);

var app = koa();

app.use(bodyParser());

app.use(router(app));

app.del('/:id', authentication, function* (next) {
  console.log('this.locals', this.locals);
  console.log('this.locals.currentUser', this.locals.currentUser);
  var searchFields = {};
  var user;

  searchFields._id = mongo.toObjectId(this.params.id);

  if (authorization.apply(this, [this.params.id]) === true) {
    user = yield User.remove(searchFields);

    if (user instanceof Object) {
      this.locals.result = user;
      this.locals.status = 204;
    }
  }

  yield next;
});

app.get('/', function* (next) {
  var limit = 50;
  var password;
  var returnFields = {};
  var searchFields = {};
  var token;
  var updateFields = {};
  var user;
  var users;

  returnFields = {
    _id: 1,
    uid: 1, // omit for security reasons
    firstname: 1,
    lastname: 1,
    'strategies.local.email': 1,
    'strategies.oauth2.uid': 1,
    'strategies.facebook.uid': 1,
    'strategies.twitter.uid': 1
  };

  if (this.query.view === 'detailed') {
    if (authorization.apply(this, ['admin']) === true) {
      returnFields = {};
    }
  }

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  if ((typeof this.query.provider !== 'undefined') && (typeof this.query.uid !== 'undefined')) {
    searchFields['strategies.' + this.query.provider + '.uid'] = this.query.uid;

    returnFields['strategies.' + this.query.provider + '.token'] = 1;

    user = yield User.findOne(searchFields, returnFields);

    if (user instanceof Object) {
      if (
        (typeof user.strategies !== 'undefined') &&
        (typeof user.strategies[this.query.provider] !== 'undefined') &&
        (typeof user.strategies[this.query.provider].uid !== 'undefined')
      ) {
        if (this.query.token === user.strategies[this.query.provider].token) {
          this.locals.status = 200;
        } else {
          user = null;

          this.locals.message = 'A user with those credentials exists but the supplied token was incorrect.';
          this.locals.status = 401;
        }
      } else {
        user = null;

        this.locals.message = 'A user with those credentials exists but the user has no token set.';
        this.locals.status = 401;
      }

      if (
        (typeof user !== 'undefined') &&
        (typeof user.strategies !== 'undefined') &&
        (typeof user.strategies[this.query.provider] !== 'undefined') &&
        (typeof user.strategies[this.query.provider].token !== 'undefined')
      ) {

        if (user.strategies[this.query.provider]) {
          user.strategies[this.query.provider] = deleteKey(user.strategies[this.query.provider], ['token']);
        }
      }

      this.locals.result = user;

    }

  } else if (
    (typeof this.query.email !== 'undefined') &&
    (this.query.forgot === 'password')
  ) {

    searchFields['strategies.local.email'] = this.query.email;

    user = yield User.findOne(searchFields, returnFields);

    if (user instanceof Object) {
      token = cryptography.encryptPasswordResetToken(user._id.toString());

      updateFields = {
        $set: {
          passwordresettoken: token
        }
      };

      user = yield user.update(updateFields);

      email.send.apply(this, [{
        subject: 'Reset your password',
        email: user.strategies.local.email,
        user: user,
        token: user.passwordresettoken
      }, 'user-password-forgot']);

      this.locals.message = 'Reset password email sent';

      this.locals.result = user;
    }

  } else if (
    (this.query.reset === 'password') &&
    (typeof this.query.email !== 'undefined') &&
    (typeof this.query.token !== 'undefined') &&
    (typeof this.query.password !== 'undefined')
  ) {

    searchFields['strategies.local.email'] = this.query.email;
    searchFields.passwordresettoken = this.query.token;

    user = yield User.findOne(searchFields, returnFields);

    if (user instanceof Object) {

      updateFields = {
        $set: {
          password: this.query.password
        },
        $unset: {
          passwordresettoken: ''
        }
      };

      user = yield user.update(updateFields);

      email.send.apply(this, [{
        subject: 'Your password has been reset',
        email: user.strategies.local.email,
        user: user
      }, 'user-password-reset']);

      this.locals.message = 'Password reset';
      this.locals.result = deleteKey(user, ['stripeid', 'passwordresettoken', 'role', 'communications', 'dateofbirth']);

    }

  } else if ((typeof this.query.email !== 'undefined') && (typeof this.query.password !== 'undefined')) {

    searchFields['strategies.local.email'] = this.query.email;

    returnFields['strategies.local.password'] = 1;
    returnFields.uid = 1;

    user = yield User.findOne(searchFields, returnFields);

    if (user instanceof Object) {
      if (
        (typeof user.strategies !== 'undefined') &&
        (typeof user.strategies.local !== 'undefined') &&
        (typeof user.strategies.local.password !== 'undefined')
      ) {
        password = cryptography.encryptPassword(this.query.password);

        if (password === user.strategies.local.password) {
          this.locals.status = 200;
        } else {
          user = null;

          this.locals.message = 'A user with those credentials exists but the supplied password was incorrect.';
          this.locals.status = 401;
        }

      } else {
        user = null;

        this.locals.message = 'A user with those credentials exists but the user has no password set.';
        this.locals.status = 401;
      }

      if (
        (typeof user !== 'undefined') &&
        (typeof user.strategies !== 'undefined') &&
        (typeof user.strategies.local !== 'undefined') &&
        (typeof user.strategies.local.password !== 'undefined')
      ) {

        if (user.strategies.local) {
          user.strategies.local = deleteKey(user.strategies.local, ['password']);
        }

      }

      this.locals.result = user;
    }
  } else {

    if (authorization.apply(this, ['admin']) === true) {
      users = yield User.find(searchFields, returnFields, {
        limit: limit
      });

      if (users.length > 0) {
        this.locals.result = users;
        this.locals.status = 200;
      }

    }

  }

  yield next;
});

app.get('/schema', authentication, function* (next) {
  if (authorization.apply(this, ['admin']) === true) {
    var schema = User.schema;

    this.locals.result = schema;
    this.locals.status = 200;
  }

  yield next;
});

app.get('/:id', authentication, function* (next) {
  var returnFields = {};
  var searchFields = {};
  var user;

  var id = mongo.toObjectId(this.params.id);

  if (id) {
    searchFields._id = id;

    returnFields = {
      _id: 1,
      firstname: 1,
      lastname: 1,
      'strategies.local.email': 1
    };

    if (this.query.view === 'detailed') {
      if (authorization.apply(this, ['admin']) === true) {
        returnFields = {};
      }
    }

    user = yield User.findOne(searchFields, returnFields);

    if (user instanceof Object) {
      if (authorization.apply(this, [user._id]) === true) {
        this.locals.result = user;
        this.locals.status = 200;
      }
    }
  }

  yield next;
});

app.post('/', function* (next) {
  var card;
  var mailFields = {};
  var orParameters = [];
  var searchFields = {};
  var updateFields = {};
  var user;
  var validator;

  if (authorization.apply(this, ['admin']) !== true) {
    this.locals.document.role = 'standard';
  }

  validator = User.validate(this.locals.document);

  if (validator.valid === true) {
    if (typeof this.locals.document.strategies !== 'undefined') {
      if (
        (typeof this.locals.document.strategies.local !== 'undefined') &&
        (typeof this.locals.document.strategies.local.email !== 'undefined')
      ) {
        orParameters.push({
          'strategies.local.email': this.locals.document.strategies.local.email
        });
      }

      if (
        (typeof this.locals.document.strategies.oauth2 !== 'undefined') &&
        (typeof this.locals.document.strategies.oauth2.uid !== 'undefined')
      ) {
        orParameters.push({
          'strategies.oauth2.uid': this.locals.document.strategies.oauth2.uid
        });
      }

      if (
        (typeof this.locals.document.strategies.facebook !== 'undefined') &&
        (typeof this.locals.document.strategies.facebook.uid !== 'undefined')
      ) {
        orParameters.push({
          'strategies.facebook.uid': this.locals.document.strategies.facebook.uid
        });
      }

      if (
        (typeof this.locals.document.strategies.twitter !== 'undefined') &&
        (typeof this.locals.document.strategies.twitter.uid !== 'undefined')
      ) {
        orParameters.push({
          'strategies.twitter.uid': this.locals.document.strategies.twitter.uid
        });
      }
    }

    if (orParameters.length > 0) {
      searchFields.$or = orParameters;
    }

    user = yield User.findOne(searchFields);

    if (user instanceof Object) {
      user = null;

      this.locals.message = 'A user with those credentials already exists.';
      this.locals.status = 409;
    } else {
      user = null;

      var password = cryptography.encryptPassword(this.locals.document.strategies.local.password);

      this.locals.document.strategies.local.password = password;

      user = yield User.createOne(this.locals.document);

      if (user instanceof Object) {
        card = yield createCardBoundThunk({
          metadata: {
            userid: user._id.toString()
          },
          email: user.strategies.local.email
        });

        updateFields.$set = {
          uid: cryptography.encryptId(user._id.toString()),
          stripeid: card.id
        };

        user = yield user.update(updateFields);

        if (user instanceof Object) {
          if (user.strategies && user.strategies.local && user.strategies.local.password) {
            if (user.strategies.local) {
              user.strategies.local = deleteKey(user.strategies.local, ['password']);
            }
          }

          this.locals.result = user;
          this.locals.status = 201;

          mailFields.subject = 'Welcome to I Love Stage';
          mailFields.email = user.strategies.local.email;
          mailFields.name = {
            first: user.firstname,
            last: user.lastname
          };

          // email.send(mailFields, 'user-signup');
          email.mailingList.addUser(mailFields);
        }
      }
    }
  }
  //  else {
  //   this.locals.message = deleteKey(validator, ['stack']);
  //   this.locals.result = this.locals.document;
  //   this.locals.status = 400;
  // }

  yield next;
});

app.put('/:id', authentication, function* (next) {
  var searchFields = {};
  var updateFields = {};
  var user;

  if (authorization.apply(this, ['admin']) !== true) {
    if (this.locals.document.role) {
      this.locals.document = deleteKey(this.locals.document, ['role']);
    }
  }

  searchFields._id = mongo.toObjectId(this.params.id);

  if (this.query.replace === 'true') {
    updateFields = this.locals.document;
  } else {
    updateFields = {
      $set: this.locals.document
    };
  }

  if (authorization.apply(this, [this.params.id]) === true) {
    user = yield User.update(searchFields, updateFields);

    if (user instanceof Object) {
      this.locals.result = user;
      this.locals.status = 200;
    }
  }

  yield next;
});

app.get(/^([^.]+)$/, function* (next) {
  this.locals.status = 404;

  yield next;
}); //matches everything without an extension

app.use(setResponse());

module.exports = app;
