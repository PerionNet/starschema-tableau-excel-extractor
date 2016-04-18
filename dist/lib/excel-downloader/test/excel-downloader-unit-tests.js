var Converter, CreateHttpMock, ExcelDownloader, fullCsv, moment, stream;

ExcelDownloader = require('../');

stream = require('stream');

moment = require('moment');

Converter = require("csvtojson").Converter;

fullCsv = require('./fixture_full_csv');

CreateHttpMock = function(bodyToReturn) {
  return {
    get: function() {
      return Promise.resolve(bodyToReturn);
    }
  };
};

describe("Test ExcelDownloader", function() {
  var downloader;
  downloader = null;
  beforeEach(function() {
    return downloader = new ExcelDownloader();
  });
  describe("When downloaded CVS contains multiple headers with the same name", function() {
    beforeEach(function() {
      var http;
      http = {
        get: function() {
          return Promise.resolve(fullCsv);
        }
      };
      return downloader._inject({
        http: http
      });
    });
    it("should be able to fetch those column names as well", function(done) {
      var expectedColumnNames;
      expectedColumnNames = ['', '', '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return downloader._getCsvAsJson().then(function(json) {
        expect(expectedColumnNames).deep.equal(downloader._getColumnNames(json));
        return done();
      });
    });
    return it("_createSheetFromJson should be able to create a proper sheet", function(done) {
      var json, sheet;
      json = [
        {
          'field1': 'foo',
          'field2': 'foo'
        }, {
          'field1': 1,
          'field2': 2
        }
      ];
      expect(['field1', 'field2']).deep.equal(downloader._getFieldNames(json));
      sheet = downloader._createSheetFromJson(json);
      expect(sheet.A1).deep.equal({
        v: 'foo',
        t: 's'
      });
      expect(sheet.B1).deep.equal({
        v: 'foo',
        t: 's'
      });
      expect(sheet.A2).deep.equal({
        v: 1,
        t: 'n'
      });
      expect(sheet.B2).deep.equal({
        v: 2,
        t: 'n'
      });
      return done();
    });
  });
  describe("When downloaded CSV contains good data", function() {
    return it("should create a json object out of it", function() {
      var expectedJson, http;
      expectedJson = [
        {
          "field1": "Country",
          "field2": "Customer Name"
        }, {
          "field1": "United States",
          "field2": "Aaron Bergman"
        }
      ];
      http = CreateHttpMock("Country,Customer Name\nUnited States,Aaron Bergman");
      downloader._inject({
        http: http
      });
      return downloader._getCsvAsJson().then(function(json) {
        return expect(json).to.deep.equal(expectedJson);
      });
    });
  });
  describe("When downloaded CSV contains bad data", function() {
    return it("should reject with error", function(done) {
      var http;
      http = CreateHttpMock("foobar\"\nfoobar foobar");
      downloader._inject({
        http: http
      });
      return downloader._getCsvAsJson()["catch"](function(error) {
        expect(error.message).to.contain("Cannot parse CSV data");
        return done();
      });
    });
  });
  describe("Test date conversion", function() {
    describe("When parsing date string '7/5/2007 6:18:47 AM'", function() {
      return it("_convertToDate should return a valid date", function() {
        var date, fixture;
        fixture = '7/5/2007 6:18:47 PM';
        date = downloader._convertToDate(fixture);
        expect(date.getFullYear()).to.equal(2007);
        expect(date.getMonth()).to.equal(6);
        expect(date.getDate()).to.equal(5);
        expect(date.getHours()).to.equal(18);
        expect(date.getMinutes()).to.equal(18);
        return expect(date.getSeconds()).to.equal(47);
      });
    });
    return describe("When parsing invalid string", function() {
      return it("return null", function() {
        var date;
        date = downloader._convertToDate('7/5/2007 6:18:47 CM');
        expect(date)["null"];
        date = downloader._convertToDate('a/5/2007 6:18:47 AM');
        expect(date)["null"];
        date = downloader._convertToDate('123/5/2007 6:18:47 AM');
        expect(date)["null"];
        date = downloader._convertToDate('23:5/2007 6:18:47 AM');
        expect(date)["null"];
        date = downloader._convertToDate('23/5/2007  6:18:47 AM');
        expect(date)["null"];
        date = downloader._convertToDate('23/5/2007 6.18:47 AM');
        return expect(date)["null"];
      });
    });
  });
  describe("Test cell type detection", function() {
    return describe("When CSV contains dates", function() {
      return it("should detect dates properly", function() {
        var cell, date;
        cell = downloader._getCell('7/5/2007 6:18:47 AM');
        expect(cell.t).equal('d');
        date = new Date(cell.v);
        expect(date.getFullYear()).to.equal(2007);
        expect(date.getMonth()).to.equal(6);
        expect(date.getDate()).to.equal(5);
        expect(date.getHours()).to.equal(6);
        expect(date.getMinutes()).to.equal(18);
        return expect(date.getSeconds()).to.equal(47);
      });
    });
  });
  describe("Test cell value types", function() {
    describe("When parsing right numbers by English formatting", function() {
      return it("should detect the format and parse", function() {
        var cell, fixture;
        fixture = "139,035,350.34";
        cell = downloader._getCell(fixture);
        return expect(cell).deep.equal({
          v: 139035350.34,
          t: 'n'
        });
      });
    });
    describe("When parsing a wrongly formatted number", function() {
      return it("should return as is, as string type", function() {
        var cell, fixture;
        fixture = "xaa139,035,350.34";
        cell = downloader._getCell(fixture);
        return expect(cell).deep.equal({
          v: "xaa139,035,350.34",
          t: 's'
        });
      });
    });
    describe("When parsing a field starting with a dollar sign", function() {
      return it("should return the number value, without dollar sign", function() {
        var fixture, value;
        fixture = "$139,035.56";
        value = downloader._getCell(fixture);
        return expect(value).deep.equal({
          v: 139035.56,
          t: 'n'
        });
      });
    });
    describe("When parsing a field starting with a negative dollar sign", function() {
      return it("should return the number value, without dollar sign", function() {
        var fixture, value;
        fixture = "-$139,035.56";
        value = downloader._getCell(fixture);
        return expect(value).deep.equal({
          v: -139035.56,
          t: 'n'
        });
      });
    });
    describe("When parsing a field not starting with a dollar sign", function() {
      return it("_parseAsCurrency should return null", function() {
        var fixture, value;
        fixture = "139,035.56";
        value = downloader._parseAsCurrency(fixture);
        return expect(value)["null"];
      });
    });
    describe("When parsing a field ending with a % sign", function() {
      return it("should return the number value, without % sign", function() {
        var fixture, value;
        fixture = "139,035.56%";
        value = downloader._getCell(fixture);
        return expect(value).deep.equal({
          v: 139035.56,
          t: 'n'
        });
      });
    });
    describe("When parsing a field not starting with a % sign", function() {
      return it("_parseAsPercentage should return null", function() {
        var fixture, value;
        fixture = "139,035.56";
        value = downloader._parseAsPercentage(fixture);
        return expect(value)["null"];
      });
    });
    describe("When parsing a field with number in ()", function() {
      return it("should return the negative number value, without ()", function() {
        var fixture, value;
        fixture = "(139,035.56)";
        value = downloader._getCell(fixture);
        return expect(value).deep.equal({
          v: -139035.56,
          t: 'n'
        });
      });
    });
    return describe("When parsing a number with 0 decimals (12.0)", function() {
      return it("should be able to parse", function() {
        var fixture, value;
        fixture = "139035.0";
        value = downloader._getCell(fixture);
        return expect(value).deep.equal({
          v: 139035,
          t: 'n'
        });
      });
    });
  });
  return describe("When parsing a string including a number", function() {
    return it("should be handled as string", function() {
      var fixture, value;
      fixture = "Big Company (2000)";
      value = downloader._getCell(fixture);
      return expect(value).deep.equal({
        v: "Big Company (2000)",
        t: 's'
      });
    });
  });
});
