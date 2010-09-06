if(!Hummingbird) { var Hummingbird = {}; }

Hummingbird.WebSocket = function() {
  this.state = "stopped";
};

Hummingbird.WebSocket.prototype = {
  // WebSocket callbacks
  onclose: function() {
    var self = this;
    if(this.getState() == "retrying") {
      // Wait a while to try restarting
      console.log("still no socket, retrying in 3 seconds");
      setTimeout(function() { self.start() }, 3000);
    } else {
      // First attempt at restarting, try immediately
      this.setState("retrying");
      console.log("socket lost, retrying immediately");
      setTimeout(function() { self.start() }, 200);
    }
  },

  onopen: function() {
    this.setState("started");
    console.log("socket started");
  },

  // Hummingbird WebSocket functions
  getState: function() {
    return this.state;
  },

  setState: function(state) {
    this.state = state;
  },

  start: function() {
    console.log("start() not implemented");
  },

  webSocketHost : function() {
    if(document.location.search.match(/ws_server/)) {
      var wsServerParam = document.location.search.match(/ws_server=([^\&\#]+)/) || [];
      return wsServerParam[1];
    } else {
      return document.location.hostname;
    }
  },
  
  webSocketPort : function() {
    if(document.location.search.match(/ws_server/)) {
      var wsPortParam = document.location.search.match(/ws_port=([^\&\#]+)/) || [];
      return wsPortParam[1]|| 5990;
    } else {
      return 5990;
    }
  },
  
  webSocketTransports : ['websocket','flashsocket']
}

// DASHBOARD WEBSOCKET

Hummingbird.WebSocket.Dashboard = function() { 
}
Hummingbird.WebSocket.Dashboard.prototype = new Hummingbird.WebSocket;

Hummingbird.WebSocket.Dashboard.prototype.start = function() {
  console.log('starting');
  var totalDiv = $("#log");
  totalDiv.find('canvas').get(0).width = $(window).width() - 160;
  this.totalGraph = new Hummingbird.Graph(totalDiv, { ratePerSecond: 20, logDate: true });

  var cartAdds = $("#cart_adds");;
  cartAdds.find('canvas').get(0).width = $(window).width() - 160;
  this.cartAddsGraph = new Hummingbird.Graph(cartAdds, { ratePerSecond: 20 });

  var wsHost = this.webSocketHost();
  var wsPort = this.webSocketPort();
  var wsTransports = this.webSocketTransports;
  var ws = new io.Socket(wsHost, {'port':wsPort, 'resource':'metrics', 'transports':wsTransports});
  
  var self = this;

  ws.on('message', function(socket_data) {
    var data = JSON.parse(socket_data);

    if(typeof(data.sales) != "undefined") {
      $.each(Hummingbird.saleGraphs, function(key) {
        if(data.sales[key]) {
          Hummingbird.saleGraphs[key].drawLogPath(data.sales[key]);
        } else {
          Hummingbird.saleGraphs[key].drawLogPath(0.0);
        }
      });
    } else if(typeof(data.total) != "undefined") {
      self.totalGraph.drawLogPath(data.total);
      if(data.cartAdds) {
        self.cartAddsGraph.drawLogPath(data.cartAdds);
      } else {
        self.cartAddsGraph.drawLogPath(0.0);
      }
    }
  });

  ws.on('close', function() { self.onclose(); });
  ws.on('connect', function() { self.onopen(); });
  ws.connect();
}

// WEEKLY WEBSOCKET

Hummingbird.WebSocket.Weekly = function() { }
Hummingbird.WebSocket.Weekly.prototype = new Hummingbird.WebSocket;

Hummingbird.WebSocket.Weekly.prototype.start = function() {
  
  var wsHost = this.webSocketHost();
  var wsPort = this.webSocketPort();
  var wsTransports = this.webSocketTransports;
  var ws = new io.Socket(wsHost, {'port':wsPort, 'resource':'metrics', 'transports':wsTransports});

  var self = this;

  ws.on('message', function(socket_data) {
    var data = JSON.parse(socket_data);
    if(data.total && data.total > 0) {
      var el = $("div.day:first-child div.all_views");
      var prevTotal = el.data("total");
      el.text((prevTotal + data.total).commify()).data('total', prevTotal + data.total);
    }
    if(data.cartAdds && data.cartAdds > 0) {
      var el = $("div.day:first-child div.cart_adds");
      var prevCartAdds = el.data("cart_adds");
      el.text((prevCartAdds + data.cartAdds).commify()).data('cart_adds', prevCartAdds + data.cartAdds);
    }
  });

  ws.on('close', function() { self.onclose(); });
  ws.on('connect', function() { self.onopen(); });
  ws.connect();
}

