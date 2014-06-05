var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
//var db = new neo4j.GraphDatabase('http://tweetUp:k7b6QjQKpK4cZwG1aI3g@tweetup.sb02.stations.graphenedb.com:24789');
var _ = require('underscore');

exports.parseTweets = function(screenName, tweets) {

  var words = _.map(tweets, function(tweet){
    return tweet.text.toLowerCase().replace(/[^\w\s]/gi,'');
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
  
  var filteredWords = [];
  _.each(words, function(word){
    if(!linkFilter.test(word) && !commonWords[word]) {
      filteredWords.push(word);
    }
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
  //console.log('userdoc', userDoc);

  userDoc = JSON.stringify(userDoc);
  updateUserDoc(screenName, userDoc);
  // var tf = calculateTF(userDoc);
  // return tf;
};

var updateUserDoc = exports.updateUserDoc = function(screenName, newUserDoc) { 
  var params = {
    'screen_name':screenName,
    'user_words_doc': newUserDoc
  };

  var retrieveUserDoc = function(){
    console.log('inside retrieveUserDoc');


    var query = ['MATCH (d:Document {user:{screen_name}})',
                  'RETURN d'
                ].join('\n');

    db.query(query, params, function (error, results) {
      if ( error ) {
        console.log (error);
      } else {
        console.log('inside retrieveUserDoc', results);
          if(results.length!==0){
            var doc = results[0].d._data.data.user_words_doc;
            doc = JSON.parse(doc);
            addUserDoc(doc);
          }
          else {
            addUserDoc({});
          }
      }
    });
  };


  var addUserDoc = function(oldUserDoc){

    var query = ['MATCH (user:User {user:{screen_name}})',
                  'CREATE UNIQUE (user)-[:TWEETSABOUT]->(doc:Document)',
                  'WITH doc',
                  'SET doc.user={screen_name}, doc.user_words_doc={user_words_doc}',
                  'RETURN doc'
                ].join('\n');

    db.query(query, params, function (error, results) {
      if ( error ) {
        console.log (error);
      } else {
        console.log(results);
//        console.log(results[0].doc._data.data.user_words_doc);
      }
    });
  }

  retrieveUserDoc();
};


var updateCorpus = function(oldUserDoc, newUserDoc){

  var retrieveCorpus = function(){

    var query = ['MATCH (corpus:Corpus)',
                  'RETURN corpus'
                ].join('\n');

    db.query(query, params, function (error, results) {
      if ( error ) {
        console.log (error);
      } else {
        if (results.length!==0) {
          var cor = results.corpus._data.data.corpus_data;
          cor = JSON.parse(cor);
          editCorpus(cor);
        } else {
          editCorpus({});
        }
      }
    });
  };

  var editCorpus = function (corpus) {

    _.each(oldUserDoc, function(value, key){
      corpus[key] -= 1;
    });

    _.each(newUserDoc, function(value, key){
      if(corpus[key]){
        corpus[key] += 1;
      } else {
        corpus[key] = 1;
      }
    });

    corpus = JSON.stringify(corpus);
    addCorpus(corpus);
  }

  var addCorpus = function (corpus) {

    var params = {
      'corpus':corpus
    };

    var query = ['MERGE (corpus:Corpus)',
                'ON CREATE SET corpus.corpus_data = {corpus}',
                'ON MATCH SET corpus.corpus_data = {corpus}',
                'RETURN corpus'
              ].join('\n');

    db.query(query, params, function (error, results) {
      if ( error ) {
        console.log (error);
      } else {
        console.log(results);
      }
    });  
  }

  retrieveCorpus();
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


var calculateIDF = exports.calculateCorpus = function(userDocs){
  var corpus = {};
  //foreach parsed tweet add it to corpus  
  _.each(userDocs, function(userdoc){
    _.each(userdoc, function(value, key, collection){
      if (corpus[value]){
        corpus[value] += key;
      } 
      else {
        corpus[value] = key;
      }
    });
  });
  var totalNumOfDocs = userDocs.length;
  var docsTermAppears = 0;  
  return corpus;
}
