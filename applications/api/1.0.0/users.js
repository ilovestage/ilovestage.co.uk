'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var koa = require('koa');
var router = require('koa-router');

var bodyParser = require('koa-bodyparser');
var deleteKey = require('key-del');
var DJ = require('dot-object');
var qs = require('koa-qs');
var stripe = require('stripe')(packageJson.config.environment[environment].api.stripe.key);
var thunkify = require('thunkify');

var cryptography = require('_utilities/cryptography');
// var date = require('_utilities/date');
var email = require('_utilities/email');
// var internationalization = require('_utilities/internationalization');
var mongo = require('_utilities/mongo');

var authenticationCheck = require('_middleware/authenticationCheck');
var authorizationCheck = require('_middleware/authorizationCheck');
var setResponse = require('_middleware/setResponse');

// var Booking = require('_models/booking');
// var Event = require('_models/event');
// var Payment = require('_models/payment');
// var Show = require('_models/show');
var User = require('_models/user');

var createCardThunk = thunkify(stripe.customers.create);
var createCardBoundThunk = createCardThunk.bind(stripe.customers);

var dj = new DJ();

var app = koa();

qs(app);

app.use(bodyParser());

app.use(authenticationCheck());

app.use(router(app));

app.del('/:id', authenticationCheck, function* (next) {
  var searchFields = {};
  var user;

  searchFields._id = mongo.toObjectId(this.params.id);

  if(authorizationCheck.apply(this, [user._id]) === true) {
    user = yield User.remove(searchFields);
  }

  if (!user) {
    this.locals.status = 404;
  } else {
    this.locals.result = user;

    this.locals.status = 204;
  }

  yield next;
});

