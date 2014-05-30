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

var dbURL = 'neo4jdb.cloudapp.net:7474/db/data/cypher';  //Azure
// var dbURL = 'tweetup.sb02.stations.graphenedb.com:24789/db/data/cypher'; //Graphene

/* *************************  */

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
  
  var params;
  var appUserParams = {
    'id_str': user.id_str,
    'name': user.name,
    'screen_name': user.screen_name,
    'description': user.description,
    'profile_image_url': user.profile_image_url,
    'app_user': (!!appUser),
    'location': user.location || 'unknown'
  };
  var friendParams = { 'id_str': user };

  var query;
  var appUserQuery = "MERGE (u:User {id_str: {id_str}}) ON MATCH SET u.name = {name}, u.screen_name = {screen_name}, u.description = {description}, u.profile_image_url = {profile_image_url}, u.app_user = {app_user}, u.location = {location}, u.latest_activity = timestamp() ON CREATE SET u.id_str= {id_str}, u.name = {name}, u.screen_name = {screen_name}, u.description = {description}, u.profile_image_url = {profile_image_url}, u.app_user = {app_user}, u.location = {location}, u.latest_activity = timestamp() RETURN u";
  var friendQuery = "MERGE (u:User {id_str: {id_str}}) ON CREATE SET u.id_str = {id_str}";
  
  
  if ( !!appUser ) {
    query = appUserQuery;
    params = appUserParams;
  } else {
    query = friendQuery;
    params = friendParams;
  }

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log(user + " added to DB");
      if ( relationship ) {
        addFollowingRelationship( relationship.user, relationship.friend );
      }
    }
  });

  if ( !!appUser ) {
    twitter.getFriends(user.screen_name);
  }

};

var addFollowingRelationship = function ( userScreenName, friendID) {

  var query = "MATCH (u:User {screen_name: {userName}}), (f:User {id_str: {friendID}}) CREATE UNIQUE (u)-[:FOLLOWS]->(f)";

  var params = {
    userName: userScreenName,
    friendID: friendID
  };

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log(userScreenName + " follows friend with ID: " + friendID);
    }
  });

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
    //add callback for the request_helper to send the response back to app
  });

}

exports.updateUserProperty = function (screenName, properties) { 

}; 

exports.deleteAppUser = function(screenName){
  //deletes a user node and all relationships if a user decides to delete their account
  //also need to delete a friend node if no other users are following that person
};

var createConversationID = function( user_one, user_two ) {

  var init = [].concat(user_one, user_two).join('').split('');

  var result = _.map(init, function(letter){
    return letter.charCodeAt(0);
  })

  result = result.sort(function(a,b){ return a - b}).join('');
  return result;

};

exports.sendMessage = function(message){

  //check if there are previous messages between the same users

  var conversationID = createConversationID(message.to, message.from);

  var params = {
    'text':message.text,
    'time':message.timestamp, 
    'from':message.from, 
    'to':message.to,
    'conversationID': conversationID
  };

  var conversationQuery = "MATCH (a:User {screen_name: {to}}), (b:User {screen_name: {from}}) CREATE UNIQUE (a)-[:HAS_CONVERSATION]->( c:Conversation {id: {conversationID}} )<-[:HAS_CONVERSATION]-(b) RETURN c"

  db.query(conversationQuery, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log("created conversation", results);
    }
  });

  var createMessageQuery = "MATCH (c:CONVERSATION {id: {conversationID}}) CREATE (c)-[r:CONTAINS_MESSAGE]->(m:Message {to:{to}, text:{text}, time:{time}}) RETURN m"; 

  db.query(createMessageQuery, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log("created message", results);
    }
  });
  
  // if not create a new message node
  // else prepend the message to the front of the node
  // var query = "MERGE (m:Message {to:{to}, from:{from}}) ON MATCH SET m.position = {position} ON CREATE SET m.text= {text}, m.to = {to}, m.from = {from}, m.date = {date}, m.position = {position} RETURN m";

  var updateQuery = [
    'MATCH (c:Conversation {id:{conversationID}}),',
    '(c)-[r:CONTAINS_MESSAGE]->(m2:Message)',
    'DELETE r',
    'WITH c, m2',
    'CREATE UNIQUE (c)-[:CONTAINS_MESSAGE]->(m:Message {to:{to}, text:{text}, time:{time}})-[:CONTAINS_MESSAGE]->(m2)',
    'RETURN c'
  ].join('\n');

  db.query(updateQuery, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log("inserted second", results);
    }
  });

}