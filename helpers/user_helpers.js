/*        MODULE DEPENDENCIES       */

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
// var db = new neo4j.GraphDatabase('http://tweetUp:k7b6QjQKpK4cZwG1aI3g@tweetup.sb02.stations.graphenedb.com:24789');
var twitter = require('./twitter_helpers');
var chat = require('./chat_helpers');
var requestify = require('requestify');
var _ = require('underscore');

/*        DATABASE USER FUNCTIONS       */

exports.addFriends = function(screenName, friendsList) {
  
  _.each(friendsList, function(friend){
    addUser(friend, false, {user: screenName, friend: friend.screen_name});
  });
  
};

var addUser = exports.addUser = function(user, appUser, relationship) { //appUser is a boolean indicating whether or not this person is a user of our app or not

  var params = {
    'id_str': user.id_str,
    'name': user.name,
    'screen_name': user.screen_name,
    'description': user.description,
    'profile_image_url': user.profile_image_url,
    'location': user.location || 'unknown',
    'app_user': (!!appUser),
    'latest_activity': new Date().getTime(),
    'latest_location': !!user.latest_location ? user.latest_location : '{"latitude": "42.3314", "longitude": "83.0458"}' 
  };

  var appUserQuery = [  
    'MERGE (user:User {screen_name: {screen_name}})',
    'ON MATCH SET user.id_str = {id_str}, user.screen_name = {screen_name}, user.description = {description},',
    'user.profile_image_url = {profile_image_url}, user.app_user = {app_user}, user.location = {location},',
    'user.latest_activity = {latest_activity}, user.latest_location = {latest_location}',
    'ON CREATE SET user.id_str= {id_str}, user.name = {name}, user.screen_name = {screen_name},',
    'user.description = {description}, user.profile_image_url = {profile_image_url}, user.location = {location},',
    'user.app_user = {app_user}, user.latest_activity = {latest_activity}, user.latest_location = {latest_location} RETURN user'
  ].join('\n');

  var friendQuery = [
    'MERGE (user:User {screen_name: {screen_name}})',
    'ON CREATE SET user.id_str= {id_str}, user.name = {name}, user.screen_name = {screen_name}, user.description = {description},',
    'user.profile_image_url = {profile_image_url}, user.app_user = {app_user}, user.location = {location} RETURN user'   
  ].join('\n');

  var query;
                          
  if ( !!appUser ) {
    query = appUserQuery;
  } else {
    query = friendQuery;
  }

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log(user.screen_name + ' added to DB');
      if ( relationship ) {
        addFollowingRelationship( relationship.user, relationship.friend );
      }
      if ( !!appUser ) {
        resetFriends(user.screen_name);
        twitter.getTweets(user.screen_name);
      }
    }
  });

};

var resetFriends = exports.resetFriends = function (userName) {

  var query = [
    'MATCH (user:User {screen_name: {userName}})-[relationship:FOLLOWS]->(friend)',
    'DELETE relationship'
    ].join('\n');

  var params = {userName: userName};

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      twitter.getFriends(userName);
    }
  });

};

var addFollowingRelationship = function (userName, friendName) {

  var query = [ 
    'MATCH (user:User {screen_name: {userName}}), (friend:User {screen_name: {friendName}})',
    'CREATE UNIQUE (user)-[:FOLLOWS]->(friend)'
  ].join('\n');  

  var params = {
    userName: userName,
    friendName: friendName
  };

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log(userName + ' follows ' + friendName);
    }
  });

};








