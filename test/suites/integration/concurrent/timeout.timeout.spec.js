/* eslint-env mocha */

var Concurrent = require('../../../../lib').Concurrent
var timeout = Concurrent.timeout
var TimeoutException = Concurrent.TimeoutException
var CancellationException = Concurrent.CancellationException
var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect

Chai.use(require('chai-as-promised'))

var branchStopper = function () {
  throw new Error('Unexpected branch execution')
}

describe('Integration', function () {
  describe('/concurrent', function () {
    describe('/timeout.js', function () {
      describe('.timeout', function () {
        var clock

        beforeEach(function () {
          clock = Sinon.useFakeTimers()
        })

        afterEach(function () {
          clock.restore()
        })

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
          clock.next()
          return expect(wrapped).to.eventually.be.rejectedWith(TimeoutException)
        })

        it('passes provided message to exception', function () {
          var message = 'foo'
          var promise = new Promise(function () {})
          var wrapped = timeout(promise, 0, message)
          clock.next()
          return wrapped
            .then(branchStopper, function (error) {
              expect(error).to.be.instanceOf(TimeoutException)
              expect(error.message).to.eq(message)
            })
        })

        it('doesn\'t timeout resolved promise', function () {
          var value = 12
          var promise = Promise.resolve(value)
          var wrapped = promise
            .then(function () {
              return timeout(promise, 0)
            })
          clock.next()
          return expect(wrapped).to.eventually.eq(value)
        })

        it('provides noop #cancel() method on passed through promise', function () {
          var promise = Promise.resolve(12)
          var wrapped = timeout(promise, -1)
          expect(wrapped).to.have.property('cancel').instanceOf(Function)
          expect(wrapped.cancel).not.to.throw()
        })

        it('provides #cancel(false) method that allows to explicitly stop processing', function () {
          var promise = new Promise(function (resolve) {
            setTimeout(resolve, 10)
          })
          var wrapped = timeout(promise, 1)
          wrapped.cancel(false)
          clock.tick(15)
          return expect(wrapped).to.eventually.be.rejectedWith(CancellationException)
        })

        it('provides #cancel(true) method that allows to implicitly stop processing', function () {
          var promise = new Promise(function (resolve) {
            setTimeout(resolve, 10)
          })
          var wrapped = timeout(promise, 1)
          wrapped.cancel(true)
          clock.tick(15)
          return wrapped
        })

        it('allows to set custom callback', function () {
          var value = {x: 12}
          var callback = function (resolve) {
            resolve(value)
          }
          var promise = new Promise(function () {})
          var wrapped = timeout(promise, 1, callback)
          clock.next()
          return expect(wrapped).to.eventually.equal(value)
        })
      })
    })
  })
})
