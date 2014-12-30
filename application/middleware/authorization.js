'use strict';

module.exports = function() {

  return function* Authorization(next) {
    var returnFields = {};
    var searchFields = {};

    console.log('this.query.bypass', this.query.bypass);

    if (this.query.bypass === 'true') {
      this.locals.bypassAuthentication = true;
      this.locals.currentUser = 'bypassed';
    } else {
      this.locals.bypassAuthentication = false;

      if (this.request.header.uid) {
        returnFields = {
          _id: 1,
          uid: 1,
          role: 1
        };

        searchFields.uid = this.request.header.uid;
        // searchFields.uid = mongo.toObjectId(this.request.header.uid);

        console.log('users2', users);

        // var currentUser = yield users.findOne(searchFields, returnFields);

        // var currentUser = users.find({}).then(function(docs) {
        //   console.log('currentUser', docs);
        // });

        var currentUser = yield users.findOne(searchFields).then(User);
        // var currentUser = users.findOne(searchFields).then(User);

        var currentUser = yield users.findOne(searchFields).then(User);

        console.log('currentUser', currentUser);

        if (currentUser instanceof Object) {
          this.locals.currentUser = currentUser;
        } else {
          this.locals.currentUser = {};
        }

        this.locals.status = (typeof this.locals.currentUser !== 'undefined') ? 404 : 403;

        console.log('this.locals.currentUser', this.locals.currentUser);
        console.log('this.request.header.uid', this.request.header.uid);
        console.log('searchFields.uid', searchFields.uid);
      } else {
        this.locals.status = 401;
      }
    }

    yield next;
  };

};
