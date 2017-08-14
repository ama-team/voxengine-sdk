/* eslint-env mocha */

var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect
var Concurrent = require('../../../../lib').Concurrent
var delay = Concurrent.delay
var CancellationException = Concurrent.CancellationException

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

        it('provides #cancel(false) method for explicit cancellation', function () {
          var promise = delay(1)
          promise.cancel(false)
          return expect(promise).to.eventually.be.rejectedWith(CancellationException)
        })

        it('provides #cancel(true) method for implicit cancellation', function () {
          var promise = delay(1)
          promise.cancel(true)
          return promise
        })
      })
    })
  })
})
