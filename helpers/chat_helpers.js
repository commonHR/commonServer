/*       MODULE DEPENDENCIES         */
var neo4j = require('neo4j');
<<<<<<< HEAD
// var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var db = new neo4j.GraphDatabase('http://tweetUp:k7b6QjQKpK4cZwG1aI3g@tweetup.sb02.stations.graphenedb.com:24789');
=======
var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
// var db = new neo4j.GraphDatabase('http://tweetUp:k7b6QjQKpK4cZwG1aI3g@tweetup.sb02.stations.graphenedb.com:24789');
>>>>>>> fc88c4a6cde953bde244e51e5f35b397107103ac
var _ = require('underscore');

/*        CHAT FUNCTIONS        */

var getConversationID = function( user_one, user_two ) {

  return _.map([].concat(user_one, user_two).join('').split(''), function(letter){
    return letter.charCodeAt(0); 
  }).sort(function(a,b){ return a - b;}).join('');

};

exports.retrieveSingleConversation = function(user, match) {

  var conversationID = getConversationID(user, match);

  var params = {
    'conversationID': conversationID
  };

  var query = [
    'MATCH (conversation:Conversation {id:{conversationID}})',
    'WITH conversation',
    'MATCH path=(conversation)-[*]->(message:Message)',
    'RETURN collect(message) as messages'
  ].join('\n'); 

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      var conversation = {};
      var messageData = results[0].messages;

      var messages = _.map(messageData, function(message){
        return message._data.data;
      });

      conversation[match] = messages;

      // return conversation;
    }
  }); 
};

exports.retrieveConversations = function(screenName, callback) {

  var params = {
    'user': screenName
  };

  var query = [
    'MATCH (user:User {screen_name:{user}})',
    'SET user.latest_activity = "'+ new Date().getTime()+'"',
    'WITH user',
    'MATCH (user)-[:HAS_CONVERSATION]->(conversation:Conversation)<-[:HAS_CONVERSATION]-(match:User)',
    'WITH conversation, match',
    'MATCH path=(conversation)-[*]->(message:Message)',
    'RETURN DISTINCT conversation.latest_message, match, collect(message) as messages',
    'ORDER BY conversation.latest_message DESC'
<<<<<<< HEAD
  ].join('\n');
=======
  ].join('\n'); 

>>>>>>> fc88c4a6cde953bde244e51e5f35b397107103ac

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      var conversations = {};
      _.each(results, function(result){
        var match = result.match._data.data;
        var screen_name = result.match._data.data.screen_name;
        var messages = _.map(result.messages, function(message){
          return message._data.data;
        });
        conversations[screen_name] = {match: match, messages: messages};
      });

      callback(conversations);
    }
  }); 

};

exports.sendMessage = function(message){

  var conversationID = getConversationID(message.sender, message.recipient);

  var params = {
    'conversationID': conversationID,
    'sender':message.sender, 
    'recipient':message.recipient,
    'text':message.text,
    'time': new Date()
  };

  var conversationQuery = [ 
    'MERGE (conversation:Conversation {id: {conversationID}})',
    'ON MATCH SET conversation.latest_message = {time}',
    'ON CREATE SET conversation.latest_message = {time}, conversation.new_conversation = true',
    'WITH conversation', 
    'MATCH (sender:User {screen_name: {sender} }), (recipient:User {screen_name: {recipient} })',
    'CREATE UNIQUE (sender)-[:HAS_CONVERSATION]->(conversation)<-[:HAS_CONVERSATION]-(recipient)',
    'RETURN conversation'
  ].join('\n');  

  db.query(conversationQuery, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log('Conversation updated');
      createFirstMessage();
    }
  });

  //  Adds a new message to the conversation if none exist
  var createFirstMessage = function() {
    
    var firstMessageQuery = [
      'MATCH (conversation:Conversation {id:{conversationID} , new_conversation: true})',
      'SET conversation.new_conversation = false',
      'CREATE UNIQUE (conversation)-[:CONTAINS_MESSAGE]->(message:Message {sender:{sender}, recipient:{recipient}, text:{text}, time:{time}})',
      'RETURN message, conversation'
    ].join('\n');


    db.query(firstMessageQuery, params, function (error, results) {
      if ( error ) {
        console.log (error);
      } else {
        if ( results.length === 0 ) { //Results will be an empty array if new_conversation = false
          addMessage();
        } else {
          console.log('Added first message to the conversation');
        }
      }
    });
  };

  //If one or more messasge already exist, inserts the message and updates the message chain
  var addMessage = function(){

    var messageQuery = [
      'MATCH (conversation:Conversation {id:{conversationID}, new_conversation: false})',
      'WITH conversation',
      'MATCH (conversation)-[relationship:CONTAINS_MESSAGE]->(message2:Message)',
      'DELETE relationship',
      'WITH conversation, message2',
<<<<<<< HEAD
      'CREATE UNIQUE (conversation)-[:CONTAINS_MESSAGE]->(message:Message {sender:{sender},',
      'recipient:{recipient}, text:{text}, time:{time}})-[:CONTAINS_MESSAGE]->(message2)',
=======
      'CREATE UNIQUE (conversation)-[:CONTAINS_MESSAGE]->(message:Message {sender:{sender}, recipient:{recipient}, text:{text}, time:{time}})-[:CONTAINS_MESSAGE]->(message2)',
>>>>>>> fc88c4a6cde953bde244e51e5f35b397107103ac
      'RETURN message, conversation'
    ].join('\n');

    db.query(messageQuery, params, function (error, results) {
      if ( error ) {
        console.log (error);
      } else {
        console.log('Message added to the conversation');
      }
    });
  };
};
