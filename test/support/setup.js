var AllurePolyfill = require('@ama-team/allure-polyfill')
var sinon = require('sinon')

AllurePolyfill.ensure(new AllurePolyfill.sink.Console())

var logs = []
var requests = []

// todo: not good
//noinspection JSUnusedGlobalSymbols
global.Net = {
  HttpRequestOptions: function () {
    this.headers = {}
    this.postData = null
    this.method = 'GET'
  },
  httpRequestAsync: sinon.spy(function (url, options) {
    requests.push({url: url, options: options})
  })
};

// todo
global.Logger = {
  write: sinon.spy(function (message) {
    logs.push(message)
  })
}

beforeEach(function () {
  logs = []
  requests = []
})

afterEach(function () {
  if (logs.length) {
    allure.createAttachment('voxengine.log', logs.join('\n'), 'text/plain')
  }
  for (var i = 0; i < requests.length; i++) {
    allure.createAttachment('request-%d.json'.replace('%d', i.toString()),
      JSON.stringify(requests[i]), 'application/json')
  }
})
