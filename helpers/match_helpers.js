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
                
  var params = {screen_name:screenName, latest_location: location, latest_activity: new Date().getTime()};

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      var matches = results.map(function(result) {
        return [result['COUNT(m)'], result.m._data.data];
      });

      filterMatches(matches);
    }
    //add callback for the request_helper to send the response back to app
  });

  var filterMatches = function(matches) {

    var filterByTime = function(matches) {

      var currentTime = new Date().getTime();

      var timeFilteredMatches = [];

      // Filters matches by latest activity
      _.each(matches, function(match){
        if (new Date().getTime() -  match[1].latest_activity <= 10800000) { // 3 hours
          timeFilteredMatches.push(match);
        }
      });
      
      // Converts the latest activity of each user a friendly format (i.e., 8 minutes ago, 2 hours ago, etc.)
      _.each(timeFilteredMatches, function(match){
        var time = new Date(match[1].latest_activity);
        match[1].latest_activity = timeago(time);
      });

      // if ( !!location ) {
      //   filterByLocation(timeFilteredMatches);
      // } else {
      //   //return timeFilteredMatches to client
      // }
    };

    var filterByLocation = function(matches) {

      // filter by location

      //return filtered matches to client
    }

    filterByTime(matches);
  }


};