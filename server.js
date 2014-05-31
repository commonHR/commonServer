/*       MODULE DEPENDENCIES         */
var express = require('express');
var twitter = require('./helpers/twitter_helpers');
var request = require('./helpers/request_helpers');
var user = require('./helpers/user_helpers');
var chat = require('./helpers/chat_helpers');


/*          START SERVER             */

var app = express();
app.use(express.bodyParser());
var port = process.env.PORT || 4568;
app.listen(port);
console.log('Server now listening on port ' + port);

app.use(function(req, res, next){
  console.log(req.method + ' request at ' + req.url);
  console.log(req.body);
  next();
});

twitter.getUserInfo({screenName: 'marc0au'});

/*         HANDLE REQUESTS           */

app.post('/login', request.userLogin);
app.post('/search', request.findMatches);
app.post('/send_message', request.sendMessage);
app.post('/get_messages', request.getMessages);
app.get('*', request.home)




