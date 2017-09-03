/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

var Chai = require('chai')
var expect = Chai.expect

var Level = require('../../../../lib/logger/Level').Level

describe('Unit', function () {
  describe('/logger', function () {
    describe('/Level.js', function () {
      describe('.Level', function () {
        describe('.find', function () {
          it('finds existing type', function () {
            expect(Level.find(Level.All.id)).to.eq(Level.All)
          })

          it('finds type with invalid case', function () {
            expect(Level.find('aLL')).to.eq(Level.All)
          })

          it('returns passed type', function () {
            expect(Level.find(Level.All)).to.eq(Level.All)
          })

          it('returns null for non-existing type', function () {
            expect(Level.find('Fatal')).to.be.null
          })

          it('doesn\'t find functions', function () {
            expect(Level.find('find')).to.be.null
          })
        })
      })
    })
  })
})
