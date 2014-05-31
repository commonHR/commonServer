/*        MODULE DEPENDENCIES       */
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var geolib = require('geolib');
var timeago = require('timeago');
var _  = require('underscore');

exports.findMatches = function(screenName, searchRadius, location){


  var query = [ 
    'MATCH (u:User)-[:FOLLOWS]->(p:User)<-[:FOLLOWS]-(m)',
    'WHERE u.screen_name = {screen_name} AND m.app_user = true',
    'SET u.latest_location = {latest_location}, u.latest_activity = {latest_activity}',
    'RETURN COUNT(m), m, u'
    'ORDER BY COUNT(m) DESC'
  ].join('\n');
                
  var params = {screen_name:screenName, latest_location: location, latest_activity: new Date().getTime()};

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      var matches = results.map(function(result) {
        return [result['COUNT(m)'], result.m._data.data, commonFriendsArray(result.u._data.data.screen_name, result.m._data.data.screen_name)];
      });

      filterMatches(matches);
    }
    //add callback for the request_helper to send the response back to app
  });

  var commonFriendsArray = function(userScreenName, otherScreenName){
    var cfaQuery = ['MATCH (u:User)-[:FOLLOWS]->(p:User)<-[:FOLLOWS]-(m)',
    'WHERE u.screen_name = userScreenName} AND m.app_user = true AND m.screen_name = otherScreenName',
    'RETURN p'
    ].join('/n');
    var result=[];
    db.query(cfaQuery, params, function (error, results) {
      if ( error ) {
        console.log (error);
      } else {
        result.push();
     }
    });
    return result;
  };  

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

      if ( !!location ) {
        filterByLocation(timeFilteredMatches);
      } else {
        //return timeFilteredMatches to client
      }
    };

    var filterByLocation = function(matches) {

      var filteredMatches = [];

      _.each(matches, function(match) {
        console.log(match);
        var userLocation = JSON.parse(location);
        var matchLocation = JSON.parse(match[1].latest_location);
        var distance = (geolib.getDistance(userLocation, matchLocation)) * 0.000621371 ;//Convert to miles

        if ( distance <= searchRadius ) {
          filteredMatches.push(match);
        }
      });

      //return filterdMatches to client

    };

    filterByTime(matches);
  };


};