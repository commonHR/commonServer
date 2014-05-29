var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var twitter = require('./twitter_helpers');
var chat = require('./chat_helpers');
var requestify = require('requestify');
var _ = require('underscore');


/*         NEO4J VARS         */
var dbHeaders = {
  'Accept': 'application/json; charset=UTF-8',
  'Content-Type': 'application/json'
};
var dbURL = 'neo4jdb.cloudapp.net:7474/db/data/cypher';



/* QUERY STRINGS */


exports.addFriends = function(screenName, friends) {

  _.each(friends, function(friend) {
    addUser(friend, false, {user: screenName, friend: friend.screen_name});
  });

};


exports.deleteAppUser = function(screenName){
  //deletes a user node and all relationships if a user decides to delete their account
  //also need to delete a friend node if no other users are following that person
};

var addUser = exports.addUser = function(user, appUser, relationship) { //appUser is a boolean indicating whether or not this person is a user of our app or not

  var query;
  var appUserQuery = "MERGE (u:User {screen_name: {screen_name}}) ON MATCH SET u.app_user = {app_user}, u.latest_activity = timestamp() ON CREATE SET u.id_str= {id_str}, u.name = {name}, u.screen_name = {screen_name}, u.description = {description}, u.profile_image_url = {profile_image_url}, u.app_user = {app_user}, u.location = {location}, u.latest_activity = timestamp() RETURN u"
  var friendQuery = "MERGE (u:User {screen_name: {screen_name}}) ON CREATE SET u.id_str= {id_str}, u.name = {name}, u.screen_name = {screen_name}, u.description = {description}, u.profile_image_url = {profile_image_url}, u.app_user = {app_user}, u.location = {location} RETURN u"

  if ( !!appUser ) {
    query = appUserQuery;
  } else {
    query = friendQuery;
  }

  var params = {
    'id_str': user.id_str,
    'name': user.name,
    'screen_name': user.screen_name,
    'description': user.description,
    'profile_image_url': user.profile_image_url,
    'app_user': (!!appUser),
    'location': user.location || 'unknown'
  }

  db.query(query, params, function (err, results) {
    if ( err ) {
      console.log (err);
    } else {
      if ( relationship ) {
        addFollowingRelationship( relationship.user, relationship.friend );
      }
    }
  });

  if ( !!appUser ) {
    twitter.getFriends(user.screen_name);
  }

};

var addFollowingRelationship = function ( userScreenName, friendScreenName) {

  var query = "MATCH (u:User {screen_name: {userName}}), (f:User {screen_name: {friendName}}) CREATE UNIQUE (u)-[:FOLLOWS]->(f)";

  var params = {
    userName: userScreenName,
    friendName: friendScreenName
  };

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log(userScreenName + " follows " + friendScreenName);
    }
  });

};

exports.updateUserProperty = function (screenName, properties) { //assuming that properties will be an object containing all properties that need to be updated

}; 

exports.getTwitterInfo = function(screenName) { // this needs to be an object with a screenName key and the screenName as the value
  //sends a get request to the twitter api to get all the user information
};

exports.findMatches = function(screenName){

  var query = "MATCH (u:User)-[:FOLLOWS]->(p:User)<-[:FOLLOWS]-(m) WHERE u.screen_name = {screen_name} AND m.app_user = true RETURN COUNT(m), m ORDER BY COUNT(m) DESC"
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
  });

}


