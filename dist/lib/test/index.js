var chai, timekeeper;

require('../globals');

chai = require('chai');

GLOBAL.sinon = require('sinon');

GLOBAL.should = chai.should();

GLOBAL.expect = chai.expect;

timekeeper = require('timekeeper');

require('sinon-as-promised')(Promise);

GLOBAL.test = {
  getMockClock: function(dateString) {
    var time;
    time = (dateString ? new Date(dateString) : new Date()).getTime();
    return sinon.useFakeTimers(time);
  },
  travelTime: function(ticks) {
    var future;
    future = new Date(new Date().getTime() + ticks);
    return timekeeper.travel(future);
  },
  jumpToDate: function(date) {
    return timekeeper.travel(date);
  },
  resetDate: function() {
    return timekeeper.reset();
  },
  freezeTime: function() {
    return timekeeper.freeze();
  }
};

process.on('uncaughtException', function(err) {
  return console.log(err);
});
