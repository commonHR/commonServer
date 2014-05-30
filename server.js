/*       MODULE DEPENDENCIES         */
var express = require('express');
var twitter = require('./helpers/twitter_helpers');
var request = require('./helpers/request_helpers');
var user = require('./helpers/user_helpers');
var chat = require('./helpers/chat_helpers');


/*          START SERVER             */

var app = express();
// app.use(express.bodyParser());
var port = process.env.PORT || 4568;
app.listen(port);
console.log('Server now listening on port ' + port);

app.use(function(req, res, next){
  console.log(req.method + ' request at ' + req.url);
  console.log(req.body);
  next();
});

// twitter.getUserInfo({screenName: ''}); 

// chat.sendMessage({ 
// 	sender: 'RICEaaron', 
// 	recipient: 'duncantrussell', 
// 	text: 'first message',
// 	time: new Date().getTime()
// });

// chat.sendMessage({ 
// 	sender: 'duncantrussell', 
// 	recipient: 'RICEaaron', 
// 	text: 'second message',
// 	time: new Date().getTime()
// });

// chat.retrieveConversations('RICEaaron');

twitter.getFriendInfo('duncantrussell');

/*         HANDLE REQUESTS           */

app.post('/login', request.userLogin);
app.get('/search', request.findMatches);
app.post('/message', request.sendMessage);
app.get('*', request.home)




