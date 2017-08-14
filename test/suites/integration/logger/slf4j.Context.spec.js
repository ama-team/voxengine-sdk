/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* global allure, Logger */

var sinon = require('sinon')
var Chai = require('chai')
var Loggers = require('../../../../lib/logger/index')
var slf4j = Loggers.slf4j
var Slf4j = slf4j.Slf4j
var Context = slf4j.Context
var Level = Loggers.Level
var expect = Chai.expect

Chai.use(require('chai-string'))

describe('Integration', function () {
  describe('/logger', function () {
    describe('/slf4j.js', function () {
      describe('.Slf4j', function () {
        describe('.Context', function () {
          var writer
          var context
          var loggerName = 'dummy.dummy'

          beforeEach(function () {
            writer = {
              write: sinon.spy(Logger.write.bind(Logger))
            }
            context = new Context(Level.All, writer)
          })

          it('provides logger creation method', function () {
            var logger = context.create('dummy')
            expect(logger).to.be.instanceOf(Slf4j)
          })

          it('does not reuse loggers', function () {
            allure.description('Context should not reuse loggers because that ' +
              'would render diagnostic context useless')
            expect(context.create('dummy')).to.not.eq(context.create('dummy'))
          })

          it('creates logger with expected writer', function () {
            var writer = {
              write: sinon.spy(function () {})
            }
            var logger = context.create(loggerName, Level.All, writer)
            expect(logger.getWriter()).to.eq(writer)
          })

          it('allows in-flight logger threshold adjustments', function () {
            var logger = context.create(loggerName)
            logger.info('message-a')
            context.setLevel(loggerName, Level.Error)
            expect(context.getLevel(loggerName)).to.eq(Level.Error)
            logger.info('message-b')
            context.setLevel(loggerName, Level.Info)
            expect(context.getLevel(loggerName)).to.eq(Level.Info)
            logger.info('message-c')

            expect(writer.write.callCount).to.eq(2)
            expect(writer.write.getCall(0).args[0]).to.contain('message-a')
            expect(writer.write.getCall(1).args[0]).to.contain('message-c')
          })

          it('allows setting root threshold by not specifying logger name', function () {
            context.setLevel(Level.All)
            expect(context.getLevel()).to.eq(Level.All)
            context.setLevel(Level.Error)
            expect(context.getLevel()).to.eq(Level.Error)
          })

          // todo testing one object through another is quite bad
          it('forces logger to rely on it\'s parent threshold and level unless specified directly', function () {
            context.setLevel(Level.All)
            var logger = context.create(loggerName)
            logger.info('test')
            expect(logger.getLevel()).to.eq(Level.All)
            context.setLevel(Level.Error)
            expect(logger.getLevel()).to.eq(Level.Error)
          })

          it('allows setting root writer by not specifying logger name', function () {
            context.setWriter(writer)
            expect(context.getWriter()).to.eq(writer)
            writer = {}
            context.setWriter(writer)
            expect(context.getWriter()).to.eq(writer)
          })

          var inputs = [true, undefined, 132, '', '...']
          inputs.forEach(function (name) {
            it('does not throw on unexpected logger name', function () {
              allure.addArgument('name', name)
              context.create(name).info('test')
            })
          })
        })
      })
    })
  })
})
