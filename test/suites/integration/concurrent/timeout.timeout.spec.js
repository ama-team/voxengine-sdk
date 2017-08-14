/* eslint-env mocha */

var Concurrent = require('../../../../lib').Concurrent
var timeout = Concurrent.timeout
var TimeoutException = Concurrent.TimeoutException
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

        it('passes provided message to exception', function () {
          var message = 'foo'
          var promise = new Promise(function () {})
          var wrapped = timeout(promise, 0, message)
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
          return expect(wrapped).to.eventually.eq(value)
        })
      })
    })
  })
})
