VizqlSession = require '../'

describe "Test _getValueFromEmbedResponse", ->
  describe "When text contains key: \"value\" pattern", ->
    it "should find a match in regexp", ->
      body = 'key: "value"'
      res = VizqlSession._getValueFromEmbedResponse 'key', body
      expect(res).exists
      res.should.equal 'value'

  describe "When text contains \"key\": value pattern", ->
    it "should find a match in regexp", ->
      body = '"key": \'value\''
      res = VizqlSession._getValueFromEmbedResponse 'key', body
      expect(res).exists
      res.should.equal 'value'

describe "Test _extractBootstrapParameters", ->
  describe "When there is no sessionId returned", ->
    it "VizqlSession should throw an exception", ->
      sinon.stub VizqlSession, "_getValueFromEmbedResponse", -> return null
      expect(VizqlSession._extractBootstrapParameters.bind VizqlSession, 'foo').to.throw()
      VizqlSession._getValueFromEmbedResponse.restore()


  describe "When there is no vizqlRoot returned", ->
    it "@_vizqlRoot should become /vizql", ->
      stub = sinon.stub VizqlSession, "_getValueFromEmbedResponse"
      stub.withArgs('sessionid').returns "bar"

      VizqlSession._extractBootstrapParameters("foo")
      VizqlSession._vizqlRoot.should.equal '/vizql'
      VizqlSession._getValueFromEmbedResponse.restore()


  describe "When session and vizql url are OK", ->
    it "should return a good bootstrap session url", ->
      VizqlSession._sessionId = 'foo'
      VizqlSession._vizqlRoot = 'bar'
      VizqlSession._getBootstrapSessionUrl().should.equal "bar/bootstrapSession/sessions/foo"


describe "Test _getValueFromBootstrapResponse", ->
  describe "When key contains a newSessionId-like string", ->
    it "should extract the id", ->
      body = '"key":"A9BD-12:13"'
      value = VizqlSession._getValueFromBootstrapResponse "key", body
      value.should.equal "A9BD-12:13"


describe "Test _getJsonFromBootstrapResponse", ->
  describe 'When body is in format foo;{"bar": "stuff"}foo2;{"bar2": "stuff2"}', ->
    it 'should get the {bar: "stuff", bar2: "stuff2"} part as object', ->
      fixture = 'foo;{"bar": "stuff"}foo2;{"bar2": "stuff2"}'
      expected = {bar: "stuff", bar2: "stuff2"}
      result = VizqlSession._getJsonFromBootstrapResponse fixture
      expect(result).deep.equal expected