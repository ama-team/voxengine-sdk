/* eslint-env mocha */

var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect

Chai.use(require('chai-as-promised'))

var Concurrent = require('../../../../lib').Concurrent
var timeout = Concurrent.timeout
var TimeoutException = Concurrent.TimeoutException
var CancellationException = Concurrent.CancellationException

var branchStopper = function () {
  throw new Error('Unexpected branch execution')
}

describe('Integration', function () {
  describe('/concurrent', function () {
    describe('/timeout.js', function () {
      describe('.timeout', function () {
        it('returns promise if timeout is negative', function () {
          var promise = new Promise(function () {})
          return expect(timeout(promise, -1)).to.equal(promise)
        })

        it('returns promise if timeout is omitted', function () {
          var promise = new Promise(function () {})
          return expect(timeout(promise)).to.equal(promise)
        })

        it('returns promise if not-a-number is supplied', function () {
          var promise = new Promise(function () {})
          return expect(timeout(promise, false)).to.equal(promise)
        })

        it('wraps promise in timed out one', function () {
          var promise = new Promise(function () {})
          var wrapped = timeout(promise, 0)
          return expect(wrapped).to.eventually.be.rejectedWith(TimeoutException)
        })

        it('allows to set custom callback', function () {
          var value = {x: 12}
          var callback = function (resolve) {
            resolve(value)
          }
          var promise = new Promise(function () {})
          var wrapped = timeout(promise, 0, callback)
          return expect(wrapped).to.eventually.equal(value)
        })

        it('uses provided callback as exception message if it is string', function () {
          var message = 'foo'
          var promise = new Promise(function () {})
          var wrapped = timeout(promise, 0, message)
          return wrapped
            .then(branchStopper, function (error) {
              expect(error).to.be.instanceOf(TimeoutException)
              expect(error.message).to.eq(message)
            })
        })

        it('allows to set both callback and exception message', function () {
          var message = 'foo'
          var promise = new Promise(function () {})
          var callback = Sinon.spy(function (_, reject, error) {
            reject(error)
          })
          var wrapped = timeout(promise, 0, callback, message)
          return wrapped
            .then(branchStopper, function (error) {
              expect(error).to.be.instanceOf(TimeoutException)
              expect(error.message).to.eq(message)
              expect(callback.callCount).to.eq(1)
            })
        })

        it('doesn\'t timeout resolved promise', function () {
          var value = 12
          var promise = Promise.resolve(value)
          var wrapped = promise
            .then(function () {
              return timeout(promise, 0)
            })
          return expect(wrapped).to.eventually.eq(value)
        })

        it('provides #cancel(false) method that allows to explicitly stop processing', function () {
          var promise = new Promise(function (resolve) {})
          var wrapped = timeout(promise, 10)
          wrapped.cancel(false)
          return expect(wrapped).to.eventually.be.rejectedWith(CancellationException)
        })

        it('provides #cancel(true) method that allows to implicitly stop processing', function () {
          // TODO: doesn't really prove anything
          var promise = new Promise(function (resolve) {
            setTimeout(resolve, 1)
          })
          var wrapped = timeout(promise, 0)
          wrapped.cancel(true)
          return wrapped
        })
      })
    })
  })
})
