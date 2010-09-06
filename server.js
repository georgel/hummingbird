var ENV = require(__dirname + '/lib/environment')

var sys = require('sys'),
    http = require('http'),
    weekly = require('weekly'),
    fs = require('fs'),
    mongo = require('mongodb'),
    Hummingbird = require('hummingbird').Hummingbird;

db = new mongo.Db('hummingbird', new mongo.Server('localhost', 27017, {}), {});

db.addListener("error", function(error) {
  sys.puts("Error connecting to mongo -- perhaps it isn't running?");
});

db.open(function(p_db) {
  var hummingbird = new Hummingbird();
  hummingbird.setupDb(db, function() {
    http = http.createServer(function(req, res) {
      try {
        hummingbird.serveRequest(req, res);
      } catch(e) {
        hummingbird.handleError(req, res, e);
      }
    })
    hummingbird.setupWebSocket(http);
    hummingbird.addAllMetrics(db);
    http.listen(ENV.config.tracking_port);
  });

  sys.puts('Tracking server running at http://*:' + ENV.config.tracking_port + '/tracking_pixel.gif');
});
