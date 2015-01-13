'use strict';

var moment = require('moment');

var authentication = require('application/generators/authentication');

var authorization = require('application/functions/authorization');

var mongo = require('application/utilities/mongo');
var email = require('application/utilities/email');
// var operators = require('application/utilities/operators');

module.exports = function GeneralRoutes(configuration, router, db, models) {
  var routes = new router();

  var Booking = models.booking;
  var Event = models.event;
  var Note = models.note;
  var Payment = models.payment;
  var Show = models.show;
  var User = models.user;

  routes.name = 'general';

  routes.get('/', function* (next) {
    if (this.request.originalUrl === '/') {
      this.locals.message = configuration.name + ' API';
    } else {
      this.locals.message = configuration.name + ' API version ' + configuration.version;
    }

    this.locals.status = 200;
    yield next;
  });

  routes.get(/^([^.]+)$/, function* (next) {
    this.locals.status = 404;

    yield next;
  }); //matches everything without an extension

  return routes;
};
