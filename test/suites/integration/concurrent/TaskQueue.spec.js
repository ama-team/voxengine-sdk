/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect
var Concurrent = require('../../../../lib').Concurrent
var TaskQueue = Concurrent.TaskQueue
var RejectionException = Concurrent.RejectionException
var TimeoutException = Concurrent.TimeoutException
var Future = Concurrent.Future

var branchStopper = function () {
  throw new Error('This branch should not have been entered')
}

describe('Integration', function () {
  describe('/concurrent', function () {
    describe('/TaskQueue.js', function () {
      describe('.TaskQueue', function () {
        describe('< new', function () {
          it('may be created without any options', function () {
            return new TaskQueue()
          })

          it('is paused by default', function () {
            expect(new TaskQueue().isPaused()).to.be.true
          })

          it('is not terminated by default', function () {
            expect(new TaskQueue().isClosed()).to.be.false
          })

          it('allows to set name', function () {
            // yet another test for 100% coverage
            /* eslint-disable no-new */
            var logger = {attach: Sinon.stub()}
            var name = 'custom-name'
            new TaskQueue({name: name, logger: {instance: logger}})
            expect(logger.attach.callCount).to.eq(1)
            expect(logger.attach.getCall(0).args[0]).to.eq('name')
            expect(logger.attach.getCall(0).args[1]).to.eq(name)
          })
        })

        describe('#setName', function () {
          it('allows to set name externally', function () {
            var logger = {attach: Sinon.stub()}
            var name = 'custom-name'
            var queue = new TaskQueue({logger: {instance: logger}})
            queue.setName(name)
            expect(logger.attach.callCount).to.eq(1)
            expect(logger.attach.getCall(0).args[0]).to.eq('name')
            expect(logger.attach.getCall(0).args[1]).to.eq(name)
          })
        })

        describe('#start', function () {
          it('processes single task submitted before start', function () {
            var queue = new TaskQueue()
            var factory = Sinon.stub()
            var promise = queue.push(factory)
            queue.start()
            return promise
              .then(function () {
                expect(factory.callCount).to.eq(1)
              })
          })

          it('processes single task submitted after start', function () {
            var queue = new TaskQueue()
            var factory = Sinon.stub()
            queue.start()
            var promises = [
              queue.push(factory),
              queue.push(factory),
              queue.push(factory)
            ]
            return Promise
              .all(promises)
              .then(function () {
                expect(factory.callCount).to.eq(3)
              })
          })

          it('processes several tasks submitted before start', function () {
            var queue = new TaskQueue()
            var factory = Sinon.stub()
            queue.push(factory)
            queue.push(factory)
            var promise = queue.push(factory)
            queue.start()
            return promise
              .then(function () {
                expect(factory.callCount).to.eq(3)
              })
          })

          it('processes several tasks submitted after start', function () {
            var queue = new TaskQueue()
            var factory = Sinon.stub()
            queue.start()
            var promises = [
              queue.push(factory),
              queue.push(factory),
              queue.push(factory)
            ]
            return Promise
              .all(promises)
              .then(function () {
                expect(factory.callCount).to.eq(3)
              })
          })

          it('processes several tasks submitted before and after start', function () {
            var queue = new TaskQueue()
            var factory = Sinon.stub()
            var promises = [
              queue.push(factory),
              queue.push(factory)
            ]
            queue.start()
            promises.push(queue.push(factory))
            promises.push(queue.push(factory))
            return Promise
              .all(promises)
              .then(function () {
                expect(factory.callCount).to.eq(4)
              })
          })
        })

        describe('#push', function () {
          it('times out task exceeding specified timeout', function () {
            var queue = TaskQueue.started()
            var factory = Sinon.spy(function () {
              return new Promise(function () {})
            })
            return queue
              .push(factory, {timeout: 0})
              .then(branchStopper, function (error) {
                expect(factory.callCount).to.eq(1)
                expect(error).to.be.instanceOf(TimeoutException)
              })
          })

          it('returns promise rejected with thrown error', function () {
            var queue = new TaskQueue().start()
            var error = new Error()
            var factory = function () { throw error }
            var future = queue.push(factory)
            return expect(future).to.eventually.be.rejectedWith(error)
          })
        })

        describe('#pause', function () {
          it('returns promise resolving after current task completion', function () {
            var queue = TaskQueue.started()
            var barrier = new Future()
            var invoked = Sinon.spy(function () { return barrier })
            var suppressed = Sinon.stub()
            queue.push(invoked)
            queue.push(suppressed)
            var pause = queue.pause()
            barrier.resolve()
            return pause
              .then(function () {
                expect(invoked.callCount).to.eq(1)
                expect(suppressed.callCount).to.eq(0)
              })
          })

          it('stops task processing after current task completion', function () {
            // TODO: this doesn't actually verify anything
            var queue = TaskQueue.started()
            var barrier = new Future()
            var invoked = Sinon.spy(function () { return barrier })
            var suppressed = Sinon.stub()
            var paused = false
            queue.push(invoked)
            queue.push(suppressed)
            var pause = queue.pause().then(function () { paused = true })
            barrier.resolve()
            return pause
              .then(function () {
                expect(invoked.callCount).to.eq(1)
                expect(suppressed.callCount).to.eq(0)
                expect(paused).to.be.true
              })
          })

          it('correctly executes if there is no current task', function () {
            return TaskQueue.started().pause()
          })
        })

        describe('#close', function () {
          it('works with no tasks in queue', function () {
            return (new TaskQueue()).close()
          })

          it('returns when all current tasks are resolved', function () {
            var queue = new TaskQueue()
            var expectation = []
            var result = []
            var barriers = []
            for (var i = 0; i < 3; i++) {
              var barrier = new Future()
              barriers.push(barrier)
              expectation.push(i)
              var closure = function (i, future) {
                queue.push(function () {
                  return future.then(function () {
                    result.push(i)
                  })
                })
              }
              closure(i, barrier)
            }
            var finalization = queue.close()
            queue.start()
            barriers.forEach(function (barrier) {
              barrier.resolve()
            })
            return finalization
              .then(function () {
                expect(result).to.deep.eq(expectation)
              })
          })

          it('returns successfully even if tasks fail', function () {
            var queue = new TaskQueue().start()
            queue.push(function () { return Promise.reject(new Error()) })
            return queue.close()
          })

          it('forces rejection of new tasks', function () {
            var queue = new TaskQueue()
            queue.close()
            var future = queue.push(function () {})
            return expect(future).to.eventually.be.rejected
          })
        })

        describe('#terminate', function () {
          it('returns promised statistics instantly if there is no current task', function () {
            var queue = new TaskQueue()
            var expectation = {
              enqueued: 0,
              completed: 0,
              successful: 0,
              discarded: 0,
              rejected: 0
            }
            return expect(queue.terminate()).to.eventually.deep.eq(expectation)
          })

          it('returns promise resolving as soon as current task completes', function () {
            var queue = TaskQueue.started()
            queue.push(function () { return Promise.resolve() })
            var expectation = {
              enqueued: 1,
              completed: 1,
              successful: 1,
              discarded: 0,
              rejected: 0
            }
            return expect(queue.terminate()).to.eventually.deep.eq(expectation)
          })

          it('discards extra tasks', function () {
            var barrier = new Future()
            var queue = TaskQueue.started()
            var discarded = Sinon.stub()
            var factory = Sinon.spy(function () { return barrier })
            var expectation = {
              enqueued: 2,
              completed: 1,
              successful: 1,
              discarded: 1,
              rejected: 0
            }
            queue.push(factory)
            queue.push(discarded)
            var termination = queue.terminate()
            barrier.resolve()
            return termination
              .then(function (statistics) {
                expect(statistics).to.deep.eq(expectation)
                expect(factory.callCount).to.eq(1)
                expect(discarded.callCount).to.eq(0)
              })
          })

          it('forces rejection of new tasks', function () {
            var queue = TaskQueue.started()
            queue.terminate()
            var task = queue.push(function () {})
            return expect(task).to.eventually.be.rejectedWith(RejectionException)
          })
        })

        describe('#statistics', function () {
          it('returns correct numbers', function () {
            var queue = new TaskQueue().start()
            queue.push(function () {})
            var future = queue.push(function () { throw new Error() })
            queue.push(function () { return new Promise(function () {}) })
            return future
              .then(branchStopper, function () {
                expect(queue.getStatistics().enqueued).to.eq(3)
                expect(queue.getStatistics().completed).to.eq(2)
                expect(queue.getStatistics().successful).to.eq(1)
              })
          })
        })

        describe('#getLength', function () {
          it('returns zero for fresh queue', function () {
            expect(new TaskQueue().getLength()).to.eq(0)
          })

          it('returns actual length if queue has been populated', function () {
            var queue = new TaskQueue()
            var limit = 4
            for (var i = 0; i < limit; i++) {
              queue.push(function () { return new Promise(function () {}) })
            }
            expect(queue.getLength()).to.eq(limit)
          })

          it('returns zero when last task is completed', function () {
            var queue = TaskQueue.started()
            var limit = 4
            for (var i = 0; i < limit; i++) {
              queue.push(function () {})
            }
            return queue
              .push(function () {})
              .then(function () {
                expect(queue.getLength()).to.eq(0)
              })
          })
        })

        describe('> invariants', function () {
          it('executes tasks sequentially', function () {
            var queue = TaskQueue.started()
            var barriers = []
            var limit = 4
            var result = []
            var expectation = []
            var i
            for (i = 0; i < limit; i++) {
              expectation.push(i)
              var closure = function (i) {
                var future = new Future()
                barriers[i] = future
                queue.push(function () {
                  return future
                    .then(function () {
                      result.push(i)
                    })
                })
              }
              closure(i)
            }
            for (i = limit - 1; i >= 0; i--) {
              barriers[i].resolve()
            }
            return queue
              .close()
              .then(function () {
                expect(result).to.deep.eq(expectation)
              })
          })

          it('tolerates non-error rejection', function () {
            var value = {}
            var rejected = Promise.reject(value)
            var queue = TaskQueue.started()
            var task = queue.push(function () {
              return rejected
            })
            return expect(task).to.eventually.be.rejectedWith(value)
          })
        })
      })

      describe('.RejectionException', function () {
        it('is supplied with corresponding name', function () {
          expect(new RejectionException()).to.have.property('name').eq('RejectionException')
        })

        it('provides default message', function () {
          // yes i'm still serious about that 100% coverage that nobody needs
          expect(new RejectionException()).to.have.property('message')
        })
      })
    })
  })
})
