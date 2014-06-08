var neo4j = require('neo4j');
// var db = new neo4j.GraphDatabase('http://neo4jdb.cloudapp.net:7474');
var db = new neo4j.GraphDatabase('http://tweetUp:k7b6QjQKpK4cZwG1aI3g@tweetup.sb02.stations.graphenedb.com:24789');
var _  = require('underscore');
var Q = require('q');

exports.retrieveUserDoc = function (screenName, matches) {

  var retrieveMatchDocs = function (userDoc, corpus, matches) {

    var count = matches.length;

    //old
    // var matchDocs = [];
    //new
    var matchDocs = {};

    var docCount;
    var deferred = Q.defer();
    var matchScreenName;

    var matchWordCounts = {};

    _.each(matches, function(match) {
      
      var matchScreenName = match.screen_name;
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

            // var matchDoc = {};

            if ( results.length !== 0 ) {
              matchName = results[0].userDoc._data.data.user;
              matchData = results[0].userDoc._data.data.user_doc;
              matchData = JSON.parse(matchData);
              matchDocs[matchName] = matchData;
            }
            // matchDocs.push(matchDoc);
            count--;
            if ( count === 0) {
              console.log(matchDocs);
              deferred.resolve(calculateStats(userDoc, matchDocs, corpus, docCount, matchScreenName)); 
            }
          }
        });
      } 
      queryMethod();
    });
    return deferred.promise;
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
            // console.log('===========result========', result);
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

  // var tfm = {};
  var tfm = {};
  _.each(matchDocs, function(match, key){

    tfm[key] = (calculateTF(match));
    // tfm.push(calculateTF(match));

  });
  // console.log('tfm');
  // console.log(tfm);
  // console.log('tfm ends ***');

  // var idf = calculateIDF(corpus, docCount);
  //in the order of matches returns the matching words, their TF's and cosineSimilarity coefficient of the match
  var userSim = userSimilarities(tfu, tfm);

  // var userSim = {};
  // _.each(tfm, function(tf, key){
  //   userSim[key] = findMatchTFs(tf, tfm);
  // });

  // console.log('***userSim starts***');
  // console.log(userSim);
  // console.log('***userSim ends***');




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
  // console.log('userTF');
  // console.log(userTF);
  // console.log('matchTFs');
  // console.log(matchTFs);

  var matchedUserDocs = {};
  /***/
  _.each(matchTFs, function(matchTF, key){
    // console.log('matchTF');
    // console.log(matchTF);
    matchedUserDocs[key] = findMatchTFs(userTF, matchTF);
  });

  return matchedUserDocs;
};

var userSimilarity = exports.userSimilarity = function(userTF, matchTF){
  return findMatchTFs(userTF, matchTF);
};

var findMatchTFs = exports.findMatchTFs = function(userTF, matchTF){

  // console.log('in here, userTF\n ' + userTF);
  // console.log('in here, matchTF\n ' + matchTF);  

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
    // console.log('cosineSimilarity in findMatchTFs',c);
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
  // console.log('cosineSimilarity', cosineSimilarity);
  return cosineSimilarity;
};
