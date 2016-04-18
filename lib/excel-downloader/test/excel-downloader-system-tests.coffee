ExcelDownloader = require '../'
Converter = require("csvtojson").Converter
stream = require 'stream'
StreamMeter = require "stream-meter"

describe "ExcelDownloader system tests", ->
  downloader = null

  beforeEach ->
    downloader = new ExcelDownloader
    

  describe "When converting big file read as input stream", ->
    @timeout 0

    it "Should convert all", (done) ->
      csvfile = fs.createReadStream path.join(__dirname, "bigfile.csv"), {encoding: 'utf8'}
      converter = new Converter {constructResult:false}
      i = 0

      converter.on "record_parsed", (jsonObj) ->
        if not(i++ % 1000) then console.log i

      converter.on "end_parsed", (jsonObj) ->
        resolve jsonObj

      csvfile.pipe converter


  describe "When converting file read from read stream", ->
    @timeout 0

    it "Should convert to excel properly", (done) ->
      csvfile = fs.createReadStream path.join(__dirname, "smallfile.csv"), {encoding: 'utf8'}
      downloader._pipeCvsToJson csvfile
      .then (ws) ->
        workbook =
          SheetNames: ['test']
          Sheets: {test: ws}

        fs.writeFileSync 'atyala.xlsx', downloader._createBinaryString workbook
        done()
      .catch (err) ->
        console.log err.toString().red


  describe "When converting file read from HTTP stream", ->
    @timeout 0

    it "Should convert to excel properly", (done) ->
      url = 'test/getsmallcsv'
      downloader._getCsvAsWorksheet url
      .then (ws) ->
        workbook =
          SheetNames: ['test']
          Sheets: {test: ws}

        fs.writeFileSync 'atyala.xlsx', downloader._createBinaryString workbook
        done()
      .catch (err) ->
        console.log err.toString().red


  describe "When converting big file read from HTTP stream", ->
    @timeout 0

    it "Should convert to excel properly", (done) ->
      url = 'test/getbigcsv'
      downloader._getCsvAsWorksheet url
      .then (ws) ->
        workbook =
          SheetNames: ['test']
          Sheets: {test: ws}

        fs.writeFileSync 'atyala.xlsx', downloader._createBinaryString workbook
        done()
      .catch (err) ->
        console.log err.toString().red



  describe "When converting too big file read from stream", ->
    it "Should fail with TOO_BIG_FILE", (done) ->
      csvfile = fs.createReadStream path.join(__dirname, "smallfile.csv"), {encoding: 'utf8'}
      oldval = config.maxCSVSize
      config.maxCSVSize = 400
      downloader._pipeCvsToJson csvfile
      .catch (err) ->
        config.maxCSVSize = oldval
        expect(err.status).equal 'TOO_BIG_FILE'
        console.log "INFO: error message was #{err.message}".yellow
        done()


  describe "Test stream-meter", ->
    stringStream = null

    beforeEach ->
      stringStream = new stream.Readable()
      stringStream._read = ->
      stringStream.push '0123456789'
      stringStream.push null

    describe "When reading stream", ->
      it "Should count number of bytes read", (done) ->
        meter = StreamMeter()
        stringStream.pipe(meter)
        meter.on 'data', ->
        meter.on 'end', ->
          expect(meter.bytes).equal 10
          done()


    describe "When size exceeds the limit", ->
      it "Should catch it as error", (done) ->
        meter = StreamMeter 9
        stringStream.pipe(meter)
        meter.on 'error', (err) ->
          expect(err).eql Error "Stream exceeded specified max of 9 bytes."
          done()



