var VizqlSession;

VizqlSession = require('../');

describe("Test _getValueFromEmbedResponse", function() {
  describe("When text contains key: \"value\" pattern", function() {
    return it("should find a match in regexp", function() {
      var body, res;
      body = 'key: "value"';
      res = VizqlSession._getValueFromEmbedResponse('key', body);
      expect(res).exists;
      return res.should.equal('value');
    });
  });
  return describe("When text contains \"key\": value pattern", function() {
    return it("should find a match in regexp", function() {
      var body, res;
      body = '"key": \'value\'';
      res = VizqlSession._getValueFromEmbedResponse('key', body);
      expect(res).exists;
      return res.should.equal('value');
    });
  });
});

describe("Test _extractBootstrapParameters", function() {
  describe("When there is no sessionId returned", function() {
    return it("VizqlSession should throw an exception", function() {
      sinon.stub(VizqlSession, "_getValueFromEmbedResponse", function() {
        return null;
      });
      expect(VizqlSession._extractBootstrapParameters.bind(VizqlSession, 'foo')).to["throw"]();
      return VizqlSession._getValueFromEmbedResponse.restore();
    });
  });
  describe("When there is no vizqlRoot returned", function() {
    return it("@_vizqlRoot should become /vizql", function() {
      var stub;
      stub = sinon.stub(VizqlSession, "_getValueFromEmbedResponse");
      stub.withArgs('sessionid').returns("bar");
      VizqlSession._extractBootstrapParameters("foo");
      VizqlSession._vizqlRoot.should.equal('/vizql');
      return VizqlSession._getValueFromEmbedResponse.restore();
    });
  });
  return describe("When session and vizql url are OK", function() {
    return it("should return a good bootstrap session url", function() {
      VizqlSession._sessionId = 'foo';
      VizqlSession._vizqlRoot = 'bar';
      return VizqlSession._getBootstrapSessionUrl().should.equal("bar/bootstrapSession/sessions/foo");
    });
  });
});

describe("Test _getValueFromBootstrapResponse", function() {
  return describe("When key contains a newSessionId-like string", function() {
    return it("should extract the id", function() {
      var body, value;
      body = '"key":"A9BD-12:13"';
      value = VizqlSession._getValueFromBootstrapResponse("key", body);
      return value.should.equal("A9BD-12:13");
    });
  });
});

describe("Test _getJsonFromBootstrapResponse", function() {
  return describe('When body is in format foo;{"bar": "stuff"}foo2;{"bar2": "stuff2"}', function() {
    return it('should get the {bar: "stuff", bar2: "stuff2"} part as object', function() {
      var expected, fixture, result;
      fixture = 'foo;{"bar": "stuff"}foo2;{"bar2": "stuff2"}';
      expected = {
        bar: "stuff",
        bar2: "stuff2"
      };
      result = VizqlSession._getJsonFromBootstrapResponse(fixture);
      return expect(result).deep.equal(expected);
    });
  });
});
