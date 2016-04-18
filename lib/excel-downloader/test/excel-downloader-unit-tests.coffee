ExcelDownloader = require '../'
stream = require 'stream'
moment = require 'moment'
Converter = require("csvtojson").Converter
fullCsv = require './fixture_full_csv'

CreateHttpMock = (bodyToReturn) ->
  get: -> Promise.resolve bodyToReturn


describe "Test ExcelDownloader", ->
  downloader = null
  
  beforeEach ->
    downloader = new ExcelDownloader()

  describe "When downloaded CVS contains multiple headers with the same name", ->
    beforeEach ->
      http =
        get: -> Promise.resolve fullCsv
      
      downloader._inject {http: http}

    it "should be able to fetch those column names as well", (done) ->
      expectedColumnNames = [ '', '', '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ]
      
      downloader._getCsvAsJson().then (json) ->
        expect(expectedColumnNames).deep.equal downloader._getColumnNames(json)
        done()


    it "_createSheetFromJson should be able to create a proper sheet", (done) ->
      json = [
        {'field1': 'foo', 'field2': 'foo'},
        {'field1': 1, 'field2': 2}
      ]

      expect(['field1', 'field2']).deep.equal downloader._getFieldNames json
      
      sheet = downloader._createSheetFromJson json
      expect(sheet.A1).deep.equal { v: 'foo', t: 's' }
      expect(sheet.B1).deep.equal { v: 'foo', t: 's' }
      expect(sheet.A2).deep.equal { v: 1, t: 'n' }
      expect(sheet.B2).deep.equal { v: 2, t: 'n' }
      done()


  describe "When downloaded CSV contains good data", ->
    it "should create a json object out of it", ->
      expectedJson = [
        {"field1": "Country", "field2": "Customer Name"},
        {"field1": "United States", "field2": "Aaron Bergman"}
      ]

      http = CreateHttpMock """
        Country,Customer Name
        United States,Aaron Bergman
      """

      downloader._inject {http: http}

      downloader._getCsvAsJson().then (json) ->
        expect(json).to.deep.equal expectedJson

  describe "When downloaded CSV contains bad data", ->
    it "should reject with error", (done) ->
      http = CreateHttpMock """
        foobar"
        foobar foobar
      """

      downloader._inject {http: http}

      downloader._getCsvAsJson()
      .catch (error) ->
        expect(error.message).to.contain "Cannot parse CSV data"
        done()


  describe "Test date conversion", ->
    describe "When parsing date string '7/5/2007 6:18:47 AM'", ->
      it "_convertToDate should return a valid date", ->
        fixture = '7/5/2007 6:18:47 PM'
        date = downloader._convertToDate fixture
        expect(date.getFullYear()).to.equal 2007
        expect(date.getMonth()).to.equal 6
        expect(date.getDate()).to.equal 5
        expect(date.getHours()).to.equal 18
        expect(date.getMinutes()).to.equal 18
        expect(date.getSeconds()).to.equal 47

    describe "When parsing invalid string", ->
      it "return null", ->
        date = downloader._convertToDate '7/5/2007 6:18:47 CM'
        expect(date).null
        date = downloader._convertToDate 'a/5/2007 6:18:47 AM'
        expect(date).null
        date = downloader._convertToDate '123/5/2007 6:18:47 AM'
        expect(date).null
        date = downloader._convertToDate '23:5/2007 6:18:47 AM'
        expect(date).null
        date = downloader._convertToDate '23/5/2007  6:18:47 AM'
        expect(date).null
        date = downloader._convertToDate '23/5/2007 6.18:47 AM'
        expect(date).null

  describe "Test cell type detection", ->
    describe "When CSV contains dates", ->
      it "should detect dates properly", ->
        cell = downloader._getCell '7/5/2007 6:18:47 AM'
        expect(cell.t).equal 'd'
        date = new Date cell.v
        expect(date.getFullYear()).to.equal 2007
        expect(date.getMonth()).to.equal 6
        expect(date.getDate()).to.equal 5
        expect(date.getHours()).to.equal 6
        expect(date.getMinutes()).to.equal 18
        expect(date.getSeconds()).to.equal 47

  describe "Test cell value types", ->
    describe "When parsing right numbers by English formatting", ->
      it "should detect the format and parse", ->
        fixture = "139,035,350.34"
        cell = downloader._getCell fixture
        expect(cell).deep.equal {v: 139035350.34, t: 'n'}

    describe "When parsing a wrongly formatted number", ->
      it "should return as is, as string type", ->
        fixture = "xaa139,035,350.34"
        cell = downloader._getCell fixture
        expect(cell).deep.equal {v: "xaa139,035,350.34", t: 's'}

    describe "When parsing a field starting with a dollar sign", ->
      it "should return the number value, without dollar sign", ->
        fixture = "$139,035.56"
        value = downloader._getCell fixture
        expect(value).deep.equal {v: 139035.56, t: 'n'}

    describe "When parsing a field starting with a negative dollar sign", ->
      it "should return the number value, without dollar sign", ->
        fixture = "-$139,035.56"
        value = downloader._getCell fixture
        expect(value).deep.equal {v: -139035.56, t: 'n'}


    describe "When parsing a field not starting with a dollar sign", ->
      it "_parseAsCurrency should return null", ->
        fixture = "139,035.56"
        value = downloader._parseAsCurrency fixture
        expect(value).null

    describe "When parsing a field ending with a % sign", ->
      it "should return the number value, without % sign", ->
        fixture = "139,035.56%"
        value = downloader._getCell fixture
        expect(value).deep.equal {v: 139035.56, t: 'n'}

    describe "When parsing a field not starting with a % sign", ->
      it "_parseAsPercentage should return null", ->
        fixture = "139,035.56"
        value = downloader._parseAsPercentage fixture
        expect(value).null

    describe "When parsing a field with number in ()", ->
      it "should return the negative number value, without ()", ->
        fixture = "(139,035.56)"
        value = downloader._getCell fixture
        expect(value).deep.equal {v: -139035.56, t: 'n'}

    describe "When parsing a number with 0 decimals (12.0)", ->
      it "should be able to parse", ->
        fixture = "139035.0"
        value = downloader._getCell fixture
        expect(value).deep.equal {v: 139035, t: 'n'}

  describe "When parsing a string including a number", ->
    it "should be handled as string", ->
      fixture = "Big Company (2000)"
      value = downloader._getCell fixture
      expect(value).deep.equal {v: "Big Company (2000)", t: 's'}