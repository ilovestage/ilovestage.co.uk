'use strict';

// var packageJson = require(__dirname + '/../../package.json');
// var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var bson = require('bson');

var utility = {

  validateObjectId: function(id) {
    var bool = false;

    // if(id.length === 24) {
    //   bool = /[a-f]+/.test(id);
    // }
    // console.log('obj:', bson.BSONPure.ObjectID);

    try {
      bool = bson.BSONPure.ObjectID(id);
    } catch(error) {
      console.log('error', error);
    }

    return bool;
  },

  toObjectId: function (hex) {
    if (hex instanceof bson.BSONPure.ObjectID) {
      return hex;
    }

    if (!hex || hex.length !== 24) {
      return hex;
    }

    return bson.BSONPure.ObjectID.createFromHexString(hex);
  }

};

module.exports = utility;
