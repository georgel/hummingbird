var fs = require('fs'),
    sys = require('sys');

var ApplicationEnvironment = function() {
  this.config = {};
  this.init();
}

ApplicationEnvironment.prototype.init = function() {
  try {
    var configJSON = fs.readFileSync(fs.realpathSync('config/app.json'));
  } catch(e) {
    sys.log("File config/app.json not found.  Try: `cp config/app.json.sample config/app.json`");
  }
  sys.log("Started with config: ");
  sys.puts(configJSON);
  var config = JSON.parse(configJSON.toString());
  for(var setting in config) {
    this.config[setting] = config[setting];
  }
	this.root = fs.realpathSync(__dirname + "/..");
}

var env = new ApplicationEnvironment();

// set require paths
require.paths.unshift(env.root);
require.paths.unshift(env.root + '/lib');
require.paths.unshift(env.root + '/deps/connect/lib');
require.paths.unshift(env.root + '/deps/express/lib');
require.paths.unshift(env.root + '/deps/express/support');
require.paths.unshift(env.root + "/deps/node-mongodb-native/lib");
require.paths.unshift(env.root + "/deps/Socket.io-node/lib");

// cool - new ApplicationConfig() is called only once
// no matter how many times the file is require()'d
exports = module.exports = env;