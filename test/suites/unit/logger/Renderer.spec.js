/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect

Chai.use(require('chai-string'))

var Renderer = require('../../../../lib/logger/Renderer').Renderer

describe('Unit', function () {
  describe('/logger', function () {
    describe('/Renderer', function () {
      describe('.Renderer', function () {
        describe('.any', function () {
          var primitives = {
            boolean: true,
            number: 12,
            string: 'string'
          }

          Object.keys(primitives).forEach(function (key) {
            it('passes ' + key + 'through', function () {
              var value = primitives[key]
              expect(Renderer.any(value, false)).to.eq(value)
              expect(Renderer.any(value, true)).to.eq(value)
            })
          })

          var specials = {
            undefined: undefined,
            null: null
          }

          Object.keys(specials).forEach(function (key) {
            it('wraps special value ' + key + ' into corner brackets', function () {
              var value = specials[key]
              var expectation = '<%s>'.replace('%s', key)
              expect(Renderer.any(value, false)).to.eq(expectation)
              expect(Renderer.any(value, true)).to.eq(expectation)
            })
          })

          it('returns <Function: %name%> for function', function () {
            var subject = function subject () {}
            Object.defineProperty(subject, 'name', {value: 'subject'})
            var expectation = '<Function: subject>'
            expect(Renderer.any(subject, false)).to.eq(expectation)
            expect(Renderer.any(subject, true)).to.eq(expectation)
          })

          it('returns just <Function> for function without name', function () {
            var subject = (function () {
              return function () {
              }
            })()
            var expectation = '<Function>'
            expect(Renderer.any(subject, false)).to.eq(expectation)
            expect(Renderer.any(subject, true)).to.eq(expectation)
          })

          it('uses custom toString implementation for objects in non-expanded mode', function () {
            var value = 'test value'
            var handler = Sinon.stub().returns(value)
            var subject = {toString: handler}
            expect(Renderer.any(subject, false)).to.eq(value)
            expect(handler.callCount).to.eq(1)
          })

          it('uses JSON for objects with default toString in non-expanded mode', function () {
            var value = 'test value'
            var subject = {value: value}
            var expectation = JSON.stringify(subject)
            expect(Renderer.any(subject, false)).to.eq(expectation)
          })

          it('uses JSON for objects in expanded mode', function () {
            var value = 'test value'
            var handler = Sinon.stub().returns(value)
            var subject = {toString: handler}
            expect(Renderer.any(subject, true)).to.eq('{}')
            expect(handler.callCount).to.eq(0)
          })

          it('uses short notation for errors in non-expanded mode', function () {
            var error = new Error()
            error.name = 'prefix'
            error.message = 'suffix'
            var expectation = '<prefix: suffix>'
            expect(Renderer.any(error, false)).to.eq(expectation)
          })

          it('uses custom toString error implementation', function () {
            var error = new Error()
            error.name = 'prefix'
            error.message = 'suffix'
            var combined = 'prefix: suffix'
            var expectation = '<' + combined + '>'
            error.toString = function () {
              return combined
            }
            expect(Renderer.any(error, false)).to.eq(expectation)
          })

          it('uses placeholders for error without common properties', function () {
            var error = new Error()
            error.name = null
            error.message = null
            var expectation = '<<unknown error>: <no message>>'
            expect(Renderer.any(error, false)).to.eq(expectation)
          })

          it('adds error stack in expanded mode', function () {
            var error = new Error()
            error.name = 'prefix'
            error.message = 'suffix'
            var expectation = ['<prefix: suffix>', 'Stack:', error.stack].join('\r\n')
            expect(Renderer.any(error, true)).to.eq(expectation)
          })
        })
      })
    })
  })
})
