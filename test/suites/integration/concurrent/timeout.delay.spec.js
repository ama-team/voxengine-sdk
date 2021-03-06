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
        it('delays processing of specified code', function () {
          var callback = Sinon.stub()
          var delayed = delay(0, callback)
          expect(callback.callCount).to.eq(0)
          return delayed
            .then(function () {
              expect(callback.callCount).to.eq(1)
            })
        })

        it('rejects target promise if callback throws error', function () {
          var error = new Error()
          var callback = Sinon.stub().throws(error)
          var promise = delay(0, callback)
          return expect(promise).to.eventually.be.rejectedWith(error)
        })

        it('creates delayed promise if no callback is specified', function () {
          return expect(delay(0)).to.eventually.be.undefined
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
