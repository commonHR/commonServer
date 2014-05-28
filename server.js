/*       MODULE DEPENDENCIES         */
var express = require('express');
var twitter = require('./helpers/twitter_helpers');
var request = require('./helpers/request_helpers');


/*          START SERVER             */

var app = express();
var port = process.env.PORT || 4568;
app.listen(port);
console.log('Server now listening on port ' + port);


/*         HANDLE REQUESTS           */

app.get('/', request.home)
app.post('/login', request.userLogin);
app.get('/search', request.findMatches);
app.post('/message', request.sendMessage);




