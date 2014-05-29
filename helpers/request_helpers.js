var app = require('../server');
var db = require('./db_helpers');
var twitter = require('./twitter_helpers');

exports.home = function(request, response) {
  response.redirect('http://www.twitter.com');	
}

exports.userLogin = function(request, response) {

  var screenName = request.body;
  twitter.getUserInfo({screenName: screenName}, function(user){
    response.send(200, user);
  });
};

exports.findMatches = function(request, response) {
  var screenName = request.body.screenName;
  // var location = request.body.location;
  // query the db
};

exports.sendMessage = function(request, response) {
  // add message to the db
};



