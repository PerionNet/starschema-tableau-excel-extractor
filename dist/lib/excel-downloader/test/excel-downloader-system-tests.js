var Converter, ExcelDownloader, StreamMeter, stream;

ExcelDownloader = require('../');

Converter = require("csvtojson").Converter;

stream = require('stream');

StreamMeter = require("stream-meter");

describe("ExcelDownloader system tests", function() {
  var downloader;
  downloader = null;
  beforeEach(function() {
    return downloader = new ExcelDownloader;
  });
  describe("When converting big file read as input stream", function() {
    this.timeout(0);
    return it("Should convert all", function(done) {
      var converter, csvfile, i;
      csvfile = fs.createReadStream(path.join(__dirname, "bigfile.csv"), {
        encoding: 'utf8'
      });
      converter = new Converter({
        constructResult: false
      });
      i = 0;
      converter.on("record_parsed", function(jsonObj) {
        if (!(i++ % 1000)) {
          return console.log(i);
        }
      });
      converter.on("end_parsed", function(jsonObj) {
        return resolve(jsonObj);
      });
      return csvfile.pipe(converter);
    });
  });
  describe("When converting file read from read stream", function() {
    this.timeout(0);
    return it("Should convert to excel properly", function(done) {
      var csvfile;
      csvfile = fs.createReadStream(path.join(__dirname, "smallfile.csv"), {
        encoding: 'utf8'
      });
      return downloader._pipeCvsToJson(csvfile).then(function(ws) {
        var workbook;
        workbook = {
          SheetNames: ['test'],
          Sheets: {
            test: ws
          }
        };
        fs.writeFileSync('atyala.xlsx', downloader._createBinaryString(workbook));
        return done();
      })["catch"](function(err) {
        return console.log(err.toString().red);
      });
    });
  });
  describe("When converting file read from HTTP stream", function() {
    this.timeout(0);
    return it("Should convert to excel properly", function(done) {
      var url;
      url = 'test/getsmallcsv';
      return downloader._getCsvAsWorksheet(url).then(function(ws) {
        var workbook;
        workbook = {
          SheetNames: ['test'],
          Sheets: {
            test: ws
          }
        };
        fs.writeFileSync('atyala.xlsx', downloader._createBinaryString(workbook));
        return done();
      })["catch"](function(err) {
        return console.log(err.toString().red);
      });
    });
  });
  describe("When converting big file read from HTTP stream", function() {
    this.timeout(0);
    return it("Should convert to excel properly", function(done) {
      var url;
      url = 'test/getbigcsv';
      return downloader._getCsvAsWorksheet(url).then(function(ws) {
        var workbook;
        workbook = {
          SheetNames: ['test'],
          Sheets: {
            test: ws
          }
        };
        fs.writeFileSync('atyala.xlsx', downloader._createBinaryString(workbook));
        return done();
      })["catch"](function(err) {
        return console.log(err.toString().red);
      });
    });
  });
  describe("When converting too big file read from stream", function() {
    return it("Should fail with TOO_BIG_FILE", function(done) {
      var csvfile, oldval;
      csvfile = fs.createReadStream(path.join(__dirname, "smallfile.csv"), {
        encoding: 'utf8'
      });
      oldval = config.maxCSVSize;
      config.maxCSVSize = 400;
      return downloader._pipeCvsToJson(csvfile)["catch"](function(err) {
        config.maxCSVSize = oldval;
        expect(err.status).equal('TOO_BIG_FILE');
        console.log(("INFO: error message was " + err.message).yellow);
        return done();
      });
    });
  });
  return describe("Test stream-meter", function() {
    var stringStream;
    stringStream = null;
    beforeEach(function() {
      stringStream = new stream.Readable();
      stringStream._read = function() {};
      stringStream.push('0123456789');
      return stringStream.push(null);
    });
    describe("When reading stream", function() {
      return it("Should count number of bytes read", function(done) {
        var meter;
        meter = StreamMeter();
        stringStream.pipe(meter);
        meter.on('data', function() {});
        return meter.on('end', function() {
          expect(meter.bytes).equal(10);
          return done();
        });
      });
    });
    return describe("When size exceeds the limit", function() {
      return it("Should catch it as error", function(done) {
        var meter;
        meter = StreamMeter(9);
        stringStream.pipe(meter);
        return meter.on('error', function(err) {
          expect(err).eql(Error("Stream exceeded specified max of 9 bytes."));
          return done();
        });
      });
    });
  });
});
