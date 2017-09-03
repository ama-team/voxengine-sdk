/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* global Logger */

var sinon = require('sinon')
var Chai = require('chai')
var assert = Chai.assert
var Loggers = require('../../../../lib/logger/index')
var slf4j = Loggers.slf4j
var Slf4j = slf4j.Slf4j
var Context = slf4j.Context
var Level = Loggers.Level
var expect = Chai.expect

Chai.use(require('chai-string'))

describe('Integration', function () {
  describe('/logger', function () {
    describe('/Slf4j.js', function () {
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
          context.setLevel(loggerName, threshold)
          context.setWriter(loggerName, writer)
        })

        describe('< new', function () {
          it('uses default context for direct creation if context is not specified', function () {
            logger = new Slf4j(loggerName)
            Slf4j.setWriter(writer)
            Slf4j.setLevel(loggerName, Level.All)
            expect(logger.getLevel()).to.eq(Level.All)
            Slf4j.setLevel(loggerName, Level.Error)
            expect(logger.getLevel()).to.eq(Level.Error)
            expect(logger.getWriter()).to.eq(writer)
          })

          it('provides backward compatibility for 0.2.0-style instantiation', function () {
            writer = {write: sinon.spy(Logger.write.bind(Logger))}
            logger = new Slf4j(loggerName, Level.All, writer)
            logger.info(testMessage)
            expect(writer.write.calledOnce).to.be.true
          })

          it('tolerates falsey logger name', function () {
            logger = new Slf4j(undefined, context)
            logger.error(testMessage)
          })
        })

        describe('#log', function () {
          it('passes call to writer.write', function () {
            logger.log(Level.Error, testMessage)
            assert(writer.write.calledOnce)
            assert(writer.write.calledWithMatch(testMessage))
          })

          it('includes logger name in output', function () {
            logger.log(Level.Error, testMessage)
            expect(logs[0]).to.contain(loggerName)
          })

          it('passes message with level equal to threshold', function () {
            context = new Context(Level.Error, writer)
            logger = context.create(loggerName)
            logger.log(Level.Error, testMessage)
            assert(writer.write.calledOnce)
            assert(writer.write.calledWithMatch(testMessage))
          })

          it('passes message with level higher than threshold', function () {
            context = new Context(Level.Info, writer)
            logger = context.create(loggerName)
            logger.log(Level.Error, testMessage)
            assert(writer.write.calledOnce)
            assert(writer.write.calledWithMatch(testMessage))
          })

          it('swallows message with level lesser than threshold', function () {
            context = new Context(Level.Error, writer)
            logger = new Slf4j(loggerName, context)
            logger.log(Level.Debug, testMessage)
            assert(writer.write.notCalled)
          })

          it('correctly renders object', function () {
            var parameter = {x: 12}
            logger.log(Level.Error, 'parametrized: {}', parameter)
            var message = writer.write.getCall(0).args[0]
            expect(message).to.endWith('parametrized: {"x":12}')
          })

          it('correctly renders string', function () {
            var parameter = 'value'
            logger.log(Level.Error, 'parametrized: {}', parameter)
            var message = writer.write.getCall(0).args[0]
            expect(message).to.endWith('parametrized: value')
          })

          it('correctly renders boolean', function () {
            var parameter = true
            logger.log(Level.Error, 'parametrized: {}', parameter)
            var message = writer.write.getCall(0).args[0]
            expect(message).to.endWith('parametrized: true')
          })

          it('correctly renders number', function () {
            var parameter = 42
            logger.log(Level.Error, 'parametrized: {}', parameter)
            var message = writer.write.getCall(0).args[0]
            expect(message).to.endWith('parametrized: 42')
          })

          it('correctly renders null', function () {
            var parameter = null
            logger.log(Level.Error, 'parametrized: {}', parameter)
            var message = writer.write.getCall(0).args[0]
            expect(message).to.endWith('parametrized: <null>')
          })

          it('correctly renders undefined', function () {
            logger.log(Level.Error, 'parametrized: {}', undefined)
            var message = writer.write.getCall(0).args[0]
            expect(message).to.endWith('parametrized: <undefined>')
          })

          it('correctly renders error', function () {
            var parameter = new Error()
            var stack = 'superFunc() at file:60:64\r\nanotherFunc() at file:60:64'
            var name = 'TestingException'
            var message = 'An exception has been thrown'
            var expected = [
              'Unhandled exception:',
              '<' + name + ': ' + message + '>',
              'Stack:', stack
            ].join('\r\n')
            var pattern = 'Unhandled exception:'

            parameter.name = name
            parameter.message = message
            parameter.stack = stack

            logger.log(Level.Error, pattern, parameter)
            expect(writer.write.getCall(0).args[0]).to.endWith(expected)
          })

          it('doesn\'t treat {} replacement as a placeholder', function () {
            var pattern = '{} and {}'
            var expectation = '{} and false'
            logger.log(Level.Error, pattern, {}, false)
            expect(writer.write.getCall(0).args[0]).to.endWith(expectation)
          })
        })

        describe('#setLevel', function () {
          it('allows threshold reconfiguration on-the-fly', function () {
            logger.setLevel(Level.Debug)
            logger.log(Level.Debug, 'Message #{}', 1)
            logger.setLevel(Level.Error)
            logger.log(Level.Debug, 'Message #{}', 2)

            expect(writer.write.callCount).to.eq(1)
            expect(writer.write.getCall(0).args[0]).to.contain('Message #1')
          })
        })

        describe('#setWriter', function () {
          it('allows writer reconfiguration on-the-fly', function () {
            var writerA = {
              write: sinon.spy(Logger.write)
            }
            var writerB = {
              write: sinon.spy(Logger.write)
            }
            expect(writerA.write.calledOnce).to.be.false
            expect(writerB.write.calledOnce).to.be.false
            logger = context.create(loggerName, Level.All, writerA)
            logger.log(Level.Error, 'Message #1')
            expect(writerA.write.calledOnce).to.be.true
            expect(writerB.write.calledOnce).to.be.false
            logger.setWriter(writerB)
            logger.log(Level.Error, 'Message #2')
            expect(writerA.write.calledOnce).to.be.true
            expect(writerB.write.calledOnce).to.be.true
          })
        })

        describe('#attach', function () {
          it('attaches diagnostic context that is printed later', function () {
            var name = 'alpha'
            var value = 'beta'
            logger.attach(name, value)
            logger.log(Level.Error, testMessage)
            expect(writer.write.getCall(0)).to.be.ok
            expect(writer.write.getCall(0).args.length).to.eq(1)
            var argument = writer.write.getCall(0).args[0]
            expect(argument).to.contain(name)
            expect(argument).to.contain(value)
          })
        })

        describe('#detach', function () {
          it('provides method to clear diagnostic context key', function () {
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
        })

        describe('#attachAll', function () {
          it('provides methods to set and clear diagnostic context in one call', function () {
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
        })

        describe('.create', function () {
          it('provides static method for logger creation', function () {
            logger = Slf4j.create(loggerName)
            expect(logger).to.be.instanceof(Slf4j)
            expect(logger.getName()).to.eq(loggerName)
          })
        })

        describe('.setWriter', function () {
          it('provides static method for changing writer', function () {
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
        })

        describe('.setLevel', function () {
          it('provides static method for changing threshold', function () {
            logger = Slf4j.create(loggerName, Level.All, writer)
            expect(writer.write.calledOnce).to.be.false
            logger.info(testMessage)
            expect(writer.write.calledOnce).to.be.true
            Slf4j.setLevel(loggerName, Level.Error)
            logger.info(testMessage)
            expect(writer.write.calledOnce).to.be.true
          })
        })

        describe('#getContext', function () {
          it('returns context it was created in', function () {
            var context = new Slf4j.Context()
            var logger = context.create(loggerName)
            expect(logger.getContext()).to.eq(context)
          })
        })

        describe('.factory', function () {
          it('tolerates invalid settings', function () {
            expect(Slf4j.factory(false)).to.be.instanceOf(Slf4j)
          })

          it('returns passed instance if it is present', function () {
            var mockingbird = {}
            expect(Slf4j.factory({instance: mockingbird})).to.eq(mockingbird)
          })

          it('allows setting mapping diagnostic context', function () {
            var mdc = {alpha: 'beta'}
            var logger = Slf4j.factory({mdc: mdc})
            expect(logger.detachAll()).to.deep.eq(mdc)
          })

          it('recognizes logger instance passed instead of options', function () {
            var logger = Slf4j.create(loggerName)
            expect(Slf4j.factory(logger)).to.equal(logger)
          })
        })
      })
    })
  })
})
