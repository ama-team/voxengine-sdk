/* eslint-env mocha */

var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect
var delay = require('../../../../lib').Concurrent.delay

describe('Integration', function () {
  describe('/concurrent', function () {
    describe('/timeout.js', function () {
      describe('.delay', function () {
        var clock

        beforeEach(function () {
          clock = Sinon.useFakeTimers()
        })

        afterEach(function () {
          clock.restore()
        })

        it('delays processing of specified code', function () {
          var callback = Sinon.stub()
          var delayed = delay(10, callback)
          expect(callback.callCount).to.eq(0)
          clock.next()
          return delayed
            .then(function () {
              expect(callback.callCount).to.eq(1)
            })
        })

        it('creates delayed promise if no callback is specified', function () {
          var promise = delay(1)
          clock.next()
          return promise
        })
      })
    })
  })
})
