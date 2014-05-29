/*       MODULE DEPENDENCIES         */
var express = require('express');
var twitter = require('./helpers/twitter_helpers');
var request = require('./helpers/request_helpers');
var db = require('./helpers/db_helpers');


/*          START SERVER             */

var app = express();
var port = process.env.PORT || 4568;
app.listen(port);
console.log('Server now listening on port ' + port);

// twitter.getUserInfo({screenName: 'chrisryanphd'}); 
// twitter.getUserInfo({screenName: 'RICEaaron'});
// twitter.getUserInfo({screenName: 'duncantrussell'});

// db.findMatches('RICEaaron');

/*         HANDLE REQUESTS           */

app.post('/login', request.userLogin);
app.get('/search', request.findMatches);
app.post('/message', request.sendMessage);
app.get('*', request.home)




