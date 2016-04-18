var auth;

auth = require('..');

describe("Test Authenticate", function() {
  describe("With valid credentials", function() {
    it("should authenticate successfully", function(done) {
      return auth.authenticate(config.credentials.tableauAdminUsername, config.credentials.tableauAdminPassword).then(function() {
        return expect(1).to.equal(1);
      })["catch"](function(error) {
        return expect("success").to.equal(error);
      })["finally"](function() {
        return done();
      });
    });
    return it("should then successfully log out.", function(done) {
      return auth.logout().then(function() {
        return expect(1).to.equal(1);
      })["catch"](function(err) {
        return expect("should not be here").to.equal(err);
      })["finally"](function() {
        return done();
      });
    });
  });
  describe("With invalid credentials", function() {
    beforeEach(function() {
      var newConfig;
      newConfig = {};
      _.assign(newConfig, config);
      newConfig.credentials.password = 'foo';
      return auth.__injectConfig(newConfig);
    });
    afterEach(function() {
      return auth.__injectConfig(config);
    });
    return it("should not authenticate, should fail", function(done) {
      return auth.authenticate().then(function() {
        expect("should not authenticate").to.equal("but authenticated, that is bad");
        return done();
      })["catch"](function(error) {
        expect(new Error("Authentication: failed")).eql(error);
        return done();
      });
    });
  });
  return describe("When not logged in", function() {
    beforeEach(function(done) {
      return auth.logout()["catch"](function(error) {
        return _.noop();
      })["finally"](function() {
        return done();
      });
    });
    return it("should not log out successfully...", function(done) {
      return auth.logout().then(function() {
        return expect("should not log out successfully").to.equal("as not logged in.");
      })["catch"](function(error) {
        return expect(new Error("Not logged in")).eql(error);
      })["finally"](function() {
        return done();
      });
    });
  });
});
