'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var emailTemplates = require('email-templates');
var mcapi = require('mailchimp-api/mailchimp');
var nodemailer = require('nodemailer');
var path = require('path');

var templatesDir = path.resolve(__dirname + '/../emails');

var mc = new mcapi.Mailchimp(packageJson.config.api.mailchimp.key);

var email = {

  transporter: nodemailer.createTransport(packageJson.config.environment[environment].email.transport),

  sender: packageJson.config.environment[environment].email.sender,

  mailingList: {

    addUser: function(locals) {
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
    }

  },

  send: function(locals, layout) {
    var _this = this;

    _this.locals = _this.locals || {};

    emailTemplates(templatesDir, function(err, template) {

      // Send a single email
      template(layout, locals, function(error, html, text) {

        if (error) {
          console.log(error);
        } else {
          var mailOptions = {
            from: email.sender.name + ' <' + email.sender.address + '>', // sender address
            to: {
              name: locals.user.firstname + ' ' + locals.user.lastname,
              address: locals.email
            }, // list of receivers
            subject: locals.subject, // Subject line
            text: text, // plaintext body
            html: html // html body
          };

          email.transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
              _this.locals.status = 400;
              _this.locals.error = error;
            } else {
              _this.locals.message = info;
              // _this.locals.message = 'Email sent';
            }

            // console.log('_this.locals', _this.locals);
            // console.log('error', error);
            // console.log('mailOptions', mailOptions);

          });
        }
      });
    });
  }
};

module.exports = email;
