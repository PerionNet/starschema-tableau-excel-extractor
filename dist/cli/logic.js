var Authenticate, WorkbookDownloader, _params, _viewSet, err, error, getCliParams, getViewSet, setGlobalConfig;

GLOBAL.Promise = require('bluebird');

GLOBAL.fs = require('fs');

GLOBAL._ = require('lodash');

GLOBAL.Logger = require('./logger');

Authenticate = require('../lib/authenticate');

WorkbookDownloader = require('../lib/workbook-downloader');

_params = null;

_viewSet = null;

getCliParams = function() {
  var program, ref;
  program = require('commander');
  program.version('0.0.1').description("Extract tableau reports in Excel format.").usage('[options] <url>').option('-u, --username <username>', 'Tableau username').option('-p, --password <password>', 'Tableau password').parse(process.argv);
  if ((program.username != null) && (program.password != null) && (((ref = program.args) != null ? ref[0] : void 0) != null)) {
    return {
      username: program.username,
      password: program.password,
      viewUrl: program.args[0]
    };
  } else {
    return program.help();
  }
};

setGlobalConfig = function(url) {
  return GLOBAL.config = {
    tableauServer: url,
    tableauVersion: '9.3'
  };
};

getViewSet = function(url, username) {
  var customViewRegex, parts;
  customViewRegex = RegExp("(http[s]?:\\/\\/.*\\/)[\\#]?\\/views\\/(.*)\\/(.*)\\/" + username + "\\/([^\\?]*)[\\?]?.*");
  parts = url.match(customViewRegex);
  if (parts != null) {
    return {
      serverUrl: parts[1],
      workbookName: parts[2],
      workbookUrl: parts[2],
      viewName: parts[3],
      viewUrl: parts[3],
      customViews: [
        {
          name: parts[4],
          url: parts[4],
          username: username
        }
      ]
    };
  } else {
    throw {
      message: "Cannot extract any data."
    };
  }
};

try {
  _params = getCliParams();
  _viewSet = getViewSet(_params.viewUrl, _params.username);
  setGlobalConfig(_viewSet.serverUrl);
} catch (error) {
  err = error;
  console.log(err.message.red);
  process.exit(0);
}

Authenticate.authenticate(_params.username, _params.password).then(function(res) {
  var workbookDownloader;
  workbookDownloader = new WorkbookDownloader;
  return workbookDownloader.download(_viewSet);
}).then(function(file) {
  fs.writeFileSync(file.filename, file.data);
  console.log(("Report " + file.filename + " has been created.").green);
  return process.exit(-1);
})["catch"](function(err) {
  console.log('Error', err);
  return process.exit(0);
});
