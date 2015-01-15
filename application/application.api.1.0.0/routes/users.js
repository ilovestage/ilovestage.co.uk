'use strict';

// var _ = require('lodash');
// var co = require('co');
var deleteKey = require('key-del');
// var moment = require('moment');

var authentication = require('application/generators/authentication');

var authorization = require('application/functions/authorization');

var cryptography = require('application/utilities/cryptography');
var email = require('application/utilities/email');
var mongo = require('application/utilities/mongo');
// var operators = require('application/utilities/operators');

module.exports = function UserRoutes(configuration, router, db, models) {
  var stripe = require('stripe')(configuration.local.api.stripe.key);
  var thunkify = require('thunkify');

  // var createCustomerThunk = thunkify(stripe.customers.create);
  // var createCustomerBoundThunk = createChargeThunk.bind(stripe.customers);

  var createChargeThunk = thunkify(stripe.charges.create);
  var createChargeBoundThunk = createChargeThunk.bind(stripe.charges);

  var routes = new router();

  var Booking = models.booking;
  var Event = models.event;
  var Note = models.note;
  var Payment = models.payment;
  var Show = models.show;
  var User = models.user;

  routes.name = 'users';

  routes.del('delete user', '/:id', authentication, function* (next) {
    // console.log('this.locals', this.locals);
    // console.log('this.locals.currentUser', this.locals.currentUser);
    // var this.locals.queryOperators = {};
    var user;

    this.locals.queryOperators._id = mongo.toObjectId(this.params.id);

    if (authorization.apply(this, [this.params.id]) === true) {
      user = yield db.collection('users').remove(this.locals.queryOperators).then(User);

      if (user instanceof Object) {
        this.locals.result = user;
        this.locals.status = 204;
      }
    }

    yield next;
  });

  routes.get('read users', '/', function* (next) {
    var limit = this.query.limit ? parseInt(this.query.limit) : 50;
    var password;
    var returnFields = {};
    // var this.locals.queryOperators = {};
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

    if ((typeof this.query.provider !== 'undefined') && (typeof this.query.uid !== 'undefined')) {
      this.locals.queryOperators['strategies.' + this.query.provider + '.uid'] = this.query.uid;

      returnFields['strategies.' + this.query.provider + '.token'] = 1;

      user = yield db.collection('users').findOne(this.locals.queryOperators, returnFields).then(User);

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

      this.locals.queryOperators['strategies.local.email'] = this.query.email;

      user = yield db.collection('users').findOne(this.locals.queryOperators, returnFields).then(User);

      if (user instanceof Object) {
        token = cryptography.encryptPasswordResetToken(user._id.toString());

        updateFields = {
          $set: {
            passwordresettoken: token
          }
        };

        user = yield db.collection('users').update(updateFields).then(User);

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

      this.locals.queryOperators['strategies.local.email'] = this.query.email;
      this.locals.queryOperators.passwordresettoken = this.query.token;

      user = yield db.collection('users').findOne(this.locals.queryOperators, returnFields).then(User);

      if (user instanceof Object) {

        updateFields = {
          $set: {
            password: this.query.password
          },
          $unset: {
            passwordresettoken: ''
          }
        };

        user = yield db.collection('users').update(updateFields);

        email.send.apply(this, [{
          subject: 'Your password has been reset',
          email: user.strategies.local.email,
          user: user
        }, 'user-password-reset']);

        this.locals.message = 'Password reset';
        this.locals.result = deleteKey(user, ['stripeid', 'passwordresettoken', 'role', 'communications', 'dateofbirth']);

      }

    } else if ((typeof this.query.email !== 'undefined') && (typeof this.query.password !== 'undefined')) {

      this.locals.queryOperators['strategies.local.email'] = this.query.email;

      returnFields['strategies.local.password'] = 1;
      returnFields.uid = 1;

      user = yield db.collection('users').findOne(this.locals.queryOperators, returnFields).then(User);

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
        // console.log('this.locals.queryOperators', this.locals.queryOperators);
        users = yield db.collection('users').find(this.locals.queryOperators, returnFields, {
          limit: limit
        }).then(User);

        if (users.length > 0) {
          this.locals.result = users;
          this.locals.status = 200;
        }

      }

    }

    yield next;
  });

  routes.get('describe user', '/schema', authentication, function* (next) {
    var schema = User.describe();

    if (authorization.apply(this, ['admin']) === true) {
      this.locals.result = schema;
      this.locals.status = 200;
    }

    yield next;
  });

  routes.get('/:id', authentication, function* (next) {
    var returnFields = {};
    // var this.locals.queryOperators = {};
    var user;

    var id = mongo.toObjectId(this.params.id);

    if (id) {
      this.locals.queryOperators._id = id;

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

      user = yield db.collection('users').findOne(this.locals.queryOperators, returnFields).then(User);

      if (user instanceof Object) {
        user.fullname = user.getFullName();

        if (authorization.apply(this, [user._id]) === true) {
          this.locals.result = user;
          this.locals.status = 200;
        }
      }
    }

    yield next;
  });

  routes.post('create user', '/', function* (next) {
    var card;
    var mailFields = {};
    var orParameters = [];
    // var this.locals.queryOperators = {};
    var updateFields = {};
    var user;
    var validator;

    if (authorization.apply(this, ['admin']) !== true) {
      this.locals.document.role = 'standard';
    }

    validator = User.validate(this.locals.document, 'create');

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
        this.locals.queryOperators.$or = orParameters;
      }

      user = yield db.collection('users').findOne(this.locals.queryOperators).then(User);

      if (user instanceof Object) {
        user = null;

        this.locals.message = 'A user with those credentials already exists.';
        this.locals.status = 409;
      } else {
        user = null;

        var password = cryptography.encryptPassword(this.locals.document.strategies.local.password);

        this.locals.document.strategies.local.password = password;

        user = yield db.collection('users').insert(this.locals.document).then(User);

        if (user instanceof Object) {
          // card = yield createCardBoundThunk({
          //   metadata: {
          //     userid: user._id.toString()
          //   },
          //   email: user.strategies.local.email
          // });

          updateFields.$set = {
            uid: cryptography.encryptId(user._id.toString()),
            // stripeid: card.id
          };

          user = yield db.collection('users').update(updateFields).then(User);

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
    } else {
      this.locals.error = validator;
      this.locals.status = 400;
    }

    yield next;
  });

  routes.put('update user', '/:id', authentication, function* (next) {
    // var this.locals.queryOperators = {};
    var updateFields = {};
    var user;

    if (authorization.apply(this, ['admin']) !== true) {
      if (this.locals.document.role) {
        this.locals.document = deleteKey(this.locals.document, ['role']);
      }
    }

    this.locals.queryOperators._id = mongo.toObjectId(this.params.id);

    if (this.query.replace === 'true') {
      updateFields = this.locals.document;
    } else {
      updateFields = {
        $set: this.locals.document
      };
    }

    if (authorization.apply(this, [this.params.id]) === true) {
      user = yield db.collection('users').update(this.locals.queryOperators, updateFields).then(User);

      if (user instanceof Object) {
        this.locals.result = user;
        this.locals.status = 200;
      }
    }

    yield next;
  });

  routes.get('user not found', /^([^.]+)$/, function* (next) {
    this.locals.status = 404;

    yield next;
  }); //matches everything without an extension

  return routes;
};
