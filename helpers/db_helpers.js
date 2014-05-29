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
var dbURL = 'neo4jdb.cloudapp.net:7474/db/data/cypher'



/* QUERY STRINGS */


exports.addFriends = function(screenName, friends) {

  _.each(friends, function(friend) {
    addUser(friend);
    addFollowingRelationship(screenName, friend.screen_name);
  });

};


exports.deleteAppUser = function(screenName){
  //deletes a user node and all relationships if a user decides to delete their account
  //also need to delete a friend node if no other users are following that person
};

var addUser = exports.addUser = function(user, appUser) { //appUser is a boolean indicating whether or not this person is a user of our app or not

  console.log(user);

  var query;
  var appUserQuery = "MERGE (u:User {screen_name: {screen_name}}) ON MATCH SET u.appUser = {app_user} ON CREATE SET u.id_str= {id_str}, u.name = {name}, u.screen_name = {screen_name}, u.description = {description}, u.profile_image_url = {profile_image_url}, u.app_user = {app_user}, u.location = {location} RETURN u"
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
      console.log('database updated');
    }
  });

  if ( !!appUser ) {
    twitter.getFriends(user.screen_name);
  };

};

var addFollowingRelationship = function ( userScreenName, friendScreenName) {

  var query = "MATCH (u:User {screen_name: {userName}}), (f:User {screen_name: {friendName}}) CREATE UNIQUE (u)-[:FOLLOWS]->(f)";

  var params = {
    userName: userScreenName,
    friendName: friendScreenName
  };

  db.query(query, params, function (err, results) {
    if ( err ) {
      console.log (err);
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





// {
//   "id": 248461595,
//   "id_str": "248461595",
//   "name": "Aaron Rice",
//   "screen_name": "RICEaaron",
//   "location": "San Francisco, CA",
//   "description": "string",
//   "url": null,
//   "app_user": true,
//   "bio": "string",
//   "token": "crazy encrypted string"
// }













