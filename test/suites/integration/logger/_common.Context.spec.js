/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

var Sinon = require('sinon')
var Chai = require('chai')
var expect = Chai.expect
var Commons = require('../../../../lib/logger/_common')
var Context = Commons.Context
var Level = Commons.Level

describe('Unit', function () {
  describe('/logger', function () {
    describe('/_common.js', function () {
      var context
      var writer
      var level

      beforeEach(function () {
        writer = {
          write: Sinon.spy(function (message) {
            return message
          })
        }
        level = Level.All
        context = new Context(level, writer)
      })

      describe('.Context', function () {
        describe('#getWriter', function () {
          it('returns default writer by default', function () {
            expect(context.getWriter()).to.eq(writer)
            expect(context.getWriter('package')).to.eq(writer)
          })
        })

        describe('#setWriter', function () {
          it('sets provided writer as default if path is omitted', function () {
            var writer = {}
            context.setWriter(writer)
            expect(context.getWriter()).to.eq(writer)
          })

          it('sets writer provided during construction as default', function () {
            expect(context.getWriter()).to.eq(writer)
            expect(context.getWriter('package.package')).to.eq(writer)
          })

          it('returns writer set for package for direct and child paths', function () {
            var parent = 'package'
            var path = parent += '.package'
            var child = path += '.package'
            var overwriter = {}
            context.setWriter(path, overwriter)
            expect(context.getWriter()).to.eq(writer)
            expect(context.getWriter(parent)).to.eq(writer)
            expect(context.getWriter(path)).to.eq(overwriter)
            expect(context.getWriter(child)).to.eq(overwriter)
          })
        })

        describe('#removeWriter', function () {
          it('allows to remove previously-set writer', function () {
            var path = 'package'
            var writer = {}
            context.setWriter(path, writer)
            expect(context.getWriter(path)).to.eq(writer)
            expect(context.removeWriter(path)).to.eq(writer)
            expect(context.getWriter(path)).not.to.eq(writer)
          })

          it('returns null on non-existing writer', function () {
            expect(context.removeWriter('package')).to.be.null
          })

          it('throws if path is omitted', function () {
            var lambda = function () {
              context.removeWriter()
            }
            expect(lambda).to.throw()
          })
        })

        describe('#getLevel', function () {
          it('returns default level if no path is specified', function () {
            expect(context.getLevel()).to.eq(level)
          })

          it('returns default level if no overrides are in effect', function () {
            expect(context.getLevel('package')).to.eq(level)
          })
        })

        describe('#setLevel', function () {
          it('overrides level for specified path and all child paths', function () {
            var parent = 'package'
            var path = parent += '.package'
            var child = path += '.package'
            var override = Level.Warn
            context.setLevel(path, override)
            expect(context.getLevel()).to.eq(level)
            expect(context.getLevel(parent)).to.eq(level)
            expect(context.getLevel(path)).to.eq(override)
            expect(context.getLevel(child)).to.eq(override)
          })

          it('sets default level if no path provided', function () {
            var override = Level.Warn
            context.setLevel(override)
            expect(context.getLevel()).to.eq(override)
          })
        })

        describe('#removeLevel', function () {
          it('allows to remove preinstalled level', function () {
            var path = 'package'
            var override = Level.Warn
            context.setLevel(path, override)
            expect(context.removeLevel(path)).to.eq(override)
            expect(context.getLevel(path)).to.eq(level)
          })

          it('returns null for nonexisting path', function () {
            var path = 'package'
            expect(context.removeLevel(path)).to.be.null
          })

          it('throws if called without path', function () {
            var lambda = function () {
              context.removeLevel()
            }
            expect(lambda).to.throw()
          })
        })
      })
    })
  })
})
