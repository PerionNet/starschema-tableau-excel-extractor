auth = require '..'

describe "Test Authenticate", ->
  describe "With valid credentials", ->
    it "should authenticate successfully", (done) ->
      auth.authenticate(config.credentials.tableauAdminUsername, config.credentials.tableauAdminPassword).then ->
        expect(1).to.equal(1)
      .catch (error) ->
        expect("success").to.equal error
      .finally ->
        done()

    it "should then successfully log out.", (done) ->
      auth.logout().then ->
        expect(1).to.equal(1)
      .catch (err) ->
        expect("should not be here").to.equal err
      .finally ->
        done()

  describe "With invalid credentials", ->
    beforeEach ->
      newConfig = {}
      _.assign newConfig, config
      newConfig.credentials.password = 'foo'
      auth.__injectConfig newConfig
      
    afterEach ->
      auth.__injectConfig config


    it "should not authenticate, should fail", (done) ->
      auth.authenticate().then ->
        expect("should not authenticate").to.equal("but authenticated, that is bad")
        done()
      .catch (error) ->
        expect(new Error "Authentication: failed").eql error
        done()

  describe "When not logged in", ->
    beforeEach (done) ->
      # To be sure, log out...
      auth.logout()
      .catch (error) ->
        _.noop()
      .finally ->
        done()
      
    it "should not log out successfully...", (done) ->
      auth.logout().then ->
        expect("should not log out successfully").to.equal("as not logged in.")
      .catch (error) ->
        expect(new Error "Not logged in").eql error
      .finally ->
        done()

