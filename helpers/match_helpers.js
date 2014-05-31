/*        MODULE DEPENDENCIES       */
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var geo = require('geolib');
var timeago = require('timeago');
var _  = require('underscore');

exports.findMatches = function(screenName, searchRadius, location){

  var query = [ 
    'MATCH (u:User)-[:FOLLOWS]->(p:User)<-[:FOLLOWS]-(m)',
    'WHERE u.screen_name = {screen_name} AND m.app_user = true',
    'SET u.latest_location = {latest_location}, u.latest_activity = {latest_activity}',
    'RETURN COUNT(m), m ORDER BY COUNT(m) DESC'
  ].join('\n');
                
  var params = {screen_name:screenName, latest_location: location, latest_activity: new Date()};

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      var matches = results.map(function(result) {
        return [result['COUNT(m)'], result.m._data.data];
      });

      console.log(matches);

      filterMatches(matches);

      // filterMatchesByDistance(matches);
      // sortMatchesByLocation(matches);
    }
    //add callback for the request_helper to send the response back to app
  });

  var filterMatches = function(matches) {

    var filterByTime = function(matches) {

      // _.each(matches, function(match){
      //   console.log(match[1].latest_activity);
      // });
      var currentTime = Date.now();

      var timeFilteredMatches = _.filter(matches, function(match){
        return (currentTime - match[1].latest_activity <= 3600000);
      });
      
      _.each(timeFilteredMatches, function(match){
        match[1].latest_activity = timeago(match[1].latest_activity); 
      }); 

      console.log(timeFilteredMatches);

      if ( !!location ) {
        filterByLocation(matches);
      } else {
        //return matches to client
      }


    };

    var filterByLocation = function(matches) {

      // filter by location

      //return filtered matches to client
    }

    filterByTime(matches);
  }


};