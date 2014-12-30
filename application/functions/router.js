// 'use strict';
//
// var mount = require('koa-mount');
// var router = require('koa-router');
//
// module.exports = function Router(configuration, app) {
//   console.log('Requiring ' + configuration.application + ' application routers.');
//   var Application = require(__dirname + '/applications/' + configuration.application);
//   var application = new Application(configuration, app, db);

  // app.use(router(app));
  //
  // if (configuration.mount === true) {
  //   app.use(mount('/', application));
  // }

//   app.use(function* (next) {
//     var docs = yield db.collection('users').find({});
//     console.log('docs', docs);
//
//     yield next;
//   });

//   return router;
// };
