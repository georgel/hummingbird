var ENV = require(__dirname + '/lib/environment')

var sys = require('sys'),
    fs = require('fs'),
    mongo = require('mongodb'),
    svc = require('service_json'),
    weekly = require('weekly');

var express = require('express');
app = express.createServer();

db = new mongo.Db('hummingbird', new mongo.Server('localhost', 27017, {}), {});

db.open(function(p_db) {
  app.configure(function(){
    app.set('root', __dirname);
    app.set('db', db);
    app.use(express.staticProvider(__dirname + '/public'));
    app.set('views', __dirname + '/views');
    app.use(express.cookieDecoder());
    app.use(express.bodyDecoder());
    app.use(express.logger());
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

    for(var i in ENV.config) {
      app.set(i, ENV.config[i]);
    }    
  });

  app.get('/', function(req, res){
    authenticate(req, res);
    res.render('index.html.ejs');
  });

  app.get('/weekly', function(req, res){
    authenticate(req, res);
    res.render('weekly.html.ejs');
  });

  app.get('/login', function(req, res){
    res.render('login.html.ejs');
  });

  app.post('/login', function(req, res) {
    if(req.body.password == app.set('password')) {
      res.header('Set-Cookie', 'not_secret='+ req.body.password);
      sys.log("Auth succeeded for " + req.body.username);
      res.redirect('/');
    } else {
      sys.log("Auth failed for " + req.body.username);
      res.redirect('/login');
    }
  });

  app.get('/sale_list', function(req, res){
    authenticate(req, res);

    if(app.set('sales_uri')) {
      svc.fetchJSON(set('sales_uri'), function(data) {
        res.contentType('json');
        res.send(data,200);
      });
    } else {
      res.send("No sales uri", 500);
    }
  });

  app.get('/week.json', function(req, res){
    authenticate(req, res);
    weekly.findByDay(app.set('db'), function(data) {
      res.contentType('json');
      res.send(data, 200);
    });
  });

  app.listen(app.set('monitor_port'));
});

var authenticate = function(req, res) {
  return true; //until I figure out how to set a cookie. see http://tinyurl.com/295suzq
  if(app.set('password') != req.cookies['not_secret']) {
    res.redirect('/login');
  }
};