app.get('/', function* (next) {
  var limit = 50;
  var password;
  var returnFields;
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
    if(authorizationCheck.apply(this, ['admin']) === true) {
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

    if (!user) {
      this.locals.message = 'A user with those credentials does not exist.';
      this.locals.status = 404;
    } else {
      if ((typeof user.strategies !== 'undefined') && (typeof user.strategies[this.query.provider] !== 'undefined') && (typeof user.strategies[this.query.provider].uid !== 'undefined')) {
        if (this.query.token === user.strategies[this.query.provider].token) {
          this.locals.status = 200;
        } else {
          user = {};

          this.locals.message = 'A user with those credentials exists but the supplied token was incorrect.';
          this.locals.status = 401;
        }
      } else {
        user = {};

        this.locals.message = 'A user with those credentials exists but the user has no token set.';
        this.locals.status = 401;
      }

      if ((typeof user !== 'undefined') && (typeof user.strategies !== 'undefined') && (typeof user.strategies[this.query.provider] !== 'undefined') && (typeof user.strategies[this.query.provider].token !== 'undefined')) {

        if(user.strategies[this.query.provider]) {
          user.strategies[this.query.provider] = deleteKey(user.strategies[this.query.provider], ['token']);
        }
      }

      this.locals.result = user;
    }
  } else if ((typeof this.query.email !== 'undefined') && (this.query.forgot === 'password')) {
    searchFields['strategies.local.email'] = this.query.email;

    user = yield User.findOne(searchFields, returnFields);

    if (!user) {
      this.locals.message = 'A user with those credentials does not exist.';
      this.locals.status = 404;
    } else {
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

      // this.locals.result = user;
    }
  } else if ((typeof this.query.email !== 'undefined') && (this.query.reset === 'password') && (typeof this.query.token !== 'undefined') && (typeof this.query.password !== 'undefined')) {
    searchFields['strategies.local.email'] = this.query.email;
    searchFields['passwordresettoken'] = this.query.token;

    user = yield User.findOne(searchFields, returnFields);

    if (!user) {
      this.locals.message = 'A user with those credentials does not exist.';
      this.locals.status = 404;
    } else {
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

    user = yield User.findOne(searchFields, returnFields);

    if (!user) {
      this.locals.message = 'A user with those credentials does not exist.';
      this.locals.status = 404;
    } else {
      if ((typeof user.strategies !== 'undefined') && (typeof user.strategies.local !== 'undefined') && (typeof user.strategies.local.password !== 'undefined')) {
        password = cryptography.encryptPassword(this.query.password);

        if (password === user.strategies.local.password) {
          this.locals.status = 200;
        } else {
          user = {};

          this.locals.message = 'A user with those credentials exists but the supplied password was incorrect.';
          this.locals.status = 401;
        }
      } else {
        user = {};

        this.locals.message = 'A user with those credentials exists but the user has no password set.';
        this.locals.status = 401;
      }

      if ((typeof user !== 'undefined') && (typeof user.strategies !== 'undefined') && (typeof user.strategies.local !== 'undefined') && (typeof user.strategies.local.password !== 'undefined')) {

        if(user.strategies.local) {
          user.strategies.local = deleteKey(user.strategies.local, ['password']);
        }
      }

      this.locals.result = user;
    }
  } else {
    if(authorizationCheck.apply(this, ['admin']) === true) {
      users = yield User.find(searchFields, returnFields, {
        limit: limit
      });

      if (!users) {
        this.locals.message = this.locals.messages.resourceNotFound;
        this.locals.status = 404;
      } else {
        this.locals.result = users;
        this.locals.status = 200;
      }
    }

  }

  yield next;
});

app.get('/:id', authenticationCheck, function* (next) {
  var returnFields;
  var searchFields = {};
  var user;

  searchFields._id = mongo.toObjectId(this.params.id);

  returnFields = {
    _id: 1,
    firstname: 1,
    lastname: 1,
    'strategies.local.email': 1
  };

  if (this.query.view === 'detailed') {
    if(authorizationCheck.apply(this, ['admin']) === true) {
      returnFields = {};
    }
  }

  user = yield User.findOne(searchFields, returnFields);

  if (!user) {
    this.locals.status = 404;
  } else {
    if(authorizationCheck.apply(this, [user._id]) === true) {
      this.locals.result = user;
      this.locals.status = 200;
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

  if(authorizationCheck.apply(this, ['admin']) !== true) {
    this.locals.document.role = 'standard';
  }

  validator = User.validate(this.locals.document);

  if(validator.valid === true) {
    if (typeof this.locals.document.strategies !== 'undefined') {
      if((typeof this.locals.document.strategies.local !== 'undefined') && (typeof this.locals.document.strategies.local.email !== 'undefined')) {
        orParameters.push({
          'strategies.local.email': this.locals.document.strategies.local.email
        });
      }

      if((typeof this.locals.document.strategies.oauth2 !== 'undefined') && (typeof this.locals.document.strategies.oauth2.uid !== 'undefined')) {
        orParameters.push({
          'strategies.oauth2.uid': this.locals.document.strategies.oauth2.uid
        });
      }

      if((typeof this.locals.document.strategies.facebook !== 'undefined') && (typeof this.locals.document.strategies.facebook.uid !== 'undefined')) {
        orParameters.push({
          'strategies.facebook.uid': this.locals.document.strategies.facebook.uid
        });
      }

      if((typeof this.locals.document.strategies.twitter !== 'undefined') && (typeof this.locals.document.strategies.twitter.uid !== 'undefined')) {
        orParameters.push({
          'strategies.twitter.uid': this.locals.document.strategies.twitter.uid
        });
      }
    }

    if(orParameters.length > 0) {
      searchFields.$or = orParameters;
    }

    user = yield User.findOne(searchFields);

    if (user) {
      user = {};

      this.locals.message = 'A user with those credentials already exists.';
      this.locals.status = 409;
    } else {
      dj.object(this.locals.document);

      if(this.locals.document) {
        this.locals.document = deleteKey(this.locals.document, ['format']);
      }

      this.locals.document.strategies.local.password = cryptography.encryptPassword(this.locals.document.strategies.local.password);

      user = yield User.createOne(this.locals.document);

      if (!user) {
        this.locals.status = 404;
      } else {
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

        searchFields._id = mongo.toObjectId(user._id);

        user = yield User.update(searchFields, updateFields, {
          new: true
        });

        if(user && user.stripeid) {
          mailFields.subject = 'Welcome to I Love Stage';
          mailFields.email = user.strategies.local.email;
          mailFields.name = {
            first: user.firstname,
            last: user.lastname
          };

          // email.send(mailFields, 'user-signup');
          email.mailingList.addUser(mailFields);
        }

        if (user && user.strategies && user.strategies.local && user.strategies.local.password) {
          if(user.strategies.local) {
            user.strategies.local = deleteKey(user.strategies.local, ['password']);
          }
        }

        this.locals.result = user;
        this.locals.status = 201;
      }
    }
  } else {
    this.locals.message = deleteKey(validator, ['stack']);
    this.locals.result = this.locals.document;
    this.locals.status = 400;
  }

  yield next;
});

app.put('/:id', authenticationCheck, function* (next) {
  var searchFields = {};
  var updateFields = {};
  var user;

  if(authorizationCheck.apply(this, ['admin']) !== true) {
    if(this.locals.document.role) {
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

  if(authorizationCheck.apply(this, [this.params.id]) === true) {
    user = yield User.update(searchFields, updateFields);

    if (!user) {
      this.locals.status = 404;
    } else {
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