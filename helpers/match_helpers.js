var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');

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