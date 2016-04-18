var Authenticate;

Authenticate = require('../');

describe("Authenticate unit tests", function() {
  return it("should be able to parse authenticate response", function(done) {
    var xml;
    xml = "<?xml version='1.0' encoding='UTF-8'?>\n<tsResponse xmlns=\"http://tableausoftware.com/api\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://tableausoftware.com/api http://tableausoftware.com/api/ts-api-2.0.1.xsd\">\n    <credentials token=\"hZqWrxnUp51YYeIX2PBEmq32nbqYJaxV\">\n        <site id=\"ff66e08b-e7b4-4759-b21f-1fdc0e0885f9\" contentUrl=\"\" />\n        <user id=\"fc8d71c4-116f-4c75-a3c3-cb633c70af6c\" />\n    </credentials>\n</tsResponse>";
    return Authenticate._parseXml(xml).then(function(res) {
      return done();
    });
  });
});
