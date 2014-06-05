/* MODULE DEPENDENCIES */
var requestify = require('requestify');
var user = require('./user_helpers');
var request = require('./request_helpers');
var _ = require('underscore');
var semantic = require('./semantic_helpers');

/* TWITTER API VARIABLES */

var showUserURL = 'https://api.twitter.com/1.1/users/show.json?skip_status=true&screen_name=';
var getFriendsURL = 'https://api.twitter.com/1.1/friends/list.json?stringify_ids=true&count=200&skip_status=true&screen_name=';
var getTweetsURL = 'https://api.twitter.com/1.1/statuses/user_timeline.json?count=200&screen_name=';
var headers = {
  'User-Agent': 'tweetUpApp',
  'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAK7iXgAAAAAAg1QslCBGGo4H4PgzROllXAK5nwk%3DhMh7822qk7wo7E8BcRWbk5j6gDmOMTtNQo8hZADiuqObTNPF74',
  'Accept': '*/*',
  'dataType': 'json',
  'Host': 'api.twitter.com'
};

/* TWITTER API FUNCTIONS */

exports.getUserInfo = function(screenName, currentLocation, callback) {

  requestify.request(showUserURL + screenName, {
    method: 'GET',
    headers: headers,
   })
  .then(function(response){
    response.getBody();
    var userInfo = JSON.parse(response.body);
    userInfo.latest_location = currentLocation;
    if ( callback ) callback(userInfo); //callback is response to client with user object
    user.addUser(userInfo, true);
  })
};

var getFriends = exports.getFriends = function(screenName, cursor){

  cursor = cursor || -1;

  requestify.request(getFriendsURL + screenName + '&cursor=' + cursor, {
    method: 'GET',
    headers: headers
  })
  .then(function(response){
    response.getBody();
    var data = JSON.parse(response.body);
    user.addFriends(screenName, data.users);
    if ( data.next_cursor_str !== '0' ) {
      getFriends(screenName, data.next_cursor_str);
    }
  });
};

var getTweets = exports.getTweets = function(screenName) {

  requestify.request(getTweetsURL + screenName, {
    method: 'GET',
    headers: headers
  })
  .then(function(response){
    response.getBody();
    var tweets = JSON.parse(response.body);
    semantic.parseTweets(screenName, tweets);
  });
}

