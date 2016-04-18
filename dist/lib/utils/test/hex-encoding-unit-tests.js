var utils;

utils = require('../');

describe("Test decodeHexEscapes", function() {
  return describe("When text is \x2D0\x3A0atyalapatyala\x29", function() {
    return it("should decode to \x2D0\x3A0atyalapatyala\x29", function() {
      var decoded, encoded;
      encoded = "\x2D0\x3A0atyalapatyala\x29";
      decoded = utils.decodeHexEscapes('-0:0atyalapatyala)');
      return expect(encoded).to.equal(decoded);
    });
  });
});
