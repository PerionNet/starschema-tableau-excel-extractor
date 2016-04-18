require '../globals'
chai = require 'chai'
GLOBAL.sinon = require 'sinon'
GLOBAL.should = chai.should()
GLOBAL.expect = chai.expect
timekeeper = require 'timekeeper'
require('sinon-as-promised') Promise

GLOBAL.test =
  getMockClock: (dateString) ->
    time = (if dateString then new Date(dateString) else new Date()).getTime()
    sinon.useFakeTimers(time)

  travelTime: (ticks) ->
    future = new Date(new Date().getTime() + ticks)
    timekeeper.travel future

  jumpToDate: (date) ->
    timekeeper.travel date

  resetDate: ->
    timekeeper.reset()

  freezeTime: ->
    timekeeper.freeze()

process.on 'uncaughtException', (err) ->
  console.log err
