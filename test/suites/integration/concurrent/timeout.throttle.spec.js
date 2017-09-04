/* eslint-env mocha */

var Chai = require('chai')
var expect = Chai.expect
var Concurrent = require('../../../../lib').Concurrent
var throttle = Concurrent.throttle
var CancellationException = Concurrent.CancellationException

describe('Integration', function () {
  describe('/concurrent', function () {
    describe('/timeout.js', function () {
      describe('.throttle', function () {
        it('creates promise that resolves after passed time if it resolved too fast', function () {
          var barriers = {}
          var promise = Promise.resolve()
          var alpha = throttle(promise, 2)
            .then(function () {
              barriers.alpha = 1
            })
          var beta = throttle(promise, 1)
            .then(function () {
              barriers.beta = 1
            })
          return beta
            .then(function () {
              expect(barriers).to.have.property('beta').eq(1)
              expect(barriers).not.to.have.property('alpha')
              return alpha
            })
        })

        it('doesn\'t slow down promise that takes longer that throttle time')

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
