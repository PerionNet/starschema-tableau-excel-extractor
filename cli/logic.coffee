GLOBAL.Promise = require 'bluebird'
GLOBAL.fs = require 'fs'
GLOBAL._ = require 'lodash'

GLOBAL.Logger = require './logger'
Authenticate = require '../lib/authenticate'
WorkbookDownloader = require '../lib/workbook-downloader'


_params = null
_viewSet = null

getCliParams = ->
  program = require 'commander'

  program
    .version('0.0.2')
    .description "Extract tableau reports in Excel format."
    .usage('[options] <url>')
    .option('-u, --username <username>', 'Tableau username')
    .option('-p, --password <password>', 'Tableau password')
    .parse(process.argv)

  if program.username? and program.password? and program.args?[0]?
    username: program.username
    password: program.password
    viewUrl: program.args[0]
  else
    program.help()


setGlobalConfig = (url) ->
  GLOBAL.config =
    tableauServer: url
    tableauVersion: '9.3'


getViewSet = (url, username) ->
  customViewRegex = ///(http[s]?:\/\/.*\/)[\#]?\/views\/(.*)\/(.*)\/#{username}\/([^\?]*)[\?]?.*///
  parts = url.match customViewRegex

  # url looks like a custom view url
  if parts?
    serverUrl: parts[1]
    workbookName: parts[2]
    workbookUrl: parts[2]
    viewName: parts[3]
    viewUrl: parts[3]
    customViews: [
      name: parts[4]
      url: parts[4]
      username: username
    ]
  else
    throw {message: "Cannot extract any data."}


try
  _params = getCliParams()
  _viewSet = getViewSet _params.viewUrl, _params.username
  setGlobalConfig _viewSet.serverUrl
catch err
  console.log err.message.red
  process.exit 0


Authenticate.authenticate _params.username, _params.password
.then (res) ->
  workbookDownloader = new WorkbookDownloader
  workbookDownloader.download _viewSet
.then (file) ->
  fs.writeFileSync file.filename, file.data
  console.log "Report #{file.filename} has been created.".green
  process.exit -1
.catch (err) ->
  console.log 'Error', err
  process.exit 0

