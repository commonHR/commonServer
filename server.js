/*       MODULE DEPENDENCIES         */
var express = require('express');
var bodyParser = require('body-parser')
var twitter = require('./helpers/twitter_helpers');
var request = require('./helpers/request_helpers');
var db = require('./helpers/db_helpers');


/*          START SERVER             */

var app = express();

// parse application/json and application/x-www-form-urlencoded
app.use(bodyParser());

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

var port = process.env.PORT || 4568;
app.listen(port);
console.log('Server now listening on port ' + port);

app.use(function(req, res, next){
  console.log(req.method + ' request at ' + req.url);
  console.log(req.body);
  next();
});

// twitter.getUserInfo({screenName: 'RICEaaron'}); 

// db.sendMessage({ 
// 	sender: 'RICEaaron', 
// 	recipient: 'marc0au', 
// 	text: 'test message 2',
// 	time: new Date().getTime()
// });

/*         HANDLE REQUESTS           */

app.post('/login', request.userLogin);
app.post('/search', request.findMatches);
app.post('/message', request.sendMessage);
app.get('*', request.home)




