var polyfill = require('@ama-team/allure-polyfill')
polyfill.ensure(new polyfill.sink.Console())

// todo: not good
// noinspection JSUnusedGlobalSymbols
global.Net = {
  HttpRequestOptions: function () {
    this.headers = {}
    this.postData = null
    this.method = 'GET'
  }
}
