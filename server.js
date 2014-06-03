/*       MODULE DEPENDENCIES         */
var express = require('express');
var bodyParser = require('body-parser');
var twitter = require('./helpers/twitter_helpers');
var request = require('./helpers/request_helpers');
var user = require('./helpers/user_helpers');
var chat = require('./helpers/chat_helpers');
var match = require('./helpers/match_helpers');


/*          START SERVER             */

var app = express();

// parse application/json and application/x-www-form-urlencoded
// app.use(bodyParser());

// // parse application/vnd.api+json as json
// app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use(express.bodyParser());

var port = process.env.PORT || 4568;
app.listen(port);
console.log('Server now listening on port ' + port);

app.use(function(req, res, next){
  console.log(req.method + ' request at ' + req.url);
  console.log(req.body);
  next();
});

// chat.retrieveSingleConversation('marc0au', 'nickolaswei');

// match.findMatches('RICEaaron', '{"latitude": "37.9841", "longitude": "-122.80699"}');
// match.findMatches('RICEaaron', '{"latitude": "0", "longitude": "0"}');
//location needs to be a JSON object or the database throws a fit


// chat.sendMessage({
// 	sender: 'marc0au',
// 	recipient: 'nickolaswei',
// 	text: 'coconuts.  i like coconuts.',
// });

// twitter.getUserInfo('RICEaaron', '{"latitude": "37.9841", "longitude": "-122.80699"}');	
twitter.getUserInfo('redban');


/*         HANDLE REQUESTS           */

app.post('/login', request.userLogin);
app.post('/search', request.findMatches);
app.post('/send_message', request.sendMessage);
app.post('/get_messages', request.getMessages);
app.get('*', request.home)




