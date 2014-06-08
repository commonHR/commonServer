var neo4j = require('neo4j');
// var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var db = new neo4j.GraphDatabase('http://tweetUp:k7b6QjQKpK4cZwG1aI3g@tweetup.sb02.stations.graphenedb.com:24789');
var _ = require('underscore');

exports.parseTweets = function(screenName, tweets) {

  var words = _.map(tweets, function(tweet){
    return tweet.text.toLowerCase().replace(/[^\w\s]/gi, '');
  }).join(',').replace(/[^\w\s]/gi, ' ').split(' ');
  
  var linkFilter = /^http/;

  var commonWords = { the: true, be: true, and: true, of: true, a: true, in: true, to: true, have: true, it: true, I: true, that: true,
    for: true, you: true, he: true, with: true, on: true, do: true, say: true, this: true, they: true, at: true, but: true, we: true,
    his: true, from: true, not: true, by: true, she: true, or: true, as: true, what: true, go: true, their: true, can: true, who: true,
    get: true, if: true, would: true, her: true, all: true, my: true, make: true, about: true, know: true, will: true, up: true,
    one: true, time: true, there: true, year: true, so: true, think: true, when: true, which: true, them: true, some: true, me: true,
    people: true, take: true, out: true, into: true, just: true, see: true, him: true, your: true, come: true, could: true, now: true,
    than: true, like: true, other: true, how: true, then: true, its: true, our: true, two: true, more: true, these: true, want: true,
    way: true, look: true, first: true, also: true, new: true, because: true, day: true, use: true, no: true, man: true, find: true,
    here: true, thing: true, give: true, many: true, well: true, only: true, is: true, cant: true, does: true, while: true};
  
  var filteredWords = [];

  _.each(words, function(word){
    if ( !linkFilter.test(word) && !commonWords[word] && word !== '') {
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

  userDoc = JSON.stringify(userDoc);

  updateUserDoc(screenName, userDoc);
  
};

var updateUserDoc = function(screenName, newUserDoc) { //userDoc is JSON object

  var params = {
    'screen_name': screenName,
    'new_user_doc': newUserDoc
  };

  var retrieveExistingDoc = function () {

    var getExistingQuery = [
      'MATCH (existing:Document {user: {screen_name}})',
      'RETURN existing'
      ].join('\n');

    db.query(getExistingQuery, params, function (error, results) {
      if ( error ) {
        console.log (error);
      } else {
        var oldUserDoc = {};
        if (results.length !== 0 ) {
          oldUserDoc = results[0].existing._data.data.user_doc;
          oldUserDoc = JSON.parse(oldUserDoc);
        }
        addNewUserDoc(oldUserDoc);
      }
    });
  };

  var addNewUserDoc = function(oldUserDoc) {  //oldUserDoc has already been parsed at this juncture

    var query = [
    'MATCH (user:User {screen_name: {screen_name}})',
    'CREATE UNIQUE (user)-[:HAS_WORD_DOC]->(updated:Document)',
    'WITH updated',
    'SET updated.user = {screen_name}, updated.user_doc = {new_user_doc}',
    'RETURN updated'
    ].join('\n');

    db.query(query, params, function (error, results) {
      if ( error ) {
        console.log (error);
      } else {
        var newUserDoc = results[0].updated._data.data.user_doc;
        newUserDoc = JSON.parse(newUserDoc);
        updateCorpus(oldUserDoc, newUserDoc);
      }
    });
  };

  retrieveExistingDoc();
};


var updateCorpus = function(oldUserDoc, newUserDoc) {

  var retrieveCorpus = function() {

    var getQuery = [
      'MATCH (document:Corpus)',
      'RETURN document'
    ].join('\n');

    db.query(getQuery, {}, function(error, results) {
      if ( error ) {
        console.log(error);
      } else {
        var existing = {};
        if ( results.length !== 0 ) {
          existing = results[0].document._data.data.corpus_data; //Extra data here
          existing = JSON.parse(existing);
        }

        editCorpus(existing);
      }
    });

  };

  var editCorpus = function(corpus) {

    _.each(oldUserDoc, function(value, key) {
      corpus[key] -= oldUserDoc[key];
      if ( corpus[key] <= 0 || corpus[key] === null ) {
        delete corpus[key];
      }
    });

    _.each(newUserDoc, function(value, key) {
      if ( corpus[key] ){
        corpus[key] += newUserDoc[key];
      } else {
        corpus[key] = newUserDoc[key];
      }
    });

    addUpdatedCorpus(corpus);

  };

  var addUpdatedCorpus = function(corpus) {

    corpus = JSON.stringify(corpus);

    var params = { 'corpus_data': corpus };

    var corpusQuery = [
      'MERGE (document:Corpus)',
      'ON CREATE SET document.corpus_data = {corpus_data}',
      'ON MATCH SET document.corpus_data = {corpus_data}',
      'RETURN document'
    ].join('\n');

    db.query(corpusQuery, params, function(error, results) {
      if ( error ) {
        console.log(error);
      } else {
        console.log('ADDED CORPUS', results);
      }
    }); 

  };

  retrieveCorpus();

};
