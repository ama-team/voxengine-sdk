/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

var Future = require('../../../../lib').Concurrent.Future
var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect

Chai.use(require('chai-as-promised'))

var branchStopper = function () {
  throw new Error('Unexpected branch execution')
}

describe('Integration', function () {
  describe('/concurrent', function () {
    describe('/Future.js', function () {
      describe('Future', function () {
        describe('< new', function () {
          it('does not require arguments', function () {
            expect(new Future()).to.be.instanceOf(Future)
          })

          it('accepts resolver function', function () {
            var value = 12
            var resolver = function (resolve) {
              resolve(value)
            }
            return expect(new Future(resolver)).to.eventually.equal(value)
          })
        })

        describe('#resolve', function () {
          it('resolves externally', function () {
            var future = new Future()
            var value = 12
            return expect(future.resolve(value)).to.eventually.equal(value)
          })

          it('doesn\'t resolve twice', function () {
            var future = new Future()
            var value = 12
            future.resolve(value)
            future.resolve([value])
            return expect(future).to.eventually.equal(value)
          })
        })

        describe('#reject', function () {
          it('rejects externally', function () {
            var future = new Future()
            var error = new Error()
            future.reject(error)
            return expect(future).to.eventually.be.rejectedWith(error)
          })

          it('doesn\'t reject twice', function () {
            var future = new Future()
            var error = new Error()
            future.reject(error)
            future.reject(new Error())
            return expect(future).to.eventually.be.rejectedWith(error)
          })
        })

        describe('#then', function () {
          it('composes new Future', function () {
            var future = new Future()
            var nextFuture = future.then()
            expect(nextFuture).to.be.instanceOf(Future)
            expect(nextFuture).not.to.equal(future)
          })

          it('invokes resolution handler when fulfilled', function () {
            var future = new Future()
            var handler = Sinon.stub()
            var nextFuture = future.then(handler)
            var value = {value: 12}
            future.resolve(value)
            return nextFuture.then(function () {
              expect(handler.calledOnce).to.be.true
              expect(handler.getCall(0).args[0]).to.equal(value)
            })
          })

          it('invokes resolution handler even if set after fulfillment', function () {
            var future = new Future()
            var value = {value: 12}
            future.resolve(value)
            var handler = Sinon.stub()
            var nextFuture = future.then(handler)
            return nextFuture.then(function () {
              expect(handler.calledOnce).to.be.true
              expect(handler.getCall(0).args[0]).to.equal(value)
            })
          })

          it('invokes rejection handler when rejected', function () {
            var future = new Future()
            var handler = Sinon.stub()
            var nextFuture = future.then(null, handler)
            var value = {value: 12}
            future.reject(value)
            return nextFuture.then(function () {
              expect(handler.calledOnce).to.be.true
              expect(handler.getCall(0).args[0]).to.equal(value)
            })
          })

          it('invokes rejection handler even if set after rejection', function () {
            var future = new Future()
            var value = {value: 12}
            future.reject(value)
            var handler = Sinon.stub()
            var nextFuture = future.then(null, handler)
            return nextFuture.then(function () {
              expect(handler.calledOnce).to.be.true
              expect(handler.getCall(0).args[0]).to.equal(value)
            })
          })
        })

        describe('.resolve', function () {
          it('returns resolved promise', function () {
            var value = {x: 12}
            return expect(Future.resolve(value)).to.eventually.equal(value)
          })
        })

        describe('.reject', function () {
          it('returns rejected promise', function () {
            var value = {x: 12}
            var future = Future.reject(value)
            return expect(future).to.eventually.be.rejectedWith(value)
          })
        })

        describe('.wrap', function () {
          it('wraps Promise with a Future', function () {
            var promise = new Promise(function () {})
            return expect(Future.wrap(promise)).to.be.instanceOf(Future)
          })

          it('catches resolved Promise value', function () {
            var value = {x: 12}
            var promise = new Promise(function (resolve) {
              resolve(value)
            })
            var future = Future.wrap(promise)
            promise
              .then(function () {
                future.resolve([value])
              })
            return expect(future).to.eventually.equal(value)
          })

          it('catches rejected Promise value', function () {
            var value = {x: 12}
            var promise = new Promise(function (resolve, reject) {
              reject(value)
            })
            var future = Future.wrap(promise)
            promise
              .then(branchStopper, function () {
                future.reject([value])
              })
            return expect(future).to.eventually.be.rejectedWith(value)
          })
        })

        describe('.all', function () {
          it('returns resolved promise if nothing is passed', function () {
            return expect(Future.all([]))
          })

          it('awaits all promises and returns their results as array', function () {
            var promises = [new Future(), new Future(), new Future()]
            var target = Future.all(promises)
            var expectation = []
            for (var i = 0; i < promises.length; i++) {
              promises[i].resolve(i)
              expectation.push(i)
            }
            return expect(target).to.eventually.deep.eq(expectation)
          })
        })

        describe('.race', function () {
          it('doesn\'t resolve if nothing passed', function () {
            var value = {x: 12}
            var result = new Future()
            Future.race([]).then(function () {
              result.reject()
            })
            setTimeout(function () {
              result.resolve(value)
            }, 1)
            return expect(result).to.eventually.equal(value)
          })

          it('resolves with first value of the first resolved promise', function () {
            var value = {x: 12}
            var first = new Future()
            var second = new Future()
            var result = Future.race([first, second])
            first.resolve(value)
            second.reject()
            return expect(result).to.eventually.equal(value)
          })
        })
      })
    })
  })
})
