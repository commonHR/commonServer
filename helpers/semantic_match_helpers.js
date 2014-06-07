var neo4j = require('neo4j');
// var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var db = new neo4j.GraphDatabase('http://tweetUp:k7b6QjQKpK4cZwG1aI3g@tweetup.sb02.stations.graphenedb.com:24789');
var _  = require('underscore');
var Q = require('q');

exports.retrieveUserDoc = function (screenName, matches) {

  var retrieveMatchDocs = function (userDoc, corpus, matches) {

    var count = matches.length;
    var matchDocs = [];
    var docCount;
    var deferred = Q.defer();

    //console.log("match count", count);

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


      var queryMethod = function(){

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
              deferred.resolve(calculateStats(userDoc, matchDocs, corpus, docCount)); 
            }
          }
        });
      } 
      queryMethod();
    });
    return deferred.promise;

      // queryMethod().then(function(result){
      //   return result;
      // });
      // return queryMethod();
  };

  var promise = Q.defer();

  var params = {
    'screen_name': screenName
  };

  var query = [
    'MATCH (document:Document {user: {screen_name}}), (corpus:Corpus)',
    'RETURN document, corpus'
  ].join('\n');

  var matchQueryMethod = function(){

    db.query(query, params, function (error, results) {
      if ( error ) {
        console.log(error);
      } else {
        var userDoc = results[0].document._data.data.user_doc;
        var corpus = results[0].corpus._data.data.corpus_data;
        userDoc = JSON.parse(userDoc);
        corpus = JSON.parse(corpus);
        promise.resolve(retrieveMatchDocs(userDoc, corpus, matches)
          .then(function(result){
            //console.log('===========result========', result); 
            return result; 
          })
        );
      }
    });
  };

  matchQueryMethod();
  return promise.promise;
};

var calculateStats = function(userDoc, matchDocs, corpus, docCount) {
  console.log('====calculate stats=====');
  var tfu = calculateTF(userDoc);
  var tfm =[];
  _.each(matchDocs, function(match){
    tfm.push(calculateTF(match));
  });
  var idf = calculateIDF(corpus, docCount);
  //in the order of matches returns the matching words, their TF's and cosineSimilarity coefficient of the match
  var userSim = userSimilarities(tfu, tfm);
  return userSim;
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
  var matchedUserDocs = [];
  _.each(matchTFs, function(matchTF){
    matchedUserDocs.push(findMatchTFs(userTF, matchTF));
  });
  return matchedUserDocs;
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
  if(Object.keys(uMatches).length>0 && Object.keys(mMatches).length>0){
    var c = calculateCosineSimilarity(uMatches, mMatches, count);
    console.log('cosineSimilarity in findMatchTFs',c);
    return [uMatches, mMatches, c];
  }
  else {
    return [];
  }
};

var calculateCosineSimilarity = exports.calculateCosineSimilarity = function(uMatches, mMatches, count){
  var nominator = 0;
  var denom1 = 0, denom2 = 0, denominator;
  var cosineSimilarity = 0;
  if(Object.keys(uMatches).length>0 && Object.keys(mMatches).length>0){
    console.log('inside cosineSimilarity');
    _.map(uMatches, function(value, key){
      nominator += uMatches[key] * mMatches[key];
    });
    _.map(uMatches, function(value, key){
      denom1 += uMatches[key]*uMatches[key];
      denom2 += mMatches[key]*mMatches[key]; 
    });
    denominator = Math.sqrt(denom1+denom2);
  }
  cosineSimilarity = nominator/denominator;
  console.log('cosineSimilarity', cosineSimilarity);
  return cosineSimilarity;
};