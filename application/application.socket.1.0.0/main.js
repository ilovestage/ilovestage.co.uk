'use strict';

var packageJson = require('package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

// var co = require('co');
var koa = require('koa');
// var logger = require('koa-logger');
// var mount = require('koa-mount');
var router = require('koa-router');
var io = require('socket.io');

var app = koa();

// use koa-router
app.use(router(app));
//
app.get('/', function *(next) {
  this.body = 'Welcome to the socket application';
  yield next;
});

// this must come after last app.use()
var server = require('http').Server(app.callback());
var socket = io(server);

socket.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('disconnect', function() {
    console.log('a user disconnected');
  });

  socket.emit('event', {
    hello: 'world'
  });

  socket.on('confirmation', function(message) {
    console.log('message: ' + message);
  });

});

//Run server
// server.listen(config.server.socketio.port); //socket.io

module.exports = app;
// module.exports = server;
