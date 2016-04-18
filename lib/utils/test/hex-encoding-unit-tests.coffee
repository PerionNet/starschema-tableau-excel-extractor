utils = require '../'

describe "Test decodeHexEscapes", ->
  describe "When text is \x2D0\x3A0atyalapatyala\x29", ->
    it "should decode to \x2D0\x3A0atyalapatyala\x29", ->
      encoded = "\x2D0\x3A0atyalapatyala\x29"
      decoded = utils.decodeHexEscapes '-0:0atyalapatyala)'
      expect(encoded).to.equal decoded
