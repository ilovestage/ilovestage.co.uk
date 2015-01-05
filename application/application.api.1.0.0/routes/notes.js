'use strict';

var moment = require('moment');

var authentication = require('application/generators/authentication');

var authorization = require('application/functions/authorization');

var mongo = require('application/utilities/mongo');
var operators = require('application/utilities/operators');

module.exports = function NotesRoutes(configuration, router, db, models) {
  var routes = new router();

  var Booking = models.booking;
  var Event = models.event;
  var Note = models.note;
  var Payment = models.payment;
  var Show = models.show;
  var User = models.user;

  var schema = Note.describe();

  routes.name = 'note';

  routes.get('/', function* (next) {
    this.locals.result = 'Oh hai!';
    this.locals.status = 200;

    yield next;
  });

  routes.post('/', function* (next) {
    this.locals.result = 'Oh hai postman!';
    this.locals.status = 200;

    yield next;
  });

  routes.get(/^([^.]+)$/, function* (next) {
    this.locals.status = 404;

    yield next;
  }); //matches everything without an extension

  return routes;
};
