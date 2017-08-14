/* eslint-env mocha */

var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect
var Concurrent = require('../../../../lib').Concurrent
var throttle = Concurrent.throttle
var CancellationException = Concurrent.CancellationException

describe('Integration', function () {
  describe('/concurrent', function () {
    describe('/timeout.js', function () {
      describe('.throttle', function () {
        var clock

        beforeEach(function () {
          clock = Sinon.useFakeTimers()
        })

        afterEach(function () {
          clock.restore()
        })

        it('creates promise that resolves after passed time if it resolved too fast', function () {
          var promise = Promise.resolve()
          var stub = Sinon.stub()
          var throttled = throttle(promise, 10).then(stub)
          expect(stub.callCount).to.eq(0)
          clock.next()
          return throttled
            .then(function () {
              expect(stub.callCount).to.eq(1)
            })
        })

        it('doesn\'t slow down promise that takes longer that throttle time', function () {
          var promise = new Promise(function (resolve) {
            setTimeout(resolve, 30)
          })
          var stub = Sinon.stub()
          var throttled = throttle(promise, 10).then(stub)
          expect(stub.callCount).to.eq(0)
          clock.tick(30)
          return throttled
            .then(function () {
              expect(stub.callCount).to.eq(1)
            })
        })

        it('provides #cancel(false) method for explicit cancellation', function () {
          var promise = Promise.resolve()
          var throttled = throttle(promise, 10)
          throttled.cancel(false)
          return expect(throttled).to.eventually.rejectedWith(CancellationException)
        })

        it('provides #cancel(true) method for implicit cancellation', function () {
          var value = {x: 12}
          var promise = Promise.resolve(value)
          var throttled = throttle(promise, 10)
          throttled.cancel(true)
          return expect(throttled).to.eventually.equal(value)
        })
      })
    })
  })
})
