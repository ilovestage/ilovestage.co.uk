'use strict';

// var packageJson = require(__dirname + '/../../package.json');
// var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var mongo = {

  connectionString: function(configuration) {
  	
  	if(typeof configuration === 'undefined') {
  		return false;
  	}

    var connectionString = '';

    connectionString += configuration.protocol;
    connectionString += '://';

    if((configuration.credentials.username !== null) && (configuration.credentials.password)) {
      connectionString += configuration.credentials.username;
      connectionString += ':';
      connectionString += configuration.credentials.password;
      connectionString += '@';
    }

    connectionString += configuration.host;
    connectionString += ':';
    connectionString += configuration.port;
    connectionString += '/';
    connectionString += configuration.name;
  }

};

module.exports = mongo;
