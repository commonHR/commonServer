/*       MODULE DEPENDENCIES         */
var requestify = require('requestify');
var db = require('./db_helpers');
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
      // callback(userInfo);
      db.addUser(userInfo);
    });
};

exports.getFriends = function(screenName) {

  var getList = function(screenName, callback){
    requestify.request(getFriendsURL.list + screenName, {
      method: 'GET', //Twitter API recommends using a POST for lists of larger than 100
      headers: headers,
     }, callback)
    .then(function(response){
      response.getBody();
      var friendsList = JSON.parse(response.body);
      friendsList = friendsList.ids;
      console.log(friendsList);
      callback(friendsList);
    });
  };

  var getFriendData = function(friendsList) {
    
    var parseList = function(friendsList){
      for ( var i = 0; i < friendsList.length; i += 100 ) {
        var lookupList = friendsList.slice(i, i + 100);
        retrieveData(lookupList);
      }
    };

    var retrieveData = function(lookupList) {
      lookupList = lookupList.join(',');
      requestify.request(getFriendsURL.info + lookupList, {
        method: 'GET', //Twitter API recommends using a POST for lists of larger than 100
        headers: headers,
       })
      .then(function(response){
        response.getBody();
        var friends = JSON.parse(response.body);
        console.log(friends);
        // do things with friends - pass to database helper function???
      });
    };

    parseList(friendsList);

  };

  getList(screenName, getFriendData);

};
