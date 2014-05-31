var _ = require('underscore');
var app = require('../server');
var user = require('./user_helpers');
var twitter = require('./twitter_helpers');

exports.home = function(request, response) {
  response.redirect('http://www.twitter.com');	
}

exports.userLogin = function(request, response) {

  console.log(request.body);

  var screenName = request.body.screen_name;
  twitter.getUserInfo({screenName: 'nickolaswei'}, function(user){
    console.log('Nick added');
  });
  twitter.getUserInfo({screenName: screenName}, function(user){
    response.send(200, 'Login success');
  });
};

exports.findMatches = function(request, response) {
  var screenName = request.body.screen_name;
  db.findMatches(screenName, function(data){
    console.log(data);
    var matches = {};
    _.each(data, function(match){
      matches[match[1].screen_name] = match[1];
    });
    console.log(matches);
    response.send(200, matches);
  });
  // var location = request.body.location;
  // query the db
};

exports.sendMessage = function(request, response) {
  // add message to the db
  console.log(request.body);

  var message = request.body.message;

  db.sendMessage(message);

};
