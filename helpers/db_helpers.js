var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var twitter = require('./twitter_helpers');
var chat = require('./chat_helpers');
var requestify = require('requestify');
var _ = require('underscore');


/*         NEO4J VARS         */
var dbHeaders = {
  'Accept': 'application/json; charset=UTF-8',
  'Content-Type': 'application/json'
};
var dbURL = 'neo4jdb.cloudapp.net:7474/db/data/cypher'



/* QUERY STRINGS */

exports.createAppUser = function(screenName) {

  if ( existingUser(screenName) === 'user' ) {
    convertToAppUser(screenName);
  } else if ( existingUser(screenName) = 'appUser' ) {
    //return nothing
  } else {
    addUser(screenName, true);
    addFriends(screenName);
  }

};

  // check to see if user exists in the database


  // assuming that we get a twitter username

  // make a get request to twitter api to get back all user details
  // take these details and create a new node 

  // make another get request to the twitter API to get all the freinds of the user
  // for each friend, need to create a new node

exports.convertToAppUser = function(screenName) {

  //find user in the DB and convert the appUser property to true, add token
  updateUserProperty(screenName, {app_user: true}); // helper method to retrieve token???
  addFriends(screenName);

}

exports.addFriends = function(screenName) {

  //make API call to twitter to get all user friends and add to DB along with relationsips
  var friends = twitter.getFriends(screenName);  //assuming that this will return an array of user screenNames
  _.each(friends, function(friend) {
    if ( !existingUser(friend) ) { 
      addUser(friend.screen_name)
      addFollowingRelationship(screenName, friend.screen_name)
    }
  });
};


exports.deleteAppUser = function(screenName){
  //deletes a user node and all relationships if a user decides to delete their account
  //also need to delete a friend node if no other users are following that person
};

exports.addUser = function(user, appUser) { //appUser is a boolean indicating whether or not this person is a user of our app or not

  console.log(user);

  var query = "MERGE (u {id_str:'RICEaaron'}) ON CREATE SET u.id_str={id_str} RETURN u";
  var params = {
    'id_str': user.id_str,
    'name': user.name,
    'screen_name': user.screen_name,
    'description': user.description,
    'profile_image_url': user.profile_image_url,
    'app_user':user.app_user
  }

  db.query(query, params, function (err, results) {
    if ( err ) {
      console.log (err);
    } else {
      console.log(results);
    }
  });
 //    "u.name={data.name}, u.screen_name={data.screen_name}, u.description={data.description}, u.location={data.location}, u.profile_image_url={data.profile_image_url}" +
 //     "RETURN u";

  // requestify.request(dbURL, {
  //   method: 'POST',
  //   headers: dbHeaders,
  //   data: {
  //     'query' : query_string
  //     'params' : {
  //       'id_str': data.id_str,
  //       'name': data.name,
  //       'screen_name': data.screen_name,
  //       'description': data.description,
  //       'profile_image_url': data.profile_image_url,
  //       'app_user':data.app_user
  //     }
  //   }
  //  })
  // .then(function(response){
  //   response.getBody();
  //   console.log("=================");
  //   console.log(respose.body);
  // });
  
  //Add user to the if they don't already exist.  Set app_user to true if appUser parameter is passed in.
};

exports.addFollowingRelationship = function ( userScreenName, friendScreenName) {
  // Do the things required
};

exports.updateUserProperty = function (screenName, properties) { //assuming that properties will be an object containing all properties that need to be updated

}; 

exports.existingUser = function(username) {
  // needs to return 'user' if in the database
  // needs to return 'appUser' if an app user
  // otherwise return undefined
};

exports.getTwitterInfo = function(screenName) { // this needs to be an object with a screenName key and the screenName as the value
  //sends a get request to the twitter api to get all the user information
};





// {
//   "id": 248461595,
//   "id_str": "248461595",
//   "name": "Aaron Rice",
//   "screen_name": "RICEaaron",
//   "location": "San Francisco, CA",
//   "description": "string",
//   "url": null,
//   "app_user": true,
//   "bio": "string",
//   "token": "crazy encrypted string"
// }













