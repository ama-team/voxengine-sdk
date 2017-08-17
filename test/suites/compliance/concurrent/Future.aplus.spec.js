/* eslint-env mocha */
var suite = require('promises-aplus-tests')
var Future = require('../../../../lib/index').Concurrent.Future

describe('Compliance', function () {
  describe('/concurrent', function () {
    describe('/Future.js', function () {
      describe('Future', function () {
        describe('< Promises/A+', function () {
          var adapter = {
            resolved: Future.resolve,
            rejected: Future.reject,
            deferred: function () {
              var future = new Future()
              return {
                promise: future,
                resolve: future.resolve,
                reject: future.reject
              }
            }
          }

          suite.mocha(adapter)
        })
      })
    })
  })
})
