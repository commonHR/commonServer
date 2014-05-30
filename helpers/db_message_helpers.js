/* global require, exports */
var db = require('./db_helpers');

/*--------Conversation Methods-----------*/
exports.getAll = function(data, callback) {
  var query = [
    'MATCH (user:User {screen_name:{screen_name}})',
    'SET user.latest_activity = "'+ new Date().getTime()+'"',
    'WITH user',
    'MATCH (user)-[:HAS_CONVERSATION]->(c:Conversation)<-[:HAS_CONVERSATION]-(other:User)',
    'WITH c, other',
    'MATCH (other)-[:WORKS_FOR]->(company:Company)',
    'WITH other, c',
    'MATCH path=(c)-[*]->(m:Message)',
    'RETURN DISTINCT other, collect(m) as messages'
  ].join('\n');

  var params = {
    userId: data.userId
  };
  
  // Make sure correct params exist
  if (!params.userId){
      return callback(new Error('Missing valid params to query'));
  }
  db.query(query, params, function (err, results) {
    if (err) { return callback(err); }
    else { processMessages(data.userId, results, callback); }
  });
};

exports.getOne = function(data, callback){
  var query = [
    'MATCH (user:User {userId:{userId}})--(c:Conversation)--(other:User {userId:{otherId}}),',
    '(other)-[:WORKS_FOR]->(company:Company)',
    'WITH other, c, company',
    'LIMIT 1',
    'MATCH path=(c)-[*]->(m:Message)',
    'WHERE m.time > {mostRecentMsg}',
    'RETURN DISTINCT other, c.connectDate as connectDate, collect(m) as messages, collect(company) as company'
  ].join('\n');

  // need to check for missing params due to bug in node-neo4j
  var params = {
    userId: data.userId,
    otherId: data.otherId,
    mostRecentMsg: data.mostRecentMsg
  };

  // Make sure correct params exist
  if (!params.userId || !params.otherId || !params.mostRecentMsg){
      return callback(new Error('Missing valid params to query'));
  }
  db.query(query, params, function (err, results) {
    if (err){callback(err);}
    else {processMessages(data.userId, results, callback);}
  });
};

//Clean up the data from Neo4j before sending to the front end
var processMessages = function(userId, results, callback){
  var companyHelper = function(company){
    if(company.length > 0){return company[0].data;}
    else{return 'Not Entered';}
  };
  var finalResults = results.map(function(obj){
    obj.user = userId;
    obj.other = {
      userId: obj.other.data.userId,
      firstName: obj.other.data.firstName,
      lastName: obj.other.data.lastName,
      picture: obj.other.data.picture,
      WORKS_FOR: companyHelper(obj.company),
      lastActive: obj.other.data.lastActive
    };
    obj.connectDate = obj.connectDate;
    obj.messages = obj.messages.map(function(obj2){
      return {
        sender:obj2.data.sender,
        text:obj2.data.text,
        time:obj2.data.time
      };
    });
    delete obj.company;
    return obj;
  });
  callback(null, finalResults);
};

exports.sendMessage = function(data, callback){
  var query = [
    'MATCH (user:User {userId:{userId}})-[:HAS_CONVERSATION]->(c:Conversation)<-[:HAS_CONVERSATION]-(other:User {userId:{otherId}})',
    'WITH c',
    'MATCH (c)-[r:CONTAINS_MESSAGE]->(m2:Message)',
    'DELETE r',
    'WITH c, m2',
    'CREATE UNIQUE (c)-[:CONTAINS_MESSAGE]->(m:Message {sender:{userId}, text:{text}, time:{time}})-[:CONTAINS_MESSAGE]->(m2)',
    'RETURN null'
  ].join('\n');

  var params = {
    userId: data.userId,
    otherId: data.otherId,
    text: data.text,
    time: data.time
  };

  // Make sure correct params exist
  if (!params.userId || !params.otherId || !params.text || !params.time){
      return callback(new Error('Missing valid params to query'));
  }
  db.query(query, params, function (err, results) {
    callback(err, results);
  });
};