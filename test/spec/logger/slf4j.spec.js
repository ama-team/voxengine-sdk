/* global describe, it */

var sinon = require('sinon')
var Chai = require('chai')
var assert = Chai.assert
var Loggers = require('../../../lib/logger')
var slf4j = Loggers.slf4j
var Slf4j = slf4j.Slf4j
var Context = slf4j.Context
var Level = Loggers.Level
var expect = Chai.expect

Chai.should()
Chai.use(require('chai-string'))

describe('/logger', function () {
  describe('/slf4j.js', function () {
    describe('.Slf4j', function () {
      var testMessage = 'Hey there, spectacular'
      var loggerName = 'ama-team.voxengine-sdk.test.spec.logger.slf4j.Slf4j'
      var threshold = Level.All
      var logs
      var writer
      var context
      var logger

      beforeEach(function () {
        logs = []
        writer = {
          write: sinon.spy(function (message) {
            logs.push(message)
            Logger.write(message)
          })
        }
        context = new Context(threshold, writer)
        logger = context.create(loggerName)
        Slf4j.setThreshold(loggerName, threshold)
        Slf4j.setWriter(loggerName, writer)
      })

      it('should call writer.write on log call', function () {
        logger.error(testMessage)
        assert(writer.write.calledOnce)
        assert(writer.write.calledWithMatch(testMessage))
      })

      it('should pass logger name in output', function () {
        logger.error(testMessage)
        expect(logs[0]).to.contain(loggerName)
      })

      it('should feel work ok without logger name', function () {
        logger = new Slf4j(undefined, context)
        logger.error(testMessage)
      })

      it('should pass message with level equal to threshold', function () {
        context = new Context(Level.Error, writer)
        logger = context.create(loggerName)
        logger.error(testMessage)
        assert(writer.write.calledOnce)
        assert(writer.write.calledWithMatch(testMessage))
      })

      it('should pass message with level higher than threshold', function () {
        context = new Context(Level.Error, writer)
        logger = context.create(loggerName)
        logger.error(testMessage)
        assert(writer.write.calledOnce)
        assert(writer.write.calledWithMatch(testMessage))
      })

      it('should swallow message with level lesser than threshold', function () {
        context = new Context(Level.Error, writer)
        logger = new Slf4j(loggerName, context)
        logger.debug(testMessage)
        expect(writer.write.notCalled).to.be.true
      })

      it('should correctly render object', function () {
        var parameter = {x: 12}
        logger.debug('parametrized: {}', parameter)
        writer.write.getCall(0).args[0].should
          .endWith('parametrized: ' + JSON.stringify(parameter))
      })

      it('should correctly render string', function () {
        var parameter = 'value'
        logger.debug('parametrized: {}', parameter)
        writer.write.getCall(0).args[0].should.endWith('parametrized: value')
      })

      it('should correctly render boolean', function () {
        var parameter = true
        logger.debug('parametrized: {}', parameter)
        writer.write.getCall(0).args[0].should.endWith('parametrized: true')
      })

      it('should correctly render number', function () {
        var parameter = 42
        logger.debug('parametrized: {}', parameter)
        writer.write.getCall(0).args[0].should.endWith('parametrized: 42')
      })

      it('should correctly render null', function () {
        var parameter = null
        logger.debug('parametrized: {}', parameter)
        writer.write.getCall(0).args[0].should.endWith('parametrized: null')
      })

      it('should correctly render undefined', function () {
        var parameter = undefined
        logger.debug('parametrized: {}', parameter)
        writer.write.getCall(0).args[0].should
          .endWith('parametrized: {undefined}')
      })

      it('should correctly render error', function () {
        var parameter = new Error()
        var stack = 'superFunc() at file:60:64\nanotherFunc() at file:60:64'
        var name = 'TestingException'
        var message = 'An exception has been thrown'
        var expected = [
          '[DEBUG] ' + loggerName + ': Unhandled exception:',
          name + ': ' + message,
          'Stack:', stack
        ].join('\n')
        var pattern = 'Unhandled exception:'

        parameter.name = name
        parameter.message = message
        parameter.stack = stack

        logger.debug(pattern, parameter)
        writer.write.getCall(0).args[0].should.equal(expected)
      })

      it('should allow threshold reconfiguration on-the-fly', function () {
        logger.debug('Message #{}', 1)
        logger.setThreshold(Level.Error)
        logger.debug('Message #{}', 2)

        writer.write.callCount.should.eq(1)
        writer.write.getCall(0).args[0].should.contain('Message #1')
      })

      it('should allow writer reconfiguration on-the-fly', function () {
        var writerA = {
          write: sinon.spy(Logger.write)
        }
        var writerB = {
          write: sinon.spy(Logger.write)
        }
        expect(writerA.write.calledOnce).to.be.false
        expect(writerB.write.calledOnce).to.be.false
        logger = context.create(loggerName, Level.All, writerA)
        logger.debug('Message #1')
        expect(writerA.write.calledOnce).to.be.true
        expect(writerB.write.calledOnce).to.be.false
        logger.setWriter(writerB)
        logger.debug('Message #2')
        expect(writerA.write.calledOnce).to.be.true
        expect(writerB.write.calledOnce).to.be.true
      })

      it('should print diagnostic context', function () {
        var name = 'alpha'
        var value = 'beta'
        logger.attach(name, value)
        logger.info(testMessage)
        expect(writer.write.getCall(0)).to.be.ok
        expect(writer.write.getCall(0).args.length).to.eq(1)
        var argument = writer.write.getCall(0).args[0]
        expect(argument).to.contain(name)
        expect(argument).to.contain(value)
      })

      it('should provide method to clear diagnostic context key', function () {
        var nameA = 'alpha'
        var valueA = 'beta'
        var nameB = 'gamma'
        var valueB = 'delta'
        logger.attach(nameA, valueA)
        logger.attach(nameB, valueB)
        logger.info(testMessage)

        expect(writer.write.getCall(0)).to.be.ok
        expect(writer.write.getCall(0).args.length).to.eq(1)
        var argument = writer.write.getCall(0).args[0]
        expect(argument).to.contain(nameA)
        expect(argument).to.contain(valueA)
        expect(argument).to.contain(nameB)
        expect(argument).to.contain(valueB)

        logger.detach(nameB, valueB)
        logger.info(testMessage)

        expect(writer.write.getCall(1)).to.be.ok
        expect(writer.write.getCall(1).args.length).to.eq(1)
        argument = writer.write.getCall(1).args[0]
        expect(argument).to.contain(nameA)
        expect(argument).to.contain(valueA)
        expect(argument).not.to.contain(nameB)
        expect(argument).not.to.contain(valueB)
      })

      it('should provide methods to set and clear diagnostic context in one call', function () {

        var nameA = 'alpha'
        var valueA = 'beta'
        var nameB = 'gamma'
        var valueB = 'delta'
        var mdc = {}
        var call
        var argument
        mdc[nameA] = valueA
        mdc[nameB] = valueB
        logger.attachAll(mdc)

        logger.info(testMessage)

        call = writer.write.getCall(0)
        expect(call).to.be.ok
        expect(call.args.length).to.eq(1)
        argument = call.args[0]
        expect(argument).to.contain(nameA)
        expect(argument).to.contain(valueA)
        expect(argument).to.contain(nameB)
        expect(argument).to.contain(valueB)

        logger.detachAll()
        logger.info(testMessage)

        call = writer.write.getCall(1)
        expect(call).to.be.ok
        expect(call.args.length).to.eq(1)
        argument = call.args[0]
        expect(argument).not.to.contain(nameA)
        expect(argument).not.to.contain(valueA)
        expect(argument).not.to.contain(nameB)
        expect(argument).not.to.contain(valueB)
      })

      it('should provide static method for logger creation', function () {
        logger = Slf4j.create(loggerName)
        expect(logger).to.be.instanceof(Slf4j)
        expect(logger.getName()).to.eq(loggerName)
      })

      it('should provide static method for changing writer', function () {
        logger = Slf4j.create(loggerName, Level.All)
        writer = {
          write: sinon.spy(Logger.write)
        }
        logger.info(testMessage)
        expect(writer.write.calledOnce).to.be.false
        Slf4j.setWriter(loggerName, writer)
        logger.info(testMessage)
        expect(writer.write.calledOnce).to.be.true
      })

      it('should provide static method for changing threshold', function () {
        logger = Slf4j.create(loggerName, Level.All, writer)
        expect(writer.write.calledOnce).to.be.false
        logger.info(testMessage)
        expect(writer.write.calledOnce).to.be.true
        Slf4j.setThreshold(loggerName, Level.Error)
        logger.info(testMessage)
        expect(writer.write.calledOnce).to.be.true
      })

      it('should use default context for direct creation if context is not specified', function () {
        logger = new Slf4j(loggerName)
        Slf4j.setThreshold(loggerName, Level.All)
        expect(logger.getThreshold()).to.eq(Level.All)
        Slf4j.setThreshold(loggerName, Level.Error)
        expect(logger.getThreshold()).to.eq(Level.Error)
        expect(logger.getWriter()).to.eq(writer)
      })

      it('should provide backward capability for 0.2.0-compatible instantiation', function () {
        writer = {write: sinon.spy(Logger.write.bind(Logger))}
        logger = new Slf4j(loggerName, Level.All, writer)
        logger.info(testMessage)
        expect(writer.write.calledOnce).to.be.true
      })
    })

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

      it('should provide logger creation method', function () {
        var logger = context.create('dummy')
        expect(logger).to.be.instanceOf(Slf4j)
      })

      it('should reuse loggers', function () {
        expect(context.create('dummy')).to.eq(context.create('dummy'))
      })

      it('should create logger with expected writer', function () {
        var writer = {
          write: function () {}
        }
        var logger = context.create(loggerName, Level.All, writer);
        expect(logger.getWriter()).to.eq(writer)
      })

      it('should allow in-flight logger threshold adjustments', function () {
        var logger = context.create(loggerName)
        logger.info('message-a')
        context.setThreshold(loggerName, Level.Error)
        expect(context.getThreshold(loggerName)).to.eq(Level.Error)
        logger.info('message-b')
        context.setThreshold(loggerName, Level.Info)
        expect(context.getThreshold(loggerName)).to.eq(Level.Info)
        logger.info('message-c')

        expect(writer.write.callCount).to.eq(2)
        expect(writer.write.getCall(0).args[0]).to.contain('message-a')
        expect(writer.write.getCall(1).args[0]).to.contain('message-c')
      })

      it('should allow setting root threshold by not specifying logger name', function () {
        context.setThreshold(Level.All)
        expect(context.getThreshold()).to.eq(Level.All)
        context.setThreshold(Level.Error)
        expect(context.getThreshold()).to.eq(Level.Error)
      })

      // todo testing one object through another is quite bad
      it('should force logger to rely on it\'s parent threshold and level unless specified directly', function () {
        context.setThreshold(Level.All)
        var logger = context.create(loggerName)
        logger.info('test')
        expect(logger.getThreshold()).to.eq(Level.All)
        context.setThreshold(Level.Error)
        expect(logger.getThreshold()).to.eq(Level.Error)
      })

      it('should allow setting root writer by not specifying logger name', function () {
        context.setWriter(writer)
        expect(context.getWriter()).to.eq(writer)
        writer = {}
        context.setWriter(writer)
        expect(context.getWriter()).to.eq(writer)
      })

      var inputs = [true, undefined, 132, '', '...']
      inputs.forEach(function (name) {
        it('should not throw on unexpected logger name', function () {
          allure.addArgument('name', name)
          context.create(name).info('test')
        })
      })
    })
  })
})
