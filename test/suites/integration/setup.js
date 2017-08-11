/* global allure */
/* eslint-env mocha */

var Yaml = require('js-yaml')
var Sinon = require('sinon')

var requests = []

// noinspection JSUnusedGlobalSymbols
global.Net = {
  HttpRequestOptions: function () {
    this.headers = {}
    this.postData = null
    this.method = 'GET'
  },
  httpRequestAsync: Sinon.spy(function (url, options) {
    requests.push({request: {url: url, options: options}})
  })
}

global.transportFactory = function () {
  var responses = Array.prototype.slice.call(arguments, 0)
  var index = 0
  return Sinon.spy(function (url, options) {
    var request = {
      url: url,
      options: options
    }
    var response = responses[index++ % responses.length]
    requests.push({request: request, response: response})
    return Promise.resolve(response)
  })
}

global.basicFactory = function () {
  var responses = Array.prototype.slice.call(arguments, 0)
  var index = 0
  return {
    execute: Sinon.spy(function (request) {
      var response = responses[index++ % responses.length]
      requests.push({request: request, response: response})
      return Promise.resolve(response)
    })
  }
}

global.transport = global.transportFactory

afterEach(function () {
  for (var i = 0; i < requests.length; i++) {
    allure.createAttachment('request-%d.json'.replace('%d', i.toString()),
      Yaml.dump(requests[i]), 'application/x-yaml')
  }
  requests = []
})
