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
  // twitter.getUserInfo({screenName: 'nickolaswei'}, function(user){
  // });

  twitter.getUserInfo({screenName: screenName}, function(user){
    response.send(200, 'Login success');
  });
};

exports.findMatches = function(request, response) {
  var screenName = request.body.screen_name;
  var location = request.body.location;

  match.findMatches(screenName, location, function(data){
    response.send(200, data);
  });
};

exports.sendMessage = function(request, response) {
  // add message to the db
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
