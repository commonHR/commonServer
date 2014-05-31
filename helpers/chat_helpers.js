/*       MODULE DEPENDENCIES         */
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474'); //Graphene 'tweetup.sb02.stations.graphenedb.com:24789/'
var _ = require('underscore');

/*         CHAT FUNCTIONS            */

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

  var conversationQuery = [
    'MATCH (c:Conversation {id:{conversationID}})',
    'WITH c',
    'MATCH path=(c)-[*]->(m:Message)',
    'RETURN collect(m) as messages'
  ].join('\n'); 

  db.query(conversationQuery, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      
      var messageData = results[0].messages;

      var messages = _.map(messageData, function(message){
        return message._data.data;
      });

      var conversation = { screen_name: match, conversation: messages};

      // return conversation;
    }
  }); 
};

exports.retrieveConversations = function(screenName, callback) {

  var params = {
    'user': screenName
  };

  var retrieveMessagesQuery = [
    'MATCH (user:User {screen_name:{user}})',
    'SET user.latest_activity = "'+ new Date().getTime()+'"',
    'WITH user',
    'MATCH (user)-[:HAS_CONVERSATION]->(c:Conversation)<-[:HAS_CONVERSATION]-(match:User)',
    'WITH c, match',
    'MATCH path=(c)-[*]->(m:Message)',
    'RETURN DISTINCT c.latest_message, match, collect(m) as messages',
    'ORDER BY c.latest_message DESC'
  ].join('\n'); 


  db.query(retrieveMessagesQuery, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      var conversations = [];

      _.each(results, function(result){
        var conversation = {};
        var user = result.match._data.data.screen_name;
        var messages = _.map(result.messages, function(message){
          return message._data.data;
        })
        conversation.screen_name = user;
        conversation.conversation = messages;
        conversations.push(conversation);
      });

      // callback(conversations);
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
    'time': new Date().getTime()
  };

  var conversationQuery = [ 
    'MERGE (c:Conversation {id: {conversationID}})',
    'ON MATCH SET c.latest_message = {time}',
    'ON CREATE SET c.latest_message = {time}, c.new_conversation = true',
    'WITH c', 
    'MATCH (a:User {screen_name: {sender} }), (b:User {screen_name: {recipient} })',
    'CREATE UNIQUE (a)-[:HAS_CONVERSATION]->(c)<-[:HAS_CONVERSATION]-(b)',
    'RETURN c'
  ].join('\n');  

  db.query(conversationQuery, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log("Conversation results", results);
      createFirstMessage();
    }
  });

  //  Adds a new message to the conversation if none exist
  var createFirstMessage = function() {
    
    var firstMessageQuery = [
      'MATCH (c:Conversation {id:{conversationID} , new_conversation: true})',
      'SET c.new_conversation = false',
      'CREATE UNIQUE (c)-[:CONTAINS_MESSAGE]->(m:Message {sender:{sender}, recipient:{recipient}, text:{text}, time:{time}})',
      'RETURN m,c'
    ].join('\n');


    db.query(firstMessageQuery, params, function (error, results) {
      if ( error ) {
        console.log (error);
      } else {
        if ( results.length === 0 ) {
          addMessage();
        }
      }
    });
  };

  //If one or more messasge already exist, inserts the message and updates the message chain
  var addMessage = function(){

    var messageQuery = [
      'MATCH (c:Conversation {id:{conversationID}, new_conversation: false})',
      'WITH c',
      'MATCH (c)-[r:CONTAINS_MESSAGE]->(m2:Message)',
      'DELETE r',
      'WITH c, m2',
      'CREATE UNIQUE (c)-[:CONTAINS_MESSAGE]->(m:Message {sender:{sender}, recipient:{recipient}, text:{text}, time:{time}})-[:CONTAINS_MESSAGE]->(m2)',
      'RETURN m,c'
    ].join('\n');

    db.query(messageQuery, params, function (error, results) {
      if ( error ) {
        console.log (error);
      } else {
        console.log("Add message", results);
      }
    });
  };
};
