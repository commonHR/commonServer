/*        MODULE DEPENDENCIES       */
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var geolib = require('geolib');
var timeago = require('timeago');
var _  = require('underscore');

exports.findMatches = function(screenName, location){

  var query = [ 
    'MATCH (u:User)-[:FOLLOWS]->(p:User)<-[:FOLLOWS]-(m)',
    'WHERE u.screen_name = {screen_name} AND m.app_user = true',
    'SET u.latest_location = {latest_location}, u.latest_activity = {latest_activity}',
    'RETURN COUNT(m), m, u',
    'ORDER BY COUNT(m) DESC'
  ].join('\n');
                
  var params = {screen_name:screenName, latest_location: location, latest_activity: new Date().getTime()};

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      var matches = [];
      _.each(results, function(result) {
        result.m._data.data.no_common_friends = result['COUNT(m)'];
        matches.push(result.m._data.data);
      });

      filterMatches(matches);
    }
  });

  var filterMatches = function(matches) {

    var filterByTime = function(matches) {

      var timeFilteredMatches = [];

      // Filters matches by latest activity
      _.each(matches, function(match){
        if (new Date().getTime() -  match.latest_activity <= 10800000) { // 3 hours
          timeFilteredMatches.push(match);
        }
      });
      
      // Converts the latest activity of each user a friendly format (i.e., 8 minutes ago, 2 hours ago, etc.)
      _.each(timeFilteredMatches, function(match){
        var time = new Date(match.latest_activity);
        match.latest_activity = timeago(time);
      });

      filterByLocation(timeFilteredMatches);

    };

    var filterByLocation = function(matches) {

      var filteredMatches = [];

      var searchRadius = 50; // This is an option that should be set on the front end

      _.each(matches, function(match) {
        var userLocation = JSON.parse(location);
        var matchLocation = JSON.parse(match.latest_location);

        console.log(userLocation);
        console.log(matchLocation);
        var distance = (geolib.getDistance(userLocation, matchLocation)) * 0.000621371 ;//Convert to miles
        if ( distance <= searchRadius ) {
          match.distance = distance.toFixed(1);
          filteredMatches.push(match);
        }
      });

      updateMatchesWithFriends(filteredMatches);

    };

    filterByTime(matches);
  };

  var updateMatchesWithFriends = function(matches){

    var matchCount = matches.length;

    if ( matchCount === 0 ) {
      //callback - return empty set to client
    } else {
      _.each(matches, function(match) {

        var friendsQuery = ['MATCH (u:User)-[:FOLLOWS]->(p:User)<-[:FOLLOWS]-(m)',
        'WHERE u.screen_name = {user} AND m.screen_name = {match}',
        'RETURN p',
        'LIMIT 5'
        ].join('\n');

        var params = {
          'user': screenName,
          'match': match.screen_name
        };
        
        db.query(friendsQuery, params, function (error, results) {
          if ( error ) {
            console.log (error);
          } else {
            var friends = _.map(results, function(result){
              return result.p._data.data.screen_name;
            });
            match.common_friends = friends;
            matchCount--;
            if (matchCount === 0 ) {
              packageResults(matches);
            }
          }
        });
      });
    }
  }; 

  //Formats results of search before returning to client
  var packageResults = function(matches) {

    var results = _.map(matches, function(match){
      var result = {};
      var name = match.screen_name;
      var data = match;
      result[name] = data;
      return result;
    });

    console.log(results);
  //return results to client
  }; 
};
