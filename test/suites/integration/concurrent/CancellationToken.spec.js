/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

var CancellationToken = require('../../../../lib').Concurrent.CancellationToken
var Chai = require('chai')
var expect = Chai.expect

describe('Integration', function () {
  describe('/Concurrent', function () {
    describe('/CancellationToken.js', function () {
      describe('.CancellationToken', function () {
        var token

        beforeEach(function () {
          token = new CancellationToken()
        })

        describe('#cancel', function () {
          it('it sets cancelled flag to true', function () {
            expect(token.isCancelled()).to.be.false
            token.cancel()
            expect(token.isCancelled()).to.be.true
          })
        })

        describe('#then', function () {
          it('resolves associated promise when cancelled', function () {
            token.cancel()
            return token.then()
          })

          it('resolves dependent tokens as well', function () {
            token.cancel()
            return new CancellationToken([token]).then()
          })
        })
      })
    })
  })
})
