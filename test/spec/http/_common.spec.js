// noinspection JSUnusedLocalSymbols
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

var chai = require('chai')
var expect = chai.expect
var Commons = require('../../../lib/http/_common')

describe('Unit', function () {
  describe('/http', function () {
    describe('/_common.js', function () {
      it('contains all expected exceptions', function () {
        var exceptions = [
          'NetworkException',
          'IllegalUrlException',
          'MissingHostException',
          'ConnectionErrorException',
          'RedirectVortexException',
          'NetworkErrorException',
          'TimeoutException',
          'VoxEngineErrorException'
        ]

        exceptions.forEach(function (id) {
          var Clazz = Commons[id]
          var e = new Clazz()
          expect(e.name).to.eq(id)
          expect(e.message).to.be.ok
          expect(e.message).to.be.eq(Clazz.prototype.message)
          expect(e.code).to.be.ok
          expect(e.code).to.be.eq(Clazz.prototype.code)
          expect(e).to.be.instanceOf(Clazz)
        })
      })

      it('provides inverse exception index', function () {
        for (var i = -1; i >= -8; i--) {
          expect(Commons.codeExceptionIndex[i].prototype.code).to.eq(i)
        }
      })

      it('passes provided code to exception', function () {
        expect(new Commons.NetworkException(null, -120).code).to.eq(-120)
        expect(new Commons.TimeoutException(null, -120).code).to.eq(-120)
      })

      it('saves provided exception message', function () {
        expect(new Commons.NetworkException('dummy').message).to.eq('dummy')
        expect(new Commons.TimeoutException('dummy').message).to.eq('dummy')
      })
    })
  })
})
