var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474'); //Graphene 'tweetup.sb02.stations.graphenedb.com:24789/'
var twitter = require('./twitter_helpers');
var chat = require('./chat_helpers');
var requestify = require('requestify');
var _ = require('underscore');

/* *************************  */

exports.addFriendsWithInfo = function(screenName, friendsList) {
  
  _.each(friendsList, function(friend){
    addUser(friend, false, {user: screenName, friend: friend.screen_name});
  });

};

exports.addFriends = function(screenName, friendsList) {

  var parseList = function(friendsList){
    for ( var i = 0; i < friendsList.length; i += 100 ) {
      var list = friendsList.slice(i, i + 100);
      addFriendToDB(list);
    }
  };

  var addFriendToDB = function(list) {
    _.each(list, function (friend) {
      addUser(friend, false, {user: screenName, friend: friend}); // friend is id_str
    });
  };

  parseList(friendsList);

};

var addUser = exports.addUser = function(user, appUser, relationship) { //appUser is a boolean indicating whether or not this person is a user of our app or not
  
  var params = {
    'id_str': user.id_str,
    'name': user.name,
    'screen_name': user.screen_name,
    'description': user.description,
    'profile_image_url': user.profile_image_url,
    'app_user': (!!appUser),
    'latest_activity': new Date().getTime(),
    'location': user.location || 'unknown'
  };

  var query;
  var appUserQuery = [  
    'MERGE (u:User {screen_name: {screen_name}})',
    'ON MATCH SET u.id_str = {id_str}, u.screen_name = {screen_name}, u.description = {description},',
    'u.profile_image_url = {profile_image_url}, u.app_user = {app_user}, u.location = {location},',
    'u.latest_activity = {latest_activity} ON CREATE SET u.id_str= {id_str}, u.name = {name},',
    'u.screen_name = {screen_name}, u.description = {description}, u.profile_image_url = {profile_image_url},',
    'u.app_user = {app_user}, u.location = {location}, u.latest_activity = {latest_activity} RETURN u'
  ].join('\n');

  var friendQuery = [
    'MERGE (u:User {screen_name: {screen_name}})',
    'ON CREATE SET u.id_str= {id_str}, u.name = {name}, u.screen_name = {screen_name}, u.description = {description},',
     'u.profile_image_url = {profile_image_url}, u.app_user = {app_user}, u.location = {location} RETURN u'   
  ].join('\n');
                          
  if ( !!appUser ) {
    query = appUserQuery;
  } else {
    query = friendQuery;
  }

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log(user.screen_name + " added to DB");
      if ( relationship ) {
        addFollowingRelationship( relationship.user, relationship.friend );
      }
    }
  });

  if ( !!appUser ) {
    twitter.getFriends(user.screen_name);
  }

};

var addFollowingRelationship = function ( userName, friendName) {

  var query = [ 
    'MATCH (u:User {screen_name: {userName}}), (f:User {screen_name: {friendName}})',
    'CREATE UNIQUE (u)-[:FOLLOWS]->(f)'
  ].join('\n');  

  var params = {
    userName: userName,
    friendName: friendName
  };

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log(userName + " follows " + friendName);
    }
  });

};

exports.findMatches = function(screenName){

  var query = [ 
    'MATCH (u:User)-[:FOLLOWS]->(p:User)<-[:FOLLOWS]-(m)',
    'WHERE u.screen_name = {screen_name} AND m.app_user = true',
    'RETURN COUNT(m), m ORDER BY COUNT(m) DESC'
  ].join('\n');
                
  var params = {screen_name:screenName};

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      var matches = results.map(function(result) {
        return [result['COUNT(m)'], result.m._data.data];
      });
      console.log(matches);
    }
    //add callback for the request_helper to send the response back to app
  });

};

exports.updateUserProperty = function (screenName, properties) { 

}; 

exports.deleteAppUser = function(screenName){
  //deletes a user node and all relationships if a user decides to delete their account
  //also need to delete a friend node if no other users are following that person
};