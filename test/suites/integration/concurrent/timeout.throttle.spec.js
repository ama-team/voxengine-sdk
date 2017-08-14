/* eslint-env mocha */

var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect
var throttle = require('../../../../lib').Concurrent.throttle

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
      })
    })
  })
})
