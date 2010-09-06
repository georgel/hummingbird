var ENV = require('./environment');

var sys = require('sys'),
  fs = require('fs'),
  View = require('view').View,
  Metric = require('metric').Metric,
  Aggregates = require('aggregates').Aggregates,
  Buffer = require('buffer').Buffer,
  io = require('socket.io'),
  arrays = require('deps/arrays'),
  querystring = require('querystring');

var Hummingbird = function() {
  var pixelData = fs.readFileSync(__dirname + "/../images/tracking.gif", 'binary');
  this.pixel = new Buffer(43);
  this.pixel.write(pixelData, 'binary', 0);

  this.metrics = [];
};

Hummingbird.prototype = {

  setupDb: function(db, callback) {
    var self = this;
    db.createCollection('visits', function(err, collection) {
      db.collection('visits', function(err, collection) {
        self.collection = collection;
        callback();
      });
    });
  },
  
  // All metrics are broadcast out on one socket.
  setupWebSocket: function(http) {
    // Socket.io interceptor for page views
    var wsServer = io.listen(http, {
        log:function(a){sys.log(a)},
        resource:'metrics',
        transports:['websocket', 'flashsocket']});

    wsServer.on("connection", function (conn) {
      sys.log("ws connect: " + conn._id);
      conn.on("disconnect", function () {
        sys.log("ws disconnect: " + conn._id);
      });
    });

    this.wsServer = wsServer;

    sys.puts('Socket.io Interceptor on *://' + ENV.config.tracking_port+"/metrics");
  },

  addAllMetrics: function(db) {
    var self = this;

    Metric.allMetrics(function(metric) {
      metric.init(db);
      metric.wsServer = self.wsServer;
      self.metrics.push(metric);
    });
  },

  serveRequest: function(req, res) {
    this.writePixel(res);

    var env = this.splitQuery(req.url.split('?')[1]);
    env.timestamp = new Date();
    // sys.log(JSON.stringify(env, null, 2));

    var view = new View(env);

    env.url_key = view.urlKey();
    env.product_id = view.productId();

    this.collection.insertAll([env]);

    for(var i = 0; i < this.metrics.length; i++) {
      this.metrics[i].incrementCallback(view);
    }
  },

  splitQuery: function(query) {
    var queryString = {};
    (query || "").replace(
      new RegExp("([^?=&]+)(=([^&]*))?", "g"),
      function($0, $1, $2, $3) { queryString[$1] = querystring.unescape($3.replace(/\+/g, ' ')); }
    );

    return queryString;
  },

  writePixel: function(res) {
    res.writeHead(200, { 'Content-Type': 'image/gif',
                         'Content-Disposition': 'inline',
                         'Content-Length': '43' });
    res.end(this.pixel);
  },

  handleError: function(req, res, e) {
    res.writeHead(500, {});
    res.write("Server error");
    res.close();

    e.stack = e.stack.split('\n');
    e.url = req.url;
    sys.log(JSON.stringify(e, null, 2));
  }
};

exports.Hummingbird = Hummingbird;
