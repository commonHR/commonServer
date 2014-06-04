var neo4j = require('neo4j');
// var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var db = new neo4j.GraphDatabase('http://tweetUp:k7b6QjQKpK4cZwG1aI3g@tweetup.sb02.stations.graphenedb.com:24789');
var _ = require('underscore');

exports.parseTweets = function(screenName, tweets) {

  var words = _.map(tweets, function(tweet){
    return tweet.text.toLowerCase();
  }).join(',').split(' ');
  
  var linkFilter = /^http?:/;

  var commonWords = { the: true, be: true, and: true, of: true, a: true, in: true, to: true, have: true, it: true, I: true, that: true,
    for: true, you: true, he: true, with: true, on: true, do: true, say: true, this: true, they: true, at: true, but: true, we: true,
    his: true, from: true, not: true, by: true, she: true, or: true, as: true, what: true, go: true, their: true, can: true, who: true,
    get: true, if: true, would: true, her: true, all: true, my: true, make: true, about: true, know: true, will: true, up: true,
    one: true, time: true, there: true, year: true, so: true, think: true, when: true, which: true, them: true, some: true, me: true,
    people: true, take: true, out: true, into: true, just: true, see: true, him: true, your: true, come: true, could: true, now: true,
    than: true, like: true, other: true, how: true, then: true, its: true, our: true, two: true, more: true, these: true, want: true,
    way: true, look: true, first: true, also: true, new: true, because: true, day: true, use: true, no: true, man: true, find: true,
    here: true, thing: true, give: true, many: true, well: true, only: true }; 
  
  var filteredWords = _.filter(words, function(word){
    return ( !linkFilter.test(word) && !commonWords[word] );
  });

  var userDoc = {};

  _.each(filteredWords, function(word){
    if ( userDoc[word] ){
      userDoc[word] += 1;
    } else {
      userDoc[word] = 1;
    }
  });

  console.log('inside parseTweets semantic helpers');
  var tf = calculateTF(userDoc);
  //console.log(userDoc);
  //console.log(tf);
  return userDoc;
};

var addUserDoc = exports.addUserDoc = function(screenName, userDoc) { 

  var params = {
    'user_words_doc': userDoc
  };

  var query = [];

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log (error);
    } else {
      // do things here
    }
  });

};


var calculateTF = exports.calculateTF = function(userDoc){
  var size=0, tfs = {};
  _.each(userDoc, function(value){
    size+=value;
  });
  _.map(userDoc, function(value, key){
    tfs[key] = value/size;
  });
  return tfs;
}  


var calculateITF = exports.calculateITF = function(){
  var corpus = {};
  //foreach match, get parsed tweets
  //foreach parsed tweet add it to corpus  
  return corpus;
}
