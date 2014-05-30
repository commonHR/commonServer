/*       MODULE DEPENDENCIES         */
var requestify = require('requestify');
var user = require('./user_helpers');
var request = require('./request_helpers');
var _ = require('underscore');

/*          REQUEST OPTIONS          */
var showUserURL =  {
  screenName:'https://api.twitter.com/1.1/users/show.json?screen_name=',
  id: 'https://api.twitter.com/1.1/users/show.json?user_id='
}

var getFriendsURL = {
  list: 'https://api.twitter.com/1.1/friends/ids.json?stringify_ids=true&screen_name=',
  info: 'https://api.twitter.com/1.1/users/lookup.json?user_id='
}

var getFriendInfoURL = 'https://api.twitter.com/1.1/friends/list.json?stringify_ids=true&screen_name=';

var headers = {
  'User-Agent': 'tweetUpApp',
  'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAK7iXgAAAAAAg1QslCBGGo4H4PgzROllXAK5nwk%3DhMh7822qk7wo7E8BcRWbk5j6gDmOMTtNQo8hZADiuqObTNPF74',
  'Accept': '*/*',
  'dataType': 'json',
  'Host': 'api.twitter.com'
};

/*         TWITTER API FUNCTIONS        */

exports.getUserInfo = function(lookupObject, callback) { //object will have either a screenName or id as key and the corresponding value

    var lookupURL;
    var lookupValue;

    if ( lookupObject.screenName )  {
      lookupURL = showUserURL.screenName;
      lookupValue = lookupObject.screenName;
    } else {
      lookupURL = showUserURL.id;
      lookupValue = lookupObject.id;
    }
    requestify.request(lookupURL + lookupValue, {
      method: 'GET',
      headers: headers,
     })
    .then(function(response){
      response.getBody();
      var userInfo = JSON.parse(response.body);
      if ( callback ) callback(userInfo); //callback is response to client with user object
      user.addUser(userInfo, true);
    });
};

exports.getFriends = function(screenName){

  requestify.request(getFriendsURL.list + screenName, {
    method: 'GET', //Twitter API recommends using a POST for lists of larger than 100
    headers: headers,
   })
  .then(function(response){
    response.getBody();
    var friendsList = JSON.parse(response.body);
    friendsList = friendsList.ids;
    user.addFriends(screenName, friendsList);
  });
};

exports.getFriendInfo = function(screenName, cursor){

  cursor = cursor || -1;

  requestify.request(getFriendInfoURL + screenName + '&cursor=' + cursor + '&count=2' + '&skip_status=true', {
    method: 'GET',
    headers: headers
  })
  .then(function(response){
    response.getBody();
    data = JSON.parse(response.body);
    // send data.users to db helper
    if ( data.next_cursor_str !== '0' ) {
      getFriendInfo(screenName, data.next_cursor_str)
    }
  });

};


