var neo4j = require('neo4j');
// var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var db = new neo4j.GraphDatabase('http://tweetUp:k7b6QjQKpK4cZwG1aI3g@tweetup.sb02.stations.graphenedb.com:24789');
var _  = require('underscore');


exports.retrieveUserDoc = function (screenName, matches) {

  var params = {
    'screen_name': screenName
  };

  var query = [
    'MATCH (document:Document {user: {screen_name}}), (corpus:Corpus)',
    'RETURN document, corpus'
  ].join('\n');

  db.query(query, params, function (error, results) {
    if ( error ) {
      console.log(error);
    } else {
      var userDoc = results[0].document._data.data.user_doc;
      var corpus = results[0].corpus._data.data.corpus_data;
      userDoc = JSON.parse(userDoc);
      corpus = JSON.parse(corpus);
      retrieveMatchDocs(userDoc, corpus, matches);
    }
  });

};


var retrieveMatchDocs = function (userDoc, corpus, matches) {

  var count = matches.length;
  var matchDocs = [];
  var docCount;

  console.log("match count", count);

  _.each(matches, function(match) {
    
    var params = {
      'screen_name': match.screen_name
    };

    var query = [
     'MATCH (document:Document)',
     'WITH document',
     'MATCH (userDoc:Document {user: {screen_name}}), (corpus:Corpus)',
     'RETURN COUNT(document) as count, userDoc, corpus'
    ].join('\n');

    db.query(query, params, function (error, results) {
      if ( error ) {
        console.log(error);
      } else {
        var matchDoc = {};

        if ( results.length !== 0 ) {
          matchDoc = results[0].userDoc._data.data.user_doc;
          matchDoc = JSON.parse(matchDoc);
          docCount = results[0].count;
        }
        matchDocs.push(matchDoc);
        count--;
        if ( count === 0) {
          calculateStats(userDoc, matchDocs, corpus, docCount); 
        }
      }
    });
  });
};

var calculateStats = function(userDoc, matchDocs, corpus, docCount) {
  console.log('====calculate stats=====');
  var tfu = calculateTF(userDoc);
  var tfm =[];
  _.each(matchDocs, function(match){
    tfm.push(calculateTF(match));
  });
  var idf = calculateIDF(corpus, docCount);
  console.log(tfu);
  console.log(tfm);
  userSimilarities(tfu, tfm);
};


var calculateTF = exports.calculateTF = function(userDoc){
  var size=0, tf = {};
  _.each(userDoc, function(value){
    size+=value;
  });
  _.map(userDoc, function(value, key){
    tf[key] = value/size;
  });
  return tf;
};


var calculateIDF = exports.calculateIDF = function(corpus, totalNumOfDocs){
  var idf, df={};
  var total, termOccurances=0;
  _.each(corpus, function(value){
    if (value){
      termOccurances += value;
      total = value/termOccurances;
    } 
  });
  idf = totalNumOfDocs/termOccurances;
  return idf;
};

var userSimilarities = exports.userSimilarities = function(userTF, matchTFs){
  var count = 0;
  var matchedUserDocs = [];
  console.log('matchtfs length', matchTFs.length);
  _.each(matchTFs, function(matchTF){
    count++;
    matchedUserDocs.push(findMatchTFs(userTF, matchTF));
  });
    console.log(count, 'matchedUserDocs', matchedUserDocs);
};

var findMatchTFs = exports.findMatchTFs = function(userTF, matchTF){
  var uMatches = {}, mMatches = {}, count = 0;
  _.each(userTF, function(value, key){
    if(_.contains(Object.keys(matchTF), key)){
      count++;
      uMatches[key] = value;
      mMatches[key] = matchTF[key];
    }
  });
  return [uMatches, mMatches, count];
};