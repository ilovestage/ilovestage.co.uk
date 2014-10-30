'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var _ = require('lodash');
var crypto = require('crypto');
var emailTemplates = require('email-templates');
var mcapi = require('mailchimp-api/mailchimp');
var moment = require('moment');
var nodemailer = require('nodemailer');
var path = require('path');

var templatesDir = path.resolve(__dirname, '../..', 'source/emails');

var mc = new mcapi.Mailchimp(packageJson.config.api.mailchimp.key);

// var emailTemplatesThunk = thunkify(emailTemplates);

var utilities = {

  transporter: nodemailer.createTransport({ // Prepare nodemailer transport object
    service: 'Gmail',
    auth: {
      user: 'ilovestageapp@gmail.com',
      pass: 'curtaincall'
    }
  }),

  emailSender: {
    name: 'I Love Stage UK',
    email: 'ilovestageapp@gmail.com'
  },

  validateObjectId: function(id) {
    var bool = false;
    if(id.length === 24) {
      bool = /[a-f]+/.test(id);
    }
    return bool;
  },

  getEncryptedUid: function(uid) {
    var hash = crypto.createHmac('sha512', packageJson.config.salts.uid);
    hash.update(uid.toString());
    return hash.digest('hex');
  },

  getEncryptedPassword: function(password) {
    var hash = crypto.createHmac('sha512', packageJson.config.salts.password);
    hash.update(password.toString());
    return hash.digest('hex');
  },

  addUserToMailingList: function(locals) {
    mc.helper.ping(function(data) {
      // console.log('Mailchimp data', data);
    }, function(err) {
      if (err.name === 'Invalid_ApiKey') {
        console.log('Invalid API key. Set it in app.js');
      } else if (err.error) {
        console.log(err.code + ': ' + err.error);
      } else {
        console.log('An unknown error occurred');
      }
      // console.log('Mailchimp err', err);
    });

    mc.lists.subscribe(
      {
        id: 'a058aa7aa1',
        email: {
          email: locals.email
        }
      }, function(data) {
        console.log('User subscribed successfully! Look for the confirmation email.', data);
      },
      function(error) {
        if (error.error) {
          console.log(error.code + ': ' + error.error);
        } else {
          console.log('There was an error subscribing that user');
        }
      }
    );
  },

  sendEmail: function(locals, layout) {
    emailTemplates(templatesDir, function (err, template) {
      // Send a single email
      template(layout, locals, function (error, html, text) {
        if (error) {
          console.log(error);
        } else {
          var mailOptions = {
            from: utilities.emailSender.name + ' <' + utilities.emailSender.address + '>', // sender address
            to: {
              name: locals.name.first,
              address: locals.email
            }, // list of receivers
            subject: locals.subject, // Subject line
            text: text, // plaintext body
            html: html // html body
          };

          utilities.transporter.sendMail(mailOptions, function (error, info) {
            var response = {};

            if (error) {
              response.status = 400;
              response.error = error;
            } else {
              response.status = 200;
              response.info = info;
            }
            // console.log(response);
            // return response;
          });

        }
      });

    });
  },

  handleInternationalization: function(data, fields, lang) {

    function filterLanguage(data, field, lang) {
      var newValue = null;

      for(var key in data[field]) {
        if(key.indexOf(lang) === 0) {
          newValue = data[field][key];
        }

        delete data[field][key];
      }

      data[field] = newValue;
    }

    if (typeof data !== 'object') {
      return data;
    }

    if (!lang) {
      lang = 'en';
    }

    if(Array.isArray(fields)) {
      _(fields).forEach(function(field) {
        filterLanguage(data, field, lang);
      });
    } else if (typeof fields === 'string') {
      filterLanguage(data, fields, lang);
    }

    // use dot notation like 'reviews[0].name' with dot-object e.g. dj.object(result);

    return data;

    /* USAGE:

      var lang = 'ko';

      var data = {
        'item1': {
          'en': 'value in en',
          'fr': 'value in fr',
          'ko': 'value in ko'
        }
      };

      var fields = ['item1'];

      handleInternationalization(data, fields, lang);
    */
  },

  handleDateQuery: function(nestedQuery) {
    // var mydate1 = new Date('Jun 07, 1954');
    // var mydate2 = new Date(2014,9,7);
    // var mydate3 = new Date('2013-12-12T16:00:00.000Z');

    // console.log('mydate1', mydate1.getDate(), mydate1.getMonth(), mydate1.getFullYear());
    // console.log('mydate2', mydate2.getDate(), mydate2.getMonth(), mydate2.getFullYear());
    // console.log('mydate3', mydate3.getDate(), mydate3.getMonth(), mydate3.getFullYear());

    // console.log('this.querystring', this.querystring);
    // console.log('this.query', this.query);
    // console.log('qs', qs.parse(this.querystring));
    var currentDate = new Date();
    var dateParameters = {};
    var searchFields = {};
    var status = null;

    if (nestedQuery.start || nestedQuery.end) {
      searchFields.starttime = {};

      if (nestedQuery.start) {
        var dateStart = null;

        if (typeof nestedQuery.start === 'object') {
          dateParameters.start = {
            year: parseInt(nestedQuery.start.year),
            month: parseInt(nestedQuery.start.month),
            date: parseInt(nestedQuery.start.date),
            hours: parseInt(nestedQuery.start.hours) ? parseInt(nestedQuery.start.hours) : 0,
            minutes: parseInt(nestedQuery.start.minutes) ? parseInt(nestedQuery.start.minutes) : 0,
            seconds: parseInt(nestedQuery.start.seconds) ? parseInt(nestedQuery.start.seconds) : 0
          };

          // console.log('dateParameters.start', dateParameters.start);

          dateParameters.start.month -= 1;

          dateStart = new Date(dateParameters.start.year, dateParameters.start.month, dateParameters.start.date, dateParameters.start.hours, dateParameters.start.minutes, dateParameters.start.seconds);
        } else if (typeof nestedQuery.start === 'string') {
          dateStart = new Date(nestedQuery.start);
        }

        // console.log('dateStart', dateStart);

        if (!isNaN(dateStart.getTime())) {
          searchFields.starttime.$gte = dateStart;
        } else {
          status = 400;
        }

      }

      if (nestedQuery.end) {
        var dateEnd = null;

        if (typeof nestedQuery.end === 'object') {
          dateParameters.end = {
            year: parseInt(nestedQuery.end.year),
            month: parseInt(nestedQuery.end.month),
            date: parseInt(nestedQuery.end.date),
            hours: parseInt(nestedQuery.end.hours) ? parseInt(nestedQuery.end.hours) : 0,
            minutes: parseInt(nestedQuery.end.minutes) ? parseInt(nestedQuery.end.minutes) : 0,
            seconds: parseInt(nestedQuery.end.seconds) ? parseInt(nestedQuery.end.seconds) : 0
          };

          // console.log('dateParameters.end', dateParameters.end);

          dateParameters.end.month -= 1;

          dateEnd = new Date(dateParameters.end.year, dateParameters.end.month, dateParameters.end.date, dateParameters.end.hours, dateParameters.end.minutes, dateParameters.end.seconds);
        } else if (typeof nestedQuery.end === 'string') {
          dateEnd = new Date(nestedQuery.end);
        }

        // console.log('dateEnd', dateEnd);

        if (!isNaN(dateEnd.getTime())) {
          searchFields.starttime.$lt = dateEnd;
        } else {
          status = 400;
        }

      }
    } else if (nestedQuery.range && nestedQuery.units && nestedQuery.timeframe) {
      // console.log('in ranged query');
      searchFields.starttime = {};

      if(nestedQuery.timeframe === 'past') {
        var rangeStart = moment(currentDate).subtract(nestedQuery.range, nestedQuery.units).toDate(); // e.g. (3, 'months') gives "3 months before currentDate"

        searchFields.starttime.$gte = rangeStart;
        searchFields.starttime.$lt = currentDate;
      } else if(nestedQuery.timeframe === 'future') {
        var rangeEnd = moment(currentDate).add(nestedQuery.range, nestedQuery.units).toDate(); // e.g. (3, 'months') gives "3 months after currentDate"

        searchFields.starttime.$gte = currentDate;
        searchFields.starttime.$lt = rangeEnd;
      }

      // console.log('searchFields', searchFields);
    }

    return {
      status: status,
      dateParameters: dateParameters,
      searchFields: searchFields
    };

  }

};

module.exports = utilities;
