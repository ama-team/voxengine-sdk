/* global allure */
/* eslint-env mocha */

var AllurePolyfill = require('@ama-team/allure-polyfill')
var Sinon = require('sinon')

AllurePolyfill.ensure(new AllurePolyfill.sink.Console())

var logs = []

global.Logger = {
  write: Sinon.spy(function (message) {
    logs.push(message)
  })
}

beforeEach(function () {
  global.VarArgLogger = {}
  var methods = ['trace', 'debug', 'info', 'notice', 'warn', 'error']
  methods.forEach(function (method) {
    global.VarArgLogger[method] = function (pattern) {
      var message = pattern;
      [].slice.call(arguments, 1).map(JSON.stringify).forEach(function (_) {
        message = message.replace('{}', _)
      })
      global.Logger.write(message)
    }
  })
})

afterEach(function () {
  if (logs.length) {
    allure.createAttachment('voxengine.log', logs.join('\n'), 'text/plain')
    logs = []
  }
})
