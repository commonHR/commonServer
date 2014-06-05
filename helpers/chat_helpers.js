/*       MODULE DEPENDENCIES         */
var neo4j = require('neo4j');
// var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var db = new neo4j.GraphDatabase('http://tweetUp:k7b6QjQKpK4cZwG1aI3g@tweetup.sb02.stations.graphenedb.com:24789');
var _ = require('underscore');

/*        CHAT FUNCTIONS        */

var getConversationID = function( user_one, user_two ) {

  return _.map([].concat(user_one, user_two).join('').split(''), function(letter){
    return letter.charCodeAt(0); 
  }).sort(function(a,b){ return a - b;}).join('');

};

var getTimestamp = function(date){
  var chatDate = new Date(date);
  console.log(chatDate);
  console.log(typeof chatDate);
  if(chatDate.getMinutes() < 10){
    var minute = '0' + chatDate.getMinutes();
  }else{
    var minute = chatDate.getMinutes();
  }

  var newDate = new Date();
  if(newDate.getDate() - chatDate.getDate() === 0){
    //less than one day ago
    return 'Today ' + chatDate.getHours() + ':' + minute;
  }else if(newDate.getFullYear() - chatDate.getFullYear()){
    //less than one year ago
    return (chatDate.getMonth() + 1) + '-' + chatDate.getDate() + ' ' + chatDate.getHours() + ':' + minute;
  }else{
    return chatDate.getFullYear() + '-' + (chatDate.getMonth() + 1) + '-' + chatDate.getDate() + ' ' + chatDate.getHours() + ':' + minute;
  }
};

exports.retrieveSingleConversation = function(user, match, callback) {

  var conversationID = getConversationID(user, match);


  var query = [
    'MATCH (conversation:Conversation {id:{conversationID}})',
    'WITH conversation',
    'MATCH path=(conversation)-[*]->(message:Message)',
    'RETURN collect(message) as messages'
  ].join('\n'); 

  var params = {
    'conversationID': conversationID
  };

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      console.log(results);
      var conversation = {};
      var messageData = results[0].messages;

      var messages = _.map(messageData, function(message){
        // return message._data.data;
        return _.extend(message._data.data, {timestamp: getTimestamp(message._data.data.time)});
      });

      // conversation[match] = messages;
      
      callback(messages);
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
  ].join('\n'); 

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      var conversations = {};
      _.each(results, function(result){
        var match = result.match._data.data;
        var screen_name = result.match._data.data.screen_name;
        var messages = _.map(result.messages, function(message){
          // return message._data.data;
          return _.extend(message._data.data, {timestamp: getTimestamp(message._data.data.time)});
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
      'CREATE UNIQUE (conversation)-[:CONTAINS_MESSAGE]->(message:Message {sender:{sender},',
      'recipient:{recipient}, text:{text}, time:{time}})-[:CONTAINS_MESSAGE]->(message2)',
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
