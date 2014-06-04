/*        MODULE DEPENDENCIES       */
var neo4j = require('neo4j');
// var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var db = new neo4j.GraphDatabase('http://tweetUp:k7b6QjQKpK4cZwG1aI3g@tweetup.sb02.stations.graphenedb.com:24789');
var geolib = require('geolib');
var timeago = require('timeago');
var _  = require('underscore');
var twitter = require('./twitter_helpers');
var Q = require('q');

exports.findMatches = function(screenName, location, callback){

  var query = [ 
    'MATCH (user:User)-[:FOLLOWS]->(friend:User)<-[:FOLLOWS]-(match:User)',
    'WHERE user.screen_name = {screen_name} AND match.app_user = true',
    'SET user.latest_location = {latest_location}, user.latest_activity = {latest_activity}',
    'RETURN COUNT(match), match, user',
    'ORDER BY COUNT(match) DESC'
  ].join('\n');
                
  var params = {screen_name:screenName, latest_location: location, latest_activity: new Date().getTime()};

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      var matches = [];
      _.each(results, function(result) {
        result.match._data.data.no_common_friends = result['COUNT(match)'];
        matches.push(result.match._data.data);
      });

      Q.all()
        matches.forEach(function (match) {
          var test = twitter.getTweets(match.screen_name);
          console.log(test);
      });

      //call get tweets
      //call term freq
      //call inverse term freq incl users tweets
      //call cosine func
      //add results to filter
      filterMatches(matches);
    }
  });

  var filterMatches = function(matches) {

    var filterByTime = function(matches) {

      var timeFilteredMatches = [];

      // Filters matches by latest activity
      _.each(matches, function(match){
        if (new Date().getTime() -  match.latest_activity <= 10800000000) { // 3000 hours
          timeFilteredMatches.push(match);
        }
      });
      
      // Converts the latest activity in user-friendly format (i.e., 8 minutes ago, 2 hours ago, etc.)
      _.each(timeFilteredMatches, function(match){
        var time = new Date(match.latest_activity);
        match.latest_activity = timeago(time);
      });

      filterByLocation(timeFilteredMatches);

    };

    var filterByLocation = function(matches) {

      var filteredMatches = [];

      var searchRadius = 50000; // This is an option that should be set on the front end

      _.each(matches, function(match) {
        var userLocation = JSON.parse(location);
        var matchLocation = JSON.parse(match.latest_location);
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
      packageResults(matches);
    } else {
      _.each(matches, function(match) {

        var friendsQuery = [
          'MATCH (user:User)-[:FOLLOWS]->(friend:User)<-[:FOLLOWS]-(match)',
          'WHERE user.screen_name = {user} AND match.screen_name = {match}',
          'RETURN friend',
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
              return result.friend._data.data.screen_name;
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

  var packageResults = function(matches) {

    var results = {};

    _.each(matches, function(match){
      results[match.screen_name] = match;
    });

    //callback(results);
  }; 
};
