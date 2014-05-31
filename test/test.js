var assert = require("assert");
var db = require("../helpers/user_helpers.js");
var twitter = require("../helpers/twitter_helpers.js");
var chat = require("../helpers/chat_helpers.js");

describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    })
  })
})

describe('User', function(){
  describe('#addUser(*params*)', function(){
    it('should save without error', function(){
      var newUser1 = {
        'id_str': '123','name': 'Test User1','screen_name': 'testuser1',
        'description': 'for test purposes','profile_image_url': 'www.testpic.com',
        'app_user': (!!appUser),'latest_activity': new Date().getTime(),
        'location': 'unknown'
      };

      var newUser2 = {
        'id_str': '456','name': 'Test User2','screen_name': 'testuser2',
        'description': 'for test purposes','profile_image_url': 'www.testpic.com',
        'app_user': (!!appUser),'latest_activity': new Date().getTime(),
        'location': 'unknown'
      };
      addUser(newUser1);
      addUser(newUser2);
    })
  })

  describe('#addFollowingRelationship(*params*)', function(){
    it('should add the relationship without error', function(){
      addFollowingRelationship(newUser1, newUser2);
    })
  })  


  describe('#findMatches(*params*)', function(){
    it('should find the relationship without error', function(done){
      findMatches(newUser1, done);
    })
  })  

})

describe('Twitter', function(){
  describe('#getUserInfo(*params*)', function(){
    it('should get user info without error', function(done){
      var lookUpObj = {screenName:'marc0au'};
      getUserInfo(lookUpObj, function(err){
        if (err) throw err;
        done();
      });
    })
  })
})