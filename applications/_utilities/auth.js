'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var mongo = require(__dirname + '/mongo');
var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var co = require('co');
var db = require('monk')(connectionString);
var passport = require('koa-passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google').Strategy;

// var database = require(__dirname + '/database');
// var db = new database(config.server.database);
// var users = db.collection('users');

var users = db.get('users');

passport.serializeUser(function(user, done) {
  console.log('passport.serializeUser', user._id, done);
  done(null, user._id);
});

passport.deserializeUser(function(userid, done) {
  console.log('passport.deserializeUser', userid, done);

  co(function *() {
    try {
      var result = yield users.findById(userid, {});

      console.log('result', result);

      if (!result || result.length < 1) {
        return false;
      } else {
        return result;
      }
   } catch (ex) {
      return null;
   }
 })(done);
});

passport.use(new LocalStrategy(
  function (username, password, done) {
    co(function *() {
      try {
        console.log('in here', username, password, done);

        var result = yield users.findOne({
          'strategies.local.email': username,
          'strategies.local.password': password
        });

        // console.log('result', result);

        if (!result || result.length < 1) {
          return false;
        } else {
          return result;
        }
     } catch (ex) {
        return null;
     }
   })(done);

  }
));

passport.use(new FacebookStrategy({
    clientID: 'your-client-id',
    clientSecret: 'your-secret',
    callbackURL: 'http://localhost:' + (process.env.PORT || 3000) + '/auth/facebook/callback'
  },
  function(token, tokenSecret, profile, done) {
    // retrieve user ...
    done(null, user);
  }
));

passport.use(new TwitterStrategy({
    consumerKey: 'your-consumer-key',
    consumerSecret: 'your-secret',
    callbackURL: 'http://localhost:' + (process.env.PORT || 3000) + '/auth/twitter/callback'
  },
  function(token, tokenSecret, profile, done) {
    // retrieve user ...
    done(null, user);
  }
));

passport.use(new GoogleStrategy({
    returnURL: 'http://localhost:' + (process.env.PORT || 3000) + '/auth/google/callback',
    realm: 'http://localhost:' + (process.env.PORT || 3000)
  },
   function(identifier, profile, done) {
    // retrieve user ...
    done(null, user);
  }
));

// module.exports = passport;
