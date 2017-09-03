/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

var Future = require('../../../../lib/concurrent/Future').Future
var Chai = require('chai')
var expect = Chai.expect

Chai.use(require('chai-as-promised'))

describe('Unit', function () {
  describe('/concurrent', function () {
    describe('/Future.js', function () {
      describe('Future', function () {
        describe('#wrap()', function () {
          it('eventually accepts value of provided thenable', function () {
            var value = {x: 12}
            var promise = Promise.resolve(value)
            expect(Future.wrap(promise)).to.eventually.eq(value)
          })

          it('eventually accepts rejection reason of provided thenable', function () {
            var reason = new Error('somebody\'s been a bad boy this year')
            var promise = Promise.reject(reason)
            expect(Future.wrap(promise)).to.eventually.be.rejectedWith(reason)
          })
        })
      })
    })
  })
})
