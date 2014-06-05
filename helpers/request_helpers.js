var _ = require('underscore');
var app = require('../server');
var match = require('./match_helpers');
var user = require('./user_helpers');
var twitter = require('./twitter_helpers');
var chat = require('./chat_helpers');

exports.home = function(request, response) {
  response.redirect('http://www.twitter.com');  
}

exports.userLogin = function(request, response) {

  console.log(request.body);

  var screenName = request.body.screen_name;
  var location = request.body.current_location;

  twitter.getUserInfo(screenName, location, function(user){
    response.send(200, 'Login success');
  });
};

exports.findMatches = function(request, response) {
  var screenName = request.body.screen_name;
  var currentLocation = request.body.current_location;

  match.findMatches(screenName, currentLocation, function(data){
    response.send(200, data);
  });
};

exports.sendMessage = function(request, response) {

  console.log(request.body);

  var message = request.body.message;

  chat.sendMessage(message);
  response.send(200, 'Message sent');

};

exports.getMessages = function(request, response) {
  console.log(request.body);
  var screenName = request.body.screen_name;
  chat.retrieveConversations(screenName, function(data){
    console.log(data);
    response.send(200, data);
  });
};

exports.getMessage = function(request, response) {
  console.log(request.body);
  var user = request.body.user;
  var match = request.body.match;
  chat.retrieveSingleConversation(user, match, function(data){
    console.log(data);
    response.send(200, data);
  });
};
