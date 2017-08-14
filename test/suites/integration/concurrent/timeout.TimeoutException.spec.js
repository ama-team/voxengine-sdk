/* eslint-env mocha */

var Concurrent = require('../../../../lib').Concurrent
var TimeoutException = Concurrent.TimeoutException
var Chai = require('chai')
var expect = Chai.expect

describe('Integration', function () {
  describe('/concurrent', function () {
    describe('/timeout.js', function () {
      describe('.TimeoutException', function () {
        it('is a child of error', function () {
          expect(new TimeoutException()).to.be.instanceOf(Error)
        })
      })
    })
  })
})
