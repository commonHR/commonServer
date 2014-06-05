
var calculateTF = exports.calculateTF = function(term, userDoc){
  var size=0, tf;
  _.each(userDoc, function(value){
    size+=value;
  });
  tf = userDoc[term]/size;
  console.log(tf);
  return tf;
}  

var calculateIDF = exports.calculateIDF = function(term, corpus, userDocs){
  var idf;
  var totalNumOfDocs = userDocs.length;
  var termOccurances;
  _.each(corpus, function(value){
    if (value === term){
      termOccurances += value;
    } 
  });
  idf = totalNumOfDocs/termOccurances;
  return corpus;
}